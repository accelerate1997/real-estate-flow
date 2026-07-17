import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, SlidersHorizontal, ChevronDown, Loader2, Home, Search, X, Calendar, Construction, Building2, BedDouble } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LeadModal from './LeadModal';
import PropertyCard from './PropertyCard';
import { pb } from '../services/pocketbase';

const DEFAULT_FILTERS = {
    projectType: 'All',
    city: 'All',
    stage: 'All',
    priceRange: 'All',
};

const PRICE_RANGES = [
    { label: 'All Budgets', value: 'All' },
    { label: 'Under ₹50 Lakh', value: '0-5000000' },
    { label: '₹50L – ₹1 Cr', value: '5000000-10000000' },
    { label: '₹1 Cr – ₹3 Cr', value: '10000000-30000000' },
    { label: '₹3 Cr – ₹5 Cr', value: '30000000-50000000' },
    { label: 'Above ₹5 Cr', value: '50000000-999999999' },
];

const FilterSelect = ({ label, value, onChange, options, defaultLabel }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className="bg-white border border-gray-200 text-gray-800 text-sm py-2.5 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer hover:border-gray-300 transition-colors w-full appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: '30px' }}
        >
            <option value="All">{defaultLabel || `All ${label}s`}</option>
            {options.map(opt => (
                <option key={opt.value ?? opt} value={opt.value ?? opt}>{opt.label ?? opt}</option>
            ))}
        </select>
    </div>
);

const UnderDevelopment = () => {
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

    // Derive unique stages (from constructionStatus)
    const stages = useMemo(() => {
        const set = new Set();
        properties.forEach(p => {
            if (p.constructionStatus) set.add(p.constructionStatus);
        });
        return Array.from(set).sort();
    }, [properties]);

    const setFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
    const resetFilters = () => setFilters(DEFAULT_FILTERS);

    const activeFilterCount = Object.entries(filters).filter(([, v]) => v !== 'All').length;

    // Apply Filters
    const filteredProperties = useMemo(() => {
        return properties.filter(p => {
            // Project Type (stored in businessTypeSuitability: 'Residential' or 'Commercial')
            if (filters.projectType !== 'All') {
                const type = p.businessTypeSuitability || 'Residential';
                if (type.toLowerCase() !== filters.projectType.toLowerCase()) return false;
            }
            // City
            if (filters.city !== 'All') {
                const city = (p.location || '').split(', ').pop()?.trim();
                if (city !== filters.city) return false;
            }
            // Construction Stage
            if (filters.stage !== 'All') {
                if (p.constructionStatus !== filters.stage) return false;
            }
            // Price Range
            if (filters.priceRange !== 'All') {
                const [min, max] = filters.priceRange.split('-').map(Number);
                const price = Number(p.price || 0);
                if (price < min || price > max) return false;
            }
            return true;
        });
    }, [properties, filters]);

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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 border-b border-gray-200 pb-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-2">Exclusive New &amp; Under Development Projects</h1>
                        <p className="text-gray-500">
                            {isLoading ? 'Loading...' : `${filteredProperties.length} project${filteredProperties.length !== 1 ? 's' : ''} found`}
                        </p>
                    </div>

                    {/* Filter toggle button */}
                    <button
                        onClick={() => setShowFilters(v => !v)}
                        className="mt-4 md:mt-0 flex items-center gap-2 bg-white border border-gray-200 hover:border-primary text-gray-700 hover:text-primary px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm"
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
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
                            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <FilterSelect
                                        label="Project Type"
                                        value={filters.projectType}
                                        onChange={v => setFilter('projectType', v)}
                                        options={[{ label: 'Residential Project', value: 'Residential' }, { label: 'Commercial Project', value: 'Commercial' }]}
                                        defaultLabel="All Project Types"
                                    />
                                    <FilterSelect
                                        label="Construction Stage"
                                        value={filters.stage}
                                        onChange={v => setFilter('stage', v)}
                                        options={stages}
                                        defaultLabel="All Stages"
                                    />
                                    <FilterSelect
                                        label="City"
                                        value={filters.city}
                                        onChange={v => setFilter('city', v)}
                                        options={cities}
                                        defaultLabel="All Cities"
                                    />
                                    <FilterSelect
                                        label="Budget"
                                        value={filters.priceRange}
                                        onChange={v => setFilter('priceRange', v)}
                                        options={PRICE_RANGES.slice(1)}
                                        defaultLabel="Any Budget"
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
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Projects Found</h3>
                        <p className="text-gray-500 max-w-md mx-auto">We couldn't find any new projects matching your criteria. Try adjusting your filters.</p>
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

export default UnderDevelopment;
