<?php

namespace App\Http\Controllers;

use App\Models\Reconciliation;
use App\Models\ReconciliationBatchAdjustment;
use App\Models\ReconciliationItem;
use App\Models\StockInUse;
use App\Models\User;
use App\Models\Warehouse;
use App\Traits\GeneratesTransactionCode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class ReconciliationController extends Controller
{
    use GeneratesTransactionCode;

    public function index(Request $request)
    {
        $query = Reconciliation::with(['warehouse', 'reconciledBy', 'reviewedBy'])
            ->withCount(['items as products_with_discrepancy' => function ($q) {
                $q->where('discrepancy', '!=', 0);
            }])
            ->orderByDesc('created_at');

        if ($request->has('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $reconciliations = $query->get()->map(fn ($r) => [
            'id'                        => $r->id,
            'transaction_code'          => $r->transaction_code,
            'warehouse_id'              => $r->warehouse_id,
            'warehouse'                 => $r->warehouse->name,
            'date_reconciled'           => $r->date_reconciled->format('M d, Y'),
            'date_reviewed'             => $r->date_reviewed?->format('M d, Y') ?? '—',
            'reconciled_by'             => $r->reconciledBy?->name,
            'reviewed_by'               => $r->reviewedBy?->name ?? '—',
            'status'                    => $r->status,
            'products_with_discrepancy' => $r->products_with_discrepancy,
        ]);

        return response()->json(['reconciliations' => $reconciliations]);
    }

    public function expectedStock(Request $request)
    {
        $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
        ]);

        $products = StockInUse::with('product')
            ->where('warehouse_id', $request->warehouse_id)
            ->where('quantity', '>', 0)
            ->get()
            ->groupBy('product_id')
            ->map(function ($batches) {
                $product = $batches->first()->product;
                return [
                    'id'             => $product->id,
                    'sku_code'       => $product->sku_code,
                    'name'           => $product->name,
                    'unit'           => $product->unit,
                    'total_quantity' => (float) $batches->sum(fn ($b) => (float) $b->quantity),
                ];
            })
            ->filter(fn ($p) => $p['total_quantity'] > 0)
            ->sortBy('name')
            ->values();

        return response()->json(['products' => $products]);
    }

    public function store(Request $request)
    {
        $warehouseId = $request->input('warehouse_id');
        $warehouse   = Warehouse::find($warehouseId);

        if (!$warehouse || $warehouse->is_temporary) {
            return response()->json(['message' => 'Invalid or temporary warehouse.'], 422);
        }

        $request->validate([
            'warehouse_id'         => 'required|exists:warehouses,id',
            'date_reconciled'      => 'required|date',
            'pin'                  => 'required|string|size:6',
            'items'                => 'required|array|min:1',
            'items.*.product_id'   => 'required|integer|exists:products,id',
            'items.*.actual_count' => 'required|numeric|gte:0',
            'items.*.remarks'      => ['nullable', function ($attribute, $value, $fail) use ($request, $warehouse) {
                preg_match('/items\.(\d+)\.remarks/', $attribute, $matches);
                $index = $matches[1];
                $item  = $request->input("items.{$index}");

                $expectedStock = (float) StockInUse::where('warehouse_id', $warehouse->id)
                    ->where('product_id', $item['product_id'] ?? null)
                    ->where('quantity', '>', 0)
                    ->sum('quantity');

                $discrepancy = (float) ($item['actual_count'] ?? 0) - $expectedStock;

                if (abs($discrepancy) > 0.0005 && empty(trim($value ?? ''))) {
                    $fail('Remarks are required when there is a discrepancy.');
                }
            }],
        ]);

        $user = $request->user();
        if (!$user->pin || !Hash::check($request->pin, $user->pin)) {
            return response()->json(['message' => 'Incorrect PIN.'], 422);
        }

        $reconciliation = DB::transaction(function () use ($request, $warehouse, $user) {
            $code = $this->generateTransactionCode('RC', $warehouse->id, $warehouse->code, Reconciliation::class);

            $reconciliation = Reconciliation::create([
                'transaction_code' => $code,
                'warehouse_id'     => $warehouse->id,
                'reconciled_by'    => $user->id,
                'reviewed_by'      => null,
                'date_reconciled'  => $request->date_reconciled,
                'date_reviewed'    => null,
                'status'           => 'pending_review',
            ]);

            foreach ($request->items as $item) {
                $expectedStock = (float) StockInUse::where('warehouse_id', $warehouse->id)
                    ->where('product_id', $item['product_id'])
                    ->where('quantity', '>', 0)
                    ->lockForUpdate()
                    ->sum('quantity');

                $discrepancy = (float) $item['actual_count'] - $expectedStock;

                ReconciliationItem::create([
                    'reconciliation_id' => $reconciliation->id,
                    'product_id'        => $item['product_id'],
                    'expected_stock'    => $expectedStock,
                    'actual_count'      => $item['actual_count'],
                    'discrepancy'       => $discrepancy,
                    'remarks'           => $item['remarks'] ?? null,
                ]);
            }

            return $reconciliation;
        });

        return response()->json(['reconciliation' => ['transaction_code' => $reconciliation->transaction_code]], 201);
    }

    public function show($id)
    {
        $reconciliation = Reconciliation::with([
            'warehouse',
            'reconciledBy',
            'reviewedBy',
            'items.product',
            'items.adjustments.stockInUse',
        ])->findOrFail($id);

        return response()->json(['reconciliation' => [
            'id'               => $reconciliation->id,
            'transaction_code' => $reconciliation->transaction_code,
            'warehouse_id'     => $reconciliation->warehouse_id,
            'warehouse'        => $reconciliation->warehouse->name,
            'date_reconciled'  => $reconciliation->date_reconciled->format('Y-m-d'),
            'date_reviewed'    => $reconciliation->date_reviewed?->format('Y-m-d'),
            'status'           => $reconciliation->status,
            'reconciled_by'    => $reconciliation->reconciledBy?->name,
            'reviewed_by'      => $reconciliation->reviewedBy?->name,
            'items'            => $reconciliation->items->map(fn ($item) => [
                'id'             => $item->id,
                'product_id'     => $item->product_id,
                'product_code'   => $item->product->sku_code,
                'product_name'   => $item->product->name,
                'unit'           => $item->product->unit,
                'expected_stock' => $item->expected_stock,
                'actual_count'   => $item->actual_count,
                'discrepancy'    => $item->discrepancy,
                'remarks'        => $item->remarks,
                'adjustments'    => $item->adjustments->map(fn ($adj) => [
                    'id'                  => $adj->id,
                    'direction'           => $adj->direction,
                    'quantity'            => $adj->quantity,
                    'harvest_date_source' => $adj->harvest_date_source,
                    'batch_code'          => $adj->stockInUse->code,
                ]),
            ]),
        ]]);
    }

    public function confirm(Request $request, $id)
    {
        $request->validate([
            'pin' => 'required|string|size:6',
        ]);

        $reconciliation = Reconciliation::findOrFail($id);

        if ($reconciliation->status === 'reviewed') {
            return response()->json(['message' => 'Reconciliation already reviewed.'], 422);
        }

        $user = $request->user();

        if ($user->role === 'admin') {
            // Admin bypass: master admin verifies with their own PIN.
            // Self-exclusion still applies — admin cannot confirm their own reconciliation.
            if ($user->id === $reconciliation->reconciled_by) {
                return response()->json(['message' => 'The verifier cannot be the reconciler.'], 422);
            }
            if (!$user->pin || !Hash::check($request->pin, $user->pin)) {
                return response()->json(['message' => 'Invalid PIN.'], 422);
            }
            $verifierId = $user->id;
        } else {
            // Manager flow: different-manager-same-branch rule (SRS §3.7).
            $candidates = User::where('warehouse_id', $reconciliation->warehouse_id)
                ->where('id', '!=', auth()->id())
                ->get();

            $matched = $candidates->first(fn ($u) => $u->pin && Hash::check($request->pin, $u->pin));

            if (!$matched) {
                return response()->json(['message' => 'No other manager at this warehouse matched the PIN.'], 422);
            }
            $verifierId = $matched->id;
        }

        try {
            DB::transaction(function () use ($reconciliation, $id, $verifierId) {
                DB::table('reconciliations')->where('id', $id)->lockForUpdate()->first();
                $reconciliation->refresh();

                if ($reconciliation->status !== 'pending_review') {
                    throw new \RuntimeException('Reconciliation already reviewed.');
                }

                $reconciliation->load('items');

                foreach ($reconciliation->items as $item) {
                    $discrepancy = (float) $item->discrepancy;

                    if (abs($discrepancy) <= 0.0005) {
                        continue;
                    }

                    if ($discrepancy < 0) {
                        $this->fifoDeduct($item, $reconciliation->warehouse_id);
                    } else {
                        $this->createSurplusBatch($item, $reconciliation->warehouse_id);
                    }
                }

                $reconciliation->update([
                    'status'        => 'reviewed',
                    'reviewed_by'   => $verifierId,
                    'date_reviewed' => today()->toDateString(),
                ]);
            });
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['message' => 'Reconciliation confirmed: ' . $reconciliation->transaction_code]);
    }

    private function fifoDeduct(ReconciliationItem $item, int $warehouseId): void
    {
        $remaining = abs((float) $item->discrepancy);

        $batches = StockInUse::where('warehouse_id', $warehouseId)
            ->where('product_id', $item->product_id)
            ->where('quantity', '>', 0)
            ->orderBy('harvest_date', 'asc')
            ->orderBy('id', 'asc')
            ->lockForUpdate()
            ->get();

        foreach ($batches as $batch) {
            if ($remaining <= 0) {
                break;
            }

            $deducted        = min((float) $batch->quantity, $remaining);
            $batch->quantity = (float) $batch->quantity - $deducted;
            $batch->save();

            ReconciliationBatchAdjustment::create([
                'reconciliation_item_id' => $item->id,
                'stock_in_use_id'        => $batch->id,
                'direction'              => 'deduction',
                'quantity'               => $deducted,
                'harvest_date_source'    => null,
            ]);

            $remaining -= $deducted;
        }

        if ($remaining > 0.0005) {
            throw new \RuntimeException('Insufficient stock for reconciliation deduction.');
        }
    }

    private function createSurplusBatch(ReconciliationItem $item, int $warehouseId): void
    {
        $surplus   = (float) $item->discrepancy;
        $warehouse = Warehouse::findOrFail($warehouseId);
        $product   = $item->product;

        $oldest = StockInUse::where('warehouse_id', $warehouseId)
            ->where('product_id', $item->product_id)
            ->where('quantity', '>', 0)
            ->orderBy('harvest_date', 'asc')
            ->orderBy('id', 'asc')
            ->first();

        if ($oldest) {
            $harvestDate       = $oldest->harvest_date;
            $harvestDateSource = 'copied_from_oldest';
        } else {
            $harvestDate       = today();
            $harvestDateSource = 'defaulted_today';
        }

        $skuSeq   = substr($product->sku_code, 4);
        $batchSeq = str_pad(
            StockInUse::where('warehouse_id', $warehouseId)
                ->where('product_id', $item->product_id)
                ->where('code', 'like', "RCB-{$warehouse->code}-{$skuSeq}-%")
                ->lockForUpdate()
                ->count() + 1,
            3, '0', STR_PAD_LEFT
        );
        $code = "RCB-{$warehouse->code}-{$skuSeq}-{$batchSeq}";

        $newBatch = StockInUse::create([
            'code'         => $code,
            'product_id'   => $item->product_id,
            'warehouse_id' => $warehouseId,
            'quantity'     => $surplus,
            'harvest_date' => $harvestDate,
        ]);

        ReconciliationBatchAdjustment::create([
            'reconciliation_item_id' => $item->id,
            'stock_in_use_id'        => $newBatch->id,
            'direction'              => 'addition',
            'quantity'               => $surplus,
            'harvest_date_source'    => $harvestDateSource,
        ]);
    }
}
