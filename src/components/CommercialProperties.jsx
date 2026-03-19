import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Building2, Square, ArrowRight, Filter, Loader2, Home, Heart, Ruler, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LeadModal from './LeadModal';
import PropertyCard from './PropertyCard';
import { pb } from '../services/pocketbase';

const CommercialProperties = () => {
    const navigate = useNavigate();
    const [properties, setProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedProperty, setSelectedProperty] = useState(null);

    // Filter states
    const [typeFilter, setTypeFilter] = useState('Property Type');
    const [areaFilter, setAreaFilter] = useState('Min Area (sqft)');

    useEffect(() => {
        const fetchProperties = async () => {
            setIsLoading(true);
            try {
                // Fetch only commercial properties
                const records = await pb.collection('properties').getFullList({
                    filter: `propertyCategory = "Commercial"`,
                    sort: '-id'
                });
                console.log("CommercialProperties: Fetched records:", records.length, records);
                setProperties(records);
            } catch (error) {
                console.error("Error fetching commercial properties:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProperties();
    }, []);

    // Helper Functions
    const formatCurrency = (amount) => {
        if (!amount) return 'Contact for Price';
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    const getImageUrl = (property) => {
        const imageList = Array.isArray(property.images)
            ? property.images
            : (typeof property.images === 'string' && property.images.trim() !== '' ? [property.images] : []);

        if (imageList.length > 0) {
            return pb.files.getURL(property, imageList[0], { token: pb.authStore.token });
        }
        return "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2669&auto=format&fit=crop"; // Default fallback
    };

    // Apply Filters
    const filteredProperties = properties.filter(p => {
        let matchesType = true;
        let matchesArea = true;

        if (typeFilter !== 'Property Type') {
            // Rough match on business type suitability or tags since "Property Type" in the dropdown is generic (Office Space, Retail Shop, Warehouse)
            const searchStr = `${p.businessTypeSuitability || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
            const filterStr = typeFilter.split(' ')[0].toLowerCase(); // e.g., "Office", "Retail", "Warehouse"
            matchesType = searchStr.includes(filterStr);
        }

        if (areaFilter !== 'Min Area (sqft)') {
            const minArea = parseInt(areaFilter.replace('+', ''), 10);
            matchesArea = p.carpetArea >= minArea || p.builtUpArea >= minArea;
        }

        return matchesType && matchesArea;
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
                    <span className="text-gray-900 font-medium">Commercial Properties</span>
                </nav>

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-gray-200 pb-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-2">Premium Commercial Spaces & Offices</h1>
                        <p className="text-gray-600">Strategic locations for your business growth.</p>
                    </div>
                    {/* Filters */}
                    <div className="flex gap-4 mt-6 md:mt-0">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-none focus:outline-none focus:border-primary cursor-pointer hover:border-gray-400"
                        >
                            <option>Property Type</option>
                            <option>Office Space</option>
                            <option>Retail Shop</option>
                            <option>Warehouse</option>
                        </select>
                        <select
                            value={areaFilter}
                            onChange={(e) => setAreaFilter(e.target.value)}
                            className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-none focus:outline-none focus:border-primary cursor-pointer hover:border-gray-400"
                        >
                            <option>Min Area (sqft)</option>
                            <option>1000+</option>
                            <option>2500+</option>
                            <option>5000+</option>
                        </select>
                    </div>
                </div>

                {/* Grid */}
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                ) : filteredProperties.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-gray-200 p-8 shadow-sm">
                        <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Properties Found</h3>
                        <p className="text-gray-500 max-w-md mx-auto">We couldn't find any commercial properties matching your criteria. Please adjust your filters.</p>
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

export default CommercialProperties;
