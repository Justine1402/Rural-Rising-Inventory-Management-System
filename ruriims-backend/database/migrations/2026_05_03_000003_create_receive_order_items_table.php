<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('receive_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('receive_order_id')->constrained('receive_orders')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products');
            $table->decimal('quantity_ordered', 10, 3);
            $table->decimal('quantity_arrived', 10, 3)->default(0);
            $table->date('harvest_date')->nullable();
            $table->decimal('product_cost', 10, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('receive_order_items');
    }
};
