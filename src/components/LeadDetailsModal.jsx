import React, { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, Clock, CheckCircle2, Bot, User, Loader2, Target, Calendar, Edit2, Save, Search, Send } from 'lucide-react';
import { pb } from '../services/pocketbase';

const LeadDetailsModal = ({ isOpen, onClose, lead, onUpdate }) => {
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

    const [interestedProperty, setInterestedProperty] = useState(null);
    const [isLoadingProperty, setIsLoadingProperty] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', phone: '', requirement: '', date: '', status: '' });
    const [typedMessage, setTypedMessage] = useState('');
    const [isSendingChat, setIsSendingChat] = useState(false);

    const [linkedMatches, setLinkedMatches] = useState([]);
    const [allProperties, setAllProperties] = useState([]);
    const [isLoadingProperties, setIsLoadingProperties] = useState(false);
    const [propertySearch, setPropertySearch] = useState('');
    const [selectedPropertyIds, setSelectedPropertyIds] = useState([]);
    const [originalPropertyIds, setOriginalPropertyIds] = useState([]);

    const formatDateForInput = (dateStr) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return '';
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (e) {
            return '';
        }
    };

    const fetchLinkedProperties = async (leadId) => {
        try {
            const records = await pb.collection('matches').getFullList({
                filter: pb.filter('lead_id = {:leadId}', { leadId }),
                expand: 'property_id'
            });
            setLinkedMatches(records);
            const ids = records.map(r => r.property_id);
            setSelectedPropertyIds(ids);
            setOriginalPropertyIds(ids);
        } catch (error) {
            console.error("Failed to fetch linked properties:", error);
        }
    };

    const fetchAllProperties = async () => {
        setIsLoadingProperties(true);
        try {
            const agencyId = lead?.agencyId || pb.authStore.model?.id;
            if (!agencyId) return;
            const records = await pb.collection('properties').getFullList({
                filter: pb.filter('agencyId = {:agencyId}', { agencyId }),
                sort: '-created'
            });
            setAllProperties(records);
        } catch (error) {
            console.error("Failed to fetch all properties:", error);
        } finally {
            setIsLoadingProperties(false);
        }
    };

    useEffect(() => {
        if (isOpen && lead) {
            setLeadOptIn(lead.marketing_opt_in !== false);
            setIsWhitelisted(lead.whitelisted === true);
            setLeadStatus(lead.status);
            setIsEditing(false);
            setPropertySearch('');
            fetchConsentLogs(lead.id);
            fetchLinkedProperties(lead.id);
            fetchAllProperties();
            
            if (lead.interestedPropertyId) {
                fetchInterestedProperty(lead.interestedPropertyId);
            } else {
                setInterestedProperty(null);
            }
        }
    }, [isOpen, lead]);

    useEffect(() => {
        if (isOpen && lead?.phone) {
            fetchChats(lead.phone);
        }
    }, [isOpen, lead]);

    const fetchInterestedProperty = async (propId) => {
        setIsLoadingProperty(true);
        try {
            const response = await fetch(`/api/collections/properties/${propId}`);
            if (response.ok) {
                const data = await response.json();
                setInterestedProperty(data);
            }
        } catch (error) {
            console.error("Failed to fetch interested property:", error);
        } finally {
            setIsLoadingProperty(false);
        }
    };

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
                if (onUpdate) onUpdate({ ...lead, whitelisted: newWhitelist });
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
                if (onUpdate) onUpdate({ ...lead, status: newStatus });
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
                if (onUpdate) onUpdate({ ...lead, marketing_opt_in: newOptIn });
            }
        } catch (error) {
            console.error("Failed to update consent:", error);
        } finally {
            setIsUpdatingConsent(false);
        }
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        setIsSavingEdit(true);
        try {
            const response = await fetch(`/api/collections/leads/${lead.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editForm.name,
                    phone: editForm.phone,
                    requirement: editForm.requirement,
                    date: editForm.date ? new Date(editForm.date).toISOString() : null,
                    status: editForm.status
                })
            });

            if (response.ok) {
                const updatedLead = await response.json();
                setLeadStatus(editForm.status);
                
                // Update local object reference
                lead.name = editForm.name;
                lead.phone = editForm.phone;
                lead.requirement = editForm.requirement;
                lead.date = editForm.date ? new Date(editForm.date).toISOString() : null;
                lead.status = editForm.status;

                // Sync linked properties
                const toAdd = selectedPropertyIds.filter(id => !originalPropertyIds.includes(id));
                const toDelete = originalPropertyIds.filter(id => !selectedPropertyIds.includes(id));
                const agencyId = lead.agencyId || pb.authStore.model?.id;

                const addPromises = toAdd.map(propId => 
                    pb.collection('matches').create({
                        lead_id: lead.id,
                        property_id: propId,
                        agency_id: agencyId,
                        status: 'Pending Review'
                    })
                );

                const deletePromises = toDelete.map(propId => {
                    const matchToDelete = linkedMatches.find(m => m.property_id === propId);
                    if (matchToDelete) {
                        return pb.collection('matches').delete(matchToDelete.id);
                    }
                    return Promise.resolve();
                });

                await Promise.all([...addPromises, ...deletePromises]);
                await fetchLinkedProperties(lead.id);

                if (onUpdate) {
                    onUpdate(updatedLead);
                }
                setIsEditing(false);
            } else {
                const errData = await response.json();
                alert(`Failed to save: ${errData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Failed to update lead details:", error);
            alert("An error occurred while saving lead details.");
        } finally {
            setIsSavingEdit(false);
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

    const handleSendChat = async () => {
        if (!typedMessage.trim() || !lead || !lead.phone) return;
        setIsSendingChat(true);
        try {
            const agencyId = lead.agencyId || pb.authStore.model?.id;
            const response = await fetch('/api/chats/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: lead.phone,
                    message: typedMessage,
                    agencyId
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    const newMsg = {
                        role: 'assistant',
                        content: typedMessage,
                        created_at: new Date().toISOString()
                    };
                    setChats(prev => [...prev, newMsg]);
                    setTypedMessage('');
                    setTimeout(() => {
                        if (chatContainerRef.current) {
                            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                        }
                    }, 100);
                } else {
                    alert(data.error || "Failed to send message.");
                }
            } else {
                const errText = await response.text();
                alert(errText || "Error sending message.");
            }
        } catch (err) {
            console.error("Direct send chat error:", err);
            alert("An error occurred while sending the message.");
        } finally {
            setIsSendingChat(false);
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
                    {isEditing ? (
                        <div className="flex flex-col h-full bg-white">
                            {/* Edit Mode Header */}
                            <div className="px-6 py-5 bg-white border-b border-gray-100 flex justify-between items-center">
                                <div>
                                    <h2 className="text-base font-bold text-gray-900">Edit Details</h2>
                                    <p className="text-xs text-gray-400">Update lead info</p>
                                </div>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Edit Mode Body */}
                            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 overflow-y-auto flex-1">
                                <div>
                                    <label className="dash-label">Lead Name <span className="text-primary">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        className="dash-input"
                                        placeholder="e.g. John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="dash-label">WhatsApp Phone <span className="text-primary">*</span></label>
                                    <input
                                        type="tel"
                                        required
                                        value={editForm.phone}
                                        onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                        className="dash-input"
                                        placeholder="+91..."
                                    />
                                </div>
                                <div>
                                    <label className="dash-label">Requirement Overview</label>
                                    <textarea
                                        value={editForm.requirement}
                                        onChange={e => setEditForm({ ...editForm, requirement: e.target.value })}
                                        rows="4"
                                        className="dash-input resize-none"
                                        placeholder="Requirement details..."
                                    />
                                </div>
                                <div>
                                    <label className="dash-label">Next Follow-up Date</label>
                                    <input
                                        type="date"
                                        value={editForm.date}
                                        onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                                        className="dash-input"
                                    />
                                </div>
                                <div>
                                    <label className="dash-label">Pipeline Status</label>
                                    <select
                                        value={editForm.status}
                                        onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                        className="dash-input"
                                    >
                                        <option value="New Lead">New Lead</option>
                                        <option value="Contacted">Contacted</option>
                                        <option value="Needs Human Intervention">Needs Human Intervention</option>
                                        <option value="Site Visit">Site Visit</option>
                                        <option value="Closed">Closed</option>
                                        <option value="Blocked">Blocked</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="dash-label flex justify-between items-center">
                                        <span>Link Properties (Manual)</span>
                                        <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                                            {selectedPropertyIds.length} Linked
                                        </span>
                                    </label>
                                    <div className="border border-gray-200 rounded-xl p-3 bg-gray-50/50 space-y-2">
                                        <div className="relative mb-2">
                                            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                                            <input
                                                type="text"
                                                placeholder="Search properties to link..."
                                                className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                                value={propertySearch}
                                                onChange={e => setPropertySearch(e.target.value)}
                                            />
                                        </div>
                                        {isLoadingProperties ? (
                                            <div className="flex items-center justify-center py-4 gap-2 text-xs text-gray-400">
                                                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                                                <span>Loading properties...</span>
                                            </div>
                                        ) : (
                                            <div className="max-h-[140px] overflow-y-auto space-y-2 pr-1 scrollbar-none">
                                                {allProperties
                                                    .filter(p => 
                                                        p.title.toLowerCase().includes(propertySearch.toLowerCase()) || 
                                                        (p.location && p.location.toLowerCase().includes(propertySearch.toLowerCase()))
                                                    )
                                                    .map(p => {
                                                        const isLinked = selectedPropertyIds.includes(p.id);
                                                        return (
                                                            <label key={p.id} className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-gray-150 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isLinked}
                                                                    onChange={e => {
                                                                        if (e.target.checked) {
                                                                            setSelectedPropertyIds([...selectedPropertyIds, p.id]);
                                                                        } else {
                                                                            setSelectedPropertyIds(selectedPropertyIds.filter(id => id !== p.id));
                                                                        }
                                                                    }}
                                                                    className="mt-0.5 rounded text-primary focus:ring-primary border-gray-300 w-3.5 h-3.5"
                                                                />
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-xs font-bold text-gray-800 truncate">{p.title}</p>
                                                                    <p className="text-[10px] text-gray-500 truncate">{p.location || 'No Location'}</p>
                                                                </div>
                                                                <span className="text-[10px] font-mono text-gray-400 self-center shrink-0">
                                                                    {p.price ? (
                                                                        parseFloat(p.price) >= 10000000 
                                                                            ? `₹${(parseFloat(p.price) / 10000000).toFixed(1)} Cr` 
                                                                            : `₹${(parseFloat(p.price) / 100000).toFixed(1)} L`
                                                                    ) : 'Request'}
                                                                </span>
                                                            </label>
                                                        );
                                                    })
                                                }
                                                {allProperties.length === 0 && (
                                                    <p className="text-xs text-gray-400 text-center py-2">No properties available.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="flex-1 px-4 py-2.5 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-colors border border-gray-200 text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSavingEdit}
                                        className="flex-1 btn-dash-primary flex justify-center items-center gap-2 animate-in"
                                    >
                                        {isSavingEdit ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                Save
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <>
                            <div className="p-6 bg-white border-b border-gray-100">
                                <div className="flex justify-between items-start mb-2">
                                    <h2 className="text-xl font-bold text-gray-900 truncate max-w-[150px] sm:max-w-none">{lead.name}</h2>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setEditForm({
                                                    name: lead.name || '',
                                                    phone: lead.phone || '',
                                                    requirement: lead.requirement || '',
                                                    date: formatDateForInput(lead.date),
                                                    status: lead.status || 'New Lead'
                                                });
                                                setIsEditing(true);
                                            }}
                                            className="px-2.5 py-1 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-lg border border-gray-200 shadow-sm flex items-center gap-1.5 text-xs font-bold transition-all"
                                            title="Edit Lead Details"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                            <span>Edit</span>
                                        </button>
                                        <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-100">
                                            {lead.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-gray-500 text-sm mb-4">
                                    <div className="flex items-center gap-1.5">
                                        <MessageCircle className="w-4 h-4 text-gray-400" />
                                        <span>{lead.phone}</span>
                                    </div>
                                    {(lead.created || lead.created_at) && (
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <span>Created: {new Date(lead.created || lead.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                                        </div>
                                    )}
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

                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Linked Properties ({linkedMatches.length})</h3>
                                    <div className="space-y-3">
                                        {linkedMatches.map(match => {
                                            const property = match.expand?.property_id;
                                            if (!property) return null;

                                            return (
                                                <div key={match.id} className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 relative group">
                                                    {property.images && property.images.length > 0 ? (
                                                        <img 
                                                            src={`/api/files/properties/${property.id}/${property.images[0]}`} 
                                                            alt={property.title}
                                                            className="w-12 h-12 rounded-lg object-cover bg-gray-50 border border-gray-100"
                                                            onError={(e) => {
                                                                e.target.src = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=400&q=80';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                            🏡
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-bold text-gray-900 truncate">{property.title}</p>
                                                        <p className="text-xs text-gray-500 truncate">{property.location}</p>
                                                        <p className="text-xs text-primary font-bold mt-0.5">
                                                            {property.price ? (
                                                                parseFloat(property.price) >= 10000000 
                                                                    ? `₹${(parseFloat(property.price) / 10000000).toFixed(2)} Cr` 
                                                                    : `₹${(parseFloat(property.price) / 100000).toFixed(2)} Lakh`
                                                            ) : 'Price on request'}
                                                        </p>
                                                    </div>
                                                    <a 
                                                        href={`/properties/${property.id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[10px] font-bold bg-primary/5 text-primary border border-primary/10 hover:bg-primary/10 px-2.5 py-1.5 rounded-lg transition-all"
                                                    >
                                                        View Page
                                                    </a>
                                                </div>
                                            );
                                        })}
                                        {linkedMatches.length === 0 && (
                                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-xs text-gray-400">
                                                No properties linked manually.
                                            </div>
                                        )}
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
                        </>
                    )}
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

                                            <div className="flex justify-between items-center mt-1.5 opacity-60 text-[9px] text-gray-500">
                                                <span>
                                                    {msg.created_at 
                                                        ? new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) 
                                                        : ''}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <span>{isBot ? 'AI Agent' : 'Customer'}</span>
                                                    <CheckCircle2 className="w-3 h-3 text-blue-500" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Smart AI Banner & Chat Input Box */}
                    {leadStatus !== 'Needs Human Intervention' && (
                        <div className="bg-amber-50 border-t border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-800 font-medium z-10">
                            <span className="flex items-center gap-1.5">
                                ⚠️ AI Agent is active. Customer replies will trigger AI responses.
                            </span>
                            <button
                                onClick={async () => {
                                    try {
                                        const updated = await pb.collection('leads').update(lead.id, {
                                            status: 'Needs Human Intervention'
                                        });
                                        setLeadStatus('Needs Human Intervention');
                                        if (onUpdate) onUpdate(updated);
                                    } catch (e) {
                                        console.error("Failed to update status:", e);
                                    }
                                }}
                                className="bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 px-2 py-0.5 rounded-lg font-bold transition-all text-[10px]"
                            >
                                Disable AI (Needs Intervention)
                            </button>
                        </div>
                    )}

                    <div className="bg-[#f0f2f5] p-3 border-t border-gray-200 flex items-center gap-2 z-10">
                        <textarea
                            rows="1"
                            value={typedMessage}
                            onChange={(e) => setTypedMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendChat();
                                }
                            }}
                            placeholder="Type a message to chat directly..."
                            className="flex-1 resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary max-h-[100px] min-h-[38px] leading-relaxed font-messaging text-gray-800"
                        />
                        <button
                            onClick={handleSendChat}
                            disabled={isSendingChat || !typedMessage.trim()}
                            className="bg-primary hover:bg-primary/95 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2.5 rounded-full shadow transition-all shrink-0"
                            title="Send Message via WhatsApp"
                        >
                            {isSendingChat ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default LeadDetailsModal;
