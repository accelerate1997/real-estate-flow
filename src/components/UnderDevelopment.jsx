import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Heart, ArrowRight, Loader2, Home, Construction } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LeadModal from './LeadModal';
import PropertyCard from './PropertyCard';
import { pb } from '../services/pocketbase';

const UnderDevelopment = () => {
    const navigate = useNavigate();
    const [properties, setProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedProperty, setSelectedProperty] = useState(null);

    // Filter states
    const [possessionFilter, setPossessionFilter] = useState('Possession Year');
    const [stageFilter, setStageFilter] = useState('Construction Stage');

    useEffect(() => {
        const fetchProperties = async () => {
            setIsLoading(true);
            try {
                // Fetch only NewProjects properties
                const records = await pb.collection('properties').getFullList({
                    filter: `propertyCategory = "NewProjects"`,
                });
                const sortedRecords = records.sort((a, b) => new Date(b.created) - new Date(a.created));
                setProperties(sortedRecords);
            } catch (error) {
                console.error("Error fetching new projects:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProperties();
    }, []);

    // Helper Functions
    const formatCurrency = (amount) => {
        if (!amount) return 'Price on Request';
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    const getImageUrl = (property) => {
        const imageList = Array.isArray(property.images)
            ? property.images
            : (typeof property.images === 'string' && property.images.trim() !== '' ? [property.images] : []);

        if (imageList.length > 0) {
            return pb.files.getURL(property, imageList[0], { token: pb.authStore.token });
        }
        return "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2670&auto=format&fit=crop"; // Default fallback
    };

    // Calculate a mock progress percentage based on status for visual effect,
    // since PocketBase doesn't have a direct 'progress' integer field by default.
    const getProgress = (status) => {
        if (!status) return 0;
        const s = status.toLowerCase();
        if (s.includes('pre-launch') || s.includes('pre launch')) return 10;
        if (s.includes('under construction')) return 50;
        if (s.includes('nearing') || s.includes('almost')) return 85;
        if (s.includes('ready') || s.includes('completed')) return 100;
        return 30; // default generic progress
    };

    // Apply Filters
    const filteredProperties = properties.filter(p => {
        let matchesPossession = true;
        let matchesStage = true;

        if (possessionFilter !== 'Possession Year') {
            const yearStr = possessionFilter.replace('+', '');
            matchesPossession = (p.possessionDate || p.possessionStatus || '').includes(yearStr);
        }

        if (stageFilter !== 'Construction Stage') {
            const stageLower = stageFilter.toLowerCase();
            matchesStage = (p.constructionStatus || '').toLowerCase().includes(stageLower);
        }

        return matchesPossession && matchesStage;
    });

    const handlePropertyClick = (property) => {
        setSelectedProperty(property);
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-32 pb-20">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumbs */}
                <nav className="flex text-sm text-gray-500 mb-6">
                    <a href="/" className="hover:text-primary transition-colors">Home</a>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900 font-medium">New Projects</span>
                </nav>

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-gray-200 pb-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-2">Exclusive New & Under Development Projects</h1>
                        <p className="text-gray-600">Invest in tomorrow's landmarks today.</p>
                    </div>
                    {/* Filters */}
                    <div className="flex gap-4 mt-6 md:mt-0">
                        <select
                            value={possessionFilter}
                            onChange={(e) => setPossessionFilter(e.target.value)}
                            className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg focus:outline-none focus:border-primary cursor-pointer hover:border-gray-400"
                        >
                            <option>Possession Year</option>
                            <option>2026</option>
                            <option>2027</option>
                            <option>2028+</option>
                        </select>
                        <select
                            value={stageFilter}
                            onChange={(e) => setStageFilter(e.target.value)}
                            className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg focus:outline-none focus:border-primary cursor-pointer hover:border-gray-400"
                        >
                            <option>Construction Stage</option>
                            <option>Pre-Launch</option>
                            <option>Under Construction</option>
                            <option>Nearing Possession</option>
                        </select>
                    </div>
                </div>

                {/* Grid */}
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                ) : filteredProperties.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
                        <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Projects Found</h3>
                        <p className="text-gray-500 max-w-md mx-auto">We couldn't find any new development projects matching your criteria.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredProperties.map((property) => (
                            <PropertyCard 
                                key={property.id} 
                                property={{
                                    ...property,
                                    images: [getImageUrl(property)]
                                }} 
                                onClick={() => navigate(`/property/${property.id}`)}
                            />
                        ))}
                    </div>
                )}
            </div>
            <LeadModal
                isOpen={!!selectedProperty}
                onClose={() => setSelectedProperty(null)}
                property={selectedProperty}
            />
        </div>
    );
};

export default UnderDevelopment;
