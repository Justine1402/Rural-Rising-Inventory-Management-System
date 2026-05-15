<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransferRequestBatchDeduction extends Model
{
    protected $fillable = ['transfer_request_item_id', 'stock_in_use_id', 'quantity_deducted'];

    public function transferRequestItem()
    {
        return $this->belongsTo(TransferRequestItem::class);
    }

    public function stockInUse()
    {
        return $this->belongsTo(StockInUse::class);
    }
}
