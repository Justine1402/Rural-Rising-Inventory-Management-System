<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transfer_request_batch_deductions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transfer_request_item_id')->constrained('transfer_request_items', 'id', 'trf_batch_ded_item_fk')->cascadeOnDelete();
            $table->foreignId('stock_in_use_id')->constrained('stock_in_use_codes');
            $table->decimal('quantity_deducted', 10, 3);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transfer_request_batch_deductions');
    }
};
