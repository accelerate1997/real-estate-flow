import React, { useState, useEffect } from 'react';
import { Target, MessageCircle, RefreshCw, CheckCircle2, Sparkles, User } from 'lucide-react';
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
    }, [currentUser?.id]);

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
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                <p className="text-sm text-gray-400 font-medium">Finding smart matches...</p>
            </div>
        );
    }

    // Group matches by lead
    const grouped = matches.reduce((acc, m) => {
        const leadId = m.lead_id;
        if (!acc[leadId]) acc[leadId] = { lead: m.expand?.lead_id, matchGroup: [] };
        acc[leadId].matchGroup.push(m);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="section-title">Smart AI Matches</h2>
                    <p className="section-subtitle">AI-powered lead-to-property pairings</p>
                </div>
                <button
                    onClick={() => fetchMatches(true)}
                    disabled={isRefreshing}
                    className="btn-dash-secondary disabled:opacity-60"
                >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {matches.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <Sparkles className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">No matches yet</h3>
                    <p className="text-sm text-gray-500 max-w-xs mx-auto">
                        When you add a new property, our AI will automatically pair it with your past leads here.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-5">
                    {Object.entries(grouped).map(([leadId, { lead, matchGroup }]) => (
                        <div key={leadId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            {/* Lead Header */}
                            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                            <User className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">
                                                {lead?.name || lead?.phone || 'Unknown Lead'}
                                            </h3>
                                            <p className="text-xs text-gray-500">{lead?.phone}</p>
                                        </div>
                                    </div>
                                    <span className="dash-badge dash-badge-new">
                                        {matchGroup.length} {matchGroup.length === 1 ? 'Match' : 'Matches'}
                                    </span>
                                </div>
                                {lead?.requirement && (
                                    <p className="mt-3 text-sm text-gray-500 italic line-clamp-2 pl-13">
                                        "{lead.requirement}"
                                    </p>
                                )}
                            </div>

                            {/* Matched Properties */}
                            <div className="divide-y divide-gray-50">
                                {matchGroup.map(match => (
                                    <div
                                        key={match.id}
                                        className="px-6 py-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between hover:bg-gray-50/50 transition-colors"
                                    >
                                        <div className="flex-1 flex items-start gap-4">
                                            {/* Status + timestamp */}
                                            <div className="flex flex-col gap-1.5 shrink-0">
                                                <span className={`dash-badge ${match.status === 'Pending Review' ? 'dash-badge-visit' : 'dash-badge-completed'}`}>
                                                    {match.status}
                                                </span>
                                                <span className="text-[10px] text-gray-400">
                                                    {new Date(match.created).toLocaleDateString()}
                                                </span>
                                            </div>

                                            {/* Property */}
                                            <div className="flex items-start gap-3 min-w-0">
                                                <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                                                    <Target className="w-4 h-4 text-primary" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-gray-900 text-sm truncate mb-0.5">
                                                        {match.expand?.property_id?.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        ₹{match.expand?.property_id?.price?.toLocaleString()}
                                                        {match.expand?.property_id?.location && ` • ${match.expand.property_id.location}`}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Alert CTA */}
                                        <div className="shrink-0 w-full md:w-auto">
                                            {match.status === 'Alert Sent' ? (
                                                <div className="flex items-center gap-2 px-4 py-2.5 text-green-700 bg-green-50 rounded-xl border border-green-200 text-sm font-bold">
                                                    <CheckCircle2 className="w-4 h-4" /> Alert Sent
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleSendAlert(match.id)}
                                                    disabled={sendingAlert === match.id}
                                                    className="btn-dash-teal w-full md:w-auto disabled:opacity-70"
                                                >
                                                    {sendingAlert === match.id
                                                        ? <RefreshCw className="w-4 h-4 animate-spin" />
                                                        : <MessageCircle className="w-4 h-4" />}
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
