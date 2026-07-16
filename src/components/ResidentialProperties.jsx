import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, BedDouble, Bath, Square, Home, Loader2, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LeadModal from './LeadModal';
import PropertyCard from './PropertyCard';
import { pb } from '../services/pocketbase';

const DEFAULT_FILTERS = {
    transactionType: 'All',
    bhkType: 'All',
    furnishing: 'All',
    city: 'All',
    priceRange: 'All',
    floor: 'All',
    preferredTenant: 'All',
};

const PRICE_RANGES = [
    { label: 'All Budgets', value: 'All' },
    { label: 'Under ₹25 Lakh', value: '0-2500000' },
    { label: '₹25L – ₹50L', value: '2500000-5000000' },
    { label: '₹50L – ₹1 Cr', value: '5000000-10000000' },
    { label: '₹1 Cr – ₹2 Cr', value: '10000000-20000000' },
    { label: 'Above ₹2 Cr', value: '20000000-999999999' },
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

const ResidentialProperties = () => {
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
                    filter: `propertyCategory = "Residential"`,
                    sort: '-id'
                });
                setProperties(records);
            } catch (error) {
                console.error("Error fetching residential properties:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProperties();
    }, []);

    // Derive unique cities from loaded properties
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

    const setFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
    const resetFilters = () => setFilters(DEFAULT_FILTERS);

    const activeFilterCount = Object.entries(filters).filter(([, v]) => v !== 'All').length;

    const filteredProperties = useMemo(() => {
        return properties.filter(p => {
            // Transaction Type
            if (filters.transactionType !== 'All') {
                const tx = (p.transactionType || '').toLowerCase();
                if (filters.transactionType === 'Sell' && tx !== 'sell') return false;
                if (filters.transactionType === 'Rent' && tx !== 'rent') return false;
            }
            // BHK
            if (filters.bhkType !== 'All') {
                const bhk = (p.bhkType || '').toLowerCase();
                if (filters.bhkType === '4+ BHK') {
                    const num = parseInt(bhk);
                    if (isNaN(num) || num < 4) return false;
                } else {
                    if (!bhk.includes(filters.bhkType.toLowerCase().split(' ')[0])) return false;
                }
            }
            // Furnishing
            if (filters.furnishing !== 'All' && p.furnishing !== filters.furnishing) return false;
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
            // Floor
            if (filters.floor !== 'All') {
                if ((p.floorDetails || '') !== filters.floor) return false;
            }
            // Preferred Tenant
            if (filters.preferredTenant !== 'All') {
                if ((p.preferredTenant || '') !== filters.preferredTenant) return false;
            }
            return true;
        });
    }, [properties, filters]);

    const getImageUrl = (property) => {
        const imageList = Array.isArray(property.images)
            ? property.images
            : (typeof property.images === 'string' && property.images.trim() !== '' ? [property.images] : []);
        if (imageList.length > 0) {
            return pb.files.getURL(property, imageList[0], { token: pb.authStore.token });
        }
        return "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2675&auto=format&fit=crop";
    };

    // Derive unique floor options
    const floors = useMemo(() => {
        const set = new Set();
        properties.forEach(p => { if (p.floorDetails) set.add(p.floorDetails); });
        return Array.from(set).sort();
    }, [properties]);

    // Derive unique preferred tenant options
    const tenantOptions = useMemo(() => {
        const set = new Set();
        properties.forEach(p => { if (p.preferredTenant) set.add(p.preferredTenant); });
        return Array.from(set).sort();
    }, [properties]);

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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 border-b border-gray-200 pb-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-2">Luxury Residential Homes &amp; Apartments</h1>
                        <p className="text-gray-500">
                            {isLoading ? 'Loading...' : `${filteredProperties.length} propert${filteredProperties.length !== 1 ? 'ies' : 'y'} found`}
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
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                                    <FilterSelect
                                        label="Type"
                                        value={filters.transactionType}
                                        onChange={v => setFilter('transactionType', v)}
                                        options={[{ label: 'For Sell', value: 'Sell' }, { label: 'For Rent', value: 'Rent' }]}
                                        defaultLabel="All Types"
                                    />
                                    <FilterSelect
                                        label="BHK"
                                        value={filters.bhkType}
                                        onChange={v => setFilter('bhkType', v)}
                                        options={['1 BHK', '2 BHK', '3 BHK', '4+ BHK']}
                                        defaultLabel="All BHK"
                                    />
                                    <FilterSelect
                                        label="Furnishing"
                                        value={filters.furnishing}
                                        onChange={v => setFilter('furnishing', v)}
                                        options={['Fully Furnished', 'Semi Furnished', 'Unfurnished']}
                                        defaultLabel="Any Furnishing"
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
                                    {floors.length > 0 && (
                                        <FilterSelect
                                            label="Floor"
                                            value={filters.floor}
                                            onChange={v => setFilter('floor', v)}
                                            options={floors}
                                            defaultLabel="Any Floor"
                                        />
                                    )}
                                    {tenantOptions.length > 0 && (
                                        <FilterSelect
                                            label="Tenant Type"
                                            value={filters.preferredTenant}
                                            onChange={v => setFilter('preferredTenant', v)}
                                            options={tenantOptions}
                                            defaultLabel="Any Tenant"
                                        />
                                    )}
                                </div>

                                {/* Reset */}
                                {activeFilterCount > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
                                        <span className="text-sm text-gray-500">{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</span>
                                        <button
                                            onClick={resetFilters}
                                            className="flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-600 transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" /> Reset All
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
                    <div className="text-center py-20 bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
                        <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Properties Found</h3>
                        <p className="text-gray-500 max-w-md mx-auto mb-4">We couldn't find any properties matching your filters.</p>
                        <button onClick={resetFilters} className="text-primary font-semibold hover:underline text-sm">Clear Filters</button>
                    </div>
                ) : (
                    <motion.div
                        layout
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                    >
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
                    </motion.div>
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
