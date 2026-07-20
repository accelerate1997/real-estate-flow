import React, { useState, useEffect } from 'react';
import { Target, MessageCircle, RefreshCw, CheckCircle2, Sparkles, User, ChevronDown } from 'lucide-react';
import { pb } from '../services/pocketbase';

const SmartMatches = () => {
    const [matches, setMatches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [sendingAlert, setSendingAlert] = useState(null);
    // Set of leadIds that are expanded; single-match leads start expanded
    const [expandedLeads, setExpandedLeads] = useState(new Set());
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

            // Auto-expand leads that have only 1 match
            const grouped = records.reduce((acc, m) => {
                const lid = m.lead_id;
                if (!acc[lid]) acc[lid] = 0;
                acc[lid]++;
                return acc;
            }, {});
            const autoExpand = new Set(
                Object.entries(grouped)
                    .filter(([, count]) => count === 1)
                    .map(([lid]) => lid)
            );
            setExpandedLeads(autoExpand);
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

    const toggleLead = (leadId) => {
        setExpandedLeads(prev => {
            const next = new Set(prev);
            if (next.has(leadId)) next.delete(leadId);
            else next.add(leadId);
            return next;
        });
    };

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
                <div className="flex flex-col gap-4">
                    {Object.entries(grouped).map(([leadId, { lead, matchGroup }]) => {
                        const isExpanded = expandedLeads.has(leadId);
                        const sentCount = matchGroup.filter(m => m.status === 'Alert Sent').length;

                        return (
                            <div key={leadId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                
                                {/* ── Lead Header (clickable to collapse) ── */}
                                <button
                                    onClick={() => toggleLead(leadId)}
                                    className="w-full text-left px-6 py-4 bg-gradient-to-r from-gray-50 to-white hover:from-primary/5 hover:to-white transition-colors duration-200 focus:outline-none"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        {/* Left: avatar + name */}
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                <User className="w-5 h-5 text-primary" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-gray-900 truncate">
                                                    {lead?.name || lead?.phone || 'Unknown Lead'}
                                                </h3>
                                                <p className="text-xs text-gray-500">{lead?.phone}</p>
                                            </div>
                                        </div>

                                        {/* Right: badges + chevron */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            {sentCount > 0 && (
                                                <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                                                    {sentCount} Sent
                                                </span>
                                            )}
                                            <span className="dash-badge dash-badge-new">
                                                {matchGroup.length} {matchGroup.length === 1 ? 'Match' : 'Matches'}
                                            </span>
                                            <div className={`w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                                <ChevronDown className="w-4 h-4 text-gray-500" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Requirement preview — always visible */}
                                    {lead?.requirement && (
                                        <p className="mt-2.5 text-sm text-gray-500 italic line-clamp-1 pl-[52px] text-left">
                                            "{lead.requirement}"
                                        </p>
                                    )}
                                </button>

                                {/* ── Collapsible Match List ── */}
                                <div
                                    className="overflow-hidden transition-all duration-300 ease-in-out"
                                    style={{ maxHeight: isExpanded ? `${matchGroup.length * 150}px` : '0px' }}
                                >
                                    <div className="divide-y divide-gray-50 border-t border-gray-100">
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

                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SmartMatches;
