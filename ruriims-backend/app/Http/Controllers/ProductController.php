<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\StockInUse;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProductController extends Controller
{
    public function index()
    {
        $warehouses = Warehouse::all();

        // Sum of quantities per product per warehouse, keyed by [product_id][warehouse_id]
        $stock = StockInUse::selectRaw('product_id, warehouse_id, SUM(quantity) as total')
            ->groupBy('product_id', 'warehouse_id')
            ->get()
            ->groupBy('product_id')
            ->map(fn ($rows) => $rows->keyBy('warehouse_id')->map(fn ($r) => (float) $r->total));

        // Most recent harvest date per product across all warehouses
        $latestHarvest = StockInUse::selectRaw('product_id, MAX(harvest_date) as latest_harvest')
            ->groupBy('product_id')
            ->pluck('latest_harvest', 'product_id');

        // Most recent harvest date per product per warehouse (for per-warehouse views like TWH dashboard)
        $latestHarvestPerWarehouse = StockInUse::selectRaw('product_id, warehouse_id, MAX(harvest_date) as latest_harvest')
            ->groupBy('product_id', 'warehouse_id')
            ->get()
            ->groupBy('product_id')
            ->map(function ($rows) {
                return $rows->pluck('latest_harvest', 'warehouse_id')->toArray();
            });

        $products = Product::all()->map(function ($p) use ($warehouses, $stock, $latestHarvest, $latestHarvestPerWarehouse) {
            $productStock = $stock->get($p->id, collect());
            $warehouseStock = $warehouses->mapWithKeys(
                fn ($w) => [$w->id => $productStock->get($w->id, 0.0)]
            );
            $totalQty = $warehouseStock->sum();

            return [
                'id'             => $p->id,
                'sku_code'       => $p->sku_code,
                'name'           => $p->name,
                'category'       => $p->category,
                'unit'           => $p->unit,
                'shelf_life'     => $p->shelf_life,
                'warehouse_stock' => $warehouseStock,
                'harvest_date'                => $latestHarvest->get($p->id),
                'harvest_date_per_warehouse' => $latestHarvestPerWarehouse->get($p->id, []),
                'status'         => $totalQty > 0 ? 'In Stock' : 'Out of Stock',
            ];
        });

        return response()->json([
            'products'   => $products,
            'warehouses' => $warehouses->map(fn ($w) => ['id' => $w->id, 'name' => $w->name, 'code' => $w->code]),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'       => 'required|string|max:255',
            'category'   => 'required|string',
            'unit'       => 'required|string',
            'shelf_life' => 'required|integer|min:1',
            'pin'        => 'required|string|size:6',
        ]);

        $user = $request->user();

        if (!$user->pin || !Hash::check($request->pin, $user->pin)) {
            return response()->json(['message' => 'Incorrect PIN.'], 422);
        }

        $seq = Product::count() + 1;
        $skuCode = 'SKU-' . str_pad($seq, 3, '0', STR_PAD_LEFT);

        $product = Product::create([
            'sku_code'   => $skuCode,
            'name'       => $request->name,
            'category'   => $request->category,
            'unit'       => $request->unit,
            'shelf_life' => $request->shelf_life,
            'created_by' => $user->id,
        ]);

        return response()->json(['product' => $product], 201);
    }

    public function show(Product $product)
    {
        return response()->json(['product' => $product]);
    }

    public function batches(Product $product)
    {
        $user = request()->user();

        $product->load('creator');

        $query = StockInUse::with('warehouse')
            ->where('product_id', $product->id)
            ->where('quantity', '>', 0)
            ->orderBy('harvest_date', 'asc');

        if ($user->role === 'manager') {
            $query->where('warehouse_id', $user->warehouse_id);
        }

        $batches = $query->get()->map(fn($b) => [
            'code'         => $b->code,
            'warehouse_id' => $b->warehouse_id,
            'warehouse'    => $b->warehouse->name,
            'quantity'     => $b->quantity,
            'harvest_date' => $b->harvest_date
                ? \Carbon\Carbon::parse($b->harvest_date)->format('M j, Y')
                : null,
        ]);

        return response()->json([
            'product' => [
                'id'         => $product->id,
                'sku_code'   => $product->sku_code,
                'name'       => $product->name,
                'category'   => $product->category,
                'unit'       => $product->unit,
                'shelf_life' => $product->shelf_life,
            ],
            'batches' => $batches,
        ]);
    }
}
