import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, BedDouble, Bath, Square, Heart, ArrowRight, Loader2, Star } from 'lucide-react';
import LeadModal from './LeadModal';
import PropertyCard from './PropertyCard';
import { PropertyCardSkeleton } from './ui/PropertyCardSkeleton';
import clsx from 'clsx';
import { pb } from '../services/pocketbase';
import { useNavigate } from 'react-router-dom';


const SectionHeader = ({ title }) => (
    <div className="flex items-center gap-4 mb-8">
        <div className="h-8 w-1 bg-primary rounded-full"></div>
        <h3 className="text-2xl font-bold text-text tracking-tight">{title}</h3>
    </div>
);

const BrowseButton = ({ onClick, text = "Browse More Properties" }) => (
    <div className="flex justify-center mt-12 mb-16">
        <button
            onClick={onClick}
            className="group flex items-center gap-2 px-8 py-3 border-2 border-primary text-primary font-semibold rounded-full hover:bg-primary hover:text-white transition-all duration-300"
        >
            {text}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
    </div>
);

const PropertyGrid = () => {
    const [properties, setProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProperties = async () => {
            setIsLoading(true);
            try {
                const records = await pb.collection('properties').getList(1, 40, {
                    sort: '-id' // Fallback to id-based temporal sorting
                });
                console.log("PropertyGrid: Fetched records:", records.items.length, records.items);
                setProperties(records.items);

            } catch (error) {
                console.error("Error fetching properties for grid:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProperties();
    }, []);

    // Filter data for sections (max 4 per section for the home page grid)
    // Using case-insensitive normalization just in case
    const getCategoryMatch = (p, cat) => (p.propertyCategory || '').toLowerCase() === cat.toLowerCase();

    const residential = properties.filter(p => getCategoryMatch(p, 'Residential')).slice(0, 4);
    const commercial = properties.filter(p => getCategoryMatch(p, 'Commercial')).slice(0, 4);
    const newProjects = properties.filter(p => getCategoryMatch(p, 'NewProjects')).slice(0, 4);

    console.log("PropertyGrid: Section counts - Residential:", residential.length, "Commercial:", commercial.length, "NewProjects:", newProjects.length);

    return (
        <section id="properties" className="py-20 bg-white">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-bold text-text mb-4">Discover Your Future</h2>
                    <p className="text-gray-500 max-w-2xl mx-auto">Explore our exclusive portfolio of premium properties.</p>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <PropertyCardSkeleton key={i} />
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Residential Section */}
                        {residential.length > 0 && (
                            <>
                                <SectionHeader title="Featured Residential Properties" />
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {residential.map((property) => (
                                        <PropertyCard key={property.id} property={{
                                            ...property,
                                            images: [pb.files.getURL(property, property.images?.[0], { token: pb.authStore.token })]
                                        }} onClick={() => navigate(`/property/${property.id}`)} />
                                    ))}
                                </div>
                                <BrowseButton onClick={() => navigate('/properties/residential')} text="Browse All Residential" />
                            </>
                        )}

                        {/* Commercial Section */}
                        {commercial.length > 0 && (
                            <>
                                <SectionHeader title="Featured Commercial Properties" />
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {commercial.map((property) => (
                                        <PropertyCard key={property.id} property={{
                                            ...property,
                                            images: [pb.files.getURL(property, property.images?.[0], { token: pb.authStore.token })]
                                        }} onClick={() => navigate(`/property/${property.id}`)} />
                                    ))}
                                </div>
                                <BrowseButton onClick={() => navigate('/properties/commercial')} text="Browse All Commercial" />
                            </>
                        )}

                        {/* New Projects Section */}
                        {newProjects.length > 0 && (
                            <>
                                <SectionHeader title="New Development Projects" />
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {newProjects.map((property) => (
                                        <PropertyCard key={property.id} property={{
                                            ...property,
                                            images: [pb.files.getURL(property, property.images?.[0], { token: pb.authStore.token })]
                                        }} onClick={() => navigate(`/property/${property.id}`)} />
                                    ))}
                                </div>
                                <BrowseButton onClick={() => navigate('/properties/under-development')} text="Browse All New Projects" />
                            </>
                        )}

                        {properties.length === 0 && (
                            <div className="text-center text-gray-400 py-10 border border-dashed border-gray-200 rounded-xl">
                                <p>No properties available to display at the moment.</p>
                            </div>
                        )}
                    </>
                )}

            </div>

            <LeadModal
                isOpen={!!selectedProperty}
                onClose={() => setSelectedProperty(null)}
                property={selectedProperty}
            />
        </section>
    );
};

export default PropertyGrid;
