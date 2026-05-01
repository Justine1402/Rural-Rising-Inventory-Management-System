<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\WarehouseController;
use Illuminate\Support\Facades\Route;

Route::get('/test', fn () => response()->json(['message' => 'Laravel is connected!']));

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/warehouses', [WarehouseController::class, 'index']);
});
