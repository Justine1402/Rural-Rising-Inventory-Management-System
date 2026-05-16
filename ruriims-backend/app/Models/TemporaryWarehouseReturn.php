<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TemporaryWarehouseReturn extends Model
{
    protected $fillable = [
        'temporary_warehouse_id', 'product_id', 'source_stock_in_use_id',
        'destination_stock_in_use_id', 'destination_warehouse_id',
        'quantity_returned', 'harvest_date',
    ];

    protected $casts = [
        'harvest_date' => 'date',
    ];

    public function temporaryWarehouse()
    {
        return $this->belongsTo(TemporaryWarehouse::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function sourceStockInUse()
    {
        return $this->belongsTo(StockInUse::class, 'source_stock_in_use_id');
    }

    public function destinationStockInUse()
    {
        return $this->belongsTo(StockInUse::class, 'destination_stock_in_use_id');
    }

    public function destinationWarehouse()
    {
        return $this->belongsTo(Warehouse::class, 'destination_warehouse_id');
    }
}
