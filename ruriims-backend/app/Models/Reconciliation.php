<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reconciliation extends Model
{
    protected $fillable = [
        'transaction_code',
        'warehouse_id',
        'reconciled_by',
        'reviewed_by',
        'date_reconciled',
        'date_reviewed',
        'status',
    ];

    protected $casts = [
        'date_reconciled' => 'date',
        'date_reviewed'   => 'date',
    ];

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function reconciledBy()
    {
        return $this->belongsTo(User::class, 'reconciled_by')->withTrashed();
    }

    public function reviewedBy()
    {
        return $this->belongsTo(User::class, 'reviewed_by')->withTrashed();
    }

    public function items()
    {
        return $this->hasMany(ReconciliationItem::class);
    }
}
