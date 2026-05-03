<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('receive_orders', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->string('supplier_name');
            $table->decimal('delivery_fee', 10, 2)->default(0);
            $table->decimal('order_cost', 10, 2)->default(0);
            $table->decimal('total', 10, 2)->default(0);
            $table->date('date_ordered');
            $table->date('date_arrived')->nullable();
            $table->enum('status', ['incomplete', 'accomplished'])->default('incomplete');
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('receive_orders');
    }
};
