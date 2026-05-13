<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransferRequestItem extends Model
{
    protected $fillable = [
        'transfer_request_id', 'product_id', 'stock_in_use_id',
        'quantity_requested', 'quantity_received', 'harvest_date',
    ];

    protected $casts = [
        'harvest_date' => 'date',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function transferRequest()
    {
        return $this->belongsTo(TransferRequest::class);
    }

    public function stockInUse()
    {
        return $this->belongsTo(StockInUse::class, 'stock_in_use_id');
    }
}
