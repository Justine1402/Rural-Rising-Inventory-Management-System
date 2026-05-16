<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TemporaryWarehouse extends Model
{
    protected $fillable = [
        'warehouse_id', 'transaction_code', 'name', 'location',
        'event_date', 'created_by', 'closed_by', 'date_closed', 'status',
    ];

    protected $casts = [
        'event_date'  => 'date',
        'date_closed' => 'date',
    ];

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function closer()
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    public function returns()
    {
        return $this->hasMany(TemporaryWarehouseReturn::class);
    }
}
