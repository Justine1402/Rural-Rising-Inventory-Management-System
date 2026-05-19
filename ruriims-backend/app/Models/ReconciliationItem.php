<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReconciliationItem extends Model
{
    protected $fillable = [
        'reconciliation_id',
        'product_id',
        'expected_stock',
        'actual_count',
        'discrepancy',
        'remarks',
    ];

    protected $casts = [
        'expected_stock' => 'decimal:3',
        'actual_count'   => 'decimal:3',
        'discrepancy'    => 'decimal:3',
    ];

    public function reconciliation()
    {
        return $this->belongsTo(Reconciliation::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function adjustments()
    {
        return $this->hasMany(ReconciliationBatchAdjustment::class);
    }
}
