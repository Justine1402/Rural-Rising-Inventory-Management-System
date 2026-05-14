<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('issue_product_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('issue_product_id')->constrained('issue_products')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products');
            $table->foreignId('stock_in_use_id')->constrained('stock_in_use_codes');
            $table->decimal('quantity_issued', 10, 3);
            $table->date('harvest_date')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('issue_product_items');
    }
};
