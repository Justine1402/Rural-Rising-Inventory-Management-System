<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransferRequest extends Model
{
    protected $fillable = [
        'code', 'source_warehouse_id', 'destination_warehouse_id',
        'date_requested', 'date_received', 'status', 'requested_by', 'verified_by',
    ];

    protected $casts = [
        'date_requested' => 'date',
        'date_received'  => 'date',
    ];

    public function sourceWarehouse()
    {
        return $this->belongsTo(Warehouse::class, 'source_warehouse_id');
    }

    public function destinationWarehouse()
    {
        return $this->belongsTo(Warehouse::class, 'destination_warehouse_id');
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function verifier()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function items()
    {
        return $this->hasMany(TransferRequestItem::class);
    }
}
