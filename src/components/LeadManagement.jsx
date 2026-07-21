import React, { useState, useEffect } from 'react';
import { Plus, MessageCircle, Calendar, Search, Clock, Mail, UploadCloud, Loader2, Trash2, X, User, Target, Edit2 } from 'lucide-react';
import { pb } from '../services/pocketbase';
import BulkLeadUploadWizard from './BulkLeadUploadWizard';
import LeadDetailsModal from './LeadDetailsModal';

const initialColumns = {
    'New Lead': [],
    'Contacted': [],
    'Needs Human Intervention': [],
    'Site Visit': [],
    'Closed': [],
    'Blocked': [],
};

// Left-border accent per status
const colAccent = {
    'New Lead':   'kanban-card-new',
    'Contacted':  'kanban-card-contacted',
    'Needs Human Intervention': 'border-l-4 border-amber-500 bg-amber-50/10 hover:shadow-amber-100/30',
    'Site Visit': 'kanban-card-visit',
    'Closed':     'kanban-card-closed',
    'Blocked':    'border-l-4 border-red-500 bg-red-50/10 hover:shadow-red-100/30',
};

// Header dot colour per column
const colDotClass = {
    'New Lead':   'bg-primary',
    'Contacted':  'bg-blue-500',
    'Needs Human Intervention': 'bg-amber-500',
    'Site Visit': 'bg-orange-500',
    'Closed':     'bg-green-500',
    'Blocked':    'bg-red-500',
};

const LeadManagement = () => {
    const [leads, setLeads] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isBulkWizardOpen, setIsBulkWizardOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [newLead, setNewLead] = useState({ name: '', phone: '', email: '', requirement: '', date: '', status: 'New Lead' });
    const [searchTerm, setSearchTerm] = useState('');

    const currentUser = pb.authStore.model;
    const isOwner = currentUser?.role !== 'agent';
    const targetAgencyId = isOwner ? currentUser?.id : currentUser?.agencyId;

    useEffect(() => {
        if (targetAgencyId) {
            fetchLeads();
        } else {
            setIsLoading(false);
        }
    }, [targetAgencyId]);

    const fetchLeads = async () => {
        setIsLoading(true);
        try {
            const records = await pb.collection('leads').getFullList({
                filter: pb.filter('agencyId = {:agencyId}', { agencyId: targetAgencyId }),
                sort: '-created',
            });
            setLeads(records);
        } catch (error) {
            console.error('Error fetching leads:', error.message, error.data);
            alert(`Fetch failed. Details: ${JSON.stringify(error.data || error.message)}`);
        } finally {
            setIsLoading(false);
        }
    };

    const isPastOrToday = (dateString) => {
        if (!dateString) return false;
        const inputDate = new Date(dateString);
        inputDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return inputDate <= today;
    };

    const handleAddLead = async (e) => {
        e.preventDefault();
        try {
            const createdRecord = await pb.collection('leads').create({ ...newLead, agencyId: targetAgencyId });
            setLeads([createdRecord, ...leads]);
            setIsAddModalOpen(false);
            setNewLead({ name: '', phone: '', email: '', requirement: '', date: '', status: 'New Lead' });
        } catch (error) {
            console.error('Error creating lead:', error);
            alert('Failed to create lead.');
        }
    };

    const handleStatusChange = async (leadId, newStatus) => {
        try {
            setLeads(leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
            await pb.collection('leads').update(leadId, { status: newStatus });
        } catch (error) {
            console.error('Error updating lead status:', error);
            fetchLeads();
        }
    };

    const handleDeleteLead = async (e, leadId) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
            try {
                setLeads(leads.filter(l => l.id !== leadId));
                await pb.collection('leads').delete(leadId);
            } catch (error) {
                console.error('Error deleting lead:', error);
                alert('Failed to delete lead.');
                fetchLeads();
            }
        }
    };

    const handleWhatsApp = (e, phone) => {
        e.stopPropagation();
        if (!phone) return;
        const cleanPhone = phone.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanPhone}`, '_blank');
    };

    const handleLeadClick = (lead) => {
        setSelectedLead(lead);
        setIsDetailsModalOpen(true);
    };

    const searchedLeads = leads.filter(l =>
        (l.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.requirement || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.phone || '').includes(searchTerm)
    );

    const renderColumns = () => {
        if (isLoading) {
            return (
                <div className="w-full flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
                    <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                    <p className="text-sm font-medium">Loading your pipeline...</p>
                </div>
            );
        }

        return Object.keys(initialColumns).map(colName => {
            const colLeads = searchedLeads.filter(l => l.status === colName);

            return (
                <div key={colName} className="kanban-col h-[calc(100vh-230px)] lg:h-[calc(100vh-200px)] snap-align-start shrink-0 w-[85vw] sm:w-[380px]">
                    {/* Column Header */}
                    <div className="kanban-col-header">
                        <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${colDotClass[colName]}`} />
                            <h3 className="text-sm font-bold text-gray-800">{colName}</h3>
                        </div>
                        <span className="bg-white text-gray-500 text-xs font-bold px-2.5 py-1 rounded-full border border-gray-200 shadow-sm">
                            {colLeads.length}
                        </span>
                    </div>

                    {/* Cards */}
                    <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-0.5 pb-4">
                        {colLeads.length === 0 && (
                            <div className="flex-1 flex items-center justify-center">
                                <p className="text-xs text-gray-400 font-medium">No leads here</p>
                            </div>
                        )}
                        {colLeads.map(lead => {
                            const initials = (lead.name || '')
                                .split(' ')
                                .map(n => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase() || '?';
                                
                            const isIntervention = lead.status === 'Needs Human Intervention';

                            return (
                                <div
                                    key={lead.id}
                                    onClick={() => handleLeadClick(lead)}
                                    className={`kanban-card ${colAccent[colName] || ''} hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 relative group overflow-hidden bg-white p-4 rounded-xl border border-gray-100/80 flex flex-col gap-3.5 shrink-0`}
                                >
                                    {/* Header: Avatar, Name, Badges */}
                                    <div className="flex justify-between items-start gap-2.5">
                                        <div className="flex items-center gap-3 min-w-0">
                                            {/* Initials Avatar */}
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary border border-primary/20">
                                                {initials === '?' ? <User className="w-3.5 h-3.5" /> : initials}
                                            </div>
                                            {/* Name & Phone */}
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-gray-900 text-sm tracking-tight truncate group-hover:text-primary transition-colors">
                                                    {lead.name || 'WhatsApp Contact'}
                                                </h4>
                                                {lead.phone && (
                                                    <span className="text-[10px] text-gray-400 font-mono block mt-0.5">
                                                        +{lead.phone}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Badges */}
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            {lead.whitelisted && (
                                                <span className="text-[8px] font-bold bg-amber-50 text-amber-600 border border-amber-200/50 px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm uppercase tracking-wide">
                                                    ★ VIP
                                                </span>
                                            )}
                                            {isIntervention && (
                                                <span className="text-[8px] font-bold bg-red-50 text-red-600 border border-red-200/50 px-2 py-0.5 rounded-full animate-pulse uppercase tracking-wide">
                                                    Needs Agent
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Requirement snippet */}
                                    <div className="bg-gray-50 border border-gray-100/80 rounded-xl p-2.5">
                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Requirement</span>
                                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed font-medium">
                                            {lead.requirement || 'No detailed requirements recorded.'}
                                        </p>
                                    </div>

                                    {/* Status Dropdown */}
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Status</span>
                                        <select
                                            value={lead.status}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                                            className="w-full text-xs font-semibold py-1.5 px-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer text-gray-700 hover:border-gray-300 transition-colors"
                                        >
                                            {Object.keys(initialColumns).map(col => (
                                                <option key={col} value={col}>
                                                    {col}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Footer: Actions & Date */}
                                    <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 mt-auto">
                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={(e) => handleDeleteLead(e, lead.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-150 shadow-sm"
                                                title="Delete Lead"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleLeadClick(lead);
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors border border-gray-150 shadow-sm"
                                                title="Edit / View Details"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            {lead.phone && (
                                                <button
                                                    onClick={(e) => handleWhatsApp(e, lead.phone)}
                                                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-gray-150 shadow-sm"
                                                    title="WhatsApp Lead"
                                                >
                                                    <MessageCircle className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Date Display */}
                                        <div className="flex items-center gap-1.5 text-gray-400">
                                            <Clock className={`w-3.5 h-3.5 ${isPastOrToday(lead.date) ? 'text-primary' : 'text-gray-400'}`} />
                                            <span className={`text-[10px] font-bold ${isPastOrToday(lead.date) ? 'text-primary' : 'text-gray-500'}`}>
                                                {lead.date
                                                    ? new Date(lead.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                                                    : 'No Date'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        });
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="section-title">Lead Pipeline</h2>
                    <p className="section-subtitle">{leads.length} total leads</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <div className="toolbar-search min-w-[200px]">
                        <Search className="search-icon w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search leads..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={() => setIsBulkWizardOpen(true)} className="btn-dash-secondary">
                        <UploadCloud className="w-4 h-4" />
                        <span className="hidden sm:inline">Bulk Upload</span>
                    </button>
                    <button onClick={() => setIsAddModalOpen(true)} className="btn-dash-primary">
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Lead</span>
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 pb-4 overflow-x-auto scrollbar-none">
                <div className="flex flex-row gap-4 h-full items-start select-none snap-x snap-mandatory">
                    {renderColumns()}
                </div>
            </div>

            {/* Add Lead Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]
                                    animate-in">
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Plus className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-base font-display font-bold text-gray-900">Add New Lead</h2>
                                    <p className="text-xs text-gray-400">Fill in the details below</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto">
                            <form id="add-lead-form" onSubmit={handleAddLead} className="space-y-5">
                                <div>
                                    <label className="dash-label">Lead Name <span className="text-primary">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={newLead.name}
                                        onChange={e => setNewLead({ ...newLead, name: e.target.value })}
                                        className="dash-input"
                                        placeholder="e.g. John Doe"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="dash-label">WhatsApp <span className="text-primary">*</span></label>
                                        <input
                                            type="tel"
                                            required
                                            value={newLead.phone}
                                            onChange={e => setNewLead({ ...newLead, phone: e.target.value })}
                                            className="dash-input"
                                            placeholder="+91..."
                                        />
                                    </div>
                                    <div>
                                        <label className="dash-label">Email <span className="text-gray-400 font-normal">(Optional)</span></label>
                                        <input
                                            type="email"
                                            value={newLead.email}
                                            onChange={e => setNewLead({ ...newLead, email: e.target.value })}
                                            className="dash-input"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="dash-label">Requirement Overview</label>
                                    <textarea
                                        value={newLead.requirement}
                                        onChange={e => setNewLead({ ...newLead, requirement: e.target.value })}
                                        rows="3"
                                        className="dash-input resize-none"
                                        placeholder="Looking for 3BHK sea view..."
                                    />
                                </div>
                                <div>
                                    <label className="dash-label">Next Follow-up Date</label>
                                    <input
                                        type="date"
                                        value={newLead.date}
                                        onChange={e => setNewLead({ ...newLead, date: e.target.value })}
                                        className="dash-input"
                                    />
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                className="px-5 py-2.5 text-gray-600 font-semibold hover:bg-gray-200 rounded-xl transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="add-lead-form"
                                className="btn-dash-primary"
                            >
                                Create Lead
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Lead Upload Wizard */}
            {isBulkWizardOpen && (
                <BulkLeadUploadWizard
                    isOpen={isBulkWizardOpen}
                    onClose={() => setIsBulkWizardOpen(false)}
                    onSuccess={() => {
                        setIsBulkWizardOpen(false);
                        fetchLeads();
                    }}
                    targetAgencyId={targetAgencyId}
                    currentUserId={currentUser?.id}
                />
            )}

            {/* Lead Details & Chat Modal */}
            <LeadDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                lead={selectedLead}
            />
        </div>
    );
};

export default LeadManagement;
