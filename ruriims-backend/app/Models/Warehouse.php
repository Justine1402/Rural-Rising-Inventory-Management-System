<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Warehouse extends Model
{
    protected $fillable = ['name', 'code', 'is_temporary'];

    protected $casts = [
        'is_temporary' => 'boolean',
    ];
}
