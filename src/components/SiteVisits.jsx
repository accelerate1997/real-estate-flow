import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, User, Home, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
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
            // We can fetch directly from PocketBase since we have 'pb' here
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

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Scheduled': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'Cancelled': return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'No Show': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-gray-500 font-medium">Loading your site visits schedule...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Site Visits</h2>
                    <p className="text-gray-500">Manage and track property walkthroughs</p>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm text-sm font-medium text-gray-600">
                    <Calendar className="w-4 h-4 text-primary" />
                    {visits.length} Total Visits
                </div>
            </div>

            {visits.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">No visits scheduled yet</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mt-1">
                        Site visits scheduled through your AI agents or manually will appear here.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {visits.map((visit) => (
                        <motion.div
                            key={visit.id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyles(visit.status)}`}>
                                            {visit.status}
                                        </div>
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
                                            <CheckCircle className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={() => updateStatus(visit.id, 'Cancelled')}
                                            className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                                            title="Mark as Cancelled"
                                        >
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                                            <User className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Lead</p>
                                            <p className="font-bold text-gray-900">{visit.expand?.lead?.name || 'Unknown'}</p>
                                            <p className="text-sm text-gray-500">{visit.expand?.lead?.phone}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                                            <Home className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Property</p>
                                            <p className="font-bold text-gray-900">{visit.expand?.property?.title || 'Unknown'}</p>
                                            <div className="flex items-center gap-1 text-sm text-gray-500">
                                                <MapPin className="w-3.5 h-3.5" />
                                                {visit.expand?.property?.location}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {visit.notes && (
                                    <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-xs text-gray-400 font-medium uppercase mb-1 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> Notes
                                        </p>
                                        <p className="text-sm text-gray-600 italic">"{visit.notes}"</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                                <button className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors shadow-sm">
                                    Call Lead
                                </button>
                                <button className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors shadow-sm">
                                    Share Location
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SiteVisits;
