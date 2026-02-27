import React, { useState } from 'react';
import { Search, MapPin, Home, Key } from 'lucide-react';
import { motion } from 'framer-motion';

const FloatingSearch = () => {
    return (
        <div className="relative -mt-16 md:-mt-8 z-40 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="max-w-4xl mx-auto bg-white rounded-xl shadow-premium p-4 md:p-2 flex flex-col md:flex-row gap-4 items-center"
            >
                {/* Location Dropdown */}
                <div className="flex-1 w-full md:border-r border-gray-100 px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3 mb-1">
                        <MapPin className="w-5 h-5 text-primary" />
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</span>
                    </div>
                    <select className="w-full bg-transparent font-medium text-text outline-none cursor-pointer appearance-none group-hover:bg-gray-50">
                        <option>All Locations</option>
                        <option>Mumbai, India</option>
                        <option>New York, USA</option>
                        <option>London, UK</option>
                    </select>
                </div>

                {/* Property Type */}
                <div className="flex-1 w-full md:border-r border-gray-100 px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3 mb-1">
                        <Home className="w-5 h-5 text-primary" />
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Property Type</span>
                    </div>
                    <select className="w-full bg-transparent font-medium text-text outline-none cursor-pointer appearance-none group-hover:bg-gray-50">
                        <option>All Types</option>
                        <option>Apartment</option>
                        <option>Villa</option>
                        <option>Office Space</option>
                    </select>
                </div>

                {/* Status */}
                <div className="flex-1 w-full px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3 mb-1">
                        <Key className="w-5 h-5 text-primary" />
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</span>
                    </div>
                    <select className="w-full bg-transparent font-medium text-text outline-none cursor-pointer appearance-none group-hover:bg-gray-50">
                        <option>Any Status</option>
                        <option>For Sale</option>
                        <option>For Rent</option>
                    </select>
                </div>

                {/* Search Button */}
                <button className="w-full md:w-auto bg-primary hover:bg-red-700 text-white p-4 rounded-lg shadow-lg shadow-primary/30 transition-all transform hover:scale-105 flex items-center justify-center">
                    <Search className="w-6 h-6" />
                </button>
            </motion.div>
        </div>
    );
};

export default FloatingSearch;
