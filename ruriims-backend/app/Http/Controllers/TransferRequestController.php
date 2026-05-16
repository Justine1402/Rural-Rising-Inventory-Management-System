<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\StockInUse;
use App\Models\TransferRequest;
use App\Models\TransferRequestBatchDeduction;
use App\Models\TransferRequestItem;
use App\Models\Warehouse;
use App\Traits\GeneratesTransactionCode;
use App\Traits\PlansBatchCascade;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class TransferRequestController extends Controller
{
    use GeneratesTransactionCode;
    use PlansBatchCascade;

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
            'source_warehouse_id'        => 'required|exists:warehouses,id',
            'destination_warehouse_id'   => 'required|exists:warehouses,id|different:source_warehouse_id',
            'pin'                        => 'required|string|size:6',
            'items'                      => 'required|array|min:1',
            'items.*.product_code'       => 'required|string|exists:products,sku_code',
            'items.*.stock_in_use_id'    => 'required|integer|exists:stock_in_use_codes,id',
            'items.*.quantity_requested' => 'required|numeric|min:0.001',
        ]);

        $user = $request->user();
        if (!$user->pin || !Hash::check($request->pin, $user->pin)) {
            return response()->json(['message' => 'Incorrect PIN.'], 422);
        }

        $sourceWarehouse = Warehouse::findOrFail($request->source_warehouse_id);

        try {
            $transfer = DB::transaction(function () use ($request, $sourceWarehouse, $user) {
                $code = $this->generateTransactionCode('TRF', $sourceWarehouse->id, $sourceWarehouse->code, TransferRequest::class, 'code', 'source_warehouse_id');

                $transfer = TransferRequest::create([
                    'code'                     => $code,
                    'source_warehouse_id'      => $request->source_warehouse_id,
                    'destination_warehouse_id' => $request->destination_warehouse_id,
                    'date_requested'           => now()->toDateString(),
                    'status'                   => 'incomplete',
                    'requested_by'             => $user->id,
                ]);

                foreach ($request->items as $item) {
                    $product = Product::where('sku_code', $item['product_code'])->first();

                    // stock_in_use_id in the payload maps to requested_stock_in_use_id in the DB
                    $plan = $this->planBatchCascade(
                        $product->id,
                        $request->source_warehouse_id,
                        $item['stock_in_use_id'],
                        (float) $item['quantity_requested']
                    );

                    $planSum = array_sum(array_column($plan, 'quantity_deducted'));
                    if (abs($planSum - (float) $item['quantity_requested']) > 0.0005) {
                        throw new \RuntimeException(
                            "System invariant violated: cascade plan sum ({$planSum}) does not match quantity_requested ({$item['quantity_requested']}) for {$product->name}."
                        );
                    }

                    $selectedBatch = StockInUse::find($item['stock_in_use_id']);

                    $trfItem = TransferRequestItem::create([
                        'transfer_request_id'       => $transfer->id,
                        'product_id'                => $product->id,
                        'requested_stock_in_use_id' => $item['stock_in_use_id'],
                        'quantity_requested'         => $item['quantity_requested'],
                        'quantity_received'          => 0,
                        'harvest_date'               => $selectedBatch->harvest_date,
                    ]);

                    foreach ($plan as $entry) {
                        TransferRequestBatchDeduction::create([
                            'transfer_request_item_id' => $trfItem->id,
                            'stock_in_use_id'          => $entry['stock_in_use_id'],
                            'quantity_deducted'        => $entry['quantity_deducted'],
                        ]);
                    }
                }

                return $transfer;
            });
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['transfer' => ['code' => $transfer->code]], 201);
    }

    public function show(TransferRequest $transferRequest)
    {
        $transferRequest->load([
            'sourceWarehouse',
            'destinationWarehouse',
            'requester',
            'verifier',
            'items.product',
            'items.stockInUse',
            'items.batchDeductions.stockInUse',
        ]);

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
                'stock_in_use_id'    => $i->requested_stock_in_use_id,
                'stock_in_use_code'  => $i->stockInUse->code,
                'batch_quantity'     => (float) $i->stockInUse->quantity,
                'quantity_requested' => $i->quantity_requested,
                'quantity_received'  => $i->quantity_received,
                'harvest_date'       => $i->harvest_date?->format('Y-m-d'),
                'requested_batch'    => [
                    'code'         => $i->stockInUse->code,
                    'harvest_date' => $i->stockInUse->harvest_date?->format('Y-m-d'),
                ],
                'batch_deductions'   => $i->batchDeductions->map(fn ($d) => [
                    'batch'             => [
                        'code'         => $d->stockInUse->code,
                        'harvest_date' => $d->stockInUse->harvest_date?->format('Y-m-d'),
                    ],
                    'quantity_deducted' => $d->quantity_deducted,
                ]),
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
            'date_received'             => 'required|date',
            'pin'                       => 'required|string|size:6',
            'items'                     => 'required|array|min:1',
            'items.*.id'                => 'required|integer|exists:transfer_request_items,id',
            'items.*.quantity_received' => 'required|numeric|min:0',
        ]);

        $user = $request->user();

        if ($user->id === $transferRequest->requested_by) {
            return response()->json(['message' => 'A different manager must verify this transfer.'], 422);
        }

        if ($user->warehouse_id && $user->warehouse_id === $transferRequest->source_warehouse_id) {
            return response()->json(['message' => 'The verifying manager must be from a different warehouse than the source.'], 422);
        }

        if (!$user->pin || !Hash::check($request->pin, $user->pin)) {
            return response()->json(['message' => 'Incorrect PIN.'], 422);
        }

        $destination = Warehouse::findOrFail($transferRequest->destination_warehouse_id);

        try {
            DB::transaction(function () use ($request, $transferRequest, $user, $destination) {
                DB::table('transfer_requests')->where('id', $transferRequest->id)->lockForUpdate()->first();
                $transferRequest->refresh();
                if ($transferRequest->status !== 'incomplete') {
                    throw new \RuntimeException('Transfer request already accomplished.');
                }

                $transferRequest->update([
                    'date_received' => $request->date_received,
                    'status'        => 'complete',
                    'verified_by'   => $user->id,
                ]);

                $transferRequest->load(['items.product']);

                $itemMap = collect($request->items)->keyBy('id');

                foreach ($transferRequest->items as $item) {
                    $received = (float) ($itemMap[$item->id]['quantity_received'] ?? 0);
                    $item->update(['quantity_received' => $received]);

                    if ($received <= 0) {
                        continue;
                    }

                    // Discard stale create-time plan; recompute against current stock
                    $item->batchDeductions()->delete();

                    try {
                        $plan = $this->planBatchCascade(
                            $item->product_id,
                            $transferRequest->source_warehouse_id,
                            $item->requested_stock_in_use_id,
                            $received
                        );
                    } catch (\RuntimeException $e) {
                        $warehouseTotal = StockInUse::where('product_id', $item->product_id)
                            ->where('warehouse_id', $transferRequest->source_warehouse_id)
                            ->where('quantity', '>', 0)
                            ->sum('quantity');
                        throw new \RuntimeException(
                            "Insufficient stock in source warehouse for {$item->product->name}. Requested: {$received}, available: {$warehouseTotal}."
                        );
                    }

                    $planSum = array_sum(array_column($plan, 'quantity_deducted'));
                    if (abs($planSum - $received) > 0.0005) {
                        throw new \RuntimeException(
                            "System invariant violated: cascade plan sum ({$planSum}) does not match quantity_received ({$received}) for {$item->product->name}."
                        );
                    }

                    $product = $item->product;
                    $skuSeq  = substr($product->sku_code, 4);

                    foreach ($plan as $entry) {
                        TransferRequestBatchDeduction::create([
                            'transfer_request_item_id' => $item->id,
                            'stock_in_use_id'          => $entry['stock_in_use_id'],
                            'quantity_deducted'        => $entry['quantity_deducted'],
                        ]);

                        $sourceBatch = StockInUse::lockForUpdate()->findOrFail($entry['stock_in_use_id']);
                        $sourceBatch->decrement('quantity', $entry['quantity_deducted']);

                        $batchSeq = str_pad(
                            StockInUse::where('product_id', $product->id)->where('warehouse_id', $destination->id)->lockForUpdate()->count() + 1,
                            3, '0', STR_PAD_LEFT
                        );
                        $destCode = "SKU-{$destination->code}-{$skuSeq}-{$batchSeq}";

                        StockInUse::create([
                            'code'         => $destCode,
                            'product_id'   => $product->id,
                            'warehouse_id' => $destination->id,
                            'quantity'     => $entry['quantity_deducted'],
                            'harvest_date' => $sourceBatch->harvest_date,
                        ]);
                    }
                }
            });
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['message' => 'Accomplished ' . $transferRequest->code]);
    }
}
