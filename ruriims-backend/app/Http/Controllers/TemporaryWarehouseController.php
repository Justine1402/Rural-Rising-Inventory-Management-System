<?php

namespace App\Http\Controllers;

use App\Models\IssueProductItem;
use App\Models\StockInUse;
use App\Models\TemporaryWarehouse;
use App\Models\TemporaryWarehouseReturn;
use App\Models\TransferRequestItem;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class TemporaryWarehouseController extends Controller
{
    public function index(Request $request)
    {
        $query = TemporaryWarehouse::with(['warehouse', 'creator', 'closer'])
            ->orderByDesc('created_at');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $twhs = $query->get()->map(fn ($t) => [
            'id'               => $t->id,
            'warehouse_id'     => $t->warehouse_id,
            'transaction_code' => $t->transaction_code,
            'name'             => $t->name,
            'location'         => $t->location,
            'event_date'       => $t->event_date->format('M d, Y'),
            'created_at'       => $t->created_at->format('M d, Y'),
            'status'           => $t->status,
            'created_by'       => $t->creator?->name,
            'closed_by'        => $t->closer?->name ?? '—',
            'date_closed'      => $t->date_closed?->format('M d, Y') ?? '—',
        ]);

        return response()->json(['temporary_warehouses' => $twhs]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'          => 'required|string|max:255',
            'location'      => 'required|string|max:255',
            'location_code' => 'required|string|max:10|alpha_num',
            'event_date'    => 'required|date',
            'pin'           => 'required|string|size:6',
        ]);

        $user = $request->user();
        if (!$user->pin || !Hash::check($request->pin, $user->pin)) {
            return response()->json(['message' => 'Incorrect PIN.'], 422);
        }

        $locationCode = strtoupper($request->location_code);

        try {
            $twh = DB::transaction(function () use ($request, $user, $locationCode) {
                $count = DB::table('temporary_warehouses')
                    ->where('transaction_code', 'like', "TWH-{$locationCode}-000-%")
                    ->lockForUpdate()
                    ->count();

                $seq             = str_pad($count + 1, 3, '0', STR_PAD_LEFT);
                $transactionCode = "TWH-{$locationCode}-000-{$seq}";

                $warehouse = Warehouse::create([
                    'name'         => $request->name,
                    'code'         => $locationCode,
                    'is_temporary' => true,
                ]);

                return TemporaryWarehouse::create([
                    'warehouse_id'     => $warehouse->id,
                    'transaction_code' => $transactionCode,
                    'name'             => $request->name,
                    'location'         => $request->location,
                    'event_date'       => $request->event_date,
                    'created_by'       => $user->id,
                    'status'           => 'active',
                ]);
            });
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'temporary_warehouse' => [
                'id'               => $twh->id,
                'warehouse_id'     => $twh->warehouse_id,
                'transaction_code' => $twh->transaction_code,
                'name'             => $twh->name,
            ],
        ], 201);
    }

    public function show(TemporaryWarehouse $temporaryWarehouse)
    {
        $temporaryWarehouse->load([
            'warehouse', 'creator', 'closer',
            'returns.product',
            'returns.sourceStockInUse',
            'returns.destinationStockInUse',
            'returns.destinationWarehouse',
        ]);

        $warehouseId = $temporaryWarehouse->warehouse_id;

        $transferredIn = TransferRequestItem::with(['product', 'transferRequest.sourceWarehouse'])
            ->whereHas('transferRequest', fn ($q) => $q
                ->where('destination_warehouse_id', $warehouseId)
                ->where('status', 'complete'))
            ->where('quantity_received', '>', 0)
            ->get()
            ->map(fn ($i) => [
                'transfer_request_code' => $i->transferRequest->code,
                'product_code'          => $i->product->sku_code,
                'product_name'          => $i->product->name,
                'unit'                  => $i->product->unit,
                'quantity_received'     => $i->quantity_received,
                'harvest_date'          => $i->harvest_date?->format('Y-m-d'),
                'stock_in_use_code'     => StockInUse::where('warehouse_id', $warehouseId)
                    ->where('product_id', $i->product_id)
                    ->value('code'),
                'source_warehouse'      => $i->transferRequest->sourceWarehouse->name,
            ]);

        $issued = IssueProductItem::with(['product', 'issueProduct', 'stockInUse'])
            ->whereHas('issueProduct', fn ($q) => $q->where('warehouse_id', $warehouseId))
            ->get()
            ->map(fn ($i) => [
                'issue_product_code' => $i->issueProduct->code,
                'product_code'       => $i->product->sku_code,
                'product_name'       => $i->product->name,
                'unit'               => $i->product->unit,
                'quantity_issued'    => $i->quantity_issued,
                'harvest_date'       => $i->harvest_date?->format('Y-m-d'),
                'stock_in_use_code'  => $i->stockInUse?->code,
                'issue_type'         => $i->issueProduct->issue_type,
            ]);

        return response()->json(['temporary_warehouse' => [
            'id'               => $temporaryWarehouse->id,
            'transaction_code' => $temporaryWarehouse->transaction_code,
            'name'             => $temporaryWarehouse->name,
            'location'         => $temporaryWarehouse->location,
            'event_date'       => $temporaryWarehouse->event_date->format('Y-m-d'),
            'status'           => $temporaryWarehouse->status,
            'warehouse_id'     => $temporaryWarehouse->warehouse_id,
            'created_by'       => $temporaryWarehouse->creator?->name,
            'closed_by'        => $temporaryWarehouse->closer?->name,
            'date_closed'      => $temporaryWarehouse->date_closed?->format('Y-m-d'),
            'products_transferred_in' => $transferredIn,
            'products_issued'         => $issued,
            'products_returned'       => $temporaryWarehouse->returns->map(fn ($r) => [
                'product_code'           => $r->product->sku_code,
                'product_name'           => $r->product->name,
                'unit'                   => $r->product->unit,
                'source_batch_code'      => $r->sourceStockInUse->code,
                'destination_batch_code' => $r->destinationStockInUse->code,
                'destination_warehouse'  => $r->destinationWarehouse->name,
                'quantity_returned'      => $r->quantity_returned,
                'harvest_date'           => $r->harvest_date?->format('Y-m-d'),
            ]),
        ]]);
    }

    public function close(Request $request, TemporaryWarehouse $temporaryWarehouse)
    {
        if ($temporaryWarehouse->status === 'closed') {
            return response()->json(['message' => 'Temporary warehouse already closed.'], 422);
        }

        $request->validate([
            'date_closed' => 'required|date',
            'pin'         => 'required|string|size:6',
            'returns'     => 'nullable|array',
            'returns.*.stock_in_use_id'          => 'required_with:returns|integer|exists:stock_in_use_codes,id',
            'returns.*.destination_warehouse_id' => 'required_with:returns|integer|exists:warehouses,id',
            'returns.*.quantity_returned'        => 'required_with:returns|numeric|min:0.001',
        ]);

        $user = $request->user();

        if (!$user->pin || !Hash::check($request->pin, $user->pin)) {
            return response()->json(['message' => 'Incorrect PIN.'], 422);
        }

        try {
            DB::transaction(function () use ($request, $temporaryWarehouse, $user) {
                DB::table('temporary_warehouses')->where('id', $temporaryWarehouse->id)->lockForUpdate()->first();
                $temporaryWarehouse->refresh();
                if ($temporaryWarehouse->status !== 'active') {
                    throw new \RuntimeException('Temporary warehouse already closed.');
                }

                $temporaryWarehouse->update([
                    'date_closed' => $request->date_closed,
                    'status'      => 'closed',
                    'closed_by'   => $user->id,
                ]);

                foreach ($request->input('returns', []) as $ret) {
                    $destWarehouse = Warehouse::findOrFail($ret['destination_warehouse_id']);
                    if ($destWarehouse->is_temporary) {
                        throw new \RuntimeException("Destination \"{$destWarehouse->name}\" is a temporary warehouse. Returns must go to a permanent warehouse.");
                    }

                    $sourceBatch = StockInUse::lockForUpdate()->findOrFail($ret['stock_in_use_id']);

                    if ($sourceBatch->warehouse_id !== $temporaryWarehouse->warehouse_id) {
                        throw new \RuntimeException("Batch {$sourceBatch->code} does not belong to this temporary warehouse.");
                    }

                    $qty = (float) $ret['quantity_returned'];
                    if ($sourceBatch->quantity < $qty - 0.0005) {
                        throw new \RuntimeException("Insufficient stock in batch {$sourceBatch->code}. Available: {$sourceBatch->quantity}, requested: {$qty}.");
                    }

                    $sourceBatch->decrement('quantity', $qty);

                    $product  = $sourceBatch->product;
                    $skuSeq   = substr($product->sku_code, 4);
                    $batchSeq = str_pad(
                        StockInUse::where('product_id', $product->id)->where('warehouse_id', $destWarehouse->id)->lockForUpdate()->count() + 1,
                        3, '0', STR_PAD_LEFT
                    );
                    $destCode = "SKU-{$destWarehouse->code}-{$skuSeq}-{$batchSeq}";

                    $destBatch = StockInUse::create([
                        'code'         => $destCode,
                        'product_id'   => $product->id,
                        'warehouse_id' => $destWarehouse->id,
                        'quantity'     => $qty,
                        'harvest_date' => $sourceBatch->harvest_date,
                    ]);

                    TemporaryWarehouseReturn::create([
                        'temporary_warehouse_id'      => $temporaryWarehouse->id,
                        'product_id'                  => $product->id,
                        'source_stock_in_use_id'      => $sourceBatch->id,
                        'destination_stock_in_use_id' => $destBatch->id,
                        'destination_warehouse_id'    => $destWarehouse->id,
                        'quantity_returned'           => $qty,
                        'harvest_date'                => $sourceBatch->harvest_date,
                    ]);
                }
            });
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['message' => 'Closed ' . $temporaryWarehouse->transaction_code]);
    }
}
