import React, { useState, useEffect } from 'react';
import {
    Save, Building, Bell, Shield, CreditCard, ChevronRight, MessageSquare,
    Check, Loader2, BrainCircuit, Key, Plus, Trash2, Clock, Edit2, Lock, Globe, Activity, Palette
} from 'lucide-react';
import { pb } from '../services/pocketbase';
import TemplatePicker from './TemplatePicker';

const AgencySettings = () => {
    const [activeSection, setActiveSection] = useState('profile');
    const [isSaving, setIsSaving] = useState(false);

    // Facebook SDK State
    const [fbSdkInitialized, setFbSdkInitialized] = useState(false);
    const [fbPages, setFbPages] = useState([]);
    const [fbIsLoadingPages, setFbIsLoadingPages] = useState(false);
    const [fbError, setFbError] = useState('');

    useEffect(() => {
        // Initialize Facebook SDK asynchronously
        window.fbAsyncInit = function() {
            window.FB.init({
                appId      : import.meta.env.VITE_FACEBOOK_APP_ID || '123456789012345',
                cookie     : true,
                xfbml      : true,
                version    : 'v18.0'
            });
            setFbSdkInitialized(true);
        };

        // Load Facebook SDK script tag if not present
        if (!document.getElementById('facebook-jssdk')) {
            (function(d, s, id) {
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) return;
                js = d.createElement(s); js.id = id;
                js.src = "https://connect.facebook.net/en_US/sdk.js";
                fjs.parentNode.insertBefore(js, fjs);
            }(document, 'script', 'facebook-jssdk'));
        } else {
            if (window.FB) setFbSdkInitialized(true);
        }
    }, []);

    const handleFacebookLogin = () => {
        setFbError('');
        if (!window.FB) {
            setFbError('Facebook SDK not loaded. Please try disabling your adblocker.');
            return;
        }
        setFbIsLoadingPages(true);
        window.FB.login((response) => {
            if (response.authResponse) {
                const userToken = response.authResponse.accessToken;
                // Get page access tokens and lists
                window.FB.api('/me/accounts', { access_token: userToken }, (res) => {
                    setFbIsLoadingPages(false);
                    if (res && !res.error) {
                        setFbPages(res.data || []);
                        if (res.data?.length === 0) {
                            setFbError('No Facebook Pages were returned. Make sure your account manages at least one Page.');
                        }
                    } else {
                        console.error('FB Accounts API error:', res.error);
                        setFbError(res.error?.message || 'Failed to fetch Facebook Pages.');
                    }
                });
            } else {
                setFbIsLoadingPages(false);
                setFbError('Facebook Login cancelled or permissions rejected.');
            }
        }, {
            scope: 'pages_show_list,leads_retrieval,pages_read_engagement,pages_manage_ads',
            return_scopes: true
        });
    };
    const [qrCode, setQrCode] = useState(null);
    const [waConnectionStatus, setWaConnectionStatus] = useState('idle');
    const [waError, setWaError] = useState('');
    const [waVerifiedName, setWaVerifiedName] = useState('');
    const [sequences, setSequences] = useState([]);
    const [isSequencesLoading, setIsSequencesLoading] = useState(false);
    const [editingSequence, setEditingSequence] = useState(null);

    // Integrations State
    const [integrations, setIntegrations] = useState([]);
    const [isIntegrationsLoading, setIsIntegrationsLoading] = useState(false);
    const [showConfigPortal, setShowConfigPortal] = useState(null); // 'magicbricks' | '99acres' | 'housing' | 'nobroker' | null
    const [integrationFormData, setIntegrationFormData] = useState({
        apiKey: '',
        agentId: '',
        username: '',
        password: ''
    });
    const [isSavingIntegration, setIsSavingIntegration] = useState(false);
    const [simulatingPortal, setSimulatingPortal] = useState(null);
    const [simulationData, setSimulationData] = useState({
        name: 'John Doe',
        phone: '9876543210',
        requirement: 'Looking for 3BHK flat',
        location: 'Bandra West',
        budget: '25000000'
    });

    const currentUser = pb.authStore.model;

    const [agencyData, setAgencyData] = useState({
        agencyName: currentUser?.agencyName || 'RR Real Estate',
        email: currentUser?.email || '',
        phone: currentUser?.phone || '',
        address: '123 Business Avenue, Andheri West, Mumbai',
        notificationsEnabled: true,
        geminiKey: currentUser?.geminiKey || '',
        agentEnabled: currentUser?.agentEnabled ?? true,
        whatsappToken: currentUser?.metadata?.whatsappToken || '',
        whatsappPhoneNumberId: currentUser?.metadata?.whatsappPhoneNumberId || '',
        whatsappBusinessAccountId: currentUser?.metadata?.whatsappBusinessAccountId || '',
        googleTagId: currentUser?.metadata?.googleTagId || '',
        metaPixelId: currentUser?.metadata?.metaPixelId || '',
        subdomain: currentUser?.subdomain || '',
        customDomain: currentUser?.customDomain || '',
        templateId: currentUser?.templateId || 'classic',
        primaryColor: currentUser?.primaryColor || '#DC2626',
        secondaryColor: currentUser?.secondaryColor || '#1E293B'
    });

    const fetchWhatsAppStatus = async () => {
        if (!currentUser?.id) return;
        setWaConnectionStatus('loading');
        try {
            const res = await fetch(`/api/whatsapp/status?agencyId=${currentUser.id}`);
            const data = await res.json();
            if (data.success && data.connected) {
                setWaConnectionStatus('connected');
                setWaVerifiedName(data.verifiedName || '');
                setWaError('');
            } else {
                setWaConnectionStatus('idle');
                if (data.error) setWaError(data.error);
            }
        } catch (error) {
            console.error("Error fetching WhatsApp status:", error);
            setWaConnectionStatus('idle');
        }
    };

const fetchSequences = async () => {
        if (!currentUser?.id) return;
        setIsSequencesLoading(true);
        try {
            const records = await pb.collection('sequences').getFullList({
                filter: `agency_id = "${currentUser.id}"`,
                sort: '-created'
            });
            setSequences(records);
        } catch (error) {
            console.error("Error fetching sequences:", error);
        } finally {
            setIsSequencesLoading(false);
        }
    };

    // Fetch portal integrations
    const fetchIntegrations = async () => {
        if (!currentUser?.id) return;
        setIsIntegrationsLoading(true);
        try {
            const res = await fetch(`/api/integrations/${currentUser.id}`);
            const data = await res.json();
            if (data.success) {
                setIntegrations(data.items || []);
            }
        } catch (error) {
            console.error("Error fetching integrations:", error);
        } finally {
            setIsIntegrationsLoading(false);
        }
    };

    const handleSaveIntegration = async (e) => {
        e.preventDefault();
        if (!showConfigPortal) return;
        setIsSavingIntegration(true);
        try {
            const res = await fetch('/api/integrations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agencyId: currentUser.id,
                    portal: showConfigPortal,
                    apiKey: integrationFormData.apiKey,
                    agentId: integrationFormData.agentId,
                    username: integrationFormData.username,
                    password: integrationFormData.password
                })
            });
            const data = await res.json();
            if (data.success) {
                alert(`${showConfigPortal.toUpperCase()} integration updated successfully!`);
                setShowConfigPortal(null);
                fetchIntegrations();
            } else {
                alert("Failed to save integration: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            console.error(error);
            alert("Error communicating with integration server.");
        } finally {
            setIsSavingIntegration(false);
        }
    };

    const handleDisconnectIntegration = async (portal) => {
        if (!window.confirm(`Are you sure you want to disconnect ${portal.toUpperCase()} integration?`)) return;
        try {
            const res = await fetch(`/api/integrations/${currentUser.id}/${portal}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                alert(`${portal.toUpperCase()} integration disconnected.`);
                fetchIntegrations();
            } else {
                alert("Failed to disconnect: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            console.error(error);
            alert("Error disconnecting integration.");
        }
    };

    const handleSimulateLead = async (portal) => {
        if (!currentUser?.id) return;
        try {
            const res = await fetch('/api/integrations/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    portal,
                    agencyId: currentUser.id,
                    name: simulationData.name,
                    phone: simulationData.phone,
                    requirement: simulationData.requirement,
                    location: simulationData.location,
                    budget: simulationData.budget
                })
            });
            const data = await res.json();
            if (data.success) {
                alert(`🎉 Webhook test successful!\nLead: ${simulationData.name}\nRequirement: ${simulationData.requirement}\nMatched Properties will update in Matches tab.`);
                setSimulatingPortal(null);
            } else {
                alert("Webhook test failed: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            console.error(error);
            alert("Error simulating webhook lead.");
        }
    };

    React.useEffect(() => {
        if (activeSection === 'sequences') {
            fetchSequences();
        } else if (activeSection === 'integrations') {
            fetchIntegrations();
        } else if (activeSection === 'whatsapp') {
            fetchWhatsAppStatus();
        }
    }, [activeSection]);

    const handleSaveSequence = async (e) => {
        e.preventDefault();
        if (!editingSequence.name) { alert("Sequence name is required"); return; }
        setIsSaving(true);
        try {
            const data = { ...editingSequence, agency_id: currentUser.id };
            if (editingSequence.id) {
                await pb.collection('sequences').update(editingSequence.id, data);
            } else {
                await pb.collection('sequences').create(data);
            }
            setEditingSequence(null);
            fetchSequences();
            alert("Sequence saved!");
        } catch (error) {
            console.error("Error saving sequence:", error.message);
            alert("Failed to save sequence. Ensure 'sequences' collection exists.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteSequence = async (id) => {
        if (!window.confirm("Are you sure you want to delete this sequence?")) return;
        try {
            await pb.collection('sequences').delete(id);
            fetchSequences();
        } catch (error) {
            console.error("Error deleting sequence:", error);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (currentUser?.id) {
                await pb.collection('users').update(currentUser.id, {
                    agencyName: agencyData.agencyName,
                    phone: agencyData.phone,
                    geminiKey: agencyData.geminiKey,
                    agentEnabled: agencyData.agentEnabled,
                    subdomain: agencyData.subdomain || null,
                    customDomain: agencyData.customDomain || null,
                    templateId: agencyData.templateId || 'classic',
                    primaryColor: agencyData.primaryColor || '#DC2626',
                    secondaryColor: agencyData.secondaryColor || '#1E293B',
                    metadata: {
                        ...currentUser.metadata,
                        whatsappToken: agencyData.whatsappToken,
                        whatsappPhoneNumberId: agencyData.whatsappPhoneNumberId,
                        whatsappBusinessAccountId: agencyData.whatsappBusinessAccountId,
                        googleTagId: agencyData.googleTagId,
                        metaPixelId: agencyData.metaPixelId
                    }
                });
                await pb.collection('users').authRefresh();
                alert("Settings saved successfully!");
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Failed to save settings. Make sure the database fields exist.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleConnectWhatsApp = async () => {
        if (!agencyData.phone) { alert("Please enter a WhatsApp number first."); return; }
        if (!agencyData.whatsappToken) { alert("Please enter a Meta Access Token first."); return; }
        if (!agencyData.whatsappPhoneNumberId) { alert("Please enter a WhatsApp Phone Number ID first."); return; }
        
        setWaConnectionStatus('loading');
        setWaError('');
        setWaVerifiedName('');
        try {
            const res = await fetch('/api/whatsapp/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    agencyId: currentUser?.id, 
                    phoneNumber: agencyData.phone,
                    whatsappToken: agencyData.whatsappToken,
                    whatsappPhoneNumberId: agencyData.whatsappPhoneNumberId,
                    whatsappBusinessAccountId: agencyData.whatsappBusinessAccountId
                })
            });
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || `HTTP Error ${res.status}`);
            }
            const data = await res.json();
            if (data.success && data.connected) {
                setWaConnectionStatus('connected');
                setWaVerifiedName(data.verifiedName || '');
                // Save settings in PocketBase as well!
                if (currentUser?.id) {
                    await pb.collection('users').update(currentUser.id, {
                        phone: agencyData.phone,
                        metadata: {
                            ...currentUser.metadata,
                            whatsappToken: agencyData.whatsappToken,
                            whatsappPhoneNumberId: agencyData.whatsappPhoneNumberId,
                            whatsappBusinessAccountId: agencyData.whatsappBusinessAccountId,
                            googleTagId: agencyData.googleTagId,
                            metaPixelId: agencyData.metaPixelId
                        }
                    });
                    await pb.collection('users').authRefresh();
                }
                alert("WhatsApp API connected and saved successfully!");
            } else {
                const errMsg = data.error || "Verification failed";
                setWaError(errMsg);
                alert("Failed to connect WhatsApp: " + errMsg);
                setWaConnectionStatus('idle');
            }
        } catch (error) {
            console.error(error);
            setWaError(error.message);
            alert("Error connecting to server: " + error.message);
            setWaConnectionStatus('idle');
        }
    };

    const sections = [
        { id: 'profile',       name: 'Agency Profile',       icon: Building,      description: 'Manage your agency details and public information.' },
        { id: 'whatsapp',      name: 'Connect WhatsApp',     icon: MessageSquare, description: 'Connect your agency WhatsApp number to assign the AI Agent.' },
        { id: 'brain',         name: 'Brain Keys',           icon: BrainCircuit,  description: 'Configure your custom LLM API keys to power your AI Agent.' },
        { id: 'tracking',      name: 'Tracking & Pixels',    icon: Activity,      description: 'Configure Google Tags and Meta Pixels to track visits and run remarketing.' },
        { id: 'showcase',      name: 'Showcase Portal',      icon: Globe,         description: 'Configure your white-label public website template, colors, and domains.' },
        { id: 'integrations',  name: 'Portal Integrations',  icon: Plus,          description: 'Connect third-party real estate portals like Magicbricks, 99acres, etc.' },
        { id: 'security',      name: 'Security & Access',    icon: Shield,        description: 'Manage passwords and two-factor authentication.' },
        { id: 'billing',       name: 'Billing & Plan',       icon: CreditCard,    description: 'Manage your subscription and payment methods.' },
        { id: 'sequences',     name: 'Follow-up Sequences',  icon: MessageSquare, description: 'Design automated WhatsApp follow-up messages for your leads.' },
        { id: 'notifications', name: 'Notifications',        icon: Bell,          description: 'Configure how you receive alerts and lead updates.' },
    ];

    const activeSection_ = sections.find(s => s.id === activeSection);

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Settings Sidebar Nav */}
            <div className="w-full lg:w-60 shrink-0">
                <nav className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible whitespace-nowrap scrollbar-none">
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`settings-nav-item shrink-0 w-auto lg:w-full ${activeSection === section.id ? 'settings-nav-item-active' : ''}`}
                        >
                            <section.icon className={`w-4 h-4 shrink-0 ${activeSection === section.id ? 'text-primary' : 'text-gray-400'}`} />
                            <span className="text-left">{section.name}</span>
                            <ChevronRight className={`hidden lg:block w-3.5 h-3.5 ml-auto transition-all ${activeSection === section.id ? 'text-primary opacity-100 translate-x-0.5' : 'opacity-0'}`} />
                        </button>
                    ))}
                </nav>
            </div>

            {/* Settings Content */}
            <div className="flex-1 min-w-0">
                <div className="dash-panel">
                    {/* Section Header */}
                    <div className="mb-7 pb-5 border-b border-gray-100 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            {activeSection_ && <activeSection_.icon className="w-5 h-5 text-primary" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-display font-bold text-gray-900">{activeSection_?.name}</h2>
                            <p className="text-sm text-gray-500 mt-0.5">{activeSection_?.description}</p>
                        </div>
                    </div>

                    {/* Profile */}
                    {activeSection === 'profile' && (
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="dash-label">Agency Name</label>
                                    <input
                                        type="text"
                                        value={agencyData.agencyName}
                                        onChange={(e) => setAgencyData({ ...agencyData, agencyName: e.target.value })}
                                        className="dash-input"
                                        placeholder="Your Agency Name"
                                    />
                                </div>
                                <div>
                                    <label className="dash-label">Contact Email</label>
                                    <input
                                        type="email"
                                        value={agencyData.email}
                                        onChange={(e) => setAgencyData({ ...agencyData, email: e.target.value })}
                                        className="dash-input"
                                        placeholder="you@agency.com"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="dash-label">Registered Address</label>
                                    <input
                                        type="text"
                                        value={agencyData.address}
                                        onChange={(e) => setAgencyData({ ...agencyData, address: e.target.value })}
                                        className="dash-input"
                                        placeholder="123 Street, City"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Showcase Portal Settings */}
                    {activeSection === 'showcase' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                                💡 <strong>SaaS White-Labeling Info:</strong> You can choose your agency's public portal design (template), set your own primary and secondary brand colors, and configure a custom subdomain or custom domain so your clients see your personalized branding.
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="dash-label">Subdomain (e.g. <code>rahul</code> for <code>rahul.yourdomain.com</code>)</label>
                                    <input
                                        type="text"
                                        value={agencyData.subdomain || ''}
                                        onChange={(e) => setAgencyData({ ...agencyData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                        className="dash-input"
                                        placeholder="e.g. rahul-properties"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Only lowercase letters, numbers, and dashes are allowed.</p>
                                    {agencyData.subdomain && (
                                        <div className="mt-2 text-xs font-semibold text-primary flex items-center gap-1">
                                            <span>🔗 Live Test Link:</span>
                                            <a
                                                href={`${window.location.origin}/?subdomain=${agencyData.subdomain}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="underline hover:text-red-700 font-mono"
                                            >
                                                {window.location.origin}/?subdomain={agencyData.subdomain}
                                            </a>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="dash-label">Custom Domain (e.g. <code>properties.agentrahul.com</code>)</label>
                                    <input
                                        type="text"
                                        value={agencyData.customDomain || ''}
                                        onChange={(e) => setAgencyData({ ...agencyData, customDomain: e.target.value.toLowerCase().trim() })}
                                        className="dash-input"
                                        placeholder="e.g. properties.myagency.com"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Points your custom domain to our system. Remember to add a CNAME record pointing to our main domain.</p>
                                </div>
                                <div className="md:col-span-2">
                                    <TemplatePicker agencyData={agencyData} setAgencyData={setAgencyData} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="dash-label">Primary Brand Color</label>
                                    <div className="flex gap-3">
                                        <input
                                            type="color"
                                            value={agencyData.primaryColor || '#DC2626'}
                                            onChange={(e) => setAgencyData({ ...agencyData, primaryColor: e.target.value })}
                                            className="w-12 h-10 border border-gray-200 rounded-lg cursor-pointer p-0.5"
                                        />
                                        <input
                                            type="text"
                                            value={agencyData.primaryColor || ''}
                                            onChange={(e) => setAgencyData({ ...agencyData, primaryColor: e.target.value })}
                                            className="dash-input flex-1"
                                            placeholder="#DC2626"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="dash-label">Secondary Brand Color</label>
                                    <div className="flex gap-3">
                                        <input
                                            type="color"
                                            value={agencyData.secondaryColor || '#1E293B'}
                                            onChange={(e) => setAgencyData({ ...agencyData, secondaryColor: e.target.value })}
                                            className="w-12 h-10 border border-gray-200 rounded-lg cursor-pointer p-0.5"
                                        />
                                        <input
                                            type="text"
                                            value={agencyData.secondaryColor || ''}
                                            onChange={(e) => setAgencyData({ ...agencyData, secondaryColor: e.target.value })}
                                            className="dash-input flex-1"
                                            placeholder="#1E293B"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-gray-100">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Portal Settings
                                </button>
                            </div>
                        </div>
                    )}

                    {/* WhatsApp */}
                    {activeSection === 'whatsapp' && (
                        <div className="space-y-5">
                            <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                                <div className="flex items-start gap-4 mb-5">
                                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                                        <MessageSquare className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 mb-0.5">WhatsApp Cloud API (Official)</h3>
                                        <p className="text-sm text-gray-600">Connect your official Meta WhatsApp Business Platform account for reliable, automated AI chat outreach.</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {/* Toggle */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 rounded-xl border border-gray-200 gap-4">
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm">Enable AI Agent</h4>
                                            <p className="text-xs text-gray-500 mt-0.5">Allow the AI to automatically respond to new leads on WhatsApp</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={agencyData.agentEnabled}
                                                onChange={(e) => setAgencyData({ ...agencyData, agentEnabled: e.target.checked })}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-accent-teal
                                                            after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                                                            after:bg-white after:border-gray-300 after:border after:rounded-full
                                                            after:h-5 after:w-5 after:transition-all
                                                            peer-checked:after:translate-x-full peer-checked:after:border-white" />
                                        </label>
                                    </div>

                                    {/* Webhook Info Card */}
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
                                        <h4 className="text-xs font-extrabold text-blue-800 uppercase tracking-wider">Meta Developer Webhook Configuration</h4>
                                        <p className="text-xs text-blue-700 leading-relaxed">
                                            Configure these values under the <strong>WhatsApp &gt; Configuration</strong> tab in your Meta Developer App dashboard:
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                            <div>
                                                <span className="text-[10px] font-bold text-blue-600 block mb-1">CALLBACK URL</span>
                                                <div className="bg-white px-3 py-2 rounded-lg border border-blue-200 text-xs font-mono break-all select-all flex items-center justify-between">
                                                    <span>{`${window.location.origin}/webhook`}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-blue-600 block mb-1">VERIFY TOKEN</span>
                                                <div className="bg-white px-3 py-2 rounded-lg border border-blue-200 text-xs font-mono break-all select-all flex items-center justify-between">
                                                    <span>{import.meta.env.VITE_WA_VERIFY_TOKEN || 'rajesh_real_estate'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Credentials Form */}
                                    <div className="space-y-4 pt-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="dash-label">WhatsApp Phone Number</label>
                                                <input
                                                    type="text"
                                                    value={agencyData.phone || ''}
                                                    onChange={(e) => setAgencyData({ ...agencyData, phone: e.target.value })}
                                                    placeholder="e.g. +91 9876543210"
                                                    className="dash-input"
                                                />
                                                <span className="text-[10px] text-gray-500 mt-1 block">Registered WhatsApp Business number</span>
                                            </div>
                                            <div>
                                                <label className="dash-label">WhatsApp Phone Number ID</label>
                                                <input
                                                    type="text"
                                                    value={agencyData.whatsappPhoneNumberId || ''}
                                                    onChange={(e) => setAgencyData({ ...agencyData, whatsappPhoneNumberId: e.target.value })}
                                                    placeholder="e.g. 104857209384729"
                                                    className="dash-input"
                                                />
                                                <span className="text-[10px] text-gray-500 mt-1 block">From WhatsApp Getting Started / API settings tab</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="dash-label">WhatsApp Business Account ID (WABA ID)</label>
                                                <input
                                                    type="text"
                                                    value={agencyData.whatsappBusinessAccountId || ''}
                                                    onChange={(e) => setAgencyData({ ...agencyData, whatsappBusinessAccountId: e.target.value })}
                                                    placeholder="e.g. 209384729304857"
                                                    className="dash-input"
                                                />
                                                <span className="text-[10px] text-gray-500 mt-1 block">Optional, for metadata reference</span>
                                            </div>
                                            <div>
                                                <label className="dash-label">Meta Access Token (System User Token)</label>
                                                <input
                                                    type="password"
                                                    value={agencyData.whatsappToken || ''}
                                                    onChange={(e) => setAgencyData({ ...agencyData, whatsappToken: e.target.value })}
                                                    placeholder="EAABw..."
                                                    className="dash-input"
                                                />
                                                <span className="text-[10px] text-gray-500 mt-1 block">Use a permanent token generated in Business Manager</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Connection status & verification buttons */}
                                    {waConnectionStatus === 'connected' ? (
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-green-200">
                                            <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2.5 rounded-xl font-bold text-sm">
                                                <Check className="w-4 h-4" /> Connected to official API
                                            </div>
                                            {waVerifiedName && (
                                                <span className="text-xs text-green-700 font-bold bg-green-100/50 px-3 py-1 rounded-full border border-green-200">
                                                    Account: {waVerifiedName}
                                                </span>
                                            )}
                                            <button
                                                onClick={handleConnectWhatsApp}
                                                className="text-xs font-bold text-green-700 hover:text-green-900 underline"
                                            >
                                                Re-verify Credentials
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-3 pt-3 border-t border-green-200">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                                <button
                                                    onClick={handleConnectWhatsApp}
                                                    disabled={waConnectionStatus === 'loading'}
                                                    className="btn-dash-teal disabled:opacity-70"
                                                >
                                                    {waConnectionStatus === 'loading'
                                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying Connection...</>
                                                        : 'Verify & Save Connection'}
                                                </button>
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Shield className="w-3.5 h-3.5 text-green-500" /> Meta API Verification
                                                </span>
                                            </div>
                                            {waError && (
                                                <div className="text-xs text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg font-bold">
                                                    ❌ Verification Error: {waError}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Setup Instructions */}
                            <div className="border-t border-gray-100 pt-5">
                                <h4 className="font-bold text-gray-900 mb-3 text-sm">Official WhatsApp Setup Instructions</h4>
                                <ol className="space-y-3">
                                    {[
                                        'Create a Developer Account on developers.facebook.com and create a Business App.',
                                        'Add WhatsApp integration to your app. Meta will assign a test phone number (you can bind a real business number later).',
                                        'Retrieve your Phone Number ID and temporary Access Token from the Getting Started tab.',
                                        'Fill in the WhatsApp Phone Number, Phone Number ID, WABA ID, and Meta Access Token above.',
                                        'Click Verify & Save Connection to test connectivity with Meta\'s servers.',
                                        'Copy the Callback URL and Verify Token from the Blue Webhook Configuration Card above, paste them into the Configuration page of your Meta WhatsApp app, and subscribe to the "messages" webhook event.'
                                    ].map((step, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                                            <span className="w-5 h-5 rounded-full bg-accent-teal/10 text-accent-teal font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                                                {i + 1}
                                            </span>
                                            <span className="flex-1">{step}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    )}

                    {/* Brain Keys */}
                    {activeSection === 'brain' && (
                        <div className="space-y-5">
                            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5">
                                <div className="flex items-start gap-4 mb-5">
                                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                                        <BrainCircuit className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 mb-0.5">AI Brain Configuration</h3>
                                        <p className="text-sm text-gray-600">Bring your own Google Gemini API key to power your AI Agent and manage your own usage limits.</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="dash-label">Google Gemini API Key</label>
                                    <div className="relative max-w-sm">
                                        <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        <input
                                            type="password"
                                            value={agencyData.geminiKey}
                                            onChange={(e) => setAgencyData({ ...agencyData, geminiKey: e.target.value })}
                                            placeholder="AIzaSyB..."
                                            className="dash-input pl-10"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Don't have one? Get it from{' '}
                                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer"
                                           className="text-purple-600 hover:text-purple-800 font-bold underline">
                                            Google AI Studio
                                        </a>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tracking & Pixels */}
                    {activeSection === 'tracking' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Google Tags Integration */}
                                <div className="bg-white border border-gray-150 rounded-2xl p-5 hover:shadow-md transition-all duration-300">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 border border-blue-100">
                                            <Globe className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-950 text-sm">Google Tag Manager / Analytics</h3>
                                            <p className="text-xs text-gray-500 mt-1">Track website page views, traffic sources, and conversion events automatically.</p>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <label className="dash-label">Google Tag ID / Measurement ID</label>
                                        <input
                                            type="text"
                                            value={agencyData.googleTagId}
                                            onChange={(e) => setAgencyData({ ...agencyData, googleTagId: e.target.value })}
                                            placeholder="e.g. G-XXXXXXXXXX or AW-XXXXXXXXXX"
                                            className="dash-input"
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1.5 leading-normal">
                                            Enter your Google Analytics 4 (GA4) measurement ID or Google Ads conversion tag ID to activate tracking.
                                        </p>
                                    </div>
                                </div>

                                {/* Meta Pixel Integration */}
                                <div className="bg-white border border-gray-150 rounded-2xl p-5 hover:shadow-md transition-all duration-300">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100">
                                            <Activity className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-955 text-sm">Meta Pixel (Facebook Pixel)</h3>
                                            <p className="text-xs text-gray-500 mt-1">Monitor page visits and run retargeting ads to prospects on Facebook & Instagram.</p>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <label className="dash-label">Meta Pixel ID</label>
                                        <input
                                            type="text"
                                            value={agencyData.metaPixelId}
                                            onChange={(e) => setAgencyData({ ...agencyData, metaPixelId: e.target.value })}
                                            placeholder="e.g. 123456789012345"
                                            className="dash-input"
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1.5 leading-normal">
                                            Enter the 15-digit numeric Pixel ID from your Meta Event Manager to start tracking PageView and Lead events.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Security */}
                    {activeSection === 'security' && (
                        <div className="space-y-5">
                            <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-200">
                                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                                    <Lock className="w-5 h-5 text-gray-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-1">Password & Authentication</h3>
                                    <p className="text-sm text-gray-600 mb-3">Here you can update your password and manage active sessions.</p>
                                    <button className="btn-dash-primary">Change Password</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Follow-up Sequences */}
                    {activeSection === 'sequences' && (
                        <div className="space-y-5">
                            {!editingSequence ? (
                                <div className="space-y-5">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-bold text-gray-900">Your Sequences</h3>
                                        <button
                                            onClick={() => setEditingSequence({ name: '', description: '', steps: [{ delay_hours: 0, message_template: '' }] })}
                                            className="btn-dash-primary"
                                        >
                                            <Plus className="w-4 h-4" /> New Sequence
                                        </button>
                                    </div>

                                    {isSequencesLoading ? (
                                        <div className="flex justify-center py-12">
                                            <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                                        </div>
                                    ) : sequences.length === 0 ? (
                                        <div className="empty-state py-12">
                                            <div className="empty-state-icon">
                                                <MessageSquare className="w-7 h-7 text-gray-300" />
                                            </div>
                                            <p className="text-sm text-gray-500">No sequences yet. Create one to get started!</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            {sequences.map((seq) => (
                                                <div
                                                    key={seq.id}
                                                    className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm
                                                               flex items-center justify-between group hover:border-primary/20 transition-all"
                                                >
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 text-sm">{seq.name}</h4>
                                                        <p className="text-xs text-gray-500 mt-0.5">{seq.description || 'No description'}</p>
                                                        <span className="inline-flex items-center gap-1 mt-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-medium">
                                                            <Clock className="w-3 h-3" /> {seq.steps?.length || 0} Steps
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => setEditingSequence(seq)} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all">
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDeleteSequence(seq.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <form onSubmit={handleSaveSequence} className="space-y-5">
                                    <div className="flex items-center justify-between">
                                        <button type="button" onClick={() => setEditingSequence(null)} className="text-sm text-gray-500 hover:text-gray-900 font-medium flex items-center gap-1">
                                            ← Back to list
                                        </button>
                                        <h3 className="font-bold text-gray-900">{editingSequence.id ? 'Edit Sequence' : 'New Sequence'}</h3>
                                    </div>

                                    <div>
                                        <label className="dash-label">Sequence Name <span className="text-primary">*</span></label>
                                        <input
                                            type="text"
                                            value={editingSequence.name}
                                            onChange={(e) => setEditingSequence({ ...editingSequence, name: e.target.value })}
                                            placeholder="e.g. Welcome Sequence"
                                            className="dash-input"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="dash-label">Description</label>
                                        <input
                                            type="text"
                                            value={editingSequence.description}
                                            onChange={(e) => setEditingSequence({ ...editingSequence, description: e.target.value })}
                                            placeholder="Short description"
                                            className="dash-input"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="dash-label mb-0">Sequence Steps</label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newSteps = [...(editingSequence.steps || [])];
                                                    newSteps.push({ delay_hours: 24, message_template: '' });
                                                    setEditingSequence({ ...editingSequence, steps: newSteps });
                                                }}
                                                className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                                            >
                                                <Plus className="w-3.5 h-3.5" /> Add Step
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {(editingSequence.steps || []).map((step, idx) => (
                                                <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative group">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm text-xs">
                                                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                            <span className="text-gray-500">Delay (Hours):</span>
                                                            <input
                                                                type="number"
                                                                value={step.delay_hours}
                                                                onChange={(e) => {
                                                                    const newSteps = [...editingSequence.steps];
                                                                    newSteps[idx].delay_hours = parseInt(e.target.value);
                                                                    setEditingSequence({ ...editingSequence, steps: newSteps });
                                                                }}
                                                                className="w-14 font-bold text-gray-900 focus:outline-none bg-transparent"
                                                            />
                                                        </div>
                                                        <span className="text-xs text-gray-400">
                                                            {idx === 0 ? '(0 = Immediate)' : `Wait ${step.delay_hours}h after step ${idx}`}
                                                        </span>
                                                    </div>
                                                    <textarea
                                                        value={step.message_template}
                                                        onChange={(e) => {
                                                            const newSteps = [...editingSequence.steps];
                                                            newSteps[idx].message_template = e.target.value;
                                                            setEditingSequence({ ...editingSequence, steps: newSteps });
                                                        }}
                                                        placeholder="Enter message template..."
                                                        rows={3}
                                                        className="dash-input resize-none"
                                                        required
                                                    />
                                                    {editingSequence.steps.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newSteps = editingSequence.steps.filter((_, i) => i !== idx);
                                                                setEditingSequence({ ...editingSequence, steps: newSteps });
                                                            }}
                                                            className="absolute -top-2 -right-2 bg-white text-red-500 p-1 rounded-full shadow-sm border border-red-100
                                                                       opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-2">
                                        <button type="button" onClick={() => setEditingSequence(null)} className="btn-dash-secondary">
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={isSaving} className="btn-dash-primary disabled:opacity-70">
                                            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                            Save Sequence
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}


                    {/* Portal Integrations */}
                    {activeSection === 'integrations' && (
                        <div className="space-y-6">
                            {isIntegrationsLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            ) : showConfigPortal ? (
                                <form onSubmit={handleSaveIntegration} className="space-y-5 bg-white p-5 rounded-2xl border border-gray-100">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                        <button
                                            type="button"
                                            onClick={() => { setShowConfigPortal(null); }}
                                            className="text-sm text-gray-500 hover:text-gray-900 font-medium"
                                        >
                                            ← Back to Portals
                                        </button>
                                        <h3 className="font-bold text-gray-900 capitalize">Configure {showConfigPortal}</h3>
                                    </div>

                                    {/* Magicbricks Config Fields */}
                                    {showConfigPortal === 'magicbricks' && (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="dash-label">Magicbricks API Key</label>
                                                <input
                                                    type="password"
                                                    value={integrationFormData.apiKey}
                                                    onChange={e => setIntegrationFormData({...integrationFormData, apiKey: e.target.value})}
                                                    className="dash-input"
                                                    placeholder="Enter Magicbricks Developer API Key"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="dash-label">Agent ID / Registered Mobile</label>
                                                <input
                                                    type="text"
                                                    value={integrationFormData.agentId}
                                                    onChange={e => setIntegrationFormData({...integrationFormData, agentId: e.target.value})}
                                                    className="dash-input"
                                                    placeholder="e.g. AG123456"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* 99acres Config Fields */}
                                    {showConfigPortal === '99acres' && (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="dash-label">99acres XML Feed / API Key</label>
                                                <input
                                                    type="password"
                                                    value={integrationFormData.apiKey}
                                                    onChange={e => setIntegrationFormData({...integrationFormData, apiKey: e.target.value})}
                                                    className="dash-input"
                                                    placeholder="Enter 99acres API Key"
                                                />
                                            </div>
                                            <div>
                                                <label className="dash-label">Username</label>
                                                <input
                                                    type="text"
                                                    value={integrationFormData.username}
                                                    onChange={e => setIntegrationFormData({...integrationFormData, username: e.target.value})}
                                                    className="dash-input"
                                                    placeholder="99acres Username"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="dash-label">Password</label>
                                                <input
                                                    type="password"
                                                    value={integrationFormData.password}
                                                    onChange={e => setIntegrationFormData({...integrationFormData, password: e.target.value})}
                                                    className="dash-input"
                                                    placeholder="99acres Password"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Housing.com Config Fields */}
                                    {showConfigPortal === 'housing' && (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="dash-label">Housing.com Partner API Key</label>
                                                <input
                                                    type="password"
                                                    value={integrationFormData.apiKey}
                                                    onChange={e => setIntegrationFormData({...integrationFormData, apiKey: e.target.value})}
                                                    className="dash-input"
                                                    placeholder="Enter Housing.com Partner Key"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* NoBroker Config Fields */}
                                    {showConfigPortal === 'nobroker' && (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="dash-label">NoBroker Agent API Token</label>
                                                <input
                                                    type="password"
                                                    value={integrationFormData.apiKey}
                                                    onChange={e => setIntegrationFormData({...integrationFormData, apiKey: e.target.value})}
                                                    className="dash-input"
                                                    placeholder="Enter NoBroker API Token"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Meta Ads Direct Config Fields */}
                                    {showConfigPortal === 'meta' && (
                                        <div className="space-y-4 py-2">
                                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
                                                <div className="w-10 h-10 bg-[#1877F2] rounded-xl flex items-center justify-center shrink-0">
                                                    <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
                                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                                    </svg>
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-gray-800 text-sm">Official Meta Ads Lead Sync</h4>
                                                    <p className="text-xs text-gray-600">Connect your Facebook business account directly to retrieve lead forms.</p>
                                                </div>
                                            </div>

                                            {fbError && (
                                                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                                                    ⚠️ {fbError}
                                                </div>
                                            )}

                                            {fbPages.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-6 bg-gray-50 border border-dashed border-gray-250 rounded-2xl gap-3">
                                                    <p className="text-xs text-gray-500 text-center px-6">
                                                        Click the button below to log in and authorize Rajesh Realty CRM to retrieve your Page Lead Forms.
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={handleFacebookLogin}
                                                        disabled={fbIsLoadingPages}
                                                        className="px-5 py-2.5 bg-[#1877F2] hover:bg-[#165fc2] disabled:bg-gray-400 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
                                                    >
                                                        {fbIsLoadingPages ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                                Connecting Facebook...
                                                            </>
                                                        ) : (
                                                            'Login with Facebook'
                                                        )}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="dash-label font-bold text-gray-750">Select Facebook Page to Sync</label>
                                                        <select
                                                            className="dash-input mt-1.5"
                                                            required
                                                            onChange={(e) => {
                                                                if (!e.target.value) {
                                                                    setIntegrationFormData({ apiKey: '', agentId: '', username: '', password: '' });
                                                                    return;
                                                                }
                                                                const page = JSON.parse(e.target.value);
                                                                setIntegrationFormData({
                                                                    apiKey: page.access_token,
                                                                    agentId: page.id,
                                                                    username: page.name,
                                                                    password: ''
                                                                });
                                                            }}
                                                        >
                                                            <option value="">-- Choose a Page --</option>
                                                            {fbPages.map(page => (
                                                                <option key={page.id} value={JSON.stringify(page)}>
                                                                    {page.name} (ID: {page.id})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-[10px] text-gray-400">
                                                            Select a page to unlock Page Webhook Subscription.
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => setFbPages([])}
                                                            className="text-xs text-[#1877F2] font-semibold hover:underline"
                                                        >
                                                            Switch Account
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                                        <button
                                            type="button"
                                            onClick={() => { setShowConfigPortal(null); setFbPages([]); }}
                                            className="btn-dash-secondary"
                                        >
                                            Cancel
                                        </button>
                                        {(showConfigPortal !== 'meta' || fbPages.length > 0) && (
                                            <button
                                                type="submit"
                                                disabled={isSavingIntegration || (showConfigPortal === 'meta' && !integrationFormData.agentId)}
                                                className="btn-dash-primary disabled:opacity-75"
                                            >
                                                {isSavingIntegration && <Loader2 className="w-4 h-4 animate-spin" />}
                                                Save Credentials
                                            </button>
                                        )}
                                    </div>
                                </form>
                            ) : simulatingPortal ? (
                                <div className="space-y-5 bg-white p-5 rounded-2xl border border-gray-100">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                        <button
                                            type="button"
                                            onClick={() => setSimulatingPortal(null)}
                                            className="text-sm text-gray-500 hover:text-gray-900 font-medium"
                                        >
                                            ← Back to Portals
                                        </button>
                                        <h3 className="font-bold text-gray-900 capitalize">Simulate {simulatingPortal} Lead</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="dash-label">Lead Name</label>
                                            <input
                                                type="text"
                                                value={simulationData.name}
                                                onChange={e => setSimulationData({...simulationData, name: e.target.value})}
                                                className="dash-input"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="dash-label">Phone Number</label>
                                            <input
                                                type="text"
                                                value={simulationData.phone}
                                                onChange={e => setSimulationData({...simulationData, phone: e.target.value})}
                                                className="dash-input"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="dash-label">Location Preference</label>
                                            <input
                                                type="text"
                                                value={simulationData.location}
                                                onChange={e => setSimulationData({...simulationData, location: e.target.value})}
                                                className="dash-input"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="dash-label">Budget (in Rupees)</label>
                                            <input
                                                type="number"
                                                value={simulationData.budget}
                                                onChange={e => setSimulationData({...simulationData, budget: e.target.value})}
                                                className="dash-input"
                                                required
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="dash-label">Requirement details</label>
                                            <textarea
                                                value={simulationData.requirement}
                                                onChange={e => setSimulationData({...simulationData, requirement: e.target.value})}
                                                className="dash-input h-20 resize-none"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                                        <button
                                            type="button"
                                            onClick={() => setSimulatingPortal(null)}
                                            className="btn-dash-secondary"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleSimulateLead(simulatingPortal)}
                                            className="btn-dash-primary"
                                        >
                                            🚀 Trigger Inbound Webhook
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-5">
                                    {['magicbricks', '99acres', 'housing', 'nobroker', 'google', 'meta'].map(portalName => {
                                        const config = integrations.find(i => i.portal === portalName);
                                        const isConnected = !!config;
                                        const webhookUrl = portalName === 'meta'
                                            ? `${window.location.origin.replace(':5173', ':3000')}/api/integrations/webhook/meta`
                                            : `${window.location.origin.replace(':5173', ':3000')}/api/integrations/webhook/${portalName}/${currentUser?.id}`;

                                        let displayName = portalName;
                                        if (portalName === 'housing') displayName = 'Housing.com';
                                        else if (portalName === 'nobroker') displayName = 'NoBroker';
                                        else if (portalName === 'google') displayName = 'Google Ads Forms';
                                        else if (portalName === 'meta') displayName = 'Meta Ads (Facebook/Instagram)';

                                        return (
                                            <div key={portalName} className="bg-white border border-gray-150 rounded-2xl p-5 hover:shadow-md transition-all duration-300">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center shrink-0 uppercase font-black text-xs text-gray-700 tracking-wider">
                                                            {portalName === 'google' ? 'GO' : portalName === 'meta' ? 'ME' : portalName.substring(0, 2)}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-bold text-gray-900 capitalize text-base">{displayName}</h3>
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                                    isConnected ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-500 border border-gray-200'
                                                                }`}>
                                                                    {isConnected ? 'Connected' : 'Not Connected'}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-500 mt-1">
                                                                {portalName === 'magicbricks' && 'Sync inbound leads and property search logs from Magicbricks Developer API.'}
                                                                {portalName === '99acres' && 'Automatically import real-time inquiries using the 99acres lead portal API.'}
                                                                {portalName === 'housing' && 'Connect Housing.com partner webhook to assign leads to agents.'}
                                                                {portalName === 'nobroker' && 'Pull leads and inquiries from NoBroker platform.'}
                                                                {portalName === 'google' && 'Sync leads in real time from Google Search and YouTube Lead Form extensions.'}
                                                                {portalName === 'meta' && 'Directly connect Facebook Page Leads to CRM database without third party tools.'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                                        {isConnected ? (
                                                            <>
                                                                <button
                                                                    onClick={() => setSimulatingPortal(portalName)}
                                                                    className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold transition-all"
                                                                >
                                                                    Test Simulation
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDisconnectIntegration(portalName)}
                                                                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all"
                                                                >
                                                                    Disconnect
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    setIntegrationFormData({ apiKey: '', agentId: '', username: '', password: '' });
                                                                    setShowConfigPortal(portalName);
                                                                }}
                                                                className="btn-dash-primary px-4 py-1.5 text-xs font-bold"
                                                            >
                                                                Configure
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Webhook block */}
                                                {isConnected && (
                                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                                        <label className="text-xs font-bold text-gray-450 uppercase tracking-wider">Your Unique Webhook URL</label>
                                                        <div className="flex items-center gap-2 mt-1.5 bg-gray-50 border border-gray-200 rounded-xl p-2 min-w-0">
                                                            <input
                                                                type="text"
                                                                readOnly
                                                                value={webhookUrl}
                                                                className="flex-1 bg-transparent text-xs text-gray-650 font-mono select-all outline-none border-none overflow-x-auto min-w-0"
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(webhookUrl);
                                                                    alert('Webhook URL copied!');
                                                                }}
                                                                className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-250 rounded-lg text-[10px] font-bold shrink-0 transition-colors"
                                                            >
                                                                Copy
                                                            </button>
                                                        </div>
                                                        <p className="text-[11px] text-gray-400 mt-1">
                                                            {portalName === 'google' && 'Provide this Webhook URL inside your Google Ads Lead Form extension configuration, and set the Google Key to the API key configured here.'}
                                                            {portalName === 'meta' && 'Provide this Webhook URL inside your Facebook Developer App webhooks subscription setup under Messenger or Webhooks product (Page leadgen topic), and set the verification token to "meta_leads_verify_pass_123".'}
                                                            {portalName !== 'google' && portalName !== 'meta' && `Provide this Webhook URL inside your ${portalName} portal developer dashboard to enable instant lead syncing.`}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Billing */}
                    {activeSection === 'billing' && (
                        <div className="space-y-5">
                            <div className="bg-gradient-to-r from-primary/5 to-accent-teal/5 border border-gray-200 rounded-2xl p-5">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                                        <CreditCard className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 mb-1">Current Plan: <span className="text-primary">Premium Agency</span></h3>
                                        <p className="text-sm text-gray-600 mb-3">You are currently billed ₹5,000/month. Next billing date is April 1st.</p>
                                        <button className="btn-dash-primary">Manage Subscription</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notifications */}
                    {activeSection === 'notifications' && (
                        <div className="space-y-4">
                            <label className="flex items-center gap-4 cursor-pointer p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={agencyData.notificationsEnabled}
                                    onChange={(e) => setAgencyData({ ...agencyData, notificationsEnabled: e.target.checked })}
                                    className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
                                />
                                <div>
                                    <span className="font-semibold text-gray-900 text-sm">Email alerts for new leads</span>
                                    <p className="text-xs text-gray-500 mt-0.5">Receive an email whenever a new lead is added to your pipeline.</p>
                                </div>
                            </label>
                        </div>
                    )}

                    {/* Save Button (not shown in sequences/integrations edit mode) */}
                    {activeSection !== 'sequences' && activeSection !== 'integrations' && (
                        <div className="mt-8 pt-5 border-t border-gray-105 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="btn-dash-primary disabled:opacity-60"
                            >
                                {isSaving
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                                    : <><Save className="w-4 h-4" /> Save Changes</>
                                }
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AgencySettings;
