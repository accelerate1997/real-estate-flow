import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, BedDouble, Bath, Square, Heart, ArrowRight, Loader2, Star } from 'lucide-react';
import LeadModal from './LeadModal';
import { PropertyCardSkeleton } from './ui/PropertyCardSkeleton';
import clsx from 'clsx';
import { pb } from '../services/pocketbase';
import { useNavigate } from 'react-router-dom';

const PropertyCard = ({ property, onOpenModal }) => {
    const navigate = useNavigate();
    // Helper to format currency
    const formatCurrency = (amount) => {
        if (!amount) return property.transactionType === 'Rent' ? 'Ask for Price' : 'Price on Request';
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    // Helper to get image URL
    const getImageUrl = () => {
        const imageList = Array.isArray(property.images)
            ? property.images
            : (typeof property.images === 'string' && property.images.trim() !== '' ? [property.images] : []);

        if (imageList.length > 0) {
            return pb.files.getURL(property, imageList[0], { token: pb.authStore.token });
        }
        return "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2675&auto=format&fit=crop"; // Default fallback
    };

    // Helpers for display data based on type
    const isCommercial = property.propertyCategory === 'Commercial';
    const isNew = property.propertyCategory === 'NewProjects';

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
            onClick={() => navigate(`/property/${property.id}`)}
            className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col cursor-pointer"
        >
            {/* 16:9 Image Aspect Ratio */}
            <div className="relative aspect-video overflow-hidden bg-gray-100">
                <img
                    src={getImageUrl()}
                    alt={property.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Compact Badges */}
                <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                    {property.isFeatured && (
                        <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm uppercase tracking-wide flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" /> Featured
                        </span>
                    )}
                    {property.transactionType && (
                        <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm uppercase tracking-wide">
                            For {property.transactionType}
                        </span>
                    )}
                    {property.tags && Array.isArray(property.tags) && property.tags.map(tag => (
                        <span key={tag} className="bg-white text-primary text-[10px] font-bold px-2 py-0.5 rounded shadow-sm uppercase tracking-wide">
                            {tag}
                        </span>
                    ))}
                </div>

                <button className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full hover:bg-white hover:text-primary transition-colors text-gray-700 shadow-sm">
                    <Heart className="w-4 h-4" />
                </button>
            </div>

            {/* Tighter Content Padding */}
            <div className="p-4 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-1">
                    <span className="text-primary font-bold text-[10px] uppercase tracking-wider">{property.propertyCategory}</span>
                </div>

                <h3 className="text-base font-bold text-text mb-1 truncate group-hover:text-primary transition-colors" title={property.title}>
                    {property.title}
                </h3>

                <div className="flex items-center gap-1 text-gray-500 mb-3">
                    <MapPin className="w-3 h-3 min-w-[12px]" />
                    <span className="text-xs truncate">{property.location || 'Location upon request'}</span>
                </div>

                {/* Compact Features Grid */}
                <div className="flex items-center justify-between border-t border-b border-gray-50 py-2 mb-3 mt-auto">
                    {isCommercial ? (
                        <>
                            <div className="flex items-center gap-1">
                                <Square className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-[11px] font-medium text-text">{property.carpetArea || property.builtUpArea} sqft</span>
                            </div>
                            <div className="w-px h-3 bg-gray-200"></div>
                            <div className="flex items-center gap-1">
                                <span className="text-[11px] font-medium text-text truncate max-w-[100px]" title={property.businessTypeSuitability}>
                                    {property.businessTypeSuitability || 'Commercial Use'}
                                </span>
                            </div>
                        </>
                    ) : isNew ? (
                        <>
                            <div className="flex items-center gap-1">
                                <Square className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-[11px] font-medium text-text">{property.carpetArea || property.builtUpArea} sqft</span>
                            </div>
                            <div className="w-px h-3 bg-gray-200"></div>
                            <div className="flex items-center gap-1">
                                <span className="text-[11px] font-medium text-text truncate max-w-[100px]" title={property.constructionStatus}>
                                    {property.constructionStatus || 'Status TBD'}
                                </span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-1">
                                <BedDouble className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-[11px] font-medium text-text">{property.bhkType ? `${property.bhkType}` : '-'}</span>
                            </div>
                            <div className="w-px h-3 bg-gray-200"></div>
                            <div className="flex items-center gap-1">
                                <Bath className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-[11px] font-medium text-text">{property.furnishing || '-'}</span>
                            </div>
                            <div className="w-px h-3 bg-gray-200"></div>
                            <div className="flex items-center gap-1">
                                <Square className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-[11px] font-medium text-text">{property.carpetArea || property.builtUpArea} sqft</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Compact Footer */}
                <div className="flex justify-between items-center gap-2">
                    <div className="text-sm font-bold text-text truncate max-w-[120px]">
                        {formatCurrency(property.price)}
                        {property.transactionType === 'Rent' && <span className="text-[10px] text-gray-500 font-normal"> /mo</span>}
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/property/${property.id}`);
                        }}
                        className="bg-primary hover:bg-red-800 text-white text-[10px] sm:text-xs px-3 sm:px-4 py-1.5 sm:py-2 rounded font-semibold shadow-md transition-all whitespace-nowrap"
                    >
                        Show Property
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

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
                    sort: '-isFeatured,-created' // prioritize featured, then newest
                });
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
    const residential = properties.filter(p => p.propertyCategory === 'Residential').slice(0, 4);
    const commercial = properties.filter(p => p.propertyCategory === 'Commercial').slice(0, 4);
    const newProjects = properties.filter(p => p.propertyCategory === 'NewProjects').slice(0, 4);

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
                                        <PropertyCard key={property.id} property={property} onOpenModal={setSelectedProperty} />
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
                                        <PropertyCard key={property.id} property={property} onOpenModal={setSelectedProperty} />
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
                                        <PropertyCard key={property.id} property={property} onOpenModal={setSelectedProperty} />
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
