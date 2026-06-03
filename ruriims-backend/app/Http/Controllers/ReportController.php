<?php

namespace App\Http\Controllers;

use App\Models\IssueProduct;
use App\Models\Product;
use App\Models\ReceiveOrder;
use App\Models\Reconciliation;
use App\Models\StockInUse;
use App\Models\TemporaryWarehouse;
use App\Models\TransferRequest;
use App\Models\Warehouse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    private const DISCREPANCY_EPSILON = 0.0005;

    // ─── allReports ────────────────────────────────────────────────────────────

    public function allReports(Request $request)
    {
        $user        = $request->user();
        $warehouseId = $request->input('warehouse_id');
        $dateFrom    = $request->input('date_from');
        $dateTo      = $request->input('date_to');
        $search      = $request->input('search');

        if ($user->role === 'manager') {
            $warehouseId = $user->warehouse_id;
        }

        $rows = collect();

        // Receive Orders
        $roQuery = ReceiveOrder::with(['warehouse', 'verifier']);
        if ($warehouseId) {
            $roQuery->where('warehouse_id', $warehouseId);
        }
        if ($dateFrom) {
            $roQuery->whereDate('date_arrived', '>=', $dateFrom);
        }
        if ($dateTo) {
            $roQuery->whereDate('date_arrived', '<=', $dateTo);
        }
        if ($search) {
            $roQuery->where('code', 'like', "%{$search}%");
        }
        $roQuery->get()->each(function ($o) use (&$rows) {
            $rows->push([
                'id'                => $o->id,
                'transaction_code'  => $o->code,
                'transaction_type'  => 'Receive Order',
                'warehouse'         => $o->warehouse->name,
                'date_accomplished' => $o->date_arrived?->format('Y-m-d'),
                'accomplished_by'   => $o->verifier?->name ?? '—',
                'status'            => $this->formatStatus($o->status),
            ]);
        });

        // Transfer Requests
        $trQuery = TransferRequest::with(['sourceWarehouse', 'verifier']);
        if ($warehouseId) {
            $trQuery->where('source_warehouse_id', $warehouseId);
        }
        if ($dateFrom) {
            $trQuery->whereDate('date_received', '>=', $dateFrom);
        }
        if ($dateTo) {
            $trQuery->whereDate('date_received', '<=', $dateTo);
        }
        if ($search) {
            $trQuery->where('code', 'like', "%{$search}%");
        }
        $trQuery->get()->each(function ($t) use (&$rows) {
            $rows->push([
                'id'                => $t->id,
                'transaction_code'  => $t->code,
                'transaction_type'  => 'Transfer Request',
                'warehouse'         => $t->sourceWarehouse->name,
                'date_accomplished' => $t->date_received?->format('Y-m-d'),
                'accomplished_by'   => $t->verifier?->name ?? '—',
                'status'            => $this->formatStatus($t->status),
            ]);
        });

        // Issue Products
        $ipQuery = IssueProduct::with(['warehouse', 'issuedBy']);
        if ($warehouseId) {
            $ipQuery->where('warehouse_id', $warehouseId);
        }
        if ($dateFrom) {
            $ipQuery->whereDate('date_issued', '>=', $dateFrom);
        }
        if ($dateTo) {
            $ipQuery->whereDate('date_issued', '<=', $dateTo);
        }
        if ($search) {
            $ipQuery->where('code', 'like', "%{$search}%");
        }
        $ipQuery->get()->each(function ($i) use (&$rows) {
            $rows->push([
                'id'                => $i->id,
                'transaction_code'  => $i->code,
                'transaction_type'  => 'Issue Product',
                'warehouse'         => $i->warehouse->name,
                'date_accomplished' => $i->date_issued?->format('Y-m-d'),
                'accomplished_by'   => $i->issuedBy?->name ?? '—',
                'status'            => 'Complete',
            ]);
        });

        // Temporary Warehouses
        $twhQuery = TemporaryWarehouse::with(['warehouse', 'closer']);
        if ($dateFrom) {
            $twhQuery->whereDate('date_closed', '>=', $dateFrom);
        }
        if ($dateTo) {
            $twhQuery->whereDate('date_closed', '<=', $dateTo);
        }
        if ($search) {
            $twhQuery->where('transaction_code', 'like', "%{$search}%");
        }
        $twhQuery->get()->each(function ($w) use (&$rows) {
            $rows->push([
                'id'                => $w->id,
                'transaction_code'  => $w->transaction_code,
                'transaction_type'  => 'Temporary Warehouse',
                'warehouse'         => $w->warehouse->name,
                'date_accomplished' => $w->date_closed?->format('Y-m-d'),
                'accomplished_by'   => $w->closer?->name ?? '—',
                'status'            => $this->formatStatus($w->status),
            ]);
        });

        // Reconciliations
        $rcQuery = Reconciliation::with(['warehouse', 'reviewedBy']);
        if ($warehouseId) {
            $rcQuery->where('warehouse_id', $warehouseId);
        }
        if ($dateFrom) {
            $rcQuery->whereDate('date_reviewed', '>=', $dateFrom);
        }
        if ($dateTo) {
            $rcQuery->whereDate('date_reviewed', '<=', $dateTo);
        }
        if ($search) {
            $rcQuery->where('transaction_code', 'like', "%{$search}%");
        }
        $rcQuery->get()->each(function ($r) use (&$rows) {
            $rows->push([
                'id'                => $r->id,
                'transaction_code'  => $r->transaction_code,
                'transaction_type'  => 'Inventory Reconciliation',
                'warehouse'         => $r->warehouse->name,
                'date_accomplished' => $r->date_reviewed?->format('Y-m-d'),
                'accomplished_by'   => $r->reviewedBy?->name ?? '—',
                'status'            => $this->formatStatus($r->status),
            ]);
        });

        $sorted = $rows->sortByDesc(fn ($row) => $row['date_accomplished'] ?? '')->values();

        return response()->json(['reports' => $sorted]);
    }

    // ─── products ──────────────────────────────────────────────────────────────

    public function products(Request $request)
    {
        $query = Product::with(['creator']);

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku_code', 'like', "%{$search}%");
            });
        }

        $products = $query->get()->map(fn ($p) => [
            'id'           => $p->id,
            'product_code' => $p->sku_code,
            'product_name' => $p->name,
            'shelf_life'   => $p->shelf_life,
            'date_created' => $p->created_at->format('Y-m-d'),
            'created_by'   => $p->creator?->name ?? '—',
            'status'       => 'Active',
        ]);

        return response()->json(['products' => $products]);
    }

    // ─── receiveOrders ─────────────────────────────────────────────────────────

    public function receiveOrders(Request $request)
    {
        $user        = $request->user();
        $warehouseId = $request->input('warehouse_id');

        if ($user->role === 'manager') {
            $warehouseId = $user->warehouse_id;
        }

        $query = ReceiveOrder::with(['warehouse', 'creator', 'verifier', 'items']);

        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }
        if ($request->filled('date_from')) {
            $query->whereDate('date_ordered', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('date_ordered', '<=', $request->input('date_to'));
        }
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('supplier_name', 'like', "%{$search}%");
            });
        }

        $orders = $query->get()->map(fn ($o) => [
            'id'                 => $o->id,
            'transaction_code'   => $o->code,
            'supplier_name'      => $o->supplier_name,
            'warehouse'          => $o->warehouse->name,
            'total_products'     => $o->items->count(),
            'total_cost'         => number_format((float) $o->total, 2, '.', ''),
            'date_ordered'       => $o->date_ordered?->format('Y-m-d'),
            'date_accomplished'  => $o->date_arrived?->format('Y-m-d'),
            'created_by'         => $o->creator?->name ?? '—',
            'verified_by'        => $o->verifier?->name ?? '—',
            'status'             => $this->formatStatus($o->status),
        ]);

        return response()->json(['orders' => $orders]);
    }

    // ─── transferRequests ──────────────────────────────────────────────────────

    public function transferRequests(Request $request)
    {
        $user        = $request->user();
        $warehouseId = $request->input('warehouse_id');

        if ($user->role === 'manager') {
            $warehouseId = $user->warehouse_id;
        }

        $query = TransferRequest::with(['sourceWarehouse', 'destinationWarehouse', 'requester', 'verifier', 'items']);

        if ($warehouseId) {
            $query->where('source_warehouse_id', $warehouseId);
        }
        if ($request->filled('date_from')) {
            $query->whereDate('date_requested', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('date_requested', '<=', $request->input('date_to'));
        }
        if ($request->filled('search')) {
            $query->where('code', 'like', '%' . $request->input('search') . '%');
        }

        $transfers = $query->get()->map(fn ($t) => [
            'id'                    => $t->id,
            'transaction_code'      => $t->code,
            'source_warehouse'      => $t->sourceWarehouse->name,
            'destination_warehouse' => $t->destinationWarehouse->name,
            'total_products'        => $t->items->count(),
            'date_requested'        => $t->date_requested?->format('Y-m-d'),
            'date_accomplished'     => $t->date_received?->format('Y-m-d'),
            'requested_by'          => $t->requester?->name ?? '—',
            'verified_by'           => $t->verifier?->name ?? '—',
            'status'                => $this->formatStatus($t->status),
        ]);

        return response()->json(['transfers' => $transfers]);
    }

    // ─── issueProducts ─────────────────────────────────────────────────────────

    public function issueProducts(Request $request)
    {
        $user        = $request->user();
        $warehouseId = $request->input('warehouse_id');

        if ($user->role === 'manager') {
            $warehouseId = $user->warehouse_id;
        }

        $query = IssueProduct::with(['warehouse', 'issuedBy', 'items.product']);

        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }
        if ($request->filled('date_from')) {
            $query->whereDate('date_issued', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('date_issued', '<=', $request->input('date_to'));
        }
        if ($request->filled('search')) {
            $query->where('code', 'like', '%' . $request->input('search') . '%');
        }

        $issues = $query->get()->map(fn ($i) => [
            'id'                     => $i->id,
            'transaction_code'       => $i->code,
            'issue_type'             => $this->formatStatus($i->issue_type),
            'total_items'            => $i->items->count(),
            'total_quantity_summary' => $this->buildQuantitySummary($i->items),
            'date_issued'            => $i->date_issued?->format('Y-m-d'),
            'issued_by'              => $i->issuedBy?->name ?? '—',
            'status'                 => 'Complete',
        ]);

        return response()->json(['issues' => $issues]);
    }

    // ─── temporaryWarehouses ───────────────────────────────────────────────────

    public function temporaryWarehouses(Request $request)
    {
        $query = TemporaryWarehouse::with(['warehouse', 'creator', 'closer']);

        if ($request->filled('date_from')) {
            $query->whereDate('event_date', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('event_date', '<=', $request->input('date_to'));
        }
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('transaction_code', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%");
            });
        }

        $temporaryWarehouses = $query->get()->map(fn ($w) => [
            'id'               => $w->id,
            'transaction_code' => $w->transaction_code,
            'warehouse_name'   => $w->warehouse->name,
            'location'         => $w->location,
            'event_date'       => $w->event_date?->format('Y-m-d'),
            'date_created'     => $w->created_at->format('Y-m-d'),
            'created_by'       => $w->creator?->name ?? '—',
            'closed_by'        => $w->closer?->name ?? '—',
            'date_closed'      => $w->date_closed?->format('Y-m-d'),
            'status'           => $this->formatStatus($w->status),
        ]);

        return response()->json(['temporary_warehouses' => $temporaryWarehouses]);
    }

    // ─── reconciliation ────────────────────────────────────────────────────────

    public function reconciliation(Request $request)
    {
        $user        = $request->user();
        $warehouseId = $request->input('warehouse_id');

        if ($user->role === 'manager') {
            $warehouseId = $user->warehouse_id;
        }

        $query = Reconciliation::with(['warehouse', 'reconciledBy', 'reviewedBy', 'items']);

        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }
        if ($request->filled('date_from')) {
            $query->whereDate('date_reconciled', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('date_reconciled', '<=', $request->input('date_to'));
        }
        if ($request->filled('search')) {
            $query->where('transaction_code', 'like', '%' . $request->input('search') . '%');
        }

        $reconciliations = $query->get()->map(fn ($r) => [
            'id'                       => $r->id,
            'transaction_code'         => $r->transaction_code,
            'warehouse'                => $r->warehouse->name,
            'date_reconciled'          => $r->date_reconciled?->format('Y-m-d'),
            'products_with_discrepancy' => $r->items->filter(
                fn ($item) => abs((float) $item->discrepancy) >= self::DISCREPANCY_EPSILON
            )->count(),
            'reconciled_by'            => $r->reconciledBy?->name ?? '—',
            'reviewed_by'              => $r->reviewedBy?->name ?? '—',
            'status'                   => $this->formatStatus($r->status),
        ]);

        return response()->json(['reconciliations' => $reconciliations]);
    }

    // ─── inventorySummary ──────────────────────────────────────────────────────

    public function inventorySummary(Request $request)
    {
        $user        = $request->user();
        $warehouseId = $request->input('warehouse_id');

        if ($user->role === 'manager') {
            $warehouseId = $user->warehouse_id;
        }

        $stockQuery = StockInUse::with(['product', 'warehouse'])->where('quantity', '>', 0);

        if ($warehouseId) {
            $stockQuery->where('warehouse_id', $warehouseId);
        }

        $allStock = $stockQuery->get();

        $search = $request->filled('search') ? strtolower($request->input('search')) : null;

        $grouped = $allStock
            ->groupBy('product_id')
            ->map(function ($batches) {
                $product = $batches->first()->product;

                $warehouses = $batches
                    ->groupBy('warehouse_id')
                    ->map(function ($wBatches) {
                        $warehouse = $wBatches->first()->warehouse;
                        $total     = $wBatches->sum(fn ($b) => (float) $b->quantity);
                        return [
                            'warehouse_id'   => $warehouse->id,
                            'warehouse_name' => $warehouse->name,
                            'total_quantity' => number_format($total, 3, '.', ''),
                            'is_temporary'   => (bool) $warehouse->is_temporary,
                        ];
                    })
                    ->values();

                $grandTotal = $batches->sum(fn ($b) => (float) $b->quantity);

                return [
                    'product_id'   => $product->id,
                    'sku_code'     => $product->sku_code,
                    'product_name' => $product->name,
                    'unit'         => $product->unit,
                    'category'     => $product->category,
                    'warehouses'   => $warehouses,
                    'grand_total'  => number_format($grandTotal, 3, '.', ''),
                ];
            })
            ->filter(function ($p) use ($search) {
                if (!$search) {
                    return true;
                }
                return str_contains(strtolower($p['product_name']), $search)
                    || str_contains(strtolower($p['sku_code']), $search);
            })
            ->sortBy('product_name')
            ->values();

        $warehouses = Warehouse::orderBy('name')->get()->map(fn ($w) => [
            'id'           => $w->id,
            'name'         => $w->name,
            'is_temporary' => (bool) $w->is_temporary,
        ]);

        return response()->json([
            'products'   => $grouped,
            'warehouses' => $warehouses,
        ]);
    }

    // ─── helpers ───────────────────────────────────────────────────────────────

    private function formatStatus(string $status): string
    {
        return ucwords(str_replace('_', ' ', $status));
    }

    private function buildQuantitySummary($items): string
    {
        if ($items->isEmpty()) {
            return '0 Products';
        }

        $totalItems = $items->count();
        $totalQty   = $items->sum(fn ($i) => (float) $i->quantity_issued);

        $unit = $items->first()->product?->unit ?? '';

        if ($totalItems === 1) {
            return number_format($totalQty, 3, '.', '') . ($unit ? " {$unit}" : '');
        }

        return "{$totalItems} Products | " . number_format($totalQty, 3, '.', '') . ($unit ? " {$unit}" : '');
    }
}
