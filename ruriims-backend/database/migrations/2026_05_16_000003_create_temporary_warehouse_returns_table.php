<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('temporary_warehouse_returns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('temporary_warehouse_id')->constrained('temporary_warehouses')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->foreignId('source_stock_in_use_id')->constrained('stock_in_use_codes')->restrictOnDelete();
            $table->foreignId('destination_stock_in_use_id')->constrained('stock_in_use_codes')->restrictOnDelete();
            $table->foreignId('destination_warehouse_id')->constrained('warehouses')->restrictOnDelete();
            $table->decimal('quantity_returned', 10, 3);
            $table->date('harvest_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('temporary_warehouse_returns');
    }
};
