<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReceiveOrderItem extends Model
{
    protected $fillable = [
        'receive_order_id', 'product_id',
        'quantity_ordered', 'quantity_arrived',
        'harvest_date', 'product_cost',
    ];

    protected $casts = ['harvest_date' => 'date'];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function receiveOrder()
    {
        return $this->belongsTo(ReceiveOrder::class);
    }
}
