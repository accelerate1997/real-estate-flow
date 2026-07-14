import React, { useState, useEffect } from 'react';
import { UserPlus, Loader2, Copy, Check, Power, PowerOff, Users } from 'lucide-react';
import { pb } from '../services/pocketbase';

const AgentManagement = () => {
    const [agents, setAgents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [inviteLink, setInviteLink] = useState(null);
    const [copied, setCopied] = useState(false);

    const currentUser = pb.authStore.model;
    const isOwner = currentUser?.role !== 'agent';
    const targetAgencyId = isOwner ? currentUser.id : currentUser?.agencyId;

    useEffect(() => {
        if (targetAgencyId) {
            fetchAgents();
        } else {
            setIsLoading(false);
        }
    }, [targetAgencyId]);

    const fetchAgents = async () => {
        setIsLoading(true);
        console.log("AgentManagement -> fetchAgents starting");
        console.log("currentUser:", currentUser);
        console.log("isOwner:", isOwner, "targetAgencyId:", targetAgencyId);

        try {
            const filterStr = `role = "agent" && (agencyId = "${targetAgencyId}" || agencyId ?= "${targetAgencyId}")`;
            console.log("Querying PB with filter:", filterStr);

            const records = await pb.collection('users').getFullList({
                filter: `role = "agent" && agencyId = "${targetAgencyId}"`,
            });
            const sortedRecords = records.sort((a, b) => new Date(b.created) - new Date(a.created));
            console.log("Records received:", records);
            setAgents(sortedRecords);
        } catch (error) {
            console.error('Error fetching agents:', error);
            if (error.response) {
                console.error("PB Error Response:", error.response);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const toggleAgentStatus = async (agent) => {
        try {
            const newStatus = agent.isActive === false ? true : false;
            setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, isActive: newStatus } : a));
            await pb.collection('users').update(agent.id, { isActive: newStatus });
        } catch (error) {
            console.error("Error toggling agent status:", error);
            alert("Failed to update agent status. Please check permissions.");
            fetchAgents();
        }
    };

    const generateInvite = async () => {
        if (!isOwner) return;
        setIsGenerating(true);
        try {
            const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            await pb.collection('invites').create({
                token,
                agencyId: currentUser.id,
                status: 'pending',
                expiresAt: expiresAt.toISOString(),
            });

            const link = `${window.location.origin}/invite?token=${token}`;
            setInviteLink(link);
            setCopied(false);
        } catch (error) {
            console.error('Error generating invite:', error);
            alert("Could not generate invite link. Ensure invites collection exists and rules are configured.");
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Agent avatar with initials
    const AgentAvatar = ({ name, isYou }) => (
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0
                         ${isYou ? 'bg-primary/15 text-primary' : 'bg-gray-100 text-gray-600'}`}>
            {(name || '?').charAt(0).toUpperCase()}
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="section-title">{isOwner ? "Manage Agents" : "Agency Directory"}</h2>
                    <p className="section-subtitle">{agents.length} {agents.length === 1 ? 'agent' : 'agents'} in your agency</p>
                </div>
                {isOwner && (
                    <button
                        onClick={generateInvite}
                        disabled={isGenerating}
                        className="btn-dash-primary disabled:opacity-60"
                    >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        {isGenerating ? 'Generating...' : 'Invite Agent'}
                    </button>
                )}
            </div>

            {/* Invite Link Banner */}
            {inviteLink && isOwner && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                            <UserPlus className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 mb-0.5">Invite Link Generated!</h4>
                            <p className="text-sm text-gray-600 mb-2">Share this unique link with your agent. It expires in 7 days.</p>
                            <code className="block bg-white px-3 py-2 rounded-xl border border-emerald-100 text-xs text-gray-700 break-all shadow-sm">
                                {inviteLink}
                            </code>
                        </div>
                    </div>
                    <button
                        onClick={copyToClipboard}
                        className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
                                   ${copied
                                       ? 'bg-emerald-600 text-white'
                                       : 'bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                </div>
            )}

            {/* Agent List */}
            {isLoading ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                    <p className="text-sm text-gray-400 font-medium">Loading agents...</p>
                </div>
            ) : agents.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <Users className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">
                        {isOwner ? 'No agents yet' : 'No other agents found'}
                    </h3>
                    <p className="text-sm text-gray-500 max-w-xs mx-auto mb-5">
                        {isOwner
                            ? 'Click "Invite Agent" to generate a one-time invite link and grow your team.'
                            : 'No other agents are registered in your agency.'}
                    </p>
                    {isOwner && (
                        <button onClick={generateInvite} disabled={isGenerating} className="btn-dash-primary">
                            <UserPlus className="w-4 h-4" /> Invite First Agent
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                        {agents.map((agent) => {
                            const isYou = agent.id === currentUser.id;
                            const isActive = agent.isActive !== false;
                            return (
                                <div key={agent.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <AgentAvatar name={agent.name || agent.username} isYou={isYou} />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-gray-900 text-sm">{agent.name || agent.username}</h3>
                                                    {isYou && (
                                                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase">You</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500">{agent.email}</p>
                                            </div>
                                        </div>
                                        <span className={`dash-badge ${isActive ? 'dash-badge-active' : 'dash-badge-inactive'}`}>
                                            {isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-gray-50 pt-3">
                                        <div className="flex gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-500 text-xs">Listings:</span>
                                                <span className="font-bold text-gray-900 ml-1">0</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 text-xs">Leads:</span>
                                                <span className="font-bold text-gray-900 ml-1">0</span>
                                            </div>
                                        </div>
                                        {isOwner && !isYou && (
                                            <button
                                                onClick={() => toggleAgentStatus(agent)}
                                                className={`p-2 rounded-xl transition-all ${isActive
                                                    ? 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                                                    : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                                                title={isActive ? 'Deactivate' : 'Activate'}
                                            >
                                                {isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto w-full">
                            <table className="dash-table">
                                <thead>
                                    <tr>
                                        <th>Agent</th>
                                        <th>Email</th>
                                        <th className="text-center">Status</th>
                                        <th className="text-center">Listings</th>
                                        <th className="text-center">Leads</th>
                                        {isOwner && <th className="text-right">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {agents.map((agent) => {
                                        const isYou = agent.id === currentUser.id;
                                        const isActive = agent.isActive !== false;
                                        return (
                                            <tr key={agent.id}>
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <AgentAvatar name={agent.name || agent.username} isYou={isYou} />
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-semibold text-gray-900">{agent.name || agent.username}</span>
                                                                {isYou && (
                                                                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">You</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-gray-500">{agent.email}</td>
                                                <td className="text-center">
                                                    <span className={`dash-badge ${isActive ? 'dash-badge-active' : 'dash-badge-inactive'}`}>
                                                        {isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="text-center font-semibold">0</td>
                                                <td className="text-center font-semibold">0</td>
                                                {isOwner && (
                                                    <td className="text-right">
                                                        {!isYou && (
                                                            <button
                                                                onClick={() => toggleAgentStatus(agent)}
                                                                title={isActive ? "Deactivate Agent" : "Activate Agent"}
                                                                className={`p-2 rounded-xl transition-all ${isActive
                                                                    ? 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                                                                    : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                                                            >
                                                                {isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                                                            </button>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AgentManagement;
