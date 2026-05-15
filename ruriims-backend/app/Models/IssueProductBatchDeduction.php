<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IssueProductBatchDeduction extends Model
{
    protected $fillable = ['issue_product_item_id', 'stock_in_use_id', 'quantity_deducted'];

    public function issueProductItem()
    {
        return $this->belongsTo(IssueProductItem::class);
    }

    public function stockInUse()
    {
        return $this->belongsTo(StockInUse::class);
    }
}
