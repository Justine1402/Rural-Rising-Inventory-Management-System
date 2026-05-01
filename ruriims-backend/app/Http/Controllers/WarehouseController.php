<?php

namespace App\Http\Controllers;

use App\Models\Warehouse;

class WarehouseController extends Controller
{
    public function index()
    {
        return response()->json(['warehouses' => Warehouse::all()]);
    }
}
