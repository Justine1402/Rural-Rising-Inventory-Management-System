<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('issue_product_batch_deductions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('issue_product_item_id')->constrained('issue_product_items')->cascadeOnDelete();
            $table->foreignId('stock_in_use_id')->constrained('stock_in_use_codes');
            $table->decimal('quantity_deducted', 10, 3);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('issue_product_batch_deductions');
    }
};
