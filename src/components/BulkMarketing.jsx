import React, { useState, useEffect } from 'react';
import { pb } from '../services/pocketbase';
import {
    Send, Plus, Loader2, Check, Shield, Sparkles
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

    const [subTab, setSubTab] = useState('campaigns'); // 'campaigns' or 'templates'
    const [templates, setTemplates] = useState([]);
    const [isTemplatesLoading, setIsTemplatesLoading] = useState(false);
    const [creatingTemplate, setCreatingTemplate] = useState(false);
    const [newTemplateData, setNewTemplateData] = useState({
        name: '',
        category: 'MARKETING',
        language: 'en_US',
        bodyText: ''
    });

    const [aiDraftText, setAiDraftText] = useState('');
    const [isPolishing, setIsPolishing] = useState(false);
    const [polishedVariables, setPolishedVariables] = useState([]);

    const handlePolishWithAI = async () => {
        if (!aiDraftText) return;
        setIsPolishing(true);
        try {
            const res = await fetch('/api/whatsapp/templates/polish-with-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: aiDraftText })
            });
            const data = await res.json();
            if (data.success) {
                setNewTemplateData({
                    name: data.name || '',
                    category: data.category || 'MARKETING',
                    language: 'en_US',
                    bodyText: data.bodyText || ''
                });
                setPolishedVariables(data.variables || []);
                alert("AI template generated successfully! Fields have been autofilled.");
            } else {
                alert("AI Polish failed: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Error polishing template with AI:", error);
            alert("Error: " + error.message);
        } finally {
            setIsPolishing(false);
        }
    };

    const getTemplateBodyText = (tName) => {
        const t = templates.find(temp => temp.name === tName);
        if (!t) return '';
        const bodyComp = t.components?.find(c => c.type === 'BODY');
        return bodyComp ? bodyComp.text : '';
    };

    const getPreviewText = () => {
        if (!creatingCampaign?.templateName) return '';
        let text = getTemplateBodyText(creatingCampaign.templateName);
        if (!text) return '';

        const prop = properties.find(p => p.id === selectedPropertyId);

        creatingCampaign.variables.forEach((variableName, idx) => {
            let replacement = `{{${idx + 1}}}`;
            
            if (variableName === 'name') {
                replacement = 'John Doe (Sample Client)';
            } else if (variableName === 'target_location') {
                replacement = prop ? prop.location : 'Bandra West (Location)';
            } else if (variableName === 'target_bhk') {
                replacement = prop ? prop.bhk : '3BHK (BHK)';
            } else if (variableName === 'price' || variableName === 'target_budget') {
                replacement = prop ? `₹${Number(prop.price).toLocaleString()}` : '₹2.5 Cr (Budget)';
            } else if (variableName) {
                replacement = `[${variableName.toUpperCase()}]`;
            }
            
            text = text.replaceAll(`{{${idx + 1}}}`, replacement);
        });

        return text;
    };

    const [properties, setProperties] = useState([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState('');

    const fetchProperties = async () => {
        if (!currentUser?.id) return;
        try {
            const records = await pb.collection('properties').getFullList({
                filter: `agencyId = "${currentUser.id}"`,
                sort: '-created'
            });
            setProperties(records);
        } catch (error) {
            console.error('Error fetching properties for marketing:', error);
        }
    };

    useEffect(() => {
        if (creatingCampaign) {
            fetchProperties();
            fetchTemplates();
        } else {
            setSelectedPropertyId('');
        }
    }, [creatingCampaign]);

    useEffect(() => {
        if (subTab === 'templates') {
            fetchTemplates();
        } else {
            fetchCampaigns();
        }
    }, [subTab]);

    const fetchTemplates = async () => {
        if (!currentUser?.id) return;
        setIsTemplatesLoading(true);
        try {
            const res = await fetch(`/api/whatsapp/templates?agencyId=${currentUser.id}`);
            const data = await res.json();
            if (data.success) {
                setTemplates(data.items || []);
            } else {
                console.error("Error fetching templates:", data.error);
            }
        } catch (error) {
            console.error("Error fetching templates:", error);
        } finally {
            setIsTemplatesLoading(false);
        }
    };

    const handleDeleteTemplate = async (templateName) => {
        if (!confirm(`Are you sure you want to delete template "${templateName}" from Meta? This action is permanent.`)) return;
        try {
            const res = await fetch(`/api/whatsapp/templates/${templateName}?agencyId=${currentUser.id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                alert("Template deleted successfully!");
                fetchTemplates();
            } else {
                alert("Failed to delete template: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Error deleting template:", error);
            alert("Error: " + error.message);
        }
    };

    const handleCreateTemplate = async (e) => {
        e.preventDefault();
        if (!newTemplateData.name) { alert("Template name is required"); return; }
        if (!/^[a-z0-9_]+$/.test(newTemplateData.name)) { alert("Template name must be lowercase alphanumeric and underscores only"); return; }
        if (!newTemplateData.bodyText) { alert("Template body text is required"); return; }

        setIsSaving(true);
        try {
            const res = await fetch('/api/whatsapp/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agencyId: currentUser.id,
                    name: newTemplateData.name,
                    category: newTemplateData.category,
                    language: newTemplateData.language,
                    components: [
                        {
                            type: 'BODY',
                            text: newTemplateData.bodyText
                        }
                    ]
                })
            });
            const data = await res.json();
            if (data.success) {
                alert("Template submitted to Meta successfully! Status: PENDING");
                setCreatingTemplate(false);
                setNewTemplateData({ name: '', category: 'MARKETING', language: 'en_US', bodyText: '' });
                fetchTemplates();
            } else {
                alert("Failed to submit template: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Error creating template:", error);
            alert("Error: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

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
            {!creatingCampaign && !viewingCampaignDetails && !creatingTemplate && (
                <>
                    {/* Header & Tabs */}
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 border-b border-gray-200 pb-4">
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Bulk Outreach & Templates</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Send bulk campaigns and manage official Meta templates.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="bg-gray-100 p-0.5 rounded-lg flex items-center shrink-0">
                                <button
                                    onClick={() => setSubTab('campaigns')}
                                    className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${subTab === 'campaigns' ? 'bg-white text-gray-950 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                                >
                                    Campaigns
                                </button>
                                <button
                                    onClick={() => setSubTab('templates')}
                                    className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${subTab === 'templates' ? 'bg-white text-gray-950 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                                >
                                    WABA Templates
                                </button>
                            </div>
                            
                            {subTab === 'campaigns' ? (
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
                                    className="btn-dash-primary flex items-center gap-2 text-xs py-1.5 px-3"
                                >
                                    <Plus className="w-4 h-4" /> New Campaign
                                </button>
                            ) : (
                                <button
                                    onClick={() => setCreatingTemplate(true)}
                                    className="btn-dash-primary flex items-center gap-2 text-xs py-1.5 px-3"
                                >
                                    <Plus className="w-4 h-4" /> Submit Template
                                </button>
                            )}
                        </div>
                    </div>

                    {subTab === 'campaigns' && (
                        isCampaignsLoading ? (
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
                                                            Send WhatsApps
                                                        </button>
                                                    )}
                                                    
                                                    <button
                                                        type="button"
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
                        )
                    )}

                    {subTab === 'templates' && (
                        isTemplatesLoading ? (
                            <div className="flex justify-center py-12">
                                <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                            </div>
                        ) : templates.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-150 border-dashed">
                                <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Send className="w-6 h-6 animate-pulse" />
                                </div>
                                <p className="text-sm font-bold text-gray-800">No WABA templates found</p>
                                <p className="text-xs text-gray-500 mt-1">Submit your first template for Meta approval, or check your Meta App Dashboard connection.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {templates.map((tpl) => {
                                    const bodyComp = tpl.components?.find(c => c.type === 'BODY') || {};
                                    const headerComp = tpl.components?.find(c => c.type === 'HEADER') || {};
                                    const footerComp = tpl.components?.find(c => c.type === 'FOOTER') || {};
                                    
                                    return (
                                        <div key={tpl.id || tpl.name} className="bg-white rounded-2xl border border-gray-150 p-5 hover:border-gray-300 transition-all flex flex-col justify-between space-y-4">
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                                        tpl.status === 'APPROVED' ? 'bg-green-50 text-green-700 border border-green-200' :
                                                        tpl.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                                                        'bg-red-50 text-red-700 border border-red-200'
                                                    }`}>
                                                        {tpl.status}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded uppercase font-bold">{tpl.category}</span>
                                                </div>
                                                
                                                <div>
                                                    <h4 className="font-extrabold text-gray-900 text-sm truncate" title={tpl.name}>{tpl.name}</h4>
                                                    <p className="text-[10px] text-gray-400 mt-0.5">Language: {tpl.language}</p>
                                                </div>
                                                
                                                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 border border-gray-100 max-h-32 overflow-y-auto whitespace-pre-wrap font-sans">
                                                    {headerComp.text && <div className="font-bold border-b border-gray-200 pb-1 mb-1.5 text-gray-900 text-[11px]">{headerComp.text}</div>}
                                                    <div>{bodyComp.text || "No body text defined."}</div>
                                                    {footerComp.text && <div className="text-[10px] text-gray-400 mt-1.5 border-t border-gray-100 pt-1">{footerComp.text}</div>}
                                                </div>
                                            </div>

                                            <div className="flex justify-end pt-2 border-t border-gray-100">
                                                <button
                                                    onClick={() => handleDeleteTemplate(tpl.name)}
                                                    className="text-red-500 hover:text-red-700 font-bold text-xs"
                                                >
                                                    Delete Template
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
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
                                
                                {properties.length > 0 && (
                                    <div className="bg-indigo-50/50 rounded-xl border border-indigo-100/60 p-4 space-y-2 max-w-xl">
                                        <label className="dash-label text-xs text-indigo-900 font-bold block mb-1">Quick Autofill from Property Details</label>
                                        <select
                                            onChange={(e) => {
                                                const propId = e.target.value;
                                                setSelectedPropertyId(propId);
                                                if (!propId) return;
                                                const prop = properties.find(p => p.id === propId);
                                                if (prop) {
                                                    const newFilters = {
                                                        ...creatingCampaign.filters,
                                                        location: prop.location || '',
                                                        bhk: prop.bhk || '',
                                                        maxBudget: prop.price || '',
                                                        propertyId: prop.id
                                                    };
                                                    setCreatingCampaign(prev => ({
                                                        ...prev,
                                                        filters: newFilters
                                                    }));
                                                    fetchTargetLeadCount(newFilters);
                                                }
                                            }}
                                            className="dash-input bg-white border-indigo-200 text-gray-700 font-semibold"
                                        >
                                            <option value="">-- Select a Property --</option>
                                            {properties.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.title} ({p.bhk ? `${p.bhk} - ` : ''}{p.location})
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-[10px] text-indigo-500 font-medium">Selecting a property automatically inputs its location, BHK, and price to find matching leads.</p>
                                    </div>
                                )}

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
                                        <label className="dash-label text-xs">WhatsApp Template</label>
                                        {templates.length > 0 ? (
                                            <select
                                                value={creatingCampaign.templateName}
                                                onChange={(e) => {
                                                    const tName = e.target.value;
                                                    const t = templates.find(temp => temp.name === tName);
                                                    setCreatingCampaign(prev => ({
                                                        ...prev,
                                                        templateName: tName,
                                                        templateLanguage: t ? t.language : 'en_US'
                                                    }));
                                                }}
                                                className="dash-input text-gray-700 font-semibold"
                                                required
                                            >
                                                <option value="">-- Select a WABA Template --</option>
                                                {templates.map(t => (
                                                    <option key={t.name} value={t.name}>
                                                        {t.name} ({t.status} - {t.category})
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                value={creatingCampaign.templateName}
                                                onChange={(e) => setCreatingCampaign({ ...creatingCampaign, templateName: e.target.value })}
                                                placeholder="e.g. property_outreach_alert"
                                                className="dash-input"
                                                required
                                            />
                                        )}
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
                                        {['name', 'target_location', 'target_bhk', 'property_title', 'property_location', 'property_bhk', 'property_price', 'property_type', 'property_listing_type', 'property_link'].map(tag => (
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

                            {/* WhatsApp Message Live Preview */}
                            {creatingCampaign.templateName && (
                                <div className="border-t border-gray-100 pt-4 space-y-3">
                                    <h4 className="font-extrabold text-gray-800 text-sm">4. WhatsApp Message Preview</h4>
                                    <p className="text-xs text-gray-500">Live preview of how the template message will look to matching leads.</p>
                                    
                                    <div className="flex justify-center p-4 bg-gray-50 rounded-2xl border border-gray-150 shadow-inner">
                                        {/* WhatsApp Message Bubble Container */}
                                        <div className="w-full max-w-sm rounded-xl overflow-hidden shadow-sm border border-[#e1f3d4] bg-[#efeae2]">
                                            {/* Header */}
                                            <div className="bg-[#075e54] px-4 py-2 text-white flex items-center gap-2">
                                                <div className="w-7 h-7 bg-teal-800 rounded-full flex items-center justify-center font-bold text-xs shadow-inner">
                                                    RR
                                                </div>
                                                <div>
                                                    <div className="text-[11px] font-extrabold leading-none">Rajesh Realty Outreach</div>
                                                    <span className="text-[8px] text-teal-200">typing...</span>
                                                </div>
                                            </div>
                                            
                                            {/* Chat Area */}
                                            <div className="p-3 space-y-2 relative min-h-[100px] flex flex-col justify-end">
                                                {/* Message Bubble */}
                                                <div className="self-start max-w-[85%] bg-[#d9fdd3] text-gray-800 p-2.5 rounded-lg rounded-tl-none shadow-sm text-xs leading-relaxed relative border border-[#c1ebd0] whitespace-pre-wrap font-sans">
                                                    {getPreviewText() || (
                                                        <span className="italic text-gray-400">Select a template and map variables to view message preview.</span>
                                                    )}
                                                    <div className="text-[8px] text-gray-400 text-right mt-1 font-mono">
                                                        12:00 PM
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
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

            {creatingTemplate && (
                <>
                    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-155">
                        <button
                            type="button"
                            onClick={() => setCreatingTemplate(false)}
                            className="text-xs font-bold text-gray-500 hover:text-gray-800"
                        >
                            &larr; Back to Templates
                        </button>
                        <h3 className="font-bold text-gray-900 text-lg">Submit Message Template to Meta</h3>
                    </div>
                    <form onSubmit={handleCreateTemplate} className="space-y-5">
                        <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                            {/* AI Assistant Writer */}
                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-4 space-y-3.5 mb-2">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                                    <div>
                                        <h4 className="font-extrabold text-indigo-900 text-sm">AI Template Designer</h4>
                                        <p className="text-[10px] text-indigo-500 font-medium">Describe your message draft in plain text and let AI format it perfectly.</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <textarea
                                        value={aiDraftText}
                                        onChange={(e) => setAiDraftText(e.target.value)}
                                        rows={3}
                                        className="w-full px-3.5 py-2 bg-white border border-indigo-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-sans leading-relaxed text-gray-700 shadow-inner"
                                        placeholder="e.g. Write a welcome outreach message greeting the client by name. Ask if they want a 3bhk in Mumbai. Sign off with Rajesh Realty."
                                    />
                                    
                                    <div className="flex justify-between items-center gap-2">
                                        <span className="text-[9px] text-indigo-400 font-semibold italic">Auto-generates compliant format (no trailing/leading variables)</span>
                                        <button
                                            type="button"
                                            onClick={handlePolishWithAI}
                                            disabled={isPolishing || !aiDraftText}
                                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0"
                                        >
                                            {isPolishing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                            Write & Format with AI
                                        </button>
                                    </div>
                                </div>
                                
                                {polishedVariables.length > 0 && (
                                    <div className="bg-white/80 rounded-lg p-3 text-xs text-gray-700 border border-indigo-50 space-y-1.5">
                                        <span className="font-bold text-indigo-900 text-[10px] uppercase tracking-wider block">Identified Variables:</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {polishedVariables.map((v, idx) => (
                                                <span key={idx} className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md font-medium text-[10px]" title={v}>
                                                    {`{{${idx + 1}}}`}: {v}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="dash-label text-xs">Template Name</label>
                                <input
                                    type="text"
                                    value={newTemplateData.name}
                                    onChange={(e) => setNewTemplateData(prev => ({ ...prev, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                                    className="dash-input font-mono"
                                    placeholder="e.g. lead_followup_message"
                                    required
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Lowercase letters, numbers, and underscores only.</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="dash-label text-xs">Category</label>
                                    <select
                                        value={newTemplateData.category}
                                        onChange={(e) => setNewTemplateData(prev => ({ ...prev, category: e.target.value }))}
                                        className="dash-input"
                                    >
                                        <option value="MARKETING">Marketing (Offers, updates)</option>
                                        <option value="UTILITY">Utility (Reminders, followups)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="dash-label text-xs">Language</label>
                                    <select
                                        value={newTemplateData.language}
                                        onChange={(e) => setNewTemplateData(prev => ({ ...prev, language: e.target.value }))}
                                        className="dash-input"
                                    >
                                        <option value="en_US">English (US)</option>
                                        <option value="es_ES">Spanish</option>
                                        <option value="hi_IN">Hindi</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div>
                                <label className="dash-label text-xs">Body Text</label>
                                <textarea
                                    value={newTemplateData.bodyText}
                                    onChange={(e) => setNewTemplateData(prev => ({ ...prev, bodyText: e.target.value }))}
                                    rows={6}
                                    className="dash-input leading-relaxed"
                                    placeholder={`Hello {{1}},\n\nThanks for showing interest in our properties. We have some great matches for you!\n\nBest regards,\n{{2}}`}
                                    required
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Use {"{{1}}"}, {"{{2}}"} for dynamic variables (e.g. {"{{1}}"} for recipient name).</p>
                            </div>
                            
                            <div className="bg-teal-50 border border-teal-100 p-3.5 rounded-xl flex gap-2 text-xs text-teal-800">
                                <Shield className="w-4 h-4 shrink-0" />
                                <div>
                                    <span className="font-bold">Meta Template Approval Guidelines:</span> Make sure your template name contains no capital letters or spaces. Submissions are reviewed and approved automatically by Meta within a few hours.
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setCreatingTemplate(false)}
                                className="btn-dash-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="btn-dash-teal"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
                                Submit to Meta
                            </button>
                        </div>
                    </form>
                </>
            )}
        </div>
    );
};

export default BulkMarketing;
