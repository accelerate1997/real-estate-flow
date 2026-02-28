import React, { useState } from 'react';
import { Save, Building, Bell, Shield, CreditCard, ChevronRight, MessageSquare, Check, Loader2, BrainCircuit, Key } from 'lucide-react';
import { pb } from '../services/pocketbase';

const AgencySettings = () => {
    const [activeSection, setActiveSection] = useState('profile');
    const [isSaving, setIsSaving] = useState(false);
    const [qrCode, setQrCode] = useState(null);
    const [waConnectionStatus, setWaConnectionStatus] = useState('idle'); // idle, loading, ready, connected

    // Get current user details to pre-fill basic info
    const currentUser = pb.authStore.model;

    // Mock Agency Data
    const [agencyData, setAgencyData] = useState({
        agencyName: currentUser?.agencyName || 'RR Real Estate',
        email: currentUser?.email || '',
        phone: currentUser?.phone || '',
        address: '123 Business Avenue, Andheri West, Mumbai',
        notificationsEnabled: true,
        geminiKey: currentUser?.geminiKey || ''
    });

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (currentUser?.id) {
                await pb.collection('users').update(currentUser.id, {
                    agencyName: agencyData.agencyName,
                    phone: agencyData.phone,
                    geminiKey: agencyData.geminiKey
                    // Note: 'email' is usually protected in PocketBase PB auth components
                    // 'address' and 'notificationsEnabled' would need respective DB fields
                });

                // Refresh local auth store model
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
        if (!agencyData.phone) {
            alert("Please enter a WhatsApp number first.");
            return;
        }

        setWaConnectionStatus('loading');
        setQrCode(null);

        try {
            const res = await fetch('/api/whatsapp/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agencyId: currentUser?.id,
                    phoneNumber: agencyData.phone
                })
            });

            const data = await res.json();

            if (data.connected || data.instance?.state === 'open') {
                setWaConnectionStatus('connected');
            } else if (data.qr) {
                setQrCode(data.qr);
                setWaConnectionStatus('ready');
            } else if (data.mock) {
                setWaConnectionStatus('ready');
                // Use a placeholder image if backend is just returning a mock success
                setQrCode("iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAQAAADa613fAAAAc0lEQVR42u3PMQ0AAAgDsB34d5kF0wz2QoOAEc80QRMkaIIETZCgCRI0QYImSNAECZogQRMkaIIETZCgCRI0QYImSNAECZogQRMkaIIETZCgCRI0QYImSNAECZogQRMkaIIETZCgCRI0QYImSNAECZogIfMAW84C9YItK2gAAAAASUVORK5CYII=");
            } else {
                alert("Failed to initialize WhatsApp connection. See console for details.");
                setWaConnectionStatus('idle');
                console.error("WA Connection Error Data:", data);
            }
        } catch (error) {
            console.error(error);
            alert("Error connecting to server. Is whatsapp-agent running?");
            setWaConnectionStatus('idle');
        }
    };

    const sections = [
        { id: 'profile', name: 'Agency Profile', icon: Building, description: 'Manage your agency details and public information.' },
        { id: 'whatsapp', name: 'Connect WhatsApp', icon: MessageSquare, description: 'Connect your agency WhatsApp number to assign the AI Agent.' },
        { id: 'brain', name: 'Brain Keys', icon: BrainCircuit, description: 'Configure your custom LLM API keys to power your AI Agent.' },
        { id: 'security', name: 'Security & Access', icon: Shield, description: 'Manage passwords and two-factor authentication.' },
        { id: 'billing', name: 'Billing & Plan', icon: CreditCard, description: 'Manage your subscription and payment methods.' },
        { id: 'notifications', name: 'Notifications', icon: Bell, description: 'Configure how you receive alerts and lead updates.' },
    ];

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Settings Navigation Sidebar */}
            <div className="w-full lg:w-64 shrink-0">
                <nav className="space-y-1">
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${activeSection === section.id
                                ? 'bg-white shadow-sm border border-primary/20 text-primary font-bold'
                                : 'text-gray-600 hover:bg-gray-50 border border-transparent font-medium text-left'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <section.icon className={`w-5 h-5 ${activeSection === section.id ? 'text-primary' : 'text-gray-400'}`} />
                                {section.name}
                            </div>
                            <ChevronRight className={`w-4 h-4 transition-transform ${activeSection === section.id ? 'opacity-100 translate-x-1' : 'opacity-0'}`} />
                        </button>
                    ))}
                </nav>
            </div>

            {/* Settings Content Area */}
            <div className="flex-1">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                    {/* Header */}
                    <div className="mb-8 border-b border-gray-100 pb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {sections.find(s => s.id === activeSection)?.name}
                        </h2>
                        <p className="text-gray-500 mt-1">
                            {sections.find(s => s.id === activeSection)?.description}
                        </p>
                    </div>

                    {/* Content specific to section */}
                    {activeSection === 'profile' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Agency Name</label>
                                    <input
                                        type="text"
                                        value={agencyData.agencyName}
                                        onChange={(e) => setAgencyData({ ...agencyData, agencyName: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                                    <input
                                        type="email"
                                        value={agencyData.email}
                                        onChange={(e) => setAgencyData({ ...agencyData, email: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Registered Address</label>
                                    <input
                                        type="text"
                                        value={agencyData.address}
                                        onChange={(e) => setAgencyData({ ...agencyData, address: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'whatsapp' && (
                        <div className="space-y-6">
                            <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="bg-green-100 p-3 rounded-full shrink-0">
                                        <MessageSquare className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">WA Saathi Integration</h3>
                                        <p className="text-sm text-gray-600">Connect your WhatsApp Business number to automatically handle leads using our AI property agent.</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Number (with Country Code)</label>
                                        <input
                                            type="text"
                                            value={agencyData.phone || ''}
                                            onChange={(e) => setAgencyData({ ...agencyData, phone: e.target.value })}
                                            placeholder="e.g. +91 9876543210"
                                            className="w-full md:w-2/3 px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium text-gray-900"
                                        />
                                    </div>

                                    {waConnectionStatus === 'connected' ? (
                                        <div className="flex flex-col items-start gap-3 mt-4">
                                            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                                                <Check className="w-5 h-5" /> Successfully Connected!
                                            </div>
                                            <p className="text-sm text-green-700">Your agent is actively listening to messages.</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-start gap-4 pt-2">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={handleConnectWhatsApp}
                                                    disabled={waConnectionStatus === 'loading'}
                                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70"
                                                >
                                                    {waConnectionStatus === 'loading' ? (
                                                        <><Loader2 className="w-5 h-5 animate-spin" /> Initializing...</>
                                                    ) : "Generate QR Code"}
                                                </button>
                                                <span className="text-sm text-gray-500 flex items-center gap-1">
                                                    <Shield className="w-4 h-4 text-green-500" /> Secure Connection
                                                </span>
                                            </div>

                                            {/* QR Code Container */}
                                            {waConnectionStatus === 'ready' && qrCode && (
                                                <div className="mt-4 p-4 bg-white rounded-xl shadow border border-green-200 inline-block text-center">
                                                    <p className="mb-3 font-bold text-gray-900 text-sm">Scan with WhatsApp</p>
                                                    <img
                                                        src={qrCode.startsWith('data:image') ? qrCode : `data:image/png;base64,${qrCode}`}
                                                        alt="WhatsApp Connection QR Code"
                                                        className="w-48 h-48 sm:w-64 sm:h-64 mx-auto rounded-lg border border-gray-100 shadow-sm"
                                                    />
                                                    <p className="mt-3 text-xs text-gray-500 max-w-[200px] mx-auto">
                                                        Go to Settings &gt; Linked Devices to scan this code.
                                                    </p>

                                                    <button
                                                        onClick={() => setWaConnectionStatus('connected')}
                                                        className="mt-4 text-xs font-bold text-green-600 hover:text-green-800"
                                                    >
                                                        [Demo Only] Simulate Scan
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 border-t border-gray-100 pt-6">
                                <h4 className="font-bold text-gray-900 mb-4">Setup Instructions</h4>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                                    <li>Enter your official agency WhatsApp number above.</li>
                                    <li>Click <strong>Connect Number</strong>. A QR code will be generated.</li>
                                    <li>Open WhatsApp on your phone, go to Linked Devices, and scan the QR code to grant agent access.</li>
                                    <li>Once connected, the WA Saathi AI will automatically greet new incoming messages.</li>
                                </ol>
                            </div>
                        </div>
                    )}

                    {activeSection === 'brain' && (
                        <div className="space-y-6">
                            <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="bg-purple-100 p-3 rounded-full shrink-0">
                                        <BrainCircuit className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">AI Brain Configuration</h3>
                                        <p className="text-sm text-gray-600">Bring your own Google Gemini API key to power your AI Agent and manage your own usage limits and billing.</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Google Gemini API Key</label>
                                        <div className="relative w-full md:w-2/3">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Key className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="password"
                                                value={agencyData.geminiKey}
                                                onChange={(e) => setAgencyData({ ...agencyData, geminiKey: e.target.value })}
                                                placeholder="e.g. AIzaSyB..."
                                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium text-gray-900"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <p className="text-xs text-gray-500">
                                            Don't have an API key? Get one from the <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-purple-600 hover:text-purple-800 font-bold underline">Google AI Studio</a>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'security' && (
                        <div className="space-y-6 text-gray-600">
                            <p>Here you can update your password and manage active sessions.</p>
                            <button className="text-primary font-bold hover:underline">Change Password</button>
                        </div>
                    )}

                    {activeSection === 'billing' && (
                        <div className="space-y-6">
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                <h3 className="font-bold text-gray-900 mb-2">Current Plan: Premium Agency</h3>
                                <p className="text-sm text-gray-600 mb-4">You are currently billed ₹5,000/month. Next billing date is April 1st.</p>
                                <button className="text-primary font-bold hover:underline">Manage Subscription</button>
                            </div>
                        </div>
                    )}

                    {activeSection === 'notifications' && (
                        <div className="space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={agencyData.notificationsEnabled}
                                    onChange={(e) => setAgencyData({ ...agencyData, notificationsEnabled: e.target.checked })}
                                    className="w-5 h-5 rounded text-primary focus:ring-primary accent-primary"
                                />
                                <span className="font-medium text-gray-700">Receive email alerts for new leads</span>
                            </label>
                        </div>
                    )}

                    {/* Action Bar */}
                    <div className="mt-10 pt-6 border-t border-gray-100 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-red-800 transition-all shadow-md disabled:opacity-70"
                        >
                            {isSaving ? <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></span> : <Save className="w-5 h-5" />}
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgencySettings;
