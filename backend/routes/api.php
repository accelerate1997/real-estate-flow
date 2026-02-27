<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AgencyController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public Routes
Route::post('/login', [App\Http\Controllers\AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [App\Http\Controllers\AuthController::class, 'logout']);

    // Agency Owner Stats
    Route::get('/agency/stats', [AgencyController::class, 'fetchAgencyStats']);

    // Agent Management
    Route::get('/agency/agents', [AgencyController::class, 'listAgents']);
    Route::post('/agency/agents', [AgencyController::class, 'createAgent']);

    // Lead Management
    Route::patch('/leads/{lead}/reassign', [AgencyController::class, 'reassignLead']);
});
