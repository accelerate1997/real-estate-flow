<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'agency' => new AgencyResource($this->whenLoaded('agency')),
            'listings_count' => $this->whenCounted('properties'),
            'leads_count' => $this->whenCounted('leads'),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
