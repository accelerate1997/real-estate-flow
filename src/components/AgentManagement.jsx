import React, { useState, useEffect } from 'react';
import { UserPlus, MoreVertical, Loader2, Copy, Check, Power, PowerOff } from 'lucide-react';
import { pb } from '../services/pocketbase';

const AgentManagement = () => {
    const [agents, setAgents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [inviteLink, setInviteLink] = useState(null);
    const [copied, setCopied] = useState(false);

    // Determine current user context
    const currentUser = pb.authStore.model;
    const isOwner = currentUser?.role !== 'agent';
    // If the user is the owner, the agencyId is their own ID. Otherwise it's the agencyId they are assigned to.
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
            // Fetch users who are agents and belong to the target agency
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

            // Optimistic update
            setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, isActive: newStatus } : a));

            await pb.collection('users').update(agent.id, { isActive: newStatus });
        } catch (error) {
            console.error("Error toggling agent status:", error);
            alert("Failed to update agent status. Please check permissions.");
            fetchAgents(); // Revert on failure
        }
    };

    const generateInvite = async () => {
        if (!isOwner) return;
        setIsGenerating(true);
        try {
            // Create a unique token
            const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

            // Set expiration to 7 days from now
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            // Save invite to database
            await pb.collection('invites').create({
                token: token,
                agencyId: currentUser.id,
                status: 'pending',
                expiresAt: expiresAt.toISOString(),
            });

            // Construct link (assumes frontend is running on current origin)
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                <h2 className="text-2xl font-bold text-gray-900">
                    {isOwner ? "Manage Agents" : "Agency Directory"}
                </h2>
                {isOwner && (
                    <button
                        onClick={generateInvite}
                        disabled={isGenerating}
                        className="flex items-center justify-center w-full sm:w-auto gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors shadow-sm disabled:opacity-70"
                    >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        Add Agent
                    </button>
                )}
            </div>

            {/* Invite Link Modal / Alert */}
            {inviteLink && isOwner && (
                <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h4 className="font-bold mb-1">Invite Link Generated!</h4>
                        <p className="text-sm">Share this unique link with your agent. It expires in 7 days.</p>
                        <code className="block mt-2 bg-white px-3 py-1 rounded border border-green-100 text-xs sm:text-sm break-all">
                            {inviteLink}
                        </code>
                    </div>
                    <button
                        onClick={copyToClipboard}
                        className="flex-shrink-0 flex items-center gap-2 bg-white border border-green-200 hover:bg-green-100 text-green-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied' : 'Copy Link'}
                    </button>
                </div>
            )}

            {/* Agents List / Table Area */}
            {isLoading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500 flex justify-center items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    Loading agents...
                </div>
            ) : agents.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
                    {isOwner
                        ? 'No agents found. Click "Add Agent" to generate an invite link.'
                        : 'No other agents found in your agency.'}
                </div>
            ) : (
                <>
                    {/* Mobile Card Layout */}
                    <div className="md:hidden space-y-4">
                        {agents.map((agent) => (
                            <div key={agent.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                            {agent.name || agent.username}
                                            {agent.id === currentUser.id && <span className="text-[10px] bg-red-100 text-primary px-2 py-0.5 rounded-full font-bold uppercase">You</span>}
                                        </h3>
                                        <p className="text-sm text-gray-500">{agent.email}</p>
                                    </div>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${agent.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {agent.isActive !== false ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center border-t border-gray-50 pt-3">
                                    <div className="flex gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">Listings:</span> <span className="font-bold text-gray-900">0</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Leads:</span> <span className="font-bold text-gray-900">0</span>
                                        </div>
                                    </div>
                                    {isOwner && agent.id !== currentUser.id && (
                                        <button
                                            onClick={() => toggleAgentStatus(agent)}
                                            className={`p-1.5 rounded-lg transition-colors ${agent.isActive !== false ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-green-500 hover:bg-green-50'}`}
                                        >
                                            {agent.isActive !== false ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table Layout */}
                    <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto w-full">
                            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[600px]">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
                                        <th className="px-6 py-4">Agent Name</th>
                                        <th className="px-6 py-4">Email</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-center">Listings</th>
                                        <th className="px-6 py-4 text-center">Leads</th>
                                        {isOwner && <th className="px-6 py-4 text-right">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {agents.map((agent) => (
                                        <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {agent.name || agent.username}
                                                {agent.id === currentUser.id && <span className="ml-2 text-xs bg-red-100 text-primary px-2 py-0.5 rounded-full font-bold">You</span>}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-sm">{agent.email}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${agent.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {agent.isActive !== false ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-gray-900 font-medium">0</td>
                                            <td className="px-6 py-4 text-center text-gray-900 font-medium">0</td>
                                            {isOwner && (
                                                <td className="px-6 py-4 text-right">
                                                    {agent.id !== currentUser.id && (
                                                        <button
                                                            onClick={() => toggleAgentStatus(agent)}
                                                            title={agent.isActive !== false ? "Deactivate Agent" : "Activate Agent"}
                                                            className={`p-2 rounded-lg transition-colors ${agent.isActive !== false ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-green-500 hover:bg-green-50'}`}
                                                        >
                                                            {agent.isActive !== false ? <PowerOff className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                                                        </button>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
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
