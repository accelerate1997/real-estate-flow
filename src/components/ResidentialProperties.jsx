import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, BedDouble, Bath, Square, Heart, ArrowRight, Filter, Loader2, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LeadModal from './LeadModal';
import PropertyCard from './PropertyCard';
import { pb } from '../services/pocketbase';

const ResidentialProperties = () => {
    const navigate = useNavigate();
    const [properties, setProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedProperty, setSelectedProperty] = useState(null);

    // Filter states
    const [bhkFilter, setBhkFilter] = useState('BHK Type');
    const [furnishingFilter, setFurnishingFilter] = useState('Furnishing Status');

    useEffect(() => {
        const fetchProperties = async () => {
            setIsLoading(true);
            try {
                // Fetch only residential properties
                const records = await pb.collection('properties').getFullList({
                    filter: `propertyCategory = "Residential"`,
                    sort: '-id'
                });
                console.log("ResidentialProperties: Fetched records:", records.length, records);
                setProperties(records);
            } catch (error) {
                console.error("Error fetching residential properties:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProperties();
    }, []);

    // Helper Functions
    const formatCurrency = (amount) => {
        if (!amount) return 'Ask for Price';
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    const getImageUrl = (property) => {
        const imageList = Array.isArray(property.images)
            ? property.images
            : (typeof property.images === 'string' && property.images.trim() !== '' ? [property.images] : []);

        if (imageList.length > 0) {
            return pb.files.getURL(property, imageList[0], { token: pb.authStore.token });
        }
        return "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2675&auto=format&fit=crop"; 
    };

    const handlePropertyClick = (property) => {
        setSelectedProperty(property);
    };

    // Apply Filters
    const filteredProperties = properties.filter(p => {
        let matchesBhk = true;
        let matchesFurnishing = true;

        if (bhkFilter !== 'BHK Type') {
            matchesBhk = p.bhkType === bhkFilter || p.bhkType?.includes(bhkFilter.split(' ')[0]);
        }
        if (furnishingFilter !== 'Furnishing Status') {
            matchesFurnishing = p.furnishing === furnishingFilter;
        }

        return matchesBhk && matchesFurnishing;
    });

    return (
        <div className="min-h-screen bg-gray-50 pt-32 pb-20">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumbs */}
                <nav className="flex text-sm text-gray-500 mb-6">
                    <a href="/" className="hover:text-primary transition-colors">Home</a>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900 font-medium">Residential Properties</span>
                </nav>

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-gray-200 pb-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-2">Luxury Residential Homes & Apartments</h1>
                        <p className="text-gray-600">Discover your dream home from our curated collection.</p>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-4 mt-6 md:mt-0">
                        <select
                            value={bhkFilter}
                            onChange={(e) => setBhkFilter(e.target.value)}
                            className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg focus:outline-none focus:border-primary cursor-pointer hover:border-gray-400"
                        >
                            <option>BHK Type</option>
                            <option>1 BHK</option>
                            <option>2 BHK</option>
                            <option>3 BHK</option>
                            <option>4+ BHK</option>
                        </select>
                        <select
                            value={furnishingFilter}
                            onChange={(e) => setFurnishingFilter(e.target.value)}
                            className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg focus:outline-none focus:border-primary cursor-pointer hover:border-gray-400"
                        >
                            <option>Furnishing Status</option>
                            <option>Fully Furnished</option>
                            <option>Semi Furnished</option>
                            <option>Unfurnished</option>
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
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Properties Found</h3>
                        <p className="text-gray-500 max-w-md mx-auto">We couldn't find any residential properties matching your criteria. Please adjust your filters or check back later.</p>
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

export default ResidentialProperties;
