<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('properties', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agency_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null'); // Assigned Agent
            $table->string('title');
            $table->text('description');
            $table->enum('category', ['residential', 'commercial', 'under_development']);
            $table->decimal('price', 15, 2)->nullable(); // Store purely numeric or string if needed
            $table->boolean('price_hidden')->default(false);
            $table->json('media_links')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down()
    {
        Schema::dropIfExists('properties');
    }
};
