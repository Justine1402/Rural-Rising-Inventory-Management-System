<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transfer_request_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transfer_request_id')->constrained('transfer_requests')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products');
            $table->foreignId('stock_in_use_id')->constrained('stock_in_use_codes');
            $table->decimal('quantity_requested', 10, 3);
            $table->decimal('quantity_received', 10, 3)->default(0);
            $table->date('harvest_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transfer_request_items');
    }
};
