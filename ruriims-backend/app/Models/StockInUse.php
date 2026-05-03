<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockInUse extends Model
{
    protected $table = 'stock_in_use_codes';

    protected $fillable = ['code', 'product_id', 'warehouse_id', 'quantity', 'harvest_date'];

    protected $casts = ['harvest_date' => 'date'];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }
}
