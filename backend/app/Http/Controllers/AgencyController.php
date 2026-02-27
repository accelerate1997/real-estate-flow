<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Lead;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class AgencyController extends Controller
{
    // Fetch Dashboard Stats
    public function fetchAgencyStats()
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'owner') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $agencyId = $user->agency_id;

        // Eager load counts efficiently
        $stats = [
            'total_agents' => User::where('agency_id', $agencyId)->where('role', 'agent')->count(),
            'active_properties' => \App\Models\Property::where('agency_id', $agencyId)->count(),
            'new_leads_24h' => Lead::where('agency_id', $agencyId)
                ->where('created_at', '>=', now()->subDay())
                ->count(),
            // Revenue placeholder logic
            'revenue' => '₹0'
        ];

        return response()->json($stats);
    }

    // Manage Agents - List
    public function listAgents()
    {
        $user = Auth::user();
        if ($user->role !== 'owner')
            return response()->json(['message' => 'Unauthorized'], 403);

        $agents = User::where('agency_id', $user->agency_id)
            ->where('role', 'agent')
            ->withCount(['properties', 'leads'])
            ->get();

        return response()->json($agents);
    }

    // Manage Agents - Create
    public function createAgent(Request $request)
    {
        $user = Auth::user();
        if ($user->role !== 'owner')
            return response()->json(['message' => 'Unauthorized'], 403);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
        ]);

        $agent = User::create([
            'agency_id' => $user->agency_id,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'agent',
        ]);

        return response()->json($agent, 201);
    }

    // Reassign Lead
    public function reassignLead(Request $request, $leadId)
    {
        $user = Auth::user();
        if ($user->role !== 'owner')
            return response()->json(['message' => 'Unauthorized'], 403);

        $lead = Lead::where('id', $leadId)->where('agency_id', $user->agency_id)->firstOrFail();

        $validated = $request->validate([
            'assigned_to' => 'required|exists:users,id',
        ]);

        // Verify the new agent belongs to the same agency
        $newAgent = User::where('id', $validated['assigned_to'])
            ->where('agency_id', $user->agency_id)
            ->first();

        if (!$newAgent) {
            return response()->json(['message' => 'Invalid Agent'], 422);
        }

        $lead->assigned_to = $newAgent->id;
        $lead->save();

        return response()->json(['message' => 'Lead reassigned successfully', 'lead' => $lead]);
    }
}
