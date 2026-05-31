<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IssueProductBatchDeduction extends Model
{
    protected $fillable = ['issue_product_item_id', 'stock_in_use_id', 'quantity_deducted'];

    // Intentionally retained: planned backward-traversal feature (batch deduction → parent).
    // No call sites yet — see PROGRESS.md cleanup notes. Do not remove in audits.
    public function issueProductItem()
    {
        return $this->belongsTo(IssueProductItem::class);
    }

    // Intentionally retained: planned backward-traversal feature (batch deduction → parent).
    // No call sites yet — see PROGRESS.md cleanup notes. Do not remove in audits.
    public function stockInUse()
    {
        return $this->belongsTo(StockInUse::class);
    }
}
