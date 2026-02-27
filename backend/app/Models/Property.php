<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Property extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'agency_id',
        'user_id',
        'title',
        'description',
        'category',
        'price',
        'price_hidden',
        'media_links',
    ];

    protected $casts = [
        'price_hidden' => 'boolean',
        'media_links' => 'array',
    ];

    public function agency()
    {
        return $this->belongsTo(Agency::class);
    }

    public function agent()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
