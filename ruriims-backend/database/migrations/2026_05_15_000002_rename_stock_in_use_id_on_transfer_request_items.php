<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transfer_request_items', function (Blueprint $table) {
            $table->renameColumn('stock_in_use_id', 'requested_stock_in_use_id');
        });
    }

    public function down(): void
    {
        Schema::table('transfer_request_items', function (Blueprint $table) {
            $table->renameColumn('requested_stock_in_use_id', 'stock_in_use_id');
        });
    }
};
