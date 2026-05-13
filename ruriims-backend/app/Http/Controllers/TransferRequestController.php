<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\StockInUse;
use App\Models\TransferRequest;
use App\Models\TransferRequestItem;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class TransferRequestController extends Controller
{
    public function index()
    {
        $transfers = TransferRequest::with(['sourceWarehouse', 'destinationWarehouse', 'requester', 'verifier'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($t) => [
                'id'                    => $t->id,
                'code'                  => $t->code,
                'source_warehouse'      => $t->sourceWarehouse->name,
                'destination_warehouse' => $t->destinationWarehouse->name,
                'date_requested'        => $t->date_requested->format('M d, Y'),
                'date_accomplished'     => $t->date_received?->format('M d, Y') ?? '—',
                'requested_by'          => $t->requester->name,
                'verified_by'           => $t->verifier?->name ?? '—',
                'status'                => $t->status,
            ]);

        return response()->json(['transfers' => $transfers]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'source_warehouse_id'      => 'required|exists:warehouses,id',
            'destination_warehouse_id' => 'required|exists:warehouses,id|different:source_warehouse_id',
            'pin'                      => 'required|string|size:6',
            'items'                    => 'required|array|min:1',
            'items.*.product_code'     => 'required|string|exists:products,sku_code',
            'items.*.stock_in_use_id'  => 'required|integer|exists:stock_in_use_codes,id',
            'items.*.quantity_requested' => 'required|numeric|min:0.001',
        ]);

        $user = $request->user();
        if (!$user->pin || !Hash::check($request->pin, $user->pin)) {
            return response()->json(['message' => 'Incorrect PIN.'], 422);
        }

        $sourceWarehouse = Warehouse::findOrFail($request->source_warehouse_id);

        $transfer = DB::transaction(function () use ($request, $sourceWarehouse, $user) {
            // TODO: extract into GeneratesTransactionCode trait when ISS/TWH are built
            $seq = TransferRequest::where('source_warehouse_id', $sourceWarehouse->id)
                ->lockForUpdate()
                ->count() + 1;
            $code = 'TRF-' . $sourceWarehouse->code . '-000-' . str_pad($seq, 3, '0', STR_PAD_LEFT);

            $transfer = TransferRequest::create([
                'code'                     => $code,
                'source_warehouse_id'      => $request->source_warehouse_id,
                'destination_warehouse_id' => $request->destination_warehouse_id,
                'date_requested'           => now()->toDateString(),
                'status'                   => 'incomplete',
                'requested_by'             => $user->id,
            ]);

            foreach ($request->items as $item) {
                $product  = Product::where('sku_code', $item['product_code'])->first();
                $batch    = StockInUse::findOrFail($item['stock_in_use_id']);

                TransferRequestItem::create([
                    'transfer_request_id' => $transfer->id,
                    'product_id'          => $product->id,
                    'stock_in_use_id'     => $item['stock_in_use_id'],
                    'quantity_requested'  => $item['quantity_requested'],
                    'quantity_received'   => 0,
                    'harvest_date'        => $batch->harvest_date,
                ]);
            }

            return $transfer;
        });

        return response()->json(['transfer' => ['code' => $transfer->code]], 201);
    }

    public function show(TransferRequest $transferRequest)
    {
        $transferRequest->load(['sourceWarehouse', 'destinationWarehouse', 'requester', 'verifier', 'items.product', 'items.stockInUse']);

        $data = [
            'id'                        => $transferRequest->id,
            'code'                      => $transferRequest->code,
            'source_warehouse_id'       => $transferRequest->source_warehouse_id,
            'source_warehouse'          => $transferRequest->sourceWarehouse->name,
            'destination_warehouse_id'  => $transferRequest->destination_warehouse_id,
            'destination_warehouse'     => $transferRequest->destinationWarehouse->name,
            'date_requested'            => $transferRequest->date_requested->format('M d, Y'),
            'date_received'             => $transferRequest->date_received?->format('Y-m-d'),
            'status'                    => $transferRequest->status,
            'requested_by'              => $transferRequest->requester->name,
            'verified_by'               => $transferRequest->verifier?->name,
            'items'                     => $transferRequest->items->map(fn ($i) => [
                'id'                 => $i->id,
                'product_id'         => $i->product_id,
                'product_code'       => $i->product->sku_code,
                'product_name'       => $i->product->name,
                'unit'               => $i->product->unit,
                'category'           => $i->product->category,
                'stock_in_use_id'    => $i->stock_in_use_id,
                'stock_in_use_code'  => $i->stockInUse->code,
                'quantity_requested' => $i->quantity_requested,
                'quantity_received'  => $i->quantity_received,
                'harvest_date'       => $i->harvest_date?->format('Y-m-d'),
            ]),
        ];

        return response()->json(['transfer' => $data]);
    }

    public function accomplish(Request $request, TransferRequest $transferRequest)
    {
        if ($transferRequest->status === 'complete') {
            return response()->json(['message' => 'Transfer request already accomplished.'], 422);
        }

        $request->validate([
            'date_received'              => 'required|date',
            'pin'                        => 'required|string|size:6',
            'items'                      => 'required|array|min:1',
            'items.*.id'                 => 'required|integer|exists:transfer_request_items,id',
            'items.*.quantity_received'  => 'required|numeric|min:0',
        ]);

        $user = $request->user();

        if ($user->id === $transferRequest->requested_by) {
            return response()->json(['message' => 'A different manager must verify this transfer.'], 422);
        }

        // Reject if verifier is from the same warehouse as the source (enforced once warehouse_id is assigned in Step 13)
        if ($user->warehouse_id && $user->warehouse_id === $transferRequest->source_warehouse_id) {
            return response()->json(['message' => 'The verifying manager must be from a different warehouse than the source.'], 422);
        }

        if (!$user->pin || !Hash::check($request->pin, $user->pin)) {
            return response()->json(['message' => 'Incorrect PIN.'], 422);
        }

        $destination = Warehouse::findOrFail($transferRequest->destination_warehouse_id);

        DB::transaction(function () use ($request, $transferRequest, $user, $destination) {
            $transferRequest->update([
                'date_received' => $request->date_received,
                'status'        => 'complete',
                'verified_by'   => $user->id,
            ]);

            $itemMap = collect($request->items)->keyBy('id');

            foreach ($transferRequest->items as $item) {
                $received = (float) ($itemMap[$item->id]['quantity_received'] ?? 0);
                $item->update(['quantity_received' => $received]);

                if ($received <= 0) {
                    continue;
                }

                $sourceBatch = StockInUse::lockForUpdate()->findOrFail($item->stock_in_use_id);

                if ($sourceBatch->quantity < $received) {
                    throw new \Exception("Insufficient stock in batch {$sourceBatch->code}.");
                }

                $sourceBatch->decrement('quantity', $received);

                $product  = $item->product;
                $skuSeq   = substr($product->sku_code, 4);
                $batchSeq = str_pad(
                    StockInUse::where('product_id', $product->id)->where('warehouse_id', $destination->id)->lockForUpdate()->count() + 1,
                    3, '0', STR_PAD_LEFT
                );
                $destCode = "SKU-{$destination->code}-{$skuSeq}-{$batchSeq}";

                StockInUse::create([
                    'code'         => $destCode,
                    'product_id'   => $product->id,
                    'warehouse_id' => $destination->id,
                    'quantity'     => $received,
                    'harvest_date' => $item->harvest_date ?? now()->toDateString(),
                ]);
            }
        });

        return response()->json(['message' => 'Accomplished ' . $transferRequest->code]);
    }
}
