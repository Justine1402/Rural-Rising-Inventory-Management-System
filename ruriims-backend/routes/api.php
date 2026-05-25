<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\IssueProductController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\PinController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ReceiveOrderController;
use App\Http\Controllers\StockInUseController;
use App\Http\Controllers\TransferRequestController;
use App\Http\Controllers\WarehouseController;
use App\Http\Controllers\ReconciliationController;
use App\Http\Controllers\TemporaryWarehouseController;
use Illuminate\Support\Facades\Route;

Route::get('/test', fn () => response()->json(['message' => 'Laravel is connected!']));

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);

    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::post('/', [UserController::class, 'store']);
        Route::get('/{user}', [UserController::class, 'show'])->withTrashed();
        Route::put('/{user}', [UserController::class, 'update'])->withTrashed();
        Route::delete('/{user}', [UserController::class, 'destroy']);
        Route::post('/{user}/reset-password', [UserController::class, 'resetPassword'])->withTrashed();
        Route::post('/{user}/reset-pin', [UserController::class, 'resetPin'])->withTrashed();
        Route::post('/{user}/restore', [UserController::class, 'restore'])->withTrashed();
    });
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

    Route::get('/transfer-requests', [TransferRequestController::class, 'index']);
    Route::post('/transfer-requests', [TransferRequestController::class, 'store']);
    Route::get('/transfer-requests/{transferRequest}', [TransferRequestController::class, 'show']);
    Route::post('/transfer-requests/{transferRequest}/accomplish', [TransferRequestController::class, 'accomplish']);

    Route::get('/issue-products', [IssueProductController::class, 'index']);
    Route::post('/issue-products', [IssueProductController::class, 'store']);
    Route::get('/issue-products/{issueProduct}', [IssueProductController::class, 'show']);

    Route::get('/temporary-warehouses', [TemporaryWarehouseController::class, 'index']);
    Route::post('/temporary-warehouses', [TemporaryWarehouseController::class, 'store']);
    Route::get('/temporary-warehouses/{temporaryWarehouse}', [TemporaryWarehouseController::class, 'show']);
    Route::post('/temporary-warehouses/{temporaryWarehouse}/close', [TemporaryWarehouseController::class, 'close']);

    Route::get('/reconciliations', [ReconciliationController::class, 'index']);
    Route::get('/reconciliations/expected-stock', [ReconciliationController::class, 'expectedStock']);
    Route::post('/reconciliations', [ReconciliationController::class, 'store']);
    Route::get('/reconciliations/{id}', [ReconciliationController::class, 'show']);
    Route::post('/reconciliations/{id}/confirm', [ReconciliationController::class, 'confirm']);
});
