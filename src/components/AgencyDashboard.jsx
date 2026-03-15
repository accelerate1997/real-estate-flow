import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Users, Settings, LogOut,
    Menu, X, DollarSign, UserPlus, MoreVertical, Home, Loader2
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
import { Target, Calendar } from 'lucide-react';

// Removed mock data

const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen, onLogout, isOwner }) => {
    const links = [
        { name: 'Overview', icon: LayoutDashboard, id: 'overview' },
        { name: 'Leads', icon: Target, id: 'leads' },
        { name: 'Properties', icon: Home, id: 'properties' },
        { name: 'Smart Matches', icon: Target, id: 'matches' },
        { name: 'Site Visits', icon: Calendar, id: 'visits' },
        { name: isOwner ? 'Manage Agents' : 'Agency Directory', icon: Users, id: 'agents' },
    ];

    if (isOwner) {
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
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.div
                className={`fixed left-0 top-0 h-full bg-white border-r border-gray-100 w-64 z-50 transform md:translate-x-0 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                    <span className="text-xl font-bold text-primary">RR Agency</span>
                    <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-500">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="p-4 space-y-1">
                    {links.map((link) => (
                        <button
                            key={link.id}
                            onClick={() => { setActiveTab(link.id); setIsOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === link.id
                                ? 'bg-red-50 text-primary'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <link.icon className="w-5 h-5" />
                            {link.name}
                        </button>
                    ))}
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-gray-50">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </motion.div>
        </>
    );
};

const DashboardOverview = ({ currentUser, isOwner }) => {
    const [stats, setStats] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                // Determine the scope of data based on role
                const targetId = isOwner ? currentUser.id : currentUser?.agencyId;
                const propertyFilter = isOwner ? `agencyId = "${targetId}"` : `createdBy = "${currentUser.id}"`;

                // Leads currently only have an agencyId. If an agent creates them, there is no createdBy in the schema, 
                // so we show agency-wide leads for agents as well until a lead assignment system is built.
                const leadFilter = `agencyId = "${targetId}"`;

                // Fetch total counts manually since PB getList doesn't just return count without items payload
                // but we can limit items to 1 and just read totalItems
                const [propertiesList, leadsList] = await Promise.all([
                    pb.collection('properties').getList(1, 1, { filter: propertyFilter }),
                    pb.collection('leads').getList(1, 1, { filter: leadFilter })
                ]);

                const newStats = [
                    { title: 'Total Properties', value: propertiesList.totalItems.toString(), icon: Home, color: 'bg-blue-500' },
                    { title: 'Total Leads', value: leadsList.totalItems.toString(), icon: Target, color: 'bg-green-500' }
                ];

                if (isOwner) {
                    const agentFilter = `role = "agent" && (agencyId = "${targetId}" || agencyId ?= "${targetId}")`;
                    const agentsList = await pb.collection('users').getList(1, 1, { filter: agentFilter });
                    newStats.push({ title: 'Total Agents', value: agentsList.totalItems.toString(), icon: Users, color: 'bg-primary' });
                }

                setStats(newStats);

                // Calculate Last 7 Days Lead Growth
                const today = new Date();
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(today.getDate() - 6);
                sevenDaysAgo.setHours(0, 0, 0, 0);

                // Format for PB: '2022-01-01 00:00:00.000Z'
                const dateFilterString = sevenDaysAgo.toISOString().replace('T', ' ');

                // Using safe pb.filter to bind strings directly without quote escaping issues
                const recentLeadsFilter = pb.filter(`agencyId = {:targetId} && created >= {:dateFilterString}`, {
                    targetId: targetId,
                    dateFilterString: dateFilterString
                });

                // Fetch up to 500 recent leads (assuming reasonable volume per week)
                const recentLeads = await pb.collection('leads').getFullList({
                    filter: recentLeadsFilter,
                    sort: '-id'
                });

                // Initialize days array (Last 7 days, ending today)
                const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const leadCountsByDay = {};

                // Setup the 7 day structure to ensure zeros for empty days
                const newChartData = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(today.getDate() - i);
                    const dayString = daysOfWeek[d.getDay()];
                    const dateKey = d.toISOString().split('T')[0];
                    leadCountsByDay[dateKey] = { name: (i === 0 ? 'Today' : dayString), leads: 0 };
                    newChartData.push(leadCountsByDay[dateKey]);
                }

                // Bucket leads into days
                recentLeads.forEach(lead => {
                    const leadDateKey = lead.created.split(' ')[0]; // Pocketbase dates are "YYYY-MM-DD HH:mm:ss.SSSZ"
                    if (leadCountsByDay[leadDateKey]) {
                        leadCountsByDay[leadDateKey].leads++;
                    }
                });

                setChartData(newChartData);

            } catch (error) {
                console.error("Error fetching dashboard analytics:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (currentUser) {
            fetchDashboardData();
        }
    }, [currentUser, isOwner]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-gray-500 font-medium">Crunching your real estate data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</h3>
                            </div>
                            <div className={`p-3 rounded-xl bg-opacity-10 ${stat.color.replace('bg-', 'bg-opacity-10 text-')}`}>
                                <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Lead Growth (Last 7 Days)</h3>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                            <Tooltip
                                cursor={{ fill: '#F3F4F6' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Bar dataKey="leads" fill="#CC0000" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

const AgencyDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Lazy initialization to check localStorage immediately and avoid "Loading..." flash
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

    // Effect for updates if localStorage changes externally (optional but good practice)
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser.name !== userName) {
                    setUserName(parsedUser.name);
                }
            } catch (e) {
                // Ignore parse errors
            }
        }
    }, []);

    const handleLogout = () => {
        // 1. Clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // 2. Call backend logout (fire and forget for now to ensure UI redirect speed)
        // fetch('/api/logout', { method: 'POST', headers: { ... } });

        // 3. Redirect immediately
        navigate('/login');
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return <DashboardOverview currentUser={currentUser} isOwner={isOwner} />;
            case 'leads': return <LeadManagement />;
            case 'properties': return <PropertyManagement />;
            case 'matches': return <SmartMatches />;
            case 'visits': return <SiteVisits />;
            case 'agents': return <AgentManagement />;
            case 'settings': return isOwner ? <AgencySettings /> : <div className="p-10 text-center text-red-500 font-bold text-xl mt-12">Access Denied: Owner Privileges Required</div>;
            default: return <div className="p-10 text-center text-gray-500">Module under development</div>;
        }
    };

    const currentUser = pb.authStore.model;
    const isOwner = currentUser?.role !== 'agent';

    return (
        <div className="min-h-screen bg-[#F9FAFB] font-sans flex">
            {/* Sidebar Component */}
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
                onLogout={handleLogout}
                isOwner={isOwner}
            />

            {/* Main Content */}
            <div className="flex-1 md:ml-64 transition-all duration-300">
                {/* Dashboard Header */}
                <header className="bg-white border-b border-gray-100 h-16 px-4 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-500">
                            <Menu className="w-6 h-6" />
                        </button>
                        <h1 className="text-lg font-semibold text-gray-900 capitalize">{activeTab?.replace('-', ' ')}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                {userName?.charAt(0) || 'U'}
                            </div>
                            <span className="text-sm font-medium text-gray-700 hidden sm:block">{userName}</span>
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <main className="p-4 md:p-8">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {renderContent()}
                    </motion.div>
                </main>
            </div>
        </div>
    );
};

export default AgencyDashboard;
