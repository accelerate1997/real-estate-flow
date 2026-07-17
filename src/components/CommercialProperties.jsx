import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Building2, Square, ArrowRight, SlidersHorizontal, Loader2, Home, Heart, Search, X, ChevronDown, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LeadModal from './LeadModal';
import PropertyCard from './PropertyCard';
import { pb } from '../services/pocketbase';

const DEFAULT_FILTERS = {
    transactionType: 'All',
    propertyType: 'All',
    washroomType: 'All',
    city: 'All',
    priceRange: 'All',
    minArea: 'All',
};

const PRICE_RANGES = [
    { label: 'All Budgets', value: 'All' },
    { label: 'Under ₹50k/mo', value: '0-50000' },
    { label: '₹50k – ₹2L/mo', value: '50000-200000' },
    { label: '₹2L – ₹10L/mo', value: '200000-1000000' },
    { label: 'Under ₹1 Cr', value: '0-10000000' },
    { label: '₹1 Cr – ₹5 Cr', value: '10000000-50000000' },
    { label: 'Above ₹5 Cr', value: '50000000-999999999' },
];

const FilterSelect = ({ label, value, onChange, options, defaultLabel, templateId }) => {
    const isModern = templateId === 'modern';
    const isMinimal = templateId === 'minimal';
    return (
        <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-semibold uppercase tracking-wider ${isModern ? 'text-white/40' : 'text-gray-500'}`}>{label}</label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className={`text-sm py-2.5 px-3 focus:outline-none w-full appearance-none transition-colors cursor-pointer ${
                    isModern 
                        ? 'bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-primary/45 hover:bg-white/10' 
                        : isMinimal 
                            ? 'bg-white border border-gray-300 text-gray-900 rounded-none focus:border-gray-900 hover:border-gray-900' 
                            : 'bg-white border border-gray-200 text-gray-800 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary hover:border-gray-300'
                }`}
                style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${isModern ? '%23ffffff' : '%236b7280'}' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, 
                    backgroundRepeat: 'no-repeat', 
                    backgroundPosition: 'right 10px center', 
                    paddingRight: '30px' 
                }}
            >
                <option value="All" className={isModern ? 'bg-[#080610] text-white' : ''}>{defaultLabel || `All ${label}s`}</option>
                {options.map(opt => (
                    <option key={opt.value ?? opt} value={opt.value ?? opt} className={isModern ? 'bg-[#080610] text-white' : ''}>
                        {opt.label ?? opt}
                    </option>
                ))}
            </select>
        </div>
    );
};

const CommercialProperties = () => {
    const navigate = useNavigate();
    const [properties, setProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [showFilters, setShowFilters] = useState(true);

    useEffect(() => {
        const fetchProperties = async () => {
            setIsLoading(true);
            try {
                const records = await pb.collection('properties').getFullList({
                    filter: `propertyCategory = "Commercial"`,
                    sort: '-id'
                });
                setProperties(records);
            } catch (error) {
                console.error("Error fetching commercial properties:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProperties();
    }, []);

    // Derive unique cities
    const cities = useMemo(() => {
        const set = new Set();
        properties.forEach(p => {
            if (p.location) {
                const city = p.location.split(', ').pop()?.trim();
                if (city) set.add(city);
            }
        });
        return Array.from(set).sort();
    }, [properties]);

    // Derive unique property types (from bhkType or businessTypeSuitability)
    const propertyTypes = useMemo(() => {
        const set = new Set();
        properties.forEach(p => {
            if (p.bhkType) set.add(p.bhkType);
        });
        return Array.from(set).sort();
    }, [properties]);

    const setFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
    const resetFilters = () => setFilters(DEFAULT_FILTERS);

    const activeFilterCount = Object.entries(filters).filter(([, v]) => v !== 'All').length;

    // Apply Filters
    const filteredProperties = useMemo(() => {
        return properties.filter(p => {
            // Transaction Type
            if (filters.transactionType !== 'All') {
                const tx = (p.transactionType || '').toLowerCase();
                if (filters.transactionType.toLowerCase() !== tx) return false;
            }
            // Property Type
            if (filters.propertyType !== 'All') {
                if (p.bhkType !== filters.propertyType) return false;
            }
            // Washroom Type
            if (filters.washroomType !== 'All') {
                if (p.washroomType !== filters.washroomType) return false;
            }
            // City
            if (filters.city !== 'All') {
                const city = (p.location || '').split(', ').pop()?.trim();
                if (city !== filters.city) return false;
            }
            // Price Range
            if (filters.priceRange !== 'All') {
                const [min, max] = filters.priceRange.split('-').map(Number);
                const price = Number(p.price || 0);
                if (price < min || price > max) return false;
            }
            // Min Area
            if (filters.minArea !== 'All') {
                const min = Number(filters.minArea);
                const area = Number(p.carpetArea || p.builtUpArea || 0);
                if (area < min) return false;
            }
            return true;
        });
    }, [properties, filters]);

    const templateId = window.agencyConfig?.templateId || 'classic';
    const isModern = templateId === 'modern';
    const isMinimal = templateId === 'minimal';

    return (
        <div className={`min-h-screen pt-32 pb-20 transition-colors duration-300 ${
            isModern ? 'bg-[#080610] text-white' : isMinimal ? 'bg-[#FAF9F6] text-gray-900 font-serif' : 'bg-gray-50 text-gray-900 font-sans'
        }`}>
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumbs */}
                <nav className={`flex text-sm mb-6 ${isModern ? 'text-white/40' : 'text-gray-500'}`}>
                    <a href="/" className="hover:text-primary transition-colors">Home</a>
                    <span className="mx-2">/</span>
                    <span className={isModern ? 'text-white font-medium' : 'text-gray-900 font-medium'}>Commercial Properties</span>
                </nav>

                {/* Header */}
                <div className={`flex flex-col md:flex-row justify-between items-start md:items-end mb-6 border-b pb-6 ${
                    isModern ? 'border-white/10' : 'border-gray-200'
                }`}>
                    <div>
                        <h1 className={`text-3xl md:text-4xl font-bold mb-2 ${
                            isModern ? 'text-white' : isMinimal ? 'text-gray-900 font-serif font-normal' : 'text-[#1A1A1A]'
                        }`}>Premium Commercial Spaces & Offices</h1>
                        <p className={isModern ? 'text-white/40' : 'text-gray-500'}>
                            {isLoading ? 'Loading...' : `${filteredProperties.length} space${filteredProperties.length !== 1 ? 's' : ''} found`}
                        </p>
                    </div>

                    {/* Filter toggle button */}
                    <button
                        onClick={() => setShowFilters(v => !v)}
                        className={`mt-4 md:mt-0 flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all shadow-sm border ${
                            isModern 
                                ? 'bg-white/5 border-white/10 hover:border-primary/55 text-white' 
                                : isMinimal 
                                    ? 'bg-white border-gray-300 hover:border-gray-900 text-gray-900 rounded-none' 
                                    : 'bg-white border-gray-200 hover:border-primary text-gray-700 hover:text-primary rounded-lg'
                        }`}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                                {activeFilterCount}
                            </span>
                        )}
                        <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {/* Filter Panel */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden mb-8"
                        >
                            <div className={`border p-6 shadow-sm ${
                                isModern 
                                    ? 'bg-white/4 border-white/8 rounded-2xl shadow-xl' 
                                    : isMinimal 
                                        ? 'bg-white border-gray-300 rounded-none' 
                                        : 'bg-white border-gray-100 rounded-2xl'
                            }`}>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                                    <FilterSelect
                                        label="Type"
                                        value={filters.transactionType}
                                        onChange={v => setFilter('transactionType', v)}
                                        options={[{ label: 'For Sell', value: 'Sell' }, { label: 'For Rent', value: 'Rent' }]}
                                        defaultLabel="All Types"
                                        templateId={templateId}
                                    />
                                    <FilterSelect
                                        label="Category"
                                        value={filters.propertyType}
                                        onChange={v => setFilter('propertyType', v)}
                                        options={propertyTypes}
                                        defaultLabel="All Categories"
                                        templateId={templateId}
                                    />
                                    <FilterSelect
                                        label="Washroom"
                                        value={filters.washroomType}
                                        onChange={v => setFilter('washroomType', v)}
                                        options={['Private', 'Shared', 'None']}
                                        defaultLabel="Any Washroom"
                                        templateId={templateId}
                                    />
                                    <FilterSelect
                                        label="City"
                                        value={filters.city}
                                        onChange={v => setFilter('city', v)}
                                        options={cities}
                                        defaultLabel="All Cities"
                                        templateId={templateId}
                                    />
                                    <FilterSelect
                                        label="Budget"
                                        value={filters.priceRange}
                                        onChange={v => setFilter('priceRange', v)}
                                        options={PRICE_RANGES.slice(1)}
                                        defaultLabel="Any Budget"
                                        templateId={templateId}
                                    />
                                    <FilterSelect
                                        label="Min Area"
                                        value={filters.minArea}
                                        onChange={v => setFilter('minArea', v)}
                                        options={[
                                            { label: '500+ sqft', value: '500' },
                                            { label: '1000+ sqft', value: '1000' },
                                            { label: '2000+ sqft', value: '2000' },
                                            { label: '5000+ sqft', value: '5000' },
                                        ]}
                                        defaultLabel="Any Area"
                                        templateId={templateId}
                                    />
                                </div>

                                {activeFilterCount > 0 && (
                                    <div className="flex justify-end mt-4 border-t border-gray-550/10 pt-4">
                                        <button
                                            onClick={resetFilters}
                                            className="flex items-center gap-1 text-xs font-bold text-primary hover:text-accent-red uppercase tracking-wider transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" /> Clear Filters
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Grid */}
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                ) : filteredProperties.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                        <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Spaces Found</h3>
                        <p className="text-gray-500 max-w-md mx-auto">We couldn't find any commercial spaces matching your criteria. Try adjusting your filters.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredProperties.map((property) => (
                            <PropertyCard 
                                key={property.id} 
                                property={property} 
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
