<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IssueProduct extends Model
{
    protected $fillable = [
        'code', 'warehouse_id', 'issue_type', 'date_issued', 'issued_by',
    ];

    protected $casts = [
        'date_issued' => 'date',
    ];

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function issuedBy()
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    public function items()
    {
        return $this->hasMany(IssueProductItem::class);
    }
}
