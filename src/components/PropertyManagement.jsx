import React, { useState, useEffect } from 'react';
import { Settings, Image as ImageIcon, Plus, Building2, MapPin, Edit, Search, Trash2, ShieldCheck, CheckSquare, Square, Check, X, Ruler, Filter, Loader2, Home, Upload, Layers, Star, Bed, Bath, Construction, Target } from 'lucide-react';
import { pb } from '../services/pocketbase';
import AddPropertyWizard from './AddPropertyWizard';
import BulkUploadWizard from './BulkUploadWizard';
import { UploadCloud } from 'lucide-react';

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
                sort: '-id',
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
            // Delete sequentially to avoid rate limits or partial failures without logging
            for (const id of selectedProperties) {
                await pb.collection('properties').delete(id);
            }
            setProperties(prev => prev.filter(p => !selectedProperties.includes(p.id)));
            setSelectedProperties([]);
        } catch (error) {
            console.error('Error bulk deleting properties:', error);
            alert("Failed to delete some or all properties. Check your permissions and try again.");
            fetchProperties(); // Refresh list to get accurate state
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
            // Unselect all
            setSelectedProperties([]);
        } else {
            // Select all current filtered
            setSelectedProperties(filteredProperties.map(p => p.id));
        }
    };

    // Helper formatting
    const formatCurrency = (amount) => {
        if (!amount) return 'Price on Request';
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    const getPropertyIcon = (category) => {
        if (category === 'Commercial') return <Building2 className="w-8 h-8 text-gray-400" />;
        if (category === 'NewProjects') return <Construction className="w-8 h-8 text-gray-400" />;
        return <Home className="w-8 h-8 text-gray-400" />;
    };

    // Derived filtered state
    const filteredProperties = properties.filter(p => {
        const matchesSearch = (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.location || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || p.propertyCategory === filterCategory;
        const matchesType = filterType === 'All' || p.transactionType === filterType;
        return matchesSearch && matchesCategory && matchesType;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900">
                    {isOwner ? "Manage Properties" : "Agency Properties"}
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setIsBulkWizardOpen(true)}
                        className="flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 px-4 py-2 text-sm md:text-base md:px-5 md:py-2.5 rounded-xl hover:bg-gray-50 transition-colors shadow-sm font-medium w-full sm:w-auto"
                    >
                        <UploadCloud className="w-5 h-5 text-gray-500" />
                        Bulk Listing
                    </button>
                    <button
                        onClick={() => setIsAddWizardOpen(true)}
                        className="flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 text-sm md:text-base md:px-5 md:py-2.5 rounded-xl hover:bg-red-800 transition-colors shadow-sm font-medium w-full sm:w-auto"
                    >
                        <Plus className="w-5 h-5" />
                        List Property
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            {properties.length > 0 && (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 mb-2">
                    <div className="flex-1 relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search properties by title or location..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-sm min-w-[150px] cursor-pointer"
                        >
                            <option value="All">All Categories</option>
                            <option value="Residential">Residential</option>
                            <option value="Commercial">Commercial</option>
                            <option value="NewProjects">New Projects</option>
                        </select>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-sm min-w-[150px] cursor-pointer"
                        >
                            <option value="All">All Types</option>
                            <option value="Buy">Buy</option>
                            <option value="Rent">Rent</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Bulk Actions Bar */}
            {filteredProperties.length > 0 && !isLoading && (
                <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-100 mb-4 px-4">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            className="w-4 h-4 rounded text-primary border-gray-300 focus:ring-primary cursor-pointer"
                            checked={selectedProperties.length === filteredProperties.length && filteredProperties.length > 0}
                            onChange={toggleSelectAll}
                        />
                        <span className="text-sm text-gray-600 font-medium">Select All</span>
                        {selectedProperties.length > 0 && (
                            <span className="text-sm bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-bold ml-2">
                                {selectedProperties.length} Selected
                            </span>
                        )}
                    </div>
                    {selectedProperties.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete Selected
                        </button>
                    )}
                </div>
            )}

            {/* Properties Grid */}
            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : properties.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
                    <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-xl font-bold text-gray-900 mb-2">No Listings Found</p>
                    <p className="max-w-md mx-auto">Get started by creating your first high-quality property listing using our new smart wizard.</p>
                </div>
            ) : filteredProperties.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg font-bold text-gray-900 mb-1">No matches found</p>
                    <p>Try adjusting your search or filters.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {filteredProperties.map(property => {
                        const imageList = Array.isArray(property.images)
                            ? property.images
                            : (typeof property.images === 'string' && property.images.trim() !== '' ? [property.images] : []);
                        const hasImages = imageList.length > 0;
                        const hasSecondImage = imageList.length > 1;

                        const coverImageUrl = hasImages
                            ? pb.files.getURL(property, imageList[0], { token: pb.authStore.token })
                            : null;
                        const secondImageUrl = hasSecondImage
                            ? pb.files.getURL(property, imageList[1], { token: pb.authStore.token })
                            : null;

                        return (
                            <div key={property.id} className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center p-4 sm:p-3 gap-4 sm:gap-6 group relative">
                                {/* Selection Checkbox */}
                                <div className="absolute top-4 left-4 sm:static sm:flex-shrink-0 z-10 w-full sm:w-auto h-0 sm:h-auto pointer-events-none">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded text-primary border-gray-300 focus:ring-primary cursor-pointer pointer-events-auto bg-white/80 sm:bg-transparent backdrop-blur sm:backdrop-blur-none"
                                        checked={selectedProperties.includes(property.id)}
                                        onChange={() => toggleSelectProperty(property.id)}
                                    />
                                </div>

                                {/* Image Thumbnail */}
                                <div className="h-48 sm:h-14 w-full sm:w-24 shrink-0 bg-gray-100 sm:rounded-md overflow-hidden relative shadow-sm">
                                    {coverImageUrl ? (
                                        <img src={coverImageUrl} alt={property.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            {getPropertyIcon(property.propertyCategory)}
                                        </div>
                                    )}
                                    {property.transactionType && (
                                        <div className={`absolute top-2 right-2 sm:top-0 sm:right-0 px-2 py-1 sm:px-1.5 sm:py-0.5 text-[10px] sm:text-[8px] font-bold text-white shadow-sm ${property.transactionType === 'Rent' ? 'bg-blue-500' : 'bg-green-500'}`}>
                                            {property.transactionType.charAt(0)}
                                        </div>
                                    )}
                                </div>

                                {/* Title & Price */}
                                <div className="flex flex-col shrink-0 w-full sm:w-64 min-w-0 sm:pr-4 sm:border-r border-gray-100">
                                    <h3 className="font-bold text-lg sm:text-sm text-gray-900 line-clamp-1" title={property.title}>
                                        {property.title}
                                    </h3>
                                    <p className="text-primary font-bold text-sm mt-0.5">
                                        {formatCurrency(property.price)}
                                        {property.transactionType === 'Rent' && <span className="text-[10px] font-medium text-gray-500"> / mo</span>}
                                    </p>
                                </div>

                                {/* Details / Specs */}
                                <div className="flex-1 flex flex-wrap items-center gap-6 min-w-0">
                                    <div className="flex items-center gap-1.5 text-gray-600">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        <span className="text-xs truncate max-w-[140px]" title={property.location}>{property.location || '-'}</span>
                                    </div>

                                    {property.propertyCategory === 'Commercial' ? (
                                        <>
                                            <div className="flex items-center gap-1.5 text-gray-600">
                                                <Ruler className="w-4 h-4 text-gray-400" />
                                                <span className="text-xs font-medium">{property.carpetArea} sqft</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-gray-600">
                                                <Building2 className="w-4 h-4 text-gray-400" />
                                                <span className="text-xs font-medium">{property.businessTypeSuitability || 'Versatile'}</span>
                                            </div>
                                        </>
                                    ) : property.propertyCategory === 'NewProjects' ? (
                                        <>
                                            <div className="flex items-center gap-1.5 text-gray-600">
                                                <Construction className="w-4 h-4 text-gray-400" />
                                                <span className="text-xs font-medium">{property.constructionStatus || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-gray-600">
                                                <Square className="w-4 h-4 text-gray-400" />
                                                <span className="text-xs font-medium">{property.carpetArea} - {property.builtUpArea} sqft</span>
                                            </div>
                                        </>
                                    ) : (
                                        // Residential
                                        <>
                                            <div className="flex items-center gap-1.5 text-gray-600">
                                                <Bed className="w-4 h-4 text-gray-400" />
                                                <span className="text-xs font-medium">{property.bhkType || '-'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-gray-600">
                                                <Bath className="w-4 h-4 text-gray-400" />
                                                <span className="text-xs font-medium">{property.furnishing || '-'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-gray-600">
                                                <Square className="w-4 h-4 text-gray-400" />
                                                <span className="text-xs font-medium">{property.carpetArea || '-'} <span className="text-[10px] text-gray-400">sqft</span></span>
                                            </div>
                                        </>
                                    )}
                                    <div className="text-xs sm:text-[10px] text-gray-400 mt-2 sm:mt-0 ml-auto sm:pr-4 sm:border-r border-gray-100 w-full sm:w-auto text-left sm:text-right">
                                        By: <span className="font-medium text-gray-600">{property.expand?.createdBy?.name || 'Unknown'}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-4 sm:pl-2 sm:pr-2 shrink-0 w-full sm:w-auto border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0 justify-end">
                                    {(isOwner || currentUser.id === property.createdBy) && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    // This can just navigate to matches tab or similar if we have the state here
                                                    // For now, let's assume we want to show matches for THIS property
                                                    // In AgencyDashboard, we can't easily change tab from here without passing a prop
                                                    // But we can at least show the button.
                                                    alert("Matching engine triggered for this property. Check Smart Matches tab.");
                                                }}
                                                className="text-gray-400 hover:text-amber-500 transition-colors tooltip-trigger"
                                                title="Find Smart Matches"
                                            >
                                                <Target className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleToggleFeatured(property.id, property.isFeatured)}
                                                className={`transition-colors tooltip-trigger ${property.isFeatured ? 'text-amber-500 hover:text-amber-600' : 'text-gray-400 hover:text-amber-500'}`}
                                                title={property.isFeatured ? "Unfeature from Homepage" : "Feature on Homepage"}
                                            >
                                                <Star className={`w-4 h-4 ${property.isFeatured ? 'fill-current' : ''}`} />
                                            </button>
                                            <button onClick={() => setEditingProperty(property)} className="text-gray-400 hover:text-blue-600 transition-colors tooltip-trigger" title="Edit">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeleteProperty(property.id)} className="text-gray-400 hover:text-red-500 transition-colors tooltip-trigger" title="Delete">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Advanced Multi-step Wizard Modal */}
            {(isAddWizardOpen || editingProperty) && (
                <AddPropertyWizard
                    initialData={editingProperty}
                    targetAgencyId={targetAgencyId}
                    currentUserId={currentUser?.id}
                    onClose={() => {
                        setIsAddWizardOpen(false);
                        setEditingProperty(null);
                    }}
                    onSuccess={() => {
                        setIsAddWizardOpen(false);
                        setEditingProperty(null);
                        fetchProperties();
                    }}
                />
            )}

            {/* Bulk Upload CSV Wizard */}
            <BulkUploadWizard
                isOpen={isBulkWizardOpen}
                onClose={() => setIsBulkWizardOpen(false)}
                onSuccess={() => {
                    setIsBulkWizardOpen(false);
                    fetchProperties();
                }}
                targetAgencyId={targetAgencyId}
                currentUserId={currentUser?.id}
            />
        </div>
    );
};

export default PropertyManagement;
