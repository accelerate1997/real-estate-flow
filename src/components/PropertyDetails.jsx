import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pb } from '../services/pocketbase';
import { MapPin, Bed, Bath, Square, Ruler, Building2, Construction, ArrowLeft, Loader2, Phone, Mail, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

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

                {/* Layout Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Left Column: Visuals & Details */}
                    <div className="lg:col-span-8 space-y-8">
                        
                        {/* Immersive Gallery */}
                        <div className="relative rounded-[2rem] overflow-hidden bg-white shadow-premium border border-gray-100 group">
                            <div className="aspect-[16/9] md:aspect-[3/2] overflow-hidden">
                                {coverImageUrl ? (
                                    <motion.img
                                        initial={{ scale: 1.1 }}
                                        animate={{ scale: 1 }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        src={coverImageUrl}
                                        alt={property.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                                        <ImageIcon className="w-16 h-16 mb-2 opacity-50" />
                                        <span>No Image Available</span>
                                    </div>
                                )}
                            </div>
                            
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                            {/* Floating Badges */}
                            <div className="absolute top-6 left-6 flex flex-wrap gap-2">
                                <span className={clsx(
                                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-white backdrop-blur-md shadow-lg",
                                    property.transactionType === 'Rent' ? "bg-blue-600/80" : "bg-primary/80"
                                )}>
                                    For {property.transactionType}
                                </span>
                                {property.propertyCategory && (
                                    <span className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-white bg-black/40 backdrop-blur-md shadow-lg border border-white/10">
                                        {property.propertyCategory}
                                    </span>
                                )}
                            </div>

                            {/* Thumbnail Strip Overlay */}
                            {secondaryImagesUrls.length > 0 && (
                                <div className="absolute bottom-6 left-6 right-6 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                    {secondaryImagesUrls.slice(0, 4).map((url, i) => (
                                        <div key={i} className="relative h-20 w-32 rounded-xl overflow-hidden border-2 border-white/50 shadow-lg shrink-0 cursor-pointer hover:border-white transition-all">
                                            <img src={url} alt="sub" className="w-full h-full object-cover" />
                                            {i === 3 && secondaryImagesUrls.length > 4 && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold">
                                                    +{secondaryImagesUrls.length - 3}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Property Basic Info */}
                        <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-premium border border-gray-100">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em]">
                                        <MapPin className="w-4 h-4" />
                                        <span>{property.location}</span>
                                    </div>
                                    <h1 className="text-3xl md:text-5xl font-black text-dark leading-tight tracking-tight">
                                        {property.title}
                                    </h1>
                                </div>
                                <div className="text-left md:text-right">
                                    <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mb-1">Asking Price</p>
                                    <p className="text-4xl md:text-5xl font-black text-primary tracking-tighter">
                                        {formatCurrency(property.price)}
                                        {property.transactionType === 'Rent' && <span className="text-lg text-gray-400 font-medium">/mo</span>}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 pt-8 border-t border-gray-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-primary shadow-inner">
                                        <Square className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Area</p>
                                        <p className="font-bold text-dark">{property.carpetArea || '-'}<span className="text-xs ml-0.5 text-gray-500">ft²</span></p>
                                    </div>
                                </div>
                                {property.propertyCategory === 'Residential' && (
                                    <>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-primary shadow-inner">
                                                <Bed className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Type</p>
                                                <p className="font-bold text-dark">{property.bhkType || '-'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-primary shadow-inner">
                                                <Building2 className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Status</p>
                                                <p className="font-bold text-dark truncate max-w-[80px]">{property.furnishing || '-'}</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-primary shadow-inner">
                                        <Construction className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Condition</p>
                                        <p className="font-bold text-dark">{'Ready'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description Section */}
                        <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-premium border border-gray-100">
                            <h3 className="text-2xl font-black text-dark mb-6 flex items-center gap-3">
                                <span className="w-2 h-8 bg-primary rounded-full" />
                                Overview
                            </h3>
                            <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line font-medium selection:bg-primary/20">
                                {property.description || "Experience the pinnacle of luxury living in this exceptional property, meticulously designed to offer the perfect blend of comfort, style, and functionality. Located in one of the most sought-after neighborhoods, this residence stands as a testament to architectural excellence and premium craftsmanship."}
                            </p>
                        </div>

                        {/* Video Section */}
                        {videoUrls.length > 0 && (
                            <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-premium border border-gray-100">
                                <h3 className="text-2xl font-black text-dark mb-6">Property Preview</h3>
                                <div className="space-y-6">
                                    {videoUrls.map((url, idx) => (
                                        <div key={idx} className="rounded-3xl overflow-hidden bg-gray-900 aspect-video shadow-2xl relative group">
                                            <video src={url} controls className="w-full h-full object-cover" preload="metadata" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Dynamic Sidebar */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-28 space-y-6">
                            
                            {/* Lead Form Panel */}
                            <div className="glass-panel rounded-[2rem] p-8 border border-white/50 shadow-glass relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                                
                                <h3 className="text-xl font-black text-dark mb-2 relative z-10">Make an Inquiry</h3>
                                <p className="text-sm text-gray-500 mb-8 font-medium">Unlock exclusive details & schedule a private tour.</p>

                                <div className="flex items-center gap-4 mb-8 p-4 bg-white/40 rounded-2xl border border-white/20">
                                    <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center font-black text-xl shadow-lg ring-4 ring-white/50 overflow-hidden">
                                        {property.expand?.createdBy?.avatar ? (
                                            <img src={pb.files.getURL(property.expand.createdBy, property.expand.createdBy.avatar)} className="w-full h-full object-cover" alt="avatar" />
                                        ) : property.expand?.createdBy?.name?.charAt(0) || 'A'}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">Verified Partner</p>
                                        <p className="font-black text-dark leading-tight">{property.expand?.createdBy?.name || 'Premier Agent'}</p>
                                        <p className="text-xs text-gray-500 font-bold truncate max-w-[150px]">{property.expand?.agencyId?.agencyName || 'Estate Dynamics'}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 relative z-10">
                                    {(() => {
                                        let rawPhone = property.expand?.agencyId?.phone?.replace(/[^\d]/g, '') || '918268919143';
                                        if (rawPhone.length === 10) rawPhone = `91${rawPhone}`;
                                        const message = encodeURIComponent(`Hi, I'm interested in "${property.title}" (Ref: ${property.id}). Please share more details.`);
                                        const waLink = `https://api.whatsapp.com/send?phone=${rawPhone}&text=${message}`;
                                        
                                        return (
                                            <a href={waLink} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-3 bg-[#25D366] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#128C7E] transition-all shadow-lg shadow-green-200/50 hover:-translate-y-0.5 active:translate-y-0">
                                                <Phone className="w-5 h-5" />
                                                Send WhatsApp
                                            </a>
                                        );
                                    })()}
                                    <button className="w-full flex items-center justify-center gap-3 bg-dark text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-lg hover:-translate-y-0.5 active:translate-y-0">
                                        <Mail className="w-5 h-5" />
                                        Request Tour
                                    </button>
                                </div>

                                <div className="mt-8 pt-8 border-t border-black/5 text-center">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Typical response time: <span className="text-primary italic">Under 2 hours</span></p>
                                </div>
                            </div>

                            {/* Trust Badge Panel */}
                            <div className="bg-dark text-white rounded-[2rem] p-8 shadow-premium overflow-hidden relative">
                                <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary/20 rounded-full translate-y-1/2 translate-x-1/2 blur-2xl" />
                                <h4 className="font-black text-lg mb-2 tracking-tight">Prime Assurance</h4>
                                <p className="text-white/60 text-sm font-medium leading-relaxed">
                                    Verified transactions, background-checked partners, and 24/7 support throughout your journey.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PropertyDetails;
