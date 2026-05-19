<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReconciliationBatchAdjustment extends Model
{
    protected $fillable = [
        'reconciliation_item_id',
        'stock_in_use_id',
        'direction',
        'quantity',
        'harvest_date_source',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
    ];

    public function reconciliationItem()
    {
        return $this->belongsTo(ReconciliationItem::class);
    }

    public function stockInUse()
    {
        return $this->belongsTo(StockInUse::class);
    }
}
