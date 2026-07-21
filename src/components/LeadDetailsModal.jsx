import React, { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, Clock, CheckCircle2, Bot, User, Loader2, Target, Calendar } from 'lucide-react';

const LeadDetailsModal = ({ isOpen, onClose, lead }) => {
    const [chats, setChats] = useState([]);
    const [isLoadingChats, setIsLoadingChats] = useState(false);
    const chatContainerRef = useRef(null);

    const [consentLogs, setConsentLogs] = useState([]);
    const [isUpdatingConsent, setIsUpdatingConsent] = useState(false);
    const [leadOptIn, setLeadOptIn] = useState(lead ? lead.marketing_opt_in !== false : true);

    const [isWhitelisted, setIsWhitelisted] = useState(lead ? lead.whitelisted === true : false);
    const [isUpdatingWhitelist, setIsUpdatingWhitelist] = useState(false);
    const [leadStatus, setLeadStatus] = useState(lead ? lead.status : 'New Lead');
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    useEffect(() => {
        if (isOpen && lead) {
            setLeadOptIn(lead.marketing_opt_in !== false);
            setIsWhitelisted(lead.whitelisted === true);
            setLeadStatus(lead.status);
            fetchConsentLogs(lead.id);
        }
    }, [isOpen, lead]);

    useEffect(() => {
        if (isOpen && lead?.phone) {
            fetchChats(lead.phone);
        }
    }, [isOpen, lead]);

    const toggleWhitelist = async () => {
        setIsUpdatingWhitelist(true);
        try {
            const newWhitelist = !isWhitelisted;
            const response = await fetch(`/api/collections/leads/${lead.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ whitelisted: newWhitelist })
            });
            if (response.ok) {
                setIsWhitelisted(newWhitelist);
                lead.whitelisted = newWhitelist; // update local object reference
            }
        } catch (error) {
            console.error("Failed to update whitelist status:", error);
        } finally {
            setIsUpdatingWhitelist(false);
        }
    };

    const togglePermanentBlock = async () => {
        setIsUpdatingStatus(true);
        try {
            const isBlocked = leadStatus === 'Blocked';
            const newStatus = isBlocked ? 'New Lead' : 'Blocked';
            const response = await fetch(`/api/collections/leads/${lead.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (response.ok) {
                setLeadStatus(newStatus);
                lead.status = newStatus; // update local object reference
            }
        } catch (error) {
            console.error("Failed to update permanent block status:", error);
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chats]);

    const fetchConsentLogs = async (leadId) => {
        try {
            const response = await fetch(`/api/collections/lead_consents?filter=lead_id='${leadId}'&sort=-created_at`);
            if (response.ok) {
                const data = await response.json();
                setConsentLogs(data.items || []);
            }
        } catch (error) {
            console.error("Failed to fetch consent logs:", error);
        }
    };

    const toggleConsent = async () => {
        setIsUpdatingConsent(true);
        try {
            const newOptIn = !leadOptIn;
            const response = await fetch(`/api/collections/leads/${lead.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ marketing_opt_in: newOptIn })
            });
            if (response.ok) {
                setLeadOptIn(newOptIn);
                await fetchConsentLogs(lead.id);
                lead.marketing_opt_in = newOptIn; // update local object reference
            }
        } catch (error) {
            console.error("Failed to update consent:", error);
        } finally {
            setIsUpdatingConsent(false);
        }
    };

    const fetchChats = async (phone) => {
        setIsLoadingChats(true);
        try {
            // Remove non-numeric characters for the API call
            const cleanPhone = phone.replace(/\D/g, '');
            const response = await fetch(`/api/chats/${cleanPhone}`);
            if (response.ok) {
                const data = await response.json();
                setChats(data.chats || []);
            }
        } catch (error) {
            console.error("Failed to fetch AI chat logs", error);
        } finally {
            setIsLoadingChats(false);
        }
    };

    if (!isOpen || !lead) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-5xl h-[85vh] shadow-2xl flex flex-col md:flex-row overflow-hidden relative animate-in zoom-in-95 duration-200">

                {/* Mobile Close Button */}
                <button
                    onClick={onClose}
                    className="md:hidden absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-full text-gray-500 shadow-sm"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* LEFT SIDE: Lead Data */}
                <div className="w-full md:w-1/3 bg-gray-50 flex flex-col border-r border-gray-100 overflow-y-auto max-h-[40vh] md:max-h-none shrink-0">
                    <div className="p-6 bg-white border-b border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                            <h2 className="text-xl font-bold text-gray-900">{lead.name}</h2>
                            <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-100">
                                {lead.status}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                            <MessageCircle className="w-4 h-4" />
                            {lead.phone}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`, '_blank')}
                                className="flex-1 min-w-[120px] bg-green-50 hover:bg-green-100 text-green-700 font-semibold py-2 px-4 rounded-xl transition-colors flex justify-center items-center gap-2 text-sm"
                            >
                                <MessageCircle className="w-4 h-4" />
                                WhatsApp
                            </button>
                            <button
                                onClick={() => alert("Searching for property matches for this lead...")}
                                className="flex-1 min-w-[120px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-2 px-4 rounded-xl transition-colors flex justify-center items-center gap-2 text-sm"
                            >
                                <Target className="w-4 h-4" />
                                Find Match
                            </button>
                            <button
                                onClick={() => alert("Opening site visit scheduler...")}
                                className="flex-1 min-w-[120px] bg-red-50 hover:bg-red-100 text-primary font-semibold py-2 px-4 rounded-xl transition-colors flex justify-center items-center gap-2 text-sm"
                            >
                                <Calendar className="w-4 h-4" />
                                Schedule Visit
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Requirement Overview</h3>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {lead.requirement || "No detailed requirements recorded yet."}
                            </div>
                        </div>

                        {lead.date && (
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Next Action</h3>
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                                    <div className="bg-orange-50 p-2 rounded-lg">
                                        <Clock className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">Follow-up Scheduled</p>
                                        <p className="text-xs text-gray-500">{new Date(lead.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Lead Source</h3>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                                <div className="bg-blue-50 p-2 rounded-lg">
                                    <Bot className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">AI WhatsApp Agent</p>
                                    <p className="text-xs text-gray-500">Processed seamlessly via ChatGPT</p>
                                </div>
                            </div>
                        </div>

                        {/* DPDP Consent Status & Logs */}
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-gray-105">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">WhatsApp Consent</h4>
                                {leadOptIn ? (
                                    <span className="text-[9px] bg-green-50 text-green-700 border border-green-100 font-extrabold px-2 py-0.5 rounded-full">
                                        Opted-In
                                    </span>
                                ) : (
                                    <span className="text-[9px] bg-red-50 text-red-700 border border-red-100 font-extrabold px-2 py-0.5 rounded-full">
                                        Opted-Out
                                    </span>
                                )}
                            </div>

                            <div className="flex justify-between items-center gap-2">
                                <p className="text-[11px] text-gray-500 leading-normal">
                                    {leadOptIn ? "Lead agrees to receive property alerts on WhatsApp." : "Lead has unsubscribed. Campaigns are blocked."}
                                </p>
                                <button
                                    onClick={toggleConsent}
                                    disabled={isUpdatingConsent}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                                        leadOptIn 
                                        ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' 
                                        : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                    }`}
                                >
                                    {isUpdatingConsent ? 'Updating...' : (leadOptIn ? 'Unsubscribe' : 'Subscribe')}
                                </button>
                            </div>

                            {/* Consent Audit Logs */}
                            {consentLogs.length > 0 && (
                                <div className="pt-2 border-t border-gray-100">
                                    <h5 className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">Consent Audit History</h5>
                                    <div className="max-h-[120px] overflow-y-auto space-y-2 pr-1">
                                        {consentLogs.map(log => (
                                            <div key={log.id} className="text-[10px] bg-gray-50 border border-gray-100 rounded-lg p-2 flex flex-col gap-0.5">
                                                <div className="flex justify-between items-center">
                                                    <span className={`font-bold uppercase tracking-wider text-[8px] px-1 rounded-sm ${log.consent_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {log.consent_status === 'active' ? 'Granted' : 'Withdrawn'}
                                                    </span>
                                                    <span className="text-[8px] text-gray-400 font-mono">
                                                        {new Date(log.created_at || log.updated_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 font-medium leading-normal">{log.consent_clause}</p>
                                                <span className="text-[8px] text-gray-400 font-semibold italic">Source: {log.source}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* AI Billing & Security Settings */}
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">AI Billing & Security</h4>
                                <div className="flex gap-1.5">
                                    {isWhitelisted && (
                                        <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-100 font-extrabold px-2 py-0.5 rounded-full">
                                            VIP Whitelist
                                        </span>
                                    )}
                                    {leadStatus === 'Blocked' && (
                                        <span className="text-[9px] bg-red-50 text-red-700 border border-red-100 font-extrabold px-2 py-0.5 rounded-full">
                                            Blocked Competitor
                                        </span>
                                    )}
                                    {leadStatus === 'Needs Human Intervention' && (
                                        <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-100 font-extrabold px-2 py-0.5 rounded-full">
                                            Needs Handover
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Whitelist Toggle */}
                            <div className="flex justify-between items-center gap-2">
                                <div className="space-y-0.5 pr-2">
                                    <p className="text-xs font-bold text-gray-800">Whitelist VIP Client</p>
                                    <p className="text-[10px] text-gray-500 leading-normal">
                                        Allows unlimited WhatsApp messages bypassing the 50 messages limit.
                                    </p>
                                </div>
                                <button
                                    onClick={toggleWhitelist}
                                    disabled={isUpdatingWhitelist}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all shrink-0 ${
                                        isWhitelisted 
                                        ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' 
                                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    {isUpdatingWhitelist ? 'Updating...' : (isWhitelisted ? 'Remove' : 'Whitelist')}
                                </button>
                            </div>

                            {/* Permanent Ban Toggle */}
                            <div className="flex justify-between items-center gap-2 pt-2 border-t border-gray-50">
                                <div className="space-y-0.5 pr-2">
                                    <p className="text-xs font-bold text-gray-800">Permanent Ban / Block</p>
                                    <p className="text-[10px] text-gray-500 leading-normal">
                                        Completely ignore incoming messages from this phone number to save API costs.
                                    </p>
                                </div>
                                <button
                                    onClick={togglePermanentBlock}
                                    disabled={isUpdatingStatus}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all shrink-0 ${
                                        leadStatus === 'Blocked'
                                        ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' 
                                        : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                                    }`}
                                >
                                    {isUpdatingStatus ? 'Updating...' : (leadStatus === 'Blocked' ? 'Unblock' : 'Block Permanent')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: AI Chat Log */}
                <div className="w-full md:w-2/3 bg-[#efeae2] flex flex-col flex-1 min-h-0 relative">

                    {/* Chat Header */}
                    <div className="bg-white px-6 py-4 flex justify-between items-center shadow-sm z-10 sticky top-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Live AI Chat Log</h3>
                                <p className="text-xs text-gray-500">Viewing exact conversation history</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="hidden md:flex text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Chat Messages Area */}
                    <div
                        ref={chatContainerRef}
                        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4"
                        style={{ backgroundImage: `url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')`, backgroundSize: 'cover', backgroundAttachment: 'fixed', opacity: 0.95 }}
                    >
                        {isLoadingChats ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 bg-white/50 backdrop-blur-sm rounded-2xl">
                                <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                                <p className="text-sm font-medium">Fetching conversation log...</p>
                            </div>
                        ) : chats.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 bg-white/80 backdrop-blur-md rounded-2xl mx-4">
                                <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
                                <p className="text-sm font-medium text-gray-600">No active chat session found.</p>
                                <p className="text-xs text-gray-400 text-center mt-2 max-w-[250px]">
                                    If this is an older lead, the AI's temporary server memory may have cleared.
                                </p>
                            </div>
                        ) : (
                            chats.map((msg, index) => {
                                // Try to format JSON responses nicely if it's the assistant
                                let displayContent = msg.content;
                                if (msg.role === 'assistant') {
                                    try {
                                        const parsed = JSON.parse(msg.content);
                                        displayContent = parsed.human_response || msg.content;
                                    } catch (e) {
                                        // Ignore parse error, just show string
                                    }
                                }

                                const isBot = msg.role === 'assistant';

                                return (
                                    <div key={index} className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4`}>
                                        <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 shadow-md relative ${isBot
                                            ? 'bg-white text-gray-800 rounded-tl-sm'
                                            : 'bg-[#dcf8c6] text-gray-900 rounded-tr-sm'
                                            }`}>
                                            <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap font-messaging">
                                                {displayContent}
                                            </p>

                                            <div className="flex justify-end items-center gap-1 mt-1 opacity-60">
                                                <span className="text-[10px]">AI Logger</span>
                                                <CheckCircle2 className="w-3 h-3 text-blue-500" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default LeadDetailsModal;
