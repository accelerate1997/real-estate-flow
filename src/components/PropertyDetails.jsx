import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pb } from '../services/pocketbase';
import { MapPin, Bed, Bath, Square, Ruler, Building2, Construction, ArrowLeft, Loader2, Phone, Mail, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const PropertyDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [property, setProperty] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProperty = async () => {
            setIsLoading(true);
            try {
                // Fetch property and expand the creator to show agency details
                const record = await pb.collection('properties').getOne(id, {
                    expand: 'createdBy,agencyId'
                });
                setProperty(record);
            } catch (err) {
                console.error("Failed to fetch property:", err);
                setError(err.status === 404 ? "Property not found." : "Failed to load property details.");
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchProperty();
    }, [id]);

    const formatCurrency = (amount) => {
        if (!amount) return 'Price on Request';
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen pt-24 pb-12 flex justify-center items-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <p className="text-gray-500 font-medium tracking-wide">Loading premium property details...</p>
                </div>
            </div>
        );
    }

    if (error || !property) {
        return (
            <div className="min-h-screen pt-24 pb-12 flex justify-center items-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button onClick={() => navigate(-1)} className="text-primary hover:underline font-medium">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    // Process images
    const imageList = Array.isArray(property.images)
        ? property.images
        : (typeof property.images === 'string' && property.images.trim() !== '' ? [property.images] : []);

    const coverImageUrl = imageList.length > 0
        ? pb.files.getURL(property, imageList[0], { token: pb.authStore.token })
        : null;

    const secondaryImagesUrls = imageList.slice(1).map(img =>
        pb.files.getURL(property, img, { token: pb.authStore.token })
    );

    // Process videos
    const videoList = Array.isArray(property.videos)
        ? property.videos
        : (typeof property.videos === 'string' && property.videos.trim() !== '' ? [property.videos] : []);

    const videoUrls = videoList.map(vid =>
        pb.files.getURL(property, vid, { token: pb.authStore.token })
    );

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-16 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-medium">Back to Results</span>
                </button>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

                    {/* Hero Image Section */}
                    <div className="relative h-64 md:h-[500px] bg-gray-200 w-full group overflow-hidden">
                        {coverImageUrl ? (
                            <img
                                src={coverImageUrl}
                                alt={property.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100">
                                <ImageIcon className="w-16 h-16 mb-2 opacity-50" />
                                <span>No Image Available</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent"></div>

                        {/* Transaction Type Badge */}
                        <div className="absolute top-6 right-6">
                            <span className={`px-4 py-2 rounded-full text-sm font-bold text-white shadow-lg backdrop-blur-md ${property.transactionType === 'Rent' ? 'bg-blue-600/90' : 'bg-green-600/90'}`}>
                                For {property.transactionType}
                            </span>
                        </div>
                    </div>

                    {/* Secondary Image Strip (if any) */}
                    {secondaryImagesUrls.length > 0 && (
                        <div className="flex gap-2 p-2 bg-gray-50 overflow-x-auto">
                            {secondaryImagesUrls.map((url, i) => (
                                <img key={i} src={url} alt={`View ${i + 2}`} className="h-24 w-36 object-cover rounded-xl shrink-0 shadow-sm" />
                            ))}
                        </div>
                    )}

                    {/* Main Content Area */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12 p-4 sm:p-8 md:p-12">

                        {/* Left Column (Details) */}
                        <div className="lg:col-span-2 space-y-10">

                            {/* Header */}
                            <div>
                                <div className="flex items-center gap-2 text-primary font-medium text-sm mb-3 uppercase tracking-wider">
                                    <MapPin className="w-4 h-4" />
                                    <span>{property.location}</span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{property.title}</h1>
                                <p className="text-4xl font-extrabold text-primary">
                                    {formatCurrency(property.price)}
                                    {property.transactionType === 'Rent' && <span className="text-lg text-gray-500 font-medium"> / month</span>}
                                </p>
                            </div>

                            {/* Divider */}
                            <hr className="border-gray-100" />

                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {property.propertyCategory === 'Residential' && (
                                    <>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-gray-500 text-sm flex items-center gap-2"><Bed className="w-4 h-4" /> Type</span>
                                            <span className="font-bold text-gray-900 text-lg">{property.bhkType || '-'}</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-gray-500 text-sm flex items-center gap-2"><Bath className="w-4 h-4" /> Furnishing</span>
                                            <span className="font-bold text-gray-900 text-lg">{property.furnishing || '-'}</span>
                                        </div>
                                    </>
                                )}

                                <div className="flex flex-col gap-1">
                                    <span className="text-gray-500 text-sm flex items-center gap-2"><Square className="w-4 h-4" /> Carpet Area</span>
                                    <span className="font-bold text-gray-900 text-lg">{property.carpetArea || '-'} <span className="text-sm font-normal text-gray-500">sqft</span></span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-gray-500 text-sm flex items-center gap-2"><Ruler className="w-4 h-4" /> Built-up</span>
                                    <span className="font-bold text-gray-900 text-lg">{property.builtUpArea || '-'} <span className="text-sm font-normal text-gray-500">sqft</span></span>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">About this property</h3>
                                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                                    {property.description || "No description provided for this premium property."}
                                </p>
                            </div>

                            {/* Additional Categories Specs */}
                            {property.propertyCategory === 'Commercial' && (
                                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                    <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                                        <Building2 className="w-5 h-5 text-gray-400" /> Commercial Specs
                                    </h4>
                                    <p className="text-gray-600"><span className="font-medium text-gray-900">Suitability:</span> {property.businessTypeSuitability || 'Versatile'}</p>
                                </div>
                            )}

                            {property.propertyCategory === 'NewProjects' && (
                                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                    <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                                        <Construction className="w-5 h-5 text-gray-400" /> Project Details
                                    </h4>
                                    <p className="text-gray-600"><span className="font-medium text-gray-900">Status:</span> {property.constructionStatus || 'N/A'}</p>
                                </div>
                            )}

                            {/* Video Walkthroughs */}
                            {videoUrls.length > 0 && (
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">Property Walkthrough</h3>
                                    <div className="space-y-6">
                                        {videoUrls.map((url, idx) => (
                                            <div key={idx} className="rounded-2xl overflow-hidden bg-gray-900 shadow-xl border border-gray-100 aspect-video">
                                                <video
                                                    src={url}
                                                    controls
                                                    className="w-full h-full object-contain"
                                                    preload="metadata"
                                                >
                                                    Your browser does not support the video tag.
                                                </video>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Right Column (Sidebar / Contact) */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-28 bg-white rounded-3xl p-6 border border-gray-200 shadow-xl shadow-gray-200/50">
                                <h3 className="text-lg font-bold text-gray-900 mb-6">Interested in this property?</h3>

                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl shrink-0">
                                        {property.expand?.createdBy?.name?.charAt(0) || 'A'}
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Listed By</p>
                                        <p className="font-bold text-gray-900">{property.expand?.createdBy?.name || 'Agent'}</p>
                                        <p className="text-sm text-gray-500 truncate">{property.expand?.agencyId?.agencyName || 'RR Real Estate'}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <a href="https://wa.me/something" target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-3 bg-[#25D366] text-white py-4 rounded-xl font-bold hover:bg-[#128C7E] transition-colors shadow-sm">
                                        <Phone className="w-5 h-5" />
                                        Contact via WhatsApp
                                    </a>
                                    <button className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 border-2 border-gray-200 py-4 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-sm">
                                        <Mail className="w-5 h-5" />
                                        Request Details
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default PropertyDetails;
