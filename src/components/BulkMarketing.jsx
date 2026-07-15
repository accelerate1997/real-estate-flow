import React, { useState, useEffect } from 'react';
import { pb } from '../services/pocketbase';
import {
    Send, Plus, Loader2, Check, Shield
} from 'lucide-react';

const BulkMarketing = () => {
    const currentUser = pb.authStore.model;

    const [campaigns, setCampaigns] = useState([]);
    const [isCampaignsLoading, setIsCampaignsLoading] = useState(false);
    const [creatingCampaign, setCreatingCampaign] = useState(null);
    const [targetLeadCount, setTargetLeadCount] = useState(0);
    const [viewingCampaignDetails, setViewingCampaignDetails] = useState(null);
    const [recipients, setRecipients] = useState([]);
    const [isRecipientsLoading, setIsRecipientsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        if (!currentUser?.id) return;
        setIsCampaignsLoading(true);
        try {
            const res = await fetch(`/api/campaigns?agencyId=${currentUser.id}`);
            const data = await res.json();
            if (data.success) {
                setCampaigns(data.items || []);
            }
        } catch (error) {
            console.error("Error fetching campaigns:", error);
        } finally {
            setIsCampaignsLoading(false);
        }
    };

    const fetchTargetLeadCount = async (filters) => {
        if (!currentUser?.id) return;
        try {
            const res = await fetch('/api/campaigns/target-count', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agencyId: currentUser.id, filters })
            });
            const data = await res.json();
            if (data.success) {
                setTargetLeadCount(data.count);
            }
        } catch (error) {
            console.error("Error fetching target lead count:", error);
        }
    };

    const handleCreateCampaign = async (e) => {
        e.preventDefault();
        if (!creatingCampaign.name) { alert("Campaign name is required"); return; }
        if (!creatingCampaign.templateName) { alert("Template name is required"); return; }
        
        setIsSaving(true);
        try {
            const res = await fetch('/api/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agencyId: currentUser.id,
                    name: creatingCampaign.name,
                    templateName: creatingCampaign.templateName,
                    templateLanguage: creatingCampaign.templateLanguage || 'en_US',
                    variables: creatingCampaign.variables || [],
                    filters: creatingCampaign.filters || {}
                })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Campaign created successfully with ${data.totalRecipients} target recipients!`);
                setCreatingCampaign(null);
                fetchCampaigns();
            } else {
                alert("Failed to create campaign: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Error creating campaign:", error);
            alert("Error creating campaign: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSendCampaign = async (campaignId) => {
        try {
            const res = await fetch(`/api/campaigns/${campaignId}/send`, {
                method: 'POST'
            });
            const data = await res.json();
            if (data.success) {
                alert("Campaign dispatch started in background!");
                fetchCampaigns();
            } else {
                alert("Failed to send campaign: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Error sending campaign:", error);
            alert("Error: " + error.message);
        }
    };

    const fetchCampaignRecipients = async (campaignId) => {
        setIsRecipientsLoading(true);
        try {
            const res = await fetch(`/api/campaigns/${campaignId}/recipients`);
            const data = await res.json();
            if (data.success) {
                setRecipients(data.items || []);
            }
        } catch (error) {
            console.error("Error fetching recipients:", error);
        } finally {
            setIsRecipientsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-155 p-6">
            {!creatingCampaign && !viewingCampaignDetails && (
                <>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Marketing Campaigns</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Send bulk WhatsApp template alerts to filtered leads.</p>
                        </div>
                        <button
                            onClick={() => {
                                const initCamp = {
                                    name: '',
                                    templateName: '',
                                    templateLanguage: 'en_US',
                                    variables: ['name'],
                                    filters: { location: '', bhk: '', maxBudget: '' }
                                };
                                setCreatingCampaign(initCamp);
                                fetchTargetLeadCount(initCamp.filters);
                            }}
                            className="btn-dash-primary flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> New Campaign
                        </button>
                    </div>

                    {isCampaignsLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                        </div>
                    ) : campaigns.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-150 border-dashed">
                            <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Send className="w-6 h-6 animate-pulse" />
                            </div>
                            <p className="text-sm font-bold text-gray-800">No campaigns launched yet</p>
                            <p className="text-xs text-gray-500 mt-1">Create your first WhatsApp outreach campaign to connect with matching leads in bulk.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {campaigns.map((camp) => {
                                const total = parseInt(camp.total_recipients) || 0;
                                const sent = parseInt(camp.sent_count) || 0;
                                const deliv = parseInt(camp.delivered_count) || 0;
                                const read = parseInt(camp.read_count) || 0;
                                const fail = parseInt(camp.failed_count) || 0;
                                
                                const progressPercent = total > 0 ? Math.round(((sent + deliv + read + fail) / total) * 100) : 0;
                                const openPercent = (sent + deliv + read) > 0 ? Math.round((read / (sent + deliv + read)) * 100) : 0;

                                return (
                                    <div key={camp.id} className="bg-white rounded-2xl border border-gray-150 shadow-sm p-5 hover:border-gray-300 transition-all space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div>
                                                <h4 className="font-extrabold text-gray-900 text-base">{camp.name}</h4>
                                                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-500">
                                                    <span className="bg-gray-100 px-2 py-0.5 rounded font-mono">Template: {camp.template_name}</span>
                                                    <span>•</span>
                                                    <span>Created: {new Date(camp.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                                                    camp.status === 'completed' ? 'bg-green-50 text-green-700 border border-green-200' :
                                                    camp.status === 'sending' ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse' :
                                                    camp.status === 'failed' ? 'bg-red-50 text-red-700 border border-red-200' :
                                                    'bg-gray-50 text-gray-700 border border-gray-200'
                                                }`}>
                                                    {camp.status}
                                                </span>
                                                
                                                {camp.status === 'draft' && (
                                                    <button
                                                        onClick={() => handleSendCampaign(camp.id)}
                                                        className="btn-dash-teal text-xs py-1 px-3"
                                                    >
                                                        Launch
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setViewingCampaignDetails(camp);
                                                        fetchCampaignRecipients(camp.id);
                                                    }}
                                                    className="text-xs font-bold text-primary hover:text-primary-dark px-2 py-1"
                                                >
                                                    Monitor Logs
                                                </button>
                                            </div>
                                        </div>

                                        {/* Stats badges */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl">
                                            <div className="text-center">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Recipients</span>
                                                <span className="text-lg font-extrabold text-gray-800">{total}</span>
                                            </div>
                                            <div className="text-center border-l border-gray-200">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Sent / Deliv</span>
                                                <span className="text-lg font-extrabold text-gray-800">{sent + deliv}</span>
                                            </div>
                                            <div className="text-center border-l border-gray-200">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Read (Open %)</span>
                                                <span className="text-lg font-extrabold text-green-600">{read} <span className="text-xs font-normal">({openPercent}%)</span></span>
                                            </div>
                                            <div className="text-center border-l border-gray-200">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Failed</span>
                                                <span className={`text-lg font-extrabold ${fail > 0 ? 'text-red-500' : 'text-gray-800'}`}>{fail}</span>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs text-gray-500 font-medium">
                                                <span>Outreach Progress</span>
                                                <span>{progressPercent}% Sent</span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-150 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-accent-teal transition-all duration-500"
                                                    style={{ width: `${progressPercent}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {creatingCampaign && (
                <>
                    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-150">
                        <button
                            type="button"
                            onClick={() => setCreatingCampaign(null)}
                            className="text-xs font-bold text-gray-500 hover:text-gray-800"
                        >
                            &larr; Back to History
                        </button>
                        <h3 className="font-bold text-gray-900 text-lg">Create WhatsApp Campaign</h3>
                    </div>

                    <form onSubmit={handleCreateCampaign} className="space-y-5">
                        <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                            {/* Campaign name */}
                            <div>
                                <label className="dash-label">Campaign Name</label>
                                <input
                                    type="text"
                                    value={creatingCampaign.name}
                                    onChange={(e) => setCreatingCampaign({ ...creatingCampaign, name: e.target.value })}
                                    placeholder="e.g. Bandra BHK Alert July"
                                    className="dash-input max-w-md"
                                    required
                                />
                            </div>

                            {/* Target filters */}
                            <div className="border-t border-gray-100 pt-4 space-y-3">
                                <h4 className="font-extrabold text-gray-800 text-sm">1. Target Audience Filters</h4>
                                <p className="text-xs text-gray-500">Filter leads to target specific requirements. Leave empty or choose 'any' to select all.</p>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="dash-label text-xs">Target Location</label>
                                        <input
                                            type="text"
                                            value={creatingCampaign.filters.location}
                                            onChange={(e) => {
                                                const newFilters = { ...creatingCampaign.filters, location: e.target.value };
                                                setCreatingCampaign({ ...creatingCampaign, filters: newFilters });
                                                fetchTargetLeadCount(newFilters);
                                            }}
                                            placeholder="e.g. Bandra West"
                                            className="dash-input"
                                        />
                                    </div>
                                    <div>
                                        <label className="dash-label text-xs">Target BHK</label>
                                        <input
                                            type="text"
                                            value={creatingCampaign.filters.bhk}
                                            onChange={(e) => {
                                                const newFilters = { ...creatingCampaign.filters, bhk: e.target.value };
                                                setCreatingCampaign({ ...creatingCampaign, filters: newFilters });
                                                fetchTargetLeadCount(newFilters);
                                            }}
                                            placeholder="e.g. 3BHK"
                                            className="dash-input"
                                        />
                                    </div>
                                    <div>
                                        <label className="dash-label text-xs">Max Budget Limit (₹)</label>
                                        <input
                                            type="number"
                                            value={creatingCampaign.filters.maxBudget}
                                            onChange={(e) => {
                                                const newFilters = { ...creatingCampaign.filters, maxBudget: e.target.value };
                                                setCreatingCampaign({ ...creatingCampaign, filters: newFilters });
                                                fetchTargetLeadCount(newFilters);
                                            }}
                                            placeholder="e.g. 25000000"
                                            className="dash-input"
                                        />
                                    </div>
                                </div>

                                <div className="bg-teal-50 border border-teal-100 p-3.5 rounded-xl flex items-center justify-between">
                                    <span className="text-xs text-teal-800 font-bold">Matching Audience Size:</span>
                                    <span className="text-sm font-extrabold text-teal-900 bg-teal-100 px-3 py-1 rounded-full border border-teal-200">
                                        {targetLeadCount} Leads
                                    </span>
                                </div>
                            </div>

                            {/* Template details */}
                            <div className="border-t border-gray-100 pt-4 space-y-3">
                                <h4 className="font-extrabold text-gray-800 text-sm">2. Meta Template Details</h4>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="dash-label text-xs">WhatsApp Template Name</label>
                                        <input
                                            type="text"
                                            value={creatingCampaign.templateName}
                                            onChange={(e) => setCreatingCampaign({ ...creatingCampaign, templateName: e.target.value })}
                                            placeholder="e.g. property_outreach_alert"
                                            className="dash-input"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="dash-label text-xs">Template Language Code</label>
                                        <input
                                            type="text"
                                            value={creatingCampaign.templateLanguage}
                                            onChange={(e) => setCreatingCampaign({ ...creatingCampaign, templateLanguage: e.target.value })}
                                            placeholder="en_US"
                                            className="dash-input"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Variables mapping */}
                            <div className="border-t border-gray-100 pt-4 space-y-3">
                                <h4 className="font-extrabold text-gray-800 text-sm">3. Dynamic Variables Mapping</h4>
                                <p className="text-xs text-gray-500">
                                    Map dynamic variables for your template. Separate them by comma in sequence order (e.g. <code>name, target_location</code> for <code>{"{{1}}"}</code> and <code>{"{{2}}"}</code>).
                                </p>
                                <div>
                                    <label className="dash-label text-xs">Dynamic Parameters List</label>
                                    <input
                                        type="text"
                                        value={creatingCampaign.variables.join(', ')}
                                        onChange={(e) => setCreatingCampaign({ ...creatingCampaign, variables: e.target.value.split(',').map(s => s.trim()) })}
                                        placeholder="e.g. name, target_location"
                                        className="dash-input"
                                    />
                                    <div className="flex gap-2 mt-2 flex-wrap">
                                        <span className="text-[10px] text-gray-500">Suggested tags:</span>
                                        {['name', 'target_location', 'target_bhk'].map(tag => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => {
                                                    const currentVars = creatingCampaign.variables.filter(v => v !== '');
                                                    if (!currentVars.includes(tag)) {
                                                        setCreatingCampaign({ ...creatingCampaign, variables: [...currentVars, tag] });
                                                    }
                                                }}
                                                className="text-[9px] bg-gray-150 hover:bg-gray-200 px-2 py-0.5 rounded text-gray-700 font-bold"
                                            >
                                                +{tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setCreatingCampaign(null)}
                                className="btn-dash-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving || targetLeadCount === 0}
                                className="btn-dash-teal disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Create & Stage Campaign'}
                            </button>
                        </div>
                    </form>
                </>
            )}

            {viewingCampaignDetails && (
                <>
                    <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-150">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setViewingCampaignDetails(null)}
                                className="text-xs font-bold text-gray-500 hover:text-gray-800"
                            >
                                &larr; Back to Campaigns
                            </button>
                            <h3 className="font-bold text-gray-900 text-lg">Campaign Monitor: {viewingCampaignDetails.name}</h3>
                        </div>
                        <button
                            type="button"
                            onClick={() => fetchCampaignRecipients(viewingCampaignDetails.id)}
                            className="text-xs font-bold text-primary hover:underline"
                        >
                            Refresh Logs
                        </button>
                    </div>

                    {isRecipientsLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                        </div>
                    ) : recipients.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-12">No recipients loaded for this campaign.</p>
                    ) : (
                        <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-150 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                                            <th className="p-4">Recipient Name</th>
                                            <th className="p-4">Phone Number</th>
                                            <th className="p-4">Outreach Status</th>
                                            <th className="p-4">Message ID / Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {recipients.map((recip) => (
                                            <tr key={recip.id} className="hover:bg-gray-50/50">
                                                <td className="p-4 font-bold text-gray-900">{recip.lead_name || 'WhatsApp Contact'}</td>
                                                <td className="p-4 text-gray-600 font-mono">{recip.phone}</td>
                                                <td className="p-4">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                                        recip.status === 'read' ? 'bg-green-100 text-green-800' :
                                                        recip.status === 'delivered' ? 'bg-blue-100 text-blue-800' :
                                                        recip.status === 'sent' ? 'bg-teal-100 text-teal-800' :
                                                        recip.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {recip.status}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    {recip.status === 'failed' ? (
                                                        <span className="text-xs text-red-500 font-medium">{recip.error_message || 'Unknown API failure'}</span>
                                                    ) : (
                                                        <span className="text-[10px] text-gray-400 font-mono block truncate max-w-[200px]" title={recip.meta_message_id}>
                                                            {recip.meta_message_id || 'Pending send...'}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default BulkMarketing;
