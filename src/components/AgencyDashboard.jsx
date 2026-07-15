import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Users, Settings, LogOut,
    Menu, X, Home, Loader2, Bell, TrendingUp, Target, Calendar,
    ChevronRight, Sparkles, Send
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { pb } from '../services/pocketbase';
import AgentManagement from './AgentManagement';
import PropertyManagement from './PropertyManagement';
import AgencySettings from './AgencySettings';
import LeadManagement from './LeadManagement';
import SmartMatches from './SmartMatches';
import SiteVisits from './SiteVisits';
import BulkMarketing from './BulkMarketing';

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen, onLogout, isOwner }) => {
    const links = [
        { name: 'Overview', icon: LayoutDashboard, id: 'overview' },
        { name: 'Leads', icon: Target, id: 'leads' },
        { name: 'Properties', icon: Home, id: 'properties' },
        { name: 'Smart Matches', icon: Sparkles, id: 'matches' },
        { name: 'Site Visits', icon: Calendar, id: 'visits' },
        { name: isOwner ? 'Manage Agents' : 'Agency Directory', icon: Users, id: 'agents' },
    ];

    if (isOwner) {
        links.push({ name: 'Bulk Marketing', icon: Send, id: 'marketing' });
        links.push({ name: 'Agency Settings', icon: Settings, id: 'settings' });
    }

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.div
                className={`dash-sidebar fixed left-0 top-0 h-full w-64 z-50 flex flex-col
                            transform md:translate-x-0 transition-transform duration-300
                            ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {/* Brand Header */}
                <div className="flex items-center justify-between px-5 py-5 border-b border-white/08">
                    <div className="flex items-center gap-3">
                        {/* Logo mark */}
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/30">
                            <span className="text-white font-display font-bold text-sm">RR</span>
                        </div>
                        <div>
                            <p className="text-white font-display font-bold text-sm leading-tight">Rajesh Realty</p>
                            <p className="text-white/40 text-[10px] font-medium uppercase tracking-widest">Agency</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="md:hidden text-white/40 hover:text-white transition-colors p-1"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto dash-sidebar-scrollbar">
                    {links.map((link) => (
                        <button
                            key={link.id}
                            onClick={() => { setActiveTab(link.id); setIsOpen(false); }}
                            className={`dash-nav-item ${activeTab === link.id ? 'dash-nav-item-active' : ''}`}
                        >
                            <link.icon className={`w-4 h-4 shrink-0 transition-colors ${activeTab === link.id ? 'text-primary' : 'text-white/40'}`} />
                            <span>{link.name}</span>
                            {activeTab === link.id && (
                                <ChevronRight className="w-3.5 h-3.5 ml-auto text-primary/70" />
                            )}
                        </button>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-3 border-t border-white/08">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                                   text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                    >
                        <LogOut className="w-4 h-4 shrink-0" />
                        Sign Out
                    </button>
                </div>
            </motion.div>
        </>
    );
};

// ─── Custom Tooltip for Chart ─────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-gray-100 rounded-xl shadow-premium px-4 py-3">
                <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
                <p className="text-lg font-bold text-gray-900">{payload[0].value} <span className="text-xs font-normal text-gray-500">leads</span></p>
            </div>
        );
    }
    return null;
};

// ─── Dashboard Overview ───────────────────────────────────────────────────────
const DashboardOverview = ({ currentUser, isOwner }) => {
    const [stats, setStats] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!currentUser?.id) {
            setIsLoading(false);
            return;
        }

        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                const agencyId = isOwner ? currentUser.id : currentUser?.agencyId;
                if (!agencyId) {
                    setIsLoading(false);
                    return;
                }

                // ── Fetch counts in parallel ──────────────────────────
                const baseUrl = window.location.origin;
                const token = pb.authStore.token;
                const headers = token ? { Authorization: `Bearer ${token}` } : {};

                const [propRes, leadRes] = await Promise.all([
                    fetch(`${baseUrl}/api/collections/properties?filter=agencyId="${agencyId}"&page=1&perPage=1`, { headers }),
                    fetch(`${baseUrl}/api/collections/leads?filter=agencyId="${agencyId}"&page=1&perPage=1`, { headers }),
                ]);

                const propData = propRes.ok ? await propRes.json() : { totalItems: 0 };
                const leadData = leadRes.ok ? await leadRes.json() : { totalItems: 0 };

                const newStats = [
                    {
                        title: 'Total Properties',
                        value: propData.totalItems ?? 0,
                        icon: Home,
                        gradient: 'from-blue-500 to-blue-600',
                        trend: '+12%'
                    },
                    {
                        title: 'Total Leads',
                        value: leadData.totalItems ?? 0,
                        icon: Target,
                        gradient: 'from-primary to-primary-dark',
                        trend: '+8%'
                    },
                ];

                if (isOwner) {
                    try {
                        const agentRes = await fetch(
                            `${baseUrl}/api/collections/users?filter=role="agent"&page=1&perPage=1`,
                            { headers }
                        );
                        const agentData = agentRes.ok ? await agentRes.json() : { totalItems: 0 };
                        newStats.push({
                            title: 'Active Agents',
                            value: agentData.totalItems ?? 0,
                            icon: Users,
                            gradient: 'from-accent-teal to-accent-teal-dark',
                            trend: 'Stable'
                        });
                    } catch (e) {
                        console.warn('Could not fetch agent count:', e.message);
                    }
                }

                setStats(newStats);

                // ── Lead chart — last 7 days (client-side date filter) ─
                try {
                    const allLeadsRes = await fetch(
                        `${baseUrl}/api/collections/leads?filter=agencyId="${agencyId}"&sort=-created_at`,
                        { headers }
                    );
                    const allLeadsData = allLeadsRes.ok ? await allLeadsRes.json() : { items: [] };
                    const allLeads = allLeadsData.items || [];

                    const today = new Date();
                    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    const dayMap = {};
                    const newChartData = [];

                    for (let i = 6; i >= 0; i--) {
                        const d = new Date();
                        d.setDate(today.getDate() - i);
                        const dateKey = d.toISOString().split('T')[0];
                        const label = i === 0 ? 'Today' : daysOfWeek[d.getDay()];
                        dayMap[dateKey] = { name: label, leads: 0 };
                        newChartData.push(dayMap[dateKey]);
                    }

                    // Count leads per day (client-side)
                    allLeads.forEach(lead => {
                        const rawDate = lead.created_at || lead.created || '';
                        const dateKey = rawDate.split('T')[0].split(' ')[0];
                        if (dayMap[dateKey]) {
                            dayMap[dateKey].leads++;
                        }
                    });

                    setChartData(newChartData);
                } catch (e) {
                    console.warn('Could not build chart:', e.message);
                    setChartData([]);
                }

            } catch (error) {
                console.error("Error fetching dashboard analytics:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [currentUser?.id, isOwner]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                <p className="text-gray-400 font-medium text-sm">Loading your dashboard...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {stats.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08 }}
                        className="stat-card"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{stat.title}</p>
                                <h3 className="text-4xl font-display font-bold text-gray-900">{stat.value}</h3>
                                <div className="flex items-center gap-1.5 mt-2">
                                    <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                                    <span className="text-xs font-semibold text-green-600">{stat.trend}</span>
                                    <span className="text-xs text-gray-400">this week</span>
                                </div>
                            </div>
                            <div className={`stat-icon-wrap bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                                <stat.icon className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Lead Growth Chart */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="font-display font-bold text-gray-900">Lead Activity</h3>
                        <p className="text-sm text-gray-500 mt-0.5">Leads captured in the last 7 days</p>
                    </div>
                    <span className="dash-badge dash-badge-new">Live</span>
                </div>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barSize={32}>
                            <defs>
                                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#CC0000" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#990000" stopOpacity={0.7} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#9CA3AF', fontWeight: 500 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                                allowDecimals={false}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb', radius: 8 }} />
                            <Bar dataKey="leads" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 }}
                className="bg-gradient-to-r from-primary via-primary-dark to-[#7a0000] rounded-2xl p-6 text-white"
            >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="font-display font-bold text-lg">Ready to grow?</h3>
                        <p className="text-white/70 text-sm mt-0.5">Add properties or leads to get started</p>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <a
                            href="#"
                            onClick={e => { e.preventDefault(); }}
                            className="inline-flex items-center gap-2 bg-white text-primary px-4 py-2 rounded-xl text-sm font-bold hover:bg-white/90 transition-all"
                        >
                            <Home className="w-4 h-4" /> Add Property
                        </a>
                        <a
                            href="#"
                            onClick={e => { e.preventDefault(); }}
                            className="inline-flex items-center gap-2 bg-white/15 border border-white/20 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-white/25 transition-all"
                        >
                            <Target className="w-4 h-4" /> Add Lead
                        </a>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// ─── Agency Dashboard ─────────────────────────────────────────────────────────
const AgencyDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [userName, setUserName] = useState(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                return parsedUser.name || 'Agency Owner';
            } catch (e) {
                return 'Agency Owner';
            }
        }
        return 'Agency Owner';
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser.name !== userName) {
                    setUserName(parsedUser.name);
                }
            } catch (e) {}
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const currentUser = pb.authStore.model;
    const isOwner = currentUser?.role !== 'agent';

    const getPageTitle = () => {
        const titles = {
            overview: 'Dashboard',
            leads: 'Lead Pipeline',
            properties: 'Properties',
            matches: 'Smart Matches',
            visits: 'Site Visits',
            agents: isOwner ? 'Manage Agents' : 'Agency Directory',
            marketing: 'Bulk Marketing Campaigns',
            settings: 'Agency Settings',
        };
        return titles[activeTab] || 'Dashboard';
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return <DashboardOverview currentUser={currentUser} isOwner={isOwner} />;
            case 'leads': return <LeadManagement />;
            case 'properties': return <PropertyManagement />;
            case 'matches': return <SmartMatches />;
            case 'visits': return <SiteVisits />;
            case 'agents': return <AgentManagement />;
            case 'marketing': return isOwner
                ? <BulkMarketing />
                : (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                            <Send className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h3>
                        <p className="text-gray-500">Owner privileges are required to view Bulk Marketing.</p>
                    </div>
                );
            case 'settings': return isOwner
                ? <AgencySettings />
                : (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                            <Settings className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h3>
                        <p className="text-gray-500">Owner privileges are required to view settings.</p>
                    </div>
                );
            default: return (
                <div className="flex items-center justify-center py-20 text-gray-400">
                    Module under development
                </div>
            );
        }
    };

    return (
        <div className="min-h-screen bg-[#F2F4F8] font-sans flex">
            {/* Sidebar */}
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
                onLogout={handleLogout}
                isOwner={isOwner}
            />

            {/* Main Content */}
            <div className="flex-1 md:ml-64 transition-all duration-300 min-w-0">
                {/* Top Header */}
                <header className="dash-header shadow-sm">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="md:hidden text-gray-500 hover:text-gray-900 transition-colors p-1"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-base font-display font-bold text-gray-900">{getPageTitle()}</h1>
                            <p className="text-xs text-gray-400 hidden sm:block">Rajesh Realty Agency Panel</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Notification bell */}
                        <button className="relative w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                            <Bell className="w-4 h-4 text-gray-600" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-white" />
                        </button>

                        {/* User avatar */}
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-sm shadow-primary/20">
                                <span className="text-white font-bold text-sm">{userName?.charAt(0)?.toUpperCase() || 'U'}</span>
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-sm font-semibold text-gray-900 leading-tight">{userName}</p>
                                <p className="text-xs text-gray-400">{isOwner ? 'Agency Owner' : 'Agent'}</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="p-4 md:p-7">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                        {renderContent()}
                    </motion.div>
                </main>
            </div>
        </div>
    );
};

export default AgencyDashboard;
