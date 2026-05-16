<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('temporary_warehouses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warehouse_id')->unique()->constrained('warehouses')->cascadeOnDelete();
            $table->string('transaction_code')->unique();
            $table->string('name');
            $table->string('location');
            $table->date('event_date');
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('closed_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->date('date_closed')->nullable();
            $table->enum('status', ['active', 'closed'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('temporary_warehouses');
    }
};
