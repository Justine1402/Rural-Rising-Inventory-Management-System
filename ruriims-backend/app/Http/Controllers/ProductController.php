<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProductController extends Controller
{
    public function index()
    {
        return response()->json(['products' => Product::all()]);
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
}
