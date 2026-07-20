import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, User, Home, Clock, CheckCircle, XCircle, AlertCircle, Loader2, Phone, Share2 } from 'lucide-react';
import { pb } from '../services/pocketbase';

const SiteVisits = () => {
    const [visits, setVisits] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const currentUser = pb.authStore.model;
    const agencyId = currentUser?.agencyId || currentUser?.id;

    useEffect(() => {
        fetchVisits();
    }, [agencyId]);

    const fetchVisits = async () => {
        setIsLoading(true);
        try {
            const aid = agencyId.replace("Agency_", "");
            const result = await pb.collection('site_visits').getFullList({
                filter: `agency_id = "${aid}"`,
                expand: 'lead,property',
                sort: '-visit_date'
            });
            setVisits(result);
        } catch (error) {
            console.error("Error fetching site visits:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateStatus = async (visitId, newStatus) => {
        try {
            await pb.collection('site_visits').update(visitId, { status: newStatus });
            setVisits(visits.map(v => v.id === visitId ? { ...v, status: newStatus } : v));
        } catch (error) {
            console.error("Error updating visit status:", error);
        }
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'Scheduled':  return { cls: 'dash-badge-scheduled',  label: 'Scheduled',  border: 'border-l-blue-400' };
            case 'Completed':  return { cls: 'dash-badge-completed',  label: 'Completed',  border: 'border-l-green-500' };
            case 'Cancelled':  return { cls: 'dash-badge-cancelled',  label: 'Cancelled',  border: 'border-l-gray-400' };
            case 'No Show':    return { cls: 'dash-badge-noshow',     label: 'No Show',    border: 'border-l-primary' };
            default:           return { cls: 'dash-badge-cancelled',  label: status,       border: 'border-l-gray-400' };
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                <p className="text-sm text-gray-400 font-medium">Loading your visit schedule...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="section-title">Site Visits</h2>
                    <p className="section-subtitle">Manage and track property walkthroughs</p>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-gray-100 shadow-sm">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-gray-700">{visits.length} Total Visits</span>
                </div>
            </div>

            {visits.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <Calendar className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">No visits scheduled</h3>
                    <p className="text-sm text-gray-500 max-w-xs mx-auto">
                        Site visits scheduled through your AI agents or manually will appear here.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {visits.map((visit, index) => {
                        const config = getStatusConfig(visit.status);
                        return (
                            <motion.div
                                key={visit.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.06 }}
                                className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden
                                            hover:shadow-md transition-all duration-300 border-l-4 ${config.border}`}
                            >
                                {/* Card Header */}
                                <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className={`dash-badge ${config.cls}`}>{config.label}</span>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(visit.visit_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => updateStatus(visit.id, 'Completed')}
                                            className="p-1.5 hover:bg-green-50 text-gray-400 hover:text-green-600 rounded-lg transition-colors"
                                            title="Mark as Completed"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => updateStatus(visit.id, 'Cancelled')}
                                            className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                                            title="Mark as Cancelled"
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-5 space-y-4">
                                    {/* Lead */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                                            <User className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Lead</p>
                                            <p className="font-bold text-gray-900 text-sm">{visit.expand?.lead?.name || 'Unknown'}</p>
                                            <p className="text-xs text-gray-500">{visit.expand?.lead?.phone}</p>
                                        </div>
                                    </div>

                                    {/* Property */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-accent-teal/10 rounded-xl flex items-center justify-center shrink-0">
                                            <Home className="w-4 h-4 text-accent-teal" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Property</p>
                                            <p className="font-bold text-gray-900 text-sm">{visit.expand?.property?.title || 'Unknown'}</p>
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <MapPin className="w-3 h-3" />
                                                {visit.expand?.property?.location}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    {visit.notes && (
                                        <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" /> Notes
                                            </p>
                                            <p className="text-xs text-gray-600 italic">"{visit.notes}"</p>
                                        </div>
                                    )}
                                </div>

                                {/* Card Footer */}
                                <div className="px-5 py-3 bg-gray-50/60 border-t border-gray-100 flex gap-3">
                                    {visit.expand?.lead?.phone ? (
                                        <a
                                            href={`tel:${visit.expand.lead.phone}`}
                                            className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold py-2 rounded-xl text-xs hover:bg-gray-50 transition-colors shadow-sm"
                                        >
                                            <Phone className="w-3.5 h-3.5" /> Call Lead
                                        </a>
                                    ) : (
                                        <button
                                            disabled
                                            className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-150 text-gray-400 font-semibold py-2 rounded-xl text-xs cursor-not-allowed opacity-50"
                                        >
                                            <Phone className="w-3.5 h-3.5" /> No Phone
                                        </button>
                                    )}
                                    {visit.expand?.property?.location ? (
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(visit.expand.property.location)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 flex items-center justify-center gap-2 bg-accent-teal/10 border border-accent-teal/20 text-accent-teal font-semibold py-2 rounded-xl text-xs hover:bg-accent-teal/20 transition-colors"
                                        >
                                            <Share2 className="w-3.5 h-3.5" /> View Map
                                        </a>
                                    ) : (
                                        <button
                                            disabled
                                            className="flex-1 flex items-center justify-center gap-2 bg-accent-teal/5 border border-accent-teal/10 text-accent-teal/50 font-semibold py-2 rounded-xl text-xs cursor-not-allowed opacity-50"
                                        >
                                            <Share2 className="w-3.5 h-3.5" /> No Location
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SiteVisits;
