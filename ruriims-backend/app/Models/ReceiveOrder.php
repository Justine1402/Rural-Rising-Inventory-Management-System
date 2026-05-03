<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReceiveOrder extends Model
{
    protected $fillable = [
        'code', 'warehouse_id', 'supplier_name', 'delivery_fee',
        'order_cost', 'total', 'date_ordered', 'date_arrived',
        'status', 'created_by', 'verified_by',
    ];

    protected $casts = [
        'date_ordered' => 'date',
        'date_arrived' => 'date',
    ];

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function verifier()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function items()
    {
        return $this->hasMany(ReceiveOrderItem::class);
    }
}
