<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransferRequestBatchDeduction extends Model
{
    protected $fillable = ['transfer_request_item_id', 'stock_in_use_id', 'quantity_deducted'];

    // Intentionally retained: planned backward-traversal feature (batch deduction → parent).
    // No call sites yet — see PROGRESS.md cleanup notes. Do not remove in audits.
    public function transferRequestItem()
    {
        return $this->belongsTo(TransferRequestItem::class);
    }

    // Intentionally retained: planned backward-traversal feature (batch deduction → parent).
    // No call sites yet — see PROGRESS.md cleanup notes. Do not remove in audits.
    public function stockInUse()
    {
        return $this->belongsTo(StockInUse::class);
    }
}
