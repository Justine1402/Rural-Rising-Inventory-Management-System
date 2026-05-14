<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IssueProductItem extends Model
{
    protected $fillable = [
        'issue_product_id', 'product_id', 'stock_in_use_id',
        'quantity_issued', 'harvest_date', 'note',
    ];

    protected $casts = [
        'harvest_date' => 'date',
    ];

    public function issueProduct()
    {
        return $this->belongsTo(IssueProduct::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function stockInUse()
    {
        return $this->belongsTo(StockInUse::class, 'stock_in_use_id');
    }
}
