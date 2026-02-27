import React, { useState, useEffect } from 'react';
import { Plus, MessageCircle, Calendar, User, Search, Clock, Mail, UploadCloud, Loader2, Trash2 } from 'lucide-react';
import { pb } from '../services/pocketbase';
import BulkLeadUploadWizard from './BulkLeadUploadWizard';
import LeadDetailsModal from './LeadDetailsModal';

const initialColumns = {
    'New Lead': [],
    'Contacted': [],
    'Site Visit': [],
    'Closed': [],
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
                sort: '-id',
            });
            setLeads(records);
        } catch (error) {
            console.error('Error fetching leads:', error.message, error.data);
            alert(`Fetch failed. Details: ${JSON.stringify(error.data || error.message)}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper: check if date is past/today
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
            const createdRecord = await pb.collection('leads').create({
                ...newLead,
                agencyId: targetAgencyId
            });
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
            // Optimistic update
            setLeads(leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
            await pb.collection('leads').update(leadId, { status: newStatus });
        } catch (error) {
            console.error('Error updating lead status:', error);
            fetchLeads(); // revert
        }
    };

    const handleDeleteLead = async (e, leadId) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
            try {
                // Optimistic UI update
                setLeads(leads.filter(l => l.id !== leadId));
                await pb.collection('leads').delete(leadId);
            } catch (error) {
                console.error('Error deleting lead:', error);
                alert('Failed to delete lead.');
                fetchLeads(); // revert on failure
            }
        }
    };

    const handleWhatsApp = (e, phone) => {
        e.stopPropagation();
        if (!phone) return;
        // Clean phone number
        const cleanPhone = phone.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanPhone}`, '_blank');
    };

    const handleLeadClick = (lead) => {
        setSelectedLead(lead);
        setIsDetailsModalOpen(true);
    };

    // Calculate columns for rendering
    const renderColumns = () => {
        if (isLoading) {
            return (
                <div className="w-full flex justify-center items-center py-20 text-gray-400 gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    Loading leads...
                </div>
            );
        }

        const searchedLeads = leads.filter(l =>
            (l.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (l.requirement || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (l.phone || '').includes(searchTerm)
        );

        return Object.keys(initialColumns).map(colName => {
            const colLeads = searchedLeads.filter(l => l.status === colName);

            return (
                <div key={colName} className="flex-1 w-full lg:w-1/4 bg-gray-50/50 rounded-2xl p-4 flex flex-col border border-gray-100 lg:h-[calc(100vh-160px)]">
                    {/* Column Header - Fixed */}
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900 text-sm">{colName}</h3>
                        <span className="bg-white text-gray-500 text-xs font-bold px-2.5 py-1 rounded-full border border-gray-200 shadow-sm">
                            {colLeads.length}
                        </span>
                    </div>

                    {/* Column Cards - Scrollable */}
                    <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1 pb-4 sleek-scroll">
                        {colLeads.map(lead => (
                            <div
                                key={lead.id}
                                onClick={() => handleLeadClick(lead)}
                                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer flex flex-col gap-3"
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <div className="font-bold text-gray-900 line-clamp-1">{lead.name}</div>
                                    <select
                                        value={lead.status}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            handleStatusChange(lead.id, e.target.value);
                                        }}
                                        className="text-[10px] font-bold bg-gray-50 text-gray-600 border border-gray-200 rounded px-1 py-0.5 outline-none hover:bg-gray-100 cursor-pointer"
                                    >
                                        {Object.keys(initialColumns).map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>

                                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                    {lead.requirement || 'No requirement specified.'}
                                </p>

                                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className={`w-3.5 h-3.5 ${isPastOrToday(lead.date) ? 'text-red-500' : 'text-gray-400'}`} />
                                        <span className={`text-[11px] font-semibold tracking-wide ${isPastOrToday(lead.date) ? 'text-red-600' : 'text-gray-500'}`}>
                                            {lead.date ? new Date(lead.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'No Date'}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        {lead.email && (
                                            <a
                                                href={`mailto:${lead.email}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded-lg transition-colors" title="Email Lead"
                                            >
                                                <Mail className="w-4 h-4" />
                                            </a>
                                        )}
                                        {lead.phone && (
                                            <button
                                                onClick={(e) => handleWhatsApp(e, lead.phone)}
                                                className="p-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                                                title="WhatsApp Lead"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => handleDeleteLead(e, lead.id)}
                                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                                            title="Delete Lead"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        });
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900">Lead Pipeline</h2>
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64 min-w-[200px]">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search leads..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                        />
                    </div>
                    <button
                        onClick={() => setIsBulkWizardOpen(true)}
                        className="flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium whitespace-nowrap"
                    >
                        <UploadCloud className="w-4 h-4 text-gray-500" />
                        <span className="hidden sm:inline">Bulk Upload</span>
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors shadow-sm whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Lead</span>
                    </button>
                </div>
            </div>

            {/* Kanban Board Container */}
            <div className="flex-1 pb-4">
                <div className="flex flex-col lg:flex-row gap-6 h-full items-start">
                    {renderColumns()}
                </div>
            </div>

            {/* Add Lead Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900">Add New Lead</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <form id="add-lead-form" onSubmit={handleAddLead} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Lead Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={newLead.name}
                                        onChange={e => setNewLead({ ...newLead, name: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/50 text-gray-900"
                                        placeholder="e.g. John Doe"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp <span className="text-red-500">*</span></label>
                                        <input
                                            type="tel"
                                            required
                                            value={newLead.phone}
                                            onChange={e => setNewLead({ ...newLead, phone: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/50 text-gray-900"
                                            placeholder="+91..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email <span className="text-gray-400 font-normal">(Optional)</span></label>
                                        <input
                                            type="email"
                                            value={newLead.email}
                                            onChange={e => setNewLead({ ...newLead, email: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/50 text-gray-900"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Requirement Overview</label>
                                    <textarea
                                        value={newLead.requirement}
                                        onChange={e => setNewLead({ ...newLead, requirement: e.target.value })}
                                        rows="3"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/50 text-gray-900 resize-none"
                                        placeholder="Looking for 3BHK sea view..."
                                    ></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Next Follow-up Date</label>
                                    <input
                                        type="date"
                                        value={newLead.date}
                                        onChange={e => setNewLead({ ...newLead, date: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/50 text-gray-900"
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                className="px-5 py-2.5 text-gray-600 font-semibold hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="add-lead-form"
                                className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-red-800 transition-colors shadow-sm"
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
