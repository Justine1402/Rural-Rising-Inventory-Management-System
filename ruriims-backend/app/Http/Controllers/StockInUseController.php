<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\StockInUse;
use Illuminate\Http\Request;

class StockInUseController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'sku_code'     => 'required|string',
            'warehouse_id' => 'required|integer',
        ]);

        $product = Product::where('sku_code', $request->sku_code)->firstOrFail();

        $batches = StockInUse::where('product_id', $product->id)
            ->where('warehouse_id', $request->warehouse_id)
            ->where('quantity', '>', 0)
            ->orderBy('harvest_date')
            ->get(['id', 'code', 'harvest_date', 'quantity']);

        $warehouseTotal = (float) StockInUse::where('product_id', $product->id)
            ->where('warehouse_id', $request->warehouse_id)
            ->sum('quantity');

        return response()->json([
            'shelf_life'      => $product->shelf_life,
            'warehouse_total' => $warehouseTotal,
            'batches'         => $batches->map(fn ($b) => [
                'id'           => $b->id,
                'code'         => $b->code,
                'harvest_date' => $b->harvest_date->format('Y-m-d'),
                'quantity'     => (float) $b->quantity,
                'category'     => $product->category,
            ]),
        ]);
    }
}
