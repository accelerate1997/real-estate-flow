<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class LeadResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'status' => $this->status,
            'property' => new PropertyResource($this->whenLoaded('property')),
            'assigned_to' => new UserResource($this->whenLoaded('agent')),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
