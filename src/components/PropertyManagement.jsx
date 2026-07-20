import React, { useState, useEffect } from 'react';
import {
    Image as ImageIcon, Plus, Building2, MapPin, Edit, Search,
    Trash2, Star, Bed, Bath, Construction, Target, Filter,
    Loader2, Home, UploadCloud, Ruler, Square
} from 'lucide-react';
import { pb } from '../services/pocketbase';
import AddPropertyWizard from './AddPropertyWizard';
import BulkUploadWizard from './BulkUploadWizard';

const PropertyManagement = () => {
    const [properties, setProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddWizardOpen, setIsAddWizardOpen] = useState(false);
    const [isBulkWizardOpen, setIsBulkWizardOpen] = useState(false);
    const [editingProperty, setEditingProperty] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterType, setFilterType] = useState('All');
    const [selectedProperties, setSelectedProperties] = useState([]);

    const currentUser = pb.authStore.model;
    const isOwner = currentUser?.role !== 'agent';
    const targetAgencyId = isOwner ? currentUser?.id : currentUser?.agencyId;

    useEffect(() => {
        if (targetAgencyId) {
            fetchProperties();
        } else {
            setIsLoading(false);
        }
    }, [targetAgencyId]);

    const fetchProperties = async () => {
        setIsLoading(true);
        try {
            const records = await pb.collection('properties').getFullList({
                filter: `agencyId = "${targetAgencyId}"`,
                sort: '-created',
                expand: 'createdBy'
            });
            setProperties(records);
        } catch (error) {
            console.error('Error fetching properties:', error);
            if (error.status === 404) {
                console.warn("Properties collection does not exist yet.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteProperty = async (id) => {
        if (!window.confirm('Are you sure you want to delete this property?')) return;
        try {
            await pb.collection('properties').delete(id);
            setProperties(properties.filter(p => p.id !== id));
            setSelectedProperties(selectedProperties.filter(pid => pid !== id));
        } catch (error) {
            console.error("Failed to delete property:", error);
            alert("Failed to delete property. Please try again.");
        }
    };

    const handleToggleFeatured = async (id, currentState) => {
        try {
            const updated = await pb.collection('properties').update(id, { isFeatured: !currentState });
            setProperties(properties.map(p => p.id === id ? { ...p, isFeatured: updated.isFeatured } : p));
        } catch (error) {
            console.error('Failed to update featured status:', error);
            alert("Failed to update featured status. Please try again.");
        }
    };

    const handleBulkDelete = async () => {
        if (!selectedProperties.length) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedProperties.length} selected properties?`)) return;
        setIsLoading(true);
        try {
            for (const id of selectedProperties) {
                await pb.collection('properties').delete(id);
            }
            setProperties(prev => prev.filter(p => !selectedProperties.includes(p.id)));
            setSelectedProperties([]);
        } catch (error) {
            console.error('Error bulk deleting properties:', error);
            alert("Failed to delete some or all properties. Check your permissions and try again.");
            fetchProperties();
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSelectProperty = (id) => {
        setSelectedProperties(prev =>
            prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedProperties.length === filteredProperties.length) {
            setSelectedProperties([]);
        } else {
            setSelectedProperties(filteredProperties.map(p => p.id));
        }
    };

    const formatCurrency = (amount) => {
        if (!amount) return 'Price on Request';
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    const getPropertyIcon = (category) => {
        if (category === 'Commercial') return <Building2 className="w-7 h-7 text-gray-300" />;
        if (category === 'NewProjects') return <Construction className="w-7 h-7 text-gray-300" />;
        return <Home className="w-7 h-7 text-gray-300" />;
    };

    const filteredProperties = properties.filter(p => {
        const matchesSearch = (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.location || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || p.propertyCategory === filterCategory;
        const matchesType = filterType === 'All' || 
            (filterType === 'Sell' && p.transactionType !== 'Rent') ||
            (filterType === 'Rent' && p.transactionType === 'Rent');
        return matchesSearch && matchesCategory && matchesType;
    });

    const categories = ['All', 'Residential', 'Commercial', 'NewProjects'];
    const types = ['All', 'Sell', 'Rent'];

    return (
        <div className="space-y-5">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="section-title">{isOwner ? "Manage Properties" : "Agency Properties"}</h2>
                    <p className="section-subtitle">{properties.length} total listings</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button onClick={() => setIsBulkWizardOpen(true)} className="btn-dash-secondary">
                        <UploadCloud className="w-4 h-4" />
                        Bulk Listing
                    </button>
                    <button onClick={() => setIsAddWizardOpen(true)} className="btn-dash-primary">
                        <Plus className="w-4 h-4" />
                        List Property
                    </button>
                </div>
            </div>

            {/* Filters */}
            {properties.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col md:flex-row gap-3">
                    {/* Search */}
                    <div className="toolbar-search flex-1">
                        <Search className="search-icon w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by title or location..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Category chips */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                        {categories.map(c => (
                            <button
                                key={c}
                                onClick={() => setFilterCategory(c)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterCategory === c
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                {c === 'NewProjects' ? 'New Projects' : c}
                            </button>
                        ))}
                    </div>

                    {/* Type chips */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {types.map(t => (
                            <button
                                key={t}
                                onClick={() => setFilterType(t)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterType === t
                                    ? 'bg-accent-teal text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Bulk Actions Bar */}
            {filteredProperties.length > 0 && !isLoading && (
                <div className="flex items-center justify-between bg-white px-5 py-3 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            className="w-4 h-4 rounded text-primary border-gray-300 focus:ring-primary cursor-pointer"
                            checked={selectedProperties.length === filteredProperties.length && filteredProperties.length > 0}
                            onChange={toggleSelectAll}
                        />
                        <span className="text-sm text-gray-600 font-medium">Select All</span>
                        {selectedProperties.length > 0 && (
                            <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold">
                                {selectedProperties.length} Selected
                            </span>
                        )}
                    </div>
                    {selectedProperties.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-800 font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete Selected
                        </button>
                    )}
                </div>
            )}

            {/* Properties List */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                    <p className="text-sm text-gray-400 font-medium">Loading properties...</p>
                </div>
            ) : properties.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <Home className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No Listings Yet</h3>
                    <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6">
                        Get started by creating your first high-quality property listing using our smart wizard.
                    </p>
                    <button onClick={() => setIsAddWizardOpen(true)} className="btn-dash-primary">
                        <Plus className="w-4 h-4" /> List Your First Property
                    </button>
                </div>
            ) : filteredProperties.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <Search className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">No matches found</h3>
                    <p className="text-sm text-gray-500">Try adjusting your search or filters.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {filteredProperties.map(property => {
                        const imageList = Array.isArray(property.images)
                            ? property.images
                            : (typeof property.images === 'string' && property.images.trim() !== '' ? [property.images] : []);
                        const hasImages = imageList.length > 0;
                        const coverImageUrl = hasImages
                            ? pb.files.getURL(property, imageList[0])
                            : null;

                        return (
                            <div key={property.id} className="property-row group">
                                {/* Checkbox */}
                                <div className="shrink-0">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded text-primary border-gray-300 focus:ring-primary cursor-pointer"
                                        checked={selectedProperties.includes(property.id)}
                                        onChange={() => toggleSelectProperty(property.id)}
                                    />
                                </div>

                                {/* Thumbnail */}
                                <div className="h-16 w-16 shrink-0 bg-gray-100 rounded-xl overflow-hidden relative shadow-sm">
                                    {coverImageUrl ? (
                                        <img 
                                            src={coverImageUrl} 
                                            alt={property.title} 
                                            className="w-full h-full object-cover" 
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "https://placehold.co/600x400/f3f4f6/9ca3af?text=No+Image+Available";
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                            {getPropertyIcon(property.propertyCategory)}
                                        </div>
                                    )}
                                    {property.transactionType && (
                                        <div className={`absolute bottom-0 left-0 right-0 text-center text-[9px] font-bold text-white py-0.5
                                                        ${property.transactionType === 'Rent' ? 'bg-accent-teal' : 'bg-green-600'}`}>
                                            {property.transactionType}
                                        </div>
                                    )}
                                </div>

                                {/* Title & Price */}
                                <div className="flex flex-col min-w-0 w-full sm:w-52 shrink-0 sm:border-r border-gray-100 sm:pr-4">
                                    <h3 className="font-bold text-gray-900 text-sm line-clamp-1 mb-0.5" title={property.title}>
                                        {property.title}
                                    </h3>
                                    <p className="text-primary font-bold text-sm">
                                        {formatCurrency(property.price)}
                                        {property.transactionType === 'Rent' && <span className="text-[10px] font-medium text-gray-500"> /mo</span>}
                                    </p>
                                    {property.isFeatured && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 mt-1">
                                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Featured
                                        </span>
                                    )}
                                </div>

                                {/* Specs */}
                                <div className="flex-1 flex flex-wrap items-center gap-4 min-w-0">
                                    <div className="flex items-center gap-1.5 text-gray-500">
                                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="text-xs truncate max-w-[120px]" title={property.location}>
                                            {property.location || '—'}
                                        </span>
                                    </div>

                                    {property.propertyCategory === 'Commercial' ? (
                                        <>
                                            <div className="flex items-center gap-1.5 text-gray-500">
                                                <Ruler className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-xs font-medium">{property.carpetArea} sqft</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-gray-500">
                                                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-xs font-medium">{property.businessTypeSuitability || 'Versatile'}</span>
                                            </div>
                                        </>
                                    ) : property.propertyCategory === 'NewProjects' ? (
                                        <>
                                            <div className="flex items-center gap-1.5 text-gray-500">
                                                <Construction className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-xs font-medium">{property.constructionStatus || 'N/A'}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-1.5 text-gray-500">
                                                <Bed className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-xs font-medium">{property.bhkType || '—'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-gray-500">
                                                <Square className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-xs font-medium">{property.carpetArea || '—'} <span className="text-[10px] text-gray-400">sqft</span></span>
                                            </div>
                                        </>
                                    )}

                                    <span className="text-[11px] text-gray-400 ml-auto sm:pl-4 sm:border-l border-gray-100">
                                        By <span className="font-semibold text-gray-600">{property.expand?.createdBy?.name || 'Unknown'}</span>
                                    </span>
                                </div>

                                {/* Actions */}
                                {(isOwner || currentUser.id === property.createdBy) && (
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const agentApiUrl = import.meta.env.VITE_AGENT_API_URL || 'http://localhost:3000';
                                                    const res = await fetch(`${agentApiUrl}/api/properties/match`, {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ propertyId: property.id })
                                                    });
                                                    const data = await res.json();
                                                    alert(`Matching engine successfully executed! Found ${data.matchesFound || 0} match(es). Check the "Smart Matches" tab.`);
                                                } catch (err) {
                                                    console.error(err);
                                                    alert("Failed to run matching engine.");
                                                }
                                            }}
                                            className="p-2 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                                            title="Find Smart Matches"
                                        >
                                            <Target className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleToggleFeatured(property.id, property.isFeatured)}
                                            className={`p-2 rounded-lg transition-colors ${property.isFeatured
                                                ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
                                                : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'}`}
                                            title={property.isFeatured ? "Unfeature from Homepage" : "Feature on Homepage"}
                                        >
                                            <Star className={`w-4 h-4 ${property.isFeatured ? 'fill-current' : ''}`} />
                                        </button>
                                        <button
                                            onClick={() => setEditingProperty(property)}
                                            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                            title="Edit"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteProperty(property.id)}
                                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Property Wizard */}
            {(isAddWizardOpen || editingProperty) && (
                <AddPropertyWizard
                    initialData={editingProperty}
                    targetAgencyId={targetAgencyId}
                    currentUserId={currentUser?.id}
                    onClose={() => { setIsAddWizardOpen(false); setEditingProperty(null); }}
                    onSuccess={() => { setIsAddWizardOpen(false); setEditingProperty(null); fetchProperties(); }}
                />
            )}

            {/* Bulk Upload CSV Wizard */}
            <BulkUploadWizard
                isOpen={isBulkWizardOpen}
                onClose={() => setIsBulkWizardOpen(false)}
                onSuccess={() => { setIsBulkWizardOpen(false); fetchProperties(); }}
                targetAgencyId={targetAgencyId}
                currentUserId={currentUser?.id}
            />
        </div>
    );
};

export default PropertyManagement;
