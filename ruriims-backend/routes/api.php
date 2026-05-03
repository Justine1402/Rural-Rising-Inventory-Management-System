<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\PinController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ReceiveOrderController;
use App\Http\Controllers\StockInUseController;
use App\Http\Controllers\WarehouseController;
use Illuminate\Support\Facades\Route;

Route::get('/test', fn () => response()->json(['message' => 'Laravel is connected!']));

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/warehouses', [WarehouseController::class, 'index']);

    Route::get('/products', [ProductController::class, 'index']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::get('/products/{product}', [ProductController::class, 'show']);

    Route::post('/pin/verify', [PinController::class, 'verify']);

    Route::get('/stock-in-use', [StockInUseController::class, 'index']);

    Route::get('/receive-orders', [ReceiveOrderController::class, 'index']);
    Route::post('/receive-orders', [ReceiveOrderController::class, 'store']);
    Route::get('/receive-orders/{receiveOrder}', [ReceiveOrderController::class, 'show']);
    Route::post('/receive-orders/{receiveOrder}/complete', [ReceiveOrderController::class, 'complete']);
});
