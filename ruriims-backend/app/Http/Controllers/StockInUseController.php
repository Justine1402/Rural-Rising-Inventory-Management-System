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

        return response()->json([
            'batches' => $batches->map(fn ($b) => [
                'code'         => $b->code,
                'harvest_date' => $b->harvest_date->format('M d, Y'),
                'quantity'     => $b->quantity,
                'category'     => $product->category,
            ]),
        ]);
    }
}
