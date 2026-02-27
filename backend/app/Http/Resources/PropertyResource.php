<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PropertyResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'category' => $this->category,
            'price' => $this->price_hidden ? 'Price on Request' : $this->price,
            'media_links' => $this->media_links,
            'agent' => new UserResource($this->whenLoaded('agent')),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
