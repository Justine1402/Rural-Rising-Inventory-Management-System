<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reconciliation_batch_adjustments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reconciliation_item_id')->constrained('reconciliation_items')->cascadeOnDelete();
            $table->foreignId('stock_in_use_id')->constrained('stock_in_use_codes')->restrictOnDelete();
            $table->enum('direction', ['deduction', 'addition']);
            $table->decimal('quantity', 10, 3);
            $table->enum('harvest_date_source', ['copied_from_oldest', 'defaulted_today'])->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reconciliation_batch_adjustments');
    }
};
