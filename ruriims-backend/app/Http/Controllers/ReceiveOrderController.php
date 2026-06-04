<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ReceiveOrder;
use App\Models\ReceiveOrderItem;
use App\Models\StockInUse;
use App\Models\Warehouse;
use App\Traits\GeneratesTransactionCode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class ReceiveOrderController extends Controller
{
    use GeneratesTransactionCode;
    public function index(Request $request)
    {
        $user  = $request->user();
        $query = ReceiveOrder::with(['warehouse', 'creator', 'verifier'])
            ->orderByRaw("CASE WHEN status = 'incomplete' THEN 0 ELSE 1 END ASC")
            ->orderByRaw("CASE WHEN status = 'incomplete' THEN created_at ELSE date_arrived END DESC");

        if ($user->role === 'manager') {
            $query->where('warehouse_id', $user->warehouse_id);
        } elseif ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->input('warehouse_id'));
        }

        $orders = $query->get()->map(fn ($o) => [
            'id'                => $o->id,
            'code'              => $o->code,
            'warehouse'         => $o->warehouse->name,
            'date_created'      => $o->created_at->format('M d, Y'),
            'date_accomplished' => $o->date_arrived?->format('M d, Y') ?? '—',
            'created_by'        => $o->creator?->name,
            'verified_by'       => $o->verifier?->name ?? '—',
            'status'            => $o->status,
        ]);

        return response()->json(['orders' => $orders]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'warehouse_id'   => 'required|exists:warehouses,id',
            'supplier_name'  => 'required|string|max:255',
            'delivery_fee'   => 'required|numeric|min:0',
            'date_ordered'   => 'required|date',
            'pin'            => 'required|string|size:6',
            'items'          => 'required|array|min:1',
            'items.*.product_code'     => 'required|string|exists:products,sku_code',
            'items.*.quantity_ordered' => 'required|numeric|min:0.001',
            'items.*.harvest_date'     => 'nullable|date',
            'items.*.product_cost'     => 'required|numeric|min:0',
        ]);

        $user = $request->user();
        if (!$user->pin || !Hash::check($request->pin, $user->pin)) {
            return response()->json(['message' => 'Incorrect PIN.'], 422);
        }

        $warehouse = Warehouse::findOrFail($request->warehouse_id);

        $orderCost = collect($request->items)->sum('product_cost');
        $total = $orderCost + $request->delivery_fee;

        $order = DB::transaction(function () use ($request, $warehouse, $orderCost, $total, $user) {
            $code = $this->generateTransactionCode('RO', $warehouse->id, $warehouse->code, ReceiveOrder::class);

            $order = ReceiveOrder::create([
                'code'          => $code,
                'warehouse_id'  => $request->warehouse_id,
                'supplier_name' => $request->supplier_name,
                'delivery_fee'  => $request->delivery_fee,
                'order_cost'    => $orderCost,
                'total'         => $total,
                'date_ordered'  => $request->date_ordered,
                'status'        => 'incomplete',
                'created_by'    => $user->id,
            ]);

            foreach ($request->items as $item) {
                $product = Product::where('sku_code', $item['product_code'])->first();
                ReceiveOrderItem::create([
                    'receive_order_id' => $order->id,
                    'product_id'       => $product->id,
                    'quantity_ordered' => $item['quantity_ordered'],
                    'quantity_arrived' => 0,
                    'harvest_date'     => $item['harvest_date'] ?? null,
                    'product_cost'     => $item['product_cost'],
                ]);
            }

            return $order;
        });

        return response()->json(['order' => ['code' => $order->code]], 201);
    }

    public function show(ReceiveOrder $receiveOrder)
    {
        $receiveOrder->load(['warehouse', 'creator', 'verifier', 'items.product']);

        $data = [
            'id'            => $receiveOrder->id,
            'code'          => $receiveOrder->code,
            'warehouse_id'  => $receiveOrder->warehouse_id,
            'warehouse'     => $receiveOrder->warehouse->name,
            'supplier_name' => $receiveOrder->supplier_name,
            'delivery_fee'  => $receiveOrder->delivery_fee,
            'order_cost'    => $receiveOrder->order_cost,
            'total'         => $receiveOrder->total,
            'date_ordered'  => $receiveOrder->date_ordered->format('Y-m-d'),
            'date_arrived'  => $receiveOrder->date_arrived?->format('Y-m-d'),
            'status'        => $receiveOrder->status,
            'created_by'    => $receiveOrder->creator?->name,
            'verified_by'   => $receiveOrder->verifier?->name,
            'items'         => $receiveOrder->items->map(fn ($i) => [
                'id'               => $i->id,
                'product_code'     => $i->product->sku_code,
                'product_name'     => $i->product->name,
                'unit'             => $i->product->unit,
                'category'         => $i->product->category,
                'quantity_ordered' => $i->quantity_ordered,
                'quantity_arrived' => $i->quantity_arrived,
                'harvest_date'     => $i->harvest_date?->format('Y-m-d'),
                'product_cost'     => $i->product_cost,
            ]),
        ];

        return response()->json(['order' => $data]);
    }

    public function complete(Request $request, ReceiveOrder $receiveOrder)
    {
        if ($receiveOrder->status === 'accomplished') {
            return response()->json(['message' => 'Order already accomplished.'], 422);
        }

        $request->validate([
            'date_arrived'             => 'required|date',
            'pin'                      => 'required|string|size:6',
            'items'                    => 'required|array|min:1',
            'items.*.id'               => 'required|integer|exists:receive_order_items,id',
            'items.*.quantity_arrived' => 'required|numeric|min:0',
        ]);

        $user = $request->user();

        if ($user->id === $receiveOrder->created_by) {
            return response()->json(['message' => 'A different manager must verify this order.'], 422);
        }

        if (!$user->pin || !Hash::check($request->pin, $user->pin)) {
            return response()->json(['message' => 'Incorrect PIN.'], 422);
        }

        try {
            DB::transaction(function () use ($request, $receiveOrder, $user) {
                DB::table('receive_orders')->where('id', $receiveOrder->id)->lockForUpdate()->first();
                $receiveOrder->refresh();
                if ($receiveOrder->status !== 'incomplete') {
                    throw new \RuntimeException('Order already accomplished.');
                }

                $receiveOrder->update([
                    'date_arrived' => $request->date_arrived,
                    'status'       => 'accomplished',
                    'verified_by'  => $user->id,
                ]);

                $itemMap = collect($request->items)->keyBy('id');

                foreach ($receiveOrder->items as $item) {
                    $arrived = (float) ($itemMap[$item->id]['quantity_arrived'] ?? 0);
                    $item->update(['quantity_arrived' => $arrived]);

                    if ($arrived > 0) {
                        $product = $item->product;
                        $warehouse = $receiveOrder->warehouse;
                        $skuSeq = substr($product->sku_code, 4);
                        $batchSeq = str_pad(StockInUse::where('product_id', $product->id)->where('warehouse_id', $receiveOrder->warehouse_id)->lockForUpdate()->count() + 1, 3, '0', STR_PAD_LEFT);
                        $code = "SKU-{$warehouse->code}-{$skuSeq}-{$batchSeq}";

                        StockInUse::create([
                            'code'         => $code,
                            'product_id'   => $product->id,
                            'warehouse_id' => $receiveOrder->warehouse_id,
                            'quantity'     => $arrived,
                            'harvest_date' => $item->harvest_date ?? now()->toDateString(),
                        ]);
                    }
                }
            });
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['message' => 'Accomplished ' . $receiveOrder->code]);
    }
}
