import React, { useState, useEffect } from 'react';
import { Target, MessageCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { pb } from '../services/pocketbase';

const SmartMatches = () => {
    const [matches, setMatches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [sendingAlert, setSendingAlert] = useState(null);
    const currentUser = pb.authStore.model;

    const fetchMatches = async (isManual = false) => {
        if (!currentUser) return;
        const agencyId = currentUser?.role === 'agent' ? currentUser.agencyId : currentUser.id;
        if (!agencyId) return;

        // Show spinner either on full screen (initial) or on the button (manual refresh)
        if (isManual) setIsRefreshing(true);
        else if (matches.length === 0) setIsLoading(true);
        
        try {
            const records = await pb.collection('matches').getFullList({
                filter: `agency_id = "${agencyId}"`,
                expand: 'lead_id,property_id'
            });
            setMatches(records);
        } catch (error) {
            console.error("Error fetching matches:", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchMatches();
    }, [currentUser?.id]); // Use stable ID dependency instead of object reference

    const handleSendAlert = async (matchId) => {
        setSendingAlert(matchId);
        try {
            const res = await fetch('/api/properties/alert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId })
            });
            const data = await res.json();
            if (data.success) {
                // Update match status locally
                setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: 'Alert Sent' } : m));
            } else {
                alert("Failed to send alert.");
            }
        } catch (err) {
            console.error(err);
            alert("Error sending alert.");
        } finally {
            setSendingAlert(null);
        }
    };

    if (isLoading) {
        return <div className="p-10 flex justify-center"><RefreshCw className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Smart AI Matches</h2>
                <button 
                    onClick={() => fetchMatches(true)} 
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} /> 
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {matches.length === 0 ? (
                <div className="text-center bg-white p-12 rounded-xl border border-gray-100 shadow-sm text-gray-500">
                    <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No matches found</h3>
                    <p>When you add a new property, our AI will automatically pair it with your past leads here.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {Object.entries(
                        matches.reduce((acc, m) => {
                            const leadId = m.lead_id;
                            if (!acc[leadId]) acc[leadId] = { lead: m.expand?.lead_id, matchGroup: [] };
                            acc[leadId].matchGroup.push(m);
                            return acc;
                        }, {})
                    ).map(([leadId, { lead, matchGroup }]) => (
                        <div key={leadId} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            {/* Lead Header */}
                            <div className="p-6 border-b border-gray-50 bg-gray-50/50">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-xl font-bold text-gray-900">
                                        Lead: {lead?.name || lead?.phone || 'Unknown Lead'}
                                    </h3>
                                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase">
                                        {matchGroup.length} {matchGroup.length === 1 ? 'Match' : 'Matches'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-1 font-medium">{lead?.phone}</p>
                                <p className="text-sm text-gray-500 line-clamp-2 italic">"{lead?.requirement}"</p>
                            </div>

                            {/* Matched Properties List */}
                            <div className="divide-y divide-gray-50">
                                {matchGroup.map(match => (
                                    <div key={match.id} className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${match.status === 'Pending Review' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                                    {match.status}
                                                </span>
                                                <span className="text-[10px] text-gray-400">Matched on {new Date(match.created).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <div className="p-2 bg-red-50 rounded-lg">
                                                    <Target className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 mb-0.5">{match.expand?.property_id?.title}</p>
                                                    <p className="text-xs text-gray-500">₹{match.expand?.property_id?.price?.toLocaleString()} • {match.expand?.property_id?.location}</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="w-full md:w-auto">
                                            {match.status === 'Alert Sent' ? (
                                                <div className="flex items-center gap-2 px-4 py-2 text-green-700 bg-green-50 rounded-lg justify-center w-full md:min-w-[160px] text-sm font-bold border border-green-200">
                                                    <CheckCircle2 className="w-4 h-4" /> Alert Sent
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => handleSendAlert(match.id)}
                                                    disabled={sendingAlert === match.id}
                                                    className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition shadow-sm disabled:opacity-75 whitespace-nowrap"
                                                >
                                                    {sendingAlert === match.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                                                    Send Alert
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SmartMatches;
