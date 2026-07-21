import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pb } from '../services/pocketbase';
import { MapPin, Bed, Bath, Square, Ruler, Building2, Construction, ArrowLeft, Loader2, Phone, Mail, Image as ImageIcon, Check, ChevronLeft, ChevronRight, X, Calendar, ShieldCheck, Heart, Share2, Compass, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { initializeTracking, trackPageView, trackLeadSubmission, trackContactClick } from '../services/tracking';

const PropertyDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [property, setProperty] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Lightbox & Gallery state
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);
    
    // Lead form state
    const [leadName, setLeadName] = useState('');
    const [leadPhone, setLeadPhone] = useState('');
    const [leadEmail, setLeadEmail] = useState('');
    const [isSubmittingLead, setIsSubmittingLead] = useState(false);
    const [leadSubmitted, setLeadSubmitted] = useState(false);
    const [consentChecked, setConsentChecked] = useState(false);
    
    // OTP & Language state
    const [preferredLanguage, setPreferredLanguage] = useState('English');
    const [otpStep, setOtpStep] = useState(1);
    const [otpCode, setOtpCode] = useState('');
    const [otpError, setOtpError] = useState('');
    const [isSendingOtp, setIsSendingOtp] = useState(false);

    useEffect(() => {
        const fetchProperty = async () => {
            setIsLoading(true);
            try {
                const record = await pb.collection('properties').getOne(id, {
                    expand: 'createdBy,agencyId'
                });
                setProperty(record);

                // Initialize tracking with agency credentials and send page_view event
                const agencyUser = record.expand?.agencyId || record.expand?.createdBy;
                const googleTagId = agencyUser?.metadata?.googleTagId;
                const metaPixelId = agencyUser?.metadata?.metaPixelId;
                if (googleTagId || metaPixelId) {
                    initializeTracking(googleTagId, metaPixelId);
                    trackPageView(window.location.pathname, record.title);
                }
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

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: property?.title,
                text: `Check out this premium property: ${property?.title}`,
                url: window.location.href,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert("Property link copied to clipboard!");
        }
    };

    const handleSendOtp = async (e) => {
        if (e) e.preventDefault();
        if (!leadPhone) { alert("Please enter your phone number."); return; }
        setIsSendingOtp(true);
        setOtpError('');
        try {
            const agencyId = property?.agencyId || property?.expand?.agencyId?.id || property?.expand?.createdBy?.agencyId;
            const res = await fetch('/api/leads/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: leadPhone, agencyId })
            });
            const data = await res.json();
            if (data.success) {
                setOtpStep(2);
            } else {
                setOtpError(data.message || "Failed to send WhatsApp verification code.");
            }
        } catch (err) {
            console.error("Failed to send OTP:", err);
            setOtpError("Network error. Please try again.");
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otpCode) { setOtpError("Please enter the verification code."); return; }
        setIsSubmittingLead(true);
        setOtpError('');
        try {
            const agencyId = property?.agencyId || property?.expand?.agencyId?.id || property?.expand?.createdBy?.agencyId;
            const res = await fetch('/api/leads/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: leadPhone,
                    otp: otpCode,
                    agencyId,
                    name: leadName,
                    email: leadEmail,
                    requirement: `Interested in property: "${property?.title}" (ID: ${property?.id})`,
                    preferredLanguage,
                    marketing_opt_in: consentChecked,
                    interestedPropertyId: property?.id
                })
            });
            const data = await res.json();
            if (data.success) {
                setLeadSubmitted(true);
                setLeadName('');
                setLeadPhone('');
                setLeadEmail('');
                setOtpCode('');
                setOtpStep(1);

                // Track Lead submission event
                trackLeadSubmission({
                    title: property?.title,
                    value: property?.price,
                    location: property?.location
                });
            } else {
                setOtpError(data.message || "Invalid verification code.");
            }
        } catch (err) {
            console.error("Failed to verify OTP:", err);
            setOtpError("Network error. Please try again.");
        } finally {
            setIsSubmittingLead(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen pt-24 pb-12 flex justify-center items-center bg-gray-50/50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <p className="text-gray-500 font-semibold tracking-wider text-sm">Loading premium property details...</p>
                </div>
            </div>
        );
    }

    if (error || !property) {
        return (
            <div className="min-h-screen pt-24 pb-12 flex justify-center items-center bg-gray-50/50">
                <div className="text-center p-8 glass-panel max-w-md mx-auto rounded-3xl shadow-xl border border-gray-100">
                    <h2 className="text-2xl font-black text-dark mb-2">Property Unavailable</h2>
                    <p className="text-gray-500 mb-6">{error || "This property could not be loaded."}</p>
                    <button onClick={() => navigate(-1)} className="btn-primary">
                        Return to Listings
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
        ? pb.files.getURL(property, imageList[0])
        : null;

    const secondaryImagesUrls = imageList.slice(1).map(img =>
        pb.files.getURL(property, img)
    );

    const allImagesUrls = imageList.map(img => 
        pb.files.getURL(property, img)
    );

    // Process videos
    const videoList = Array.isArray(property.videos)
        ? property.videos
        : (typeof property.videos === 'string' && property.videos.trim() !== '' ? [property.videos] : []);

    const videoUrls = videoList.map(vid =>
        pb.files.getURL(property, vid)
    );

    // Parse Amenities
    let amenitiesList = [];
    if (property.projectAmenities) {
        if (Array.isArray(property.projectAmenities)) {
            amenitiesList = property.projectAmenities;
        } else if (typeof property.projectAmenities === 'string') {
            try {
                const parsed = JSON.parse(property.projectAmenities);
                amenitiesList = Array.isArray(parsed) ? parsed : [parsed];
            } catch (e) {
                amenitiesList = property.projectAmenities.split(',').map(item => item.trim()).filter(Boolean);
            }
        }
    }

    // Parse Neighborhood Highlights
    let proximityHighlights = [];
    if (property.neighborhoodHighlights) {
        if (Array.isArray(property.neighborhoodHighlights)) {
            proximityHighlights = property.neighborhoodHighlights;
        } else if (typeof property.neighborhoodHighlights === 'string') {
            try {
                const parsed = JSON.parse(property.neighborhoodHighlights);
                proximityHighlights = Array.isArray(parsed) ? parsed : [];
            } catch (e) {}
        }
    }
    
    // Fallback default list if empty
    if (proximityHighlights.length === 0) {
        proximityHighlights = [
            { name: "Metro / Transit Station", distance: "5 mins" },
            { name: "Premium Shopping Mall", distance: "8 mins" },
            { name: "International Airport", distance: "25 mins" },
            { name: "Supermarket & Groceries", distance: "2 mins" },
            { name: "Multi-specialty Hospital", distance: "10 mins" }
        ];
    }

    const templateId = window.agencyConfig?.templateId || 'classic';
    const isModern = templateId === 'modern';
    const isMinimal = templateId === 'minimal';

    return (
        <div className={`min-h-screen pt-20 pb-20 transition-colors duration-300 ${
            isModern ? 'bg-[#080610] text-white' : isMinimal ? 'bg-[#FAF9F6] text-gray-900 font-serif' : 'bg-gray-50/30 text-gray-900 font-sans'
        }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Navigation Bar */}
                <div className="flex items-center justify-between py-6 mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className={`group flex items-center gap-2.5 transition-colors font-semibold text-sm ${
                            isModern ? 'text-white/60 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Listings</span>
                    </button>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setIsFavorite(!isFavorite)}
                            className={clsx(
                                "p-3 border transition-all active:scale-95 shadow-sm",
                                isFavorite 
                                    ? "text-red-500 border-red-100 bg-red-50" 
                                    : isModern 
                                        ? "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white" 
                                        : "bg-white border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50",
                                isMinimal ? "rounded-none" : "rounded-full"
                            )}
                        >
                            <Heart className="w-5 h-5" fill={isFavorite ? "currentColor" : "none"} />
                        </button>
                        <button 
                            onClick={handleShare}
                            className={clsx(
                                "p-3 border transition-all active:scale-95 shadow-sm",
                                isModern 
                                    ? "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white" 
                                    : "bg-white border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50",
                                isMinimal ? "rounded-none" : "rounded-full"
                            )}
                        >
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Premium Grid Gallery */}
                <div className={clsx(
                    "grid grid-cols-1 gap-4 mb-10 overflow-hidden",
                    allImagesUrls.length > 1 ? "md:grid-cols-3" : "grid-cols-1",
                    isModern 
                        ? "bg-white/4 border border-white/8 rounded-[2.5rem] p-3 shadow-2xl" 
                        : isMinimal 
                            ? "bg-transparent border-none rounded-none p-0 shadow-none" 
                            : "bg-white border border-gray-100 rounded-[2.5rem] p-3 shadow-premium"
                )}>
                    {/* Main Image */}
                    <div 
                        className={clsx(
                            "relative overflow-hidden cursor-pointer group aspect-[4/3] bg-gray-100",
                            allImagesUrls.length > 1 ? "md:col-span-2 md:aspect-auto md:h-[480px]" : "md:col-span-3 md:aspect-[21/9]",
                            isMinimal ? "rounded-none" : "rounded-2xl"
                        )}
                        onClick={() => {
                            setActiveImageIndex(0);
                            setIsLightboxOpen(true);
                        }}
                    >
                        {coverImageUrl ? (
                            <img
                                src={coverImageUrl}
                                alt={property.title}
                                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700 ease-out"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://placehold.co/600x400/f3f4f6/9ca3af?text=No+Image+Available";
                                }}
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                <ImageIcon className="w-16 h-16 mb-2 opacity-50" />
                                <span className="font-semibold text-sm">No Images Available</span>
                            </div>
                        )}
                        
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 pointer-events-none" />

                        {/* Floating Badges */}
                        <div className="absolute top-6 left-6 flex flex-wrap gap-2.5">
                            <span className={clsx(
                                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-white backdrop-blur-md shadow-md",
                                property.transactionType === 'Rent' ? "bg-accent-teal/80 border border-accent-teal/20" : "bg-primary/80 border border-primary/20"
                            )}>
                                For {property.transactionType}
                            </span>
                            {property.propertyCategory && (
                                <span className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-black/45 backdrop-blur-md shadow-md border border-white/10">
                                    {property.propertyCategory}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Secondary Images Sidebar */}
                    {allImagesUrls.length > 1 && (
                        <div className="grid grid-cols-2 md:grid-cols-1 gap-4 md:h-[480px]">
                            {secondaryImagesUrls.slice(0, 2).map((url, index) => (
                                <div 
                                    key={index} 
                                    className={clsx(
                                        "relative overflow-hidden cursor-pointer group h-full min-h-[140px] md:min-h-0 bg-gray-100",
                                        isMinimal ? "rounded-none" : "rounded-2xl"
                                    )}
                                    onClick={() => {
                                        setActiveImageIndex(index + 1);
                                        setIsLightboxOpen(true);
                                    }}
                                >
                                    <img 
                                        src={url} 
                                        alt={`Property thumbnail ${index + 1}`} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "https://placehold.co/600x400/f3f4f6/9ca3af?text=No+Image+Available";
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300" />
                                    
                                    {/* Overlap indicator on second thumbnail if more images exist */}
                                    {index === 1 && allImagesUrls.length > 3 && (
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-white">
                                            <span className="text-2xl font-black">+{allImagesUrls.length - 3}</span>
                                            <span className="text-xs uppercase font-extrabold tracking-widest mt-1">Photos</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Main Content Layout Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* Left Column: Specs & Overview */}
                    <div className="lg:col-span-8 space-y-8">
                        
                        {/* Title, Address & Price Block */}
                        <div className={clsx(
                            "p-8 md:p-10 border relative overflow-hidden",
                            isModern 
                                ? "bg-white/4 border-white/8 rounded-2xl shadow-xl" 
                                : isMinimal 
                                    ? "bg-white border-gray-300 rounded-none shadow-none" 
                                    : "bg-white rounded-[2rem] shadow-premium border border-gray-100/60"
                        )}>
                            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                            
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-primary font-extrabold text-xs uppercase tracking-widest bg-primary/10 w-fit px-3 py-1.5 rounded-full border border-primary/10">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span>{property.location}</span>
                                    </div>
                                    <h1 className="text-3xl md:text-5xl font-black text-dark leading-tight tracking-tight">
                                        {property.title}
                                    </h1>
                                </div>
                                <div className={clsx(
                                    "p-6 text-left md:text-right min-w-[200px] flex flex-col justify-center border",
                                    isModern 
                                        ? "bg-white/5 border-white/10 rounded-xl" 
                                        : isMinimal 
                                            ? "bg-[#FAF9F6] border-gray-300 rounded-none" 
                                            : "bg-gray-50/50 border border-gray-100 rounded-2xl"
                                )}>
                                    <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest block mb-1">Asking Price</span>
                                    <span className="text-3xl md:text-4xl font-black text-primary tracking-tighter">
                                        {formatCurrency(property.price)}
                                    </span>
                                    {property.transactionType === 'Rent' && (
                                        <span className="text-xs text-gray-400 font-bold mt-1">per month</span>
                                    )}
                                </div>
                            </div>

                            {/* Core Specs Grid */}
                            <div className={`grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-8 mt-8 border-t ${
                                isModern ? 'border-white/8' : 'border-gray-100'
                            }`}>
                                <div className={clsx(
                                    "flex items-center gap-3 p-3 border transition-all duration-300",
                                    isModern 
                                        ? "bg-white/5 border-white/10 rounded-xl hover:bg-white/10 text-white" 
                                        : isMinimal 
                                            ? "bg-white border-gray-200 rounded-none hover:border-gray-900 text-gray-900" 
                                            : "bg-gray-50/20 rounded-2xl border border-gray-100 hover:bg-white hover:border-primary/20 hover:shadow-sm"
                                )}>
                                    <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                                        <Square className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">Carpet Area</p>
                                        <p className={`font-extrabold text-xs truncate ${isModern ? 'text-white' : 'text-dark'}`}>{property.carpetArea || '-'}<span className="text-[10px] ml-0.5 font-normal text-gray-500">sqft</span></p>
                                    </div>
                                </div>

                                {property.propertyCategory === 'Residential' ? (
                                    <>
                                        <div className={clsx(
                                            "flex items-center gap-3 p-3 border transition-all duration-300",
                                            isModern 
                                                ? "bg-white/5 border-white/10 rounded-xl hover:bg-white/10 text-white" 
                                                : isMinimal 
                                                    ? "bg-white border-gray-200 rounded-none hover:border-gray-900 text-gray-900" 
                                                    : "bg-gray-50/20 rounded-2xl border border-gray-100 hover:bg-white hover:border-primary/20 hover:shadow-sm"
                                        )}>
                                            <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                                                <Bed className="w-4.5 h-4.5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">Configuration</p>
                                                <p className={`font-extrabold text-xs truncate ${isModern ? 'text-white' : 'text-dark'}`}>{property.bhkType || '-'}</p>
                                            </div>
                                        </div>
                                        <div className={clsx(
                                            "flex items-center gap-3 p-3 border transition-all duration-300",
                                            isModern 
                                                ? "bg-white/5 border-white/10 rounded-xl hover:bg-white/10 text-white" 
                                                : isMinimal 
                                                    ? "bg-white border-gray-200 rounded-none hover:border-gray-900 text-gray-900" 
                                                    : "bg-gray-50/20 rounded-2xl border border-gray-100 hover:bg-white hover:border-primary/20 hover:shadow-sm"
                                        )}>
                                            <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                                                <Building2 className="w-4.5 h-4.5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">Furnishing</p>
                                                <p className={`font-extrabold text-xs truncate ${isModern ? 'text-white' : 'text-dark'}`}>{property.furnishing || '-'}</p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className={clsx(
                                            "flex items-center gap-3 p-3 border transition-all duration-300",
                                            isModern 
                                                ? "bg-white/5 border-white/10 rounded-xl hover:bg-white/10 text-white" 
                                                : isMinimal 
                                                    ? "bg-white border-gray-200 rounded-none hover:border-gray-900 text-gray-900" 
                                                    : "bg-gray-50/20 rounded-2xl border border-gray-100 hover:bg-white hover:border-primary/20 hover:shadow-sm"
                                        )}>
                                            <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                                                <Building2 className="w-4.5 h-4.5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">Property Type</p>
                                                <p className={`font-extrabold text-xs truncate ${isModern ? 'text-white' : 'text-dark'}`}>{property.propertyType || 'Commercial'}</p>
                                            </div>
                                        </div>
                                        <div className={clsx(
                                            "flex items-center gap-3 p-3 border transition-all duration-300",
                                            isModern 
                                                ? "bg-white/5 border-white/10 rounded-xl hover:bg-white/10 text-white" 
                                                : isMinimal 
                                                    ? "bg-white border-gray-200 rounded-none hover:border-gray-900 text-gray-900" 
                                                    : "bg-gray-50/20 rounded-2xl border border-gray-100 hover:bg-white hover:border-primary/20 hover:shadow-sm"
                                        )}>
                                            <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                                                <Compass className="w-4.5 h-4.5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">Ideal For</p>
                                                <p className={`font-extrabold text-xs truncate ${isModern ? 'text-white' : 'text-dark'}`}>{property.idealFor || 'Offices / Shops'}</p>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className={clsx(
                                    "flex items-center gap-3 p-3 border transition-all duration-300",
                                    isModern 
                                        ? "bg-white/5 border-white/10 rounded-xl hover:bg-white/10 text-white" 
                                        : isMinimal 
                                            ? "bg-white border-gray-200 rounded-none hover:border-gray-900 text-gray-900" 
                                            : "bg-gray-50/20 rounded-2xl border border-gray-100 hover:bg-white hover:border-primary/20 hover:shadow-sm"
                                )}>
                                    <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                                        <Construction className="w-4.5 h-4.5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">Status</p>
                                        <p className={`font-extrabold text-xs truncate ${isModern ? 'text-white' : 'text-dark'}`}>Ready to Move</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Overview Description */}
                        <div className={clsx(
                            "p-8 md:p-10 border",
                            isModern 
                                ? "bg-white/4 border-white/8 rounded-2xl shadow-xl" 
                                : isMinimal 
                                    ? "bg-white border-gray-300 rounded-none shadow-none" 
                                    : "bg-white rounded-[2rem] shadow-premium border border-gray-100/60"
                        )}>
                            <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                                <span className="w-2.5 h-7 bg-primary rounded-full" />
                                Property Overview
                            </h3>
                            <p className={clsx(
                                "text-base md:text-lg leading-relaxed whitespace-pre-line font-medium",
                                isModern ? "text-white/70" : "text-gray-600"
                            )}>
                                {property.description || "Experience the pinnacle of premium living in this exceptional property, meticulously curated to provide the perfect blend of architectural grandeur, high-end comfort, and flawless functionality. Positioned in one of the city's most desirable and well-connected neighborhoods, this property sets a new standard for luxury real estate."}
                            </p>
                        </div>

                        {/* Project Amenities */}
                        {amenitiesList.length > 0 && (
                            <div className={clsx(
                                "p-8 md:p-10 border",
                                isModern 
                                    ? "bg-white/4 border-white/8 rounded-2xl shadow-xl" 
                                    : isMinimal 
                                        ? "bg-white border-gray-300 rounded-none shadow-none" 
                                        : "bg-white rounded-[2rem] shadow-premium border border-gray-100/60"
                            )}>
                                <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                                    <span className="w-2.5 h-7 bg-primary rounded-full" />
                                    Premium Amenities
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {amenitiesList.map((amenity, idx) => (
                                        <div key={idx} className={clsx(
                                            "flex items-center gap-2.5 p-2.5 border transition-all group",
                                            isModern 
                                                ? "bg-white/5 border-white/10 hover:border-primary/20 hover:bg-white/10 text-white" 
                                                : isMinimal 
                                                    ? "bg-[#FAF9F6] border-gray-200 rounded-none hover:border-gray-900 text-gray-900" 
                                                    : "bg-gray-50/50 border border-gray-100 rounded-xl hover:border-primary/20 hover:bg-white"
                                        )}>
                                            <div className="w-6 h-6 rounded-md bg-green-550/10 flex items-center justify-center text-green-500 shrink-0">
                                                <Check className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-xs font-semibold truncate">{amenity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Location Proximity timeline */}
                        <div className={clsx(
                            "p-8 md:p-10 border",
                            isModern 
                                ? "bg-white/4 border-white/8 rounded-2xl shadow-xl" 
                                : isMinimal 
                                    ? "bg-white border-gray-300 rounded-none shadow-none" 
                                    : "bg-white rounded-[2rem] shadow-premium border border-gray-100/60"
                        )}>
                            <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                                <span className="w-2.5 h-7 bg-primary rounded-full" />
                                Neighborhood Highlights
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {proximityHighlights.map((highlight, idx) => (
                                    <div key={idx} className={clsx(
                                        "flex items-center justify-between p-4 border",
                                        isModern 
                                            ? "bg-white/5 border-white/10 rounded-2xl" 
                                            : isMinimal 
                                                ? "bg-[#FAF9F6] border-gray-200 rounded-none" 
                                                : "border border-gray-100 rounded-2xl bg-gray-50/30"
                                    )}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                <Compass className="w-4.5 h-4.5" />
                                            </div>
                                            <span className="text-sm font-semibold">{highlight.name}</span>
                                        </div>
                                        <span className="text-xs font-black text-primary bg-primary/5 px-2.5 py-1.5 rounded-lg border border-primary/5">{highlight.distance}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Videos Section */}
                        {videoUrls.length > 0 && (
                            <div className={clsx(
                                "p-8 md:p-10 border",
                                isModern 
                                    ? "bg-white/4 border-white/8 rounded-2xl shadow-xl" 
                                    : isMinimal 
                                        ? "bg-white border-gray-300 rounded-none shadow-none" 
                                        : "bg-white rounded-[2rem] shadow-premium border border-gray-100/60"
                            )}>
                                <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                                    <span className="w-2.5 h-7 bg-primary rounded-full" />
                                    Property Video Tour
                                </h3>
                                <div className="space-y-6">
                                    {videoUrls.map((url, idx) => (
                                        <div key={idx} className={clsx(
                                            "overflow-hidden aspect-video shadow-lg relative border",
                                            isModern 
                                                ? "bg-black/40 border-white/10 rounded-2xl" 
                                                : isMinimal 
                                                    ? "bg-[#FAF9F6] border-gray-300 rounded-none" 
                                                    : "bg-gray-900 border border-gray-100 rounded-3xl"
                                        )}>
                                            <video src={url} controls className="w-full h-full object-cover" preload="metadata" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Sticky Sidebar Info & Lead Form */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-28 space-y-6">
                            
                            {/* Verified Partner info & Inline Lead form */}
                            <div className={clsx(
                                "p-8 border relative overflow-hidden",
                                isModern 
                                    ? "bg-white/4 border-white/8 rounded-2xl shadow-xl" 
                                    : isMinimal 
                                        ? "bg-white border-gray-300 rounded-none shadow-none" 
                                        : "bg-white border border-gray-100 shadow-premium rounded-[2rem]"
                            )}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                                
                                <h3 className={`text-xl font-black mb-1 flex items-center gap-2 ${isModern ? 'text-white' : 'text-dark'}`}>
                                    <Sparkles className="w-5 h-5 text-primary" />
                                    Contact Agent
                                </h3>
                                <p className="text-xs text-gray-400 mb-6 font-semibold uppercase tracking-wider">Verified Listing Partner</p>
 
                                {/* Partner Card */}
                                <div className={clsx(
                                    "flex items-center gap-4 mb-6 p-4 border",
                                    isModern 
                                        ? "bg-white/5 border-white/10 rounded-2xl" 
                                        : isMinimal 
                                            ? "bg-[#FAF9F6] border-gray-300 rounded-none" 
                                            : "bg-gray-50/50 rounded-2xl border border-gray-100/80"
                                )}>
                                    <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-black text-lg shadow-md ring-4 ring-white overflow-hidden shrink-0">
                                        {property.expand?.createdBy?.avatar ? (
                                            <img 
                                                src={pb.files.getURL(property.expand.createdBy, property.expand.createdBy.avatar)} 
                                                className="w-full h-full object-cover" 
                                                alt="avatar" 
                                            />
                                        ) : property.expand?.createdBy?.name?.charAt(0) || 'A'}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1">
                                            <p className={`font-extrabold leading-tight truncate text-sm ${isModern ? 'text-white' : 'text-dark'}`}>
                                                {property.expand?.createdBy?.name || 'Premier Agent'}
                                            </p>
                                            <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
                                        </div>
                                        <p className="text-xs text-gray-500 font-bold truncate mt-0.5">
                                            {property.expand?.agencyId?.agencyName || 'Estate Dynamics'}
                                        </p>
                                    </div>
                                </div>

                                {/* Form and Submit */}
                                {leadSubmitted ? (
                                    <div className="bg-green-50/60 border border-green-100 p-6 rounded-2xl text-center py-8">
                                        <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md shadow-green-100">
                                            <Check className="w-6 h-6" />
                                        </div>
                                        <h4 className="font-black text-green-900 text-base mb-1">Inquiry Submitted!</h4>
                                        <p className="text-xs text-green-700 font-semibold mb-4 leading-relaxed">Our listing agent will reach out to you on WhatsApp / Email shortly.</p>
                                        <button 
                                            onClick={() => setLeadSubmitted(false)}
                                            className="text-xs text-primary font-black uppercase tracking-wider hover:underline"
                                        >
                                            Send Another Request
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {otpError && (
                                            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-bold text-center">
                                                {otpError}
                                            </div>
                                        )}

                                        {otpStep === 1 ? (
                                            <form onSubmit={handleSendOtp} className="space-y-4">
                                                <div>
                                                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">Your Name</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={leadName}
                                                        onChange={(e) => setLeadName(e.target.value)}
                                                        placeholder="e.g. John Doe"
                                                        className={`w-full px-4 py-3 border text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all hover:border-gray-200 ${
                                                            isModern 
                                                                ? 'bg-white/5 border-white/10 text-white rounded-xl' 
                                                                : isMinimal 
                                                                    ? 'bg-white border-gray-300 text-gray-900 rounded-none' 
                                                                    : 'bg-gray-50 border border-gray-100 rounded-xl'
                                                        }`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">WhatsApp / Phone</label>
                                                    <input
                                                        type="tel"
                                                        required
                                                        value={leadPhone}
                                                        onChange={(e) => setLeadPhone(e.target.value)}
                                                        placeholder="e.g. +91 99999 99999"
                                                        className={`w-full px-4 py-3 border text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all hover:border-gray-200 ${
                                                            isModern 
                                                                ? 'bg-white/5 border-white/10 text-white rounded-xl' 
                                                                : isMinimal 
                                                                    ? 'bg-white border-gray-300 text-gray-900 rounded-none' 
                                                                    : 'bg-gray-50 border border-gray-100 rounded-xl'
                                                        }`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
                                                    <input
                                                        type="email"
                                                        required
                                                        value={leadEmail}
                                                        onChange={(e) => setLeadEmail(e.target.value)}
                                                        placeholder="e.g. john@example.com"
                                                        className={`w-full px-4 py-3 border text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all hover:border-gray-200 ${
                                                            isModern 
                                                                ? 'bg-white/5 border-white/10 text-white rounded-xl' 
                                                                : isMinimal 
                                                                    ? 'bg-white border-gray-300 text-gray-900 rounded-none' 
                                                                    : 'bg-gray-50 border border-gray-100 rounded-xl'
                                                        }`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">Preferred Language to Speak</label>
                                                    <select
                                                        value={preferredLanguage}
                                                        onChange={(e) => setPreferredLanguage(e.target.value)}
                                                        className={`w-full px-4 py-3 border text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all ${
                                                            isModern 
                                                                ? 'bg-[#080610] border-white/10 text-white rounded-xl' 
                                                                : isMinimal 
                                                                    ? 'bg-white border-gray-300 text-gray-900 rounded-none' 
                                                                    : 'bg-gray-50 border border-gray-100 rounded-xl text-gray-800'
                                                        }`}
                                                    >
                                                        <option value="English">English</option>
                                                        <option value="Hindi">Hindi (हिंदी)</option>
                                                        <option value="Marathi">Marathi (मराठी)</option>
                                                        <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                                                        <option value="Spanish">Spanish (Español)</option>
                                                    </select>
                                                </div>

                                                <div className="flex items-start gap-2.5 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                                     <input
                                                         type="checkbox"
                                                         id="marketing_consent"
                                                         checked={consentChecked}
                                                         onChange={(e) => setConsentChecked(e.target.checked)}
                                                         className="mt-0.5 rounded text-primary focus:ring-primary border-gray-300 w-4 h-4 cursor-pointer"
                                                         required
                                                     />
                                                     <label htmlFor="marketing_consent" className="text-[11px] text-gray-500 leading-normal font-medium cursor-pointer">
                                                         I consent to Rajesh Realty collecting my details to send matching properties, alerts, and updates via WhatsApp. I agree to the <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">Privacy Policy</a>.
                                                     </label>
                                                 </div>

                                                <button
                                                    type="submit"
                                                    disabled={isSendingOtp}
                                                    className="w-full py-4 bg-primary text-white rounded-xl font-extrabold text-xs uppercase tracking-widest hover:bg-primary-dark transition-all shadow-md shadow-primary/10 hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 mt-2"
                                                >
                                                    {isSendingOtp ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            <span>Sending WhatsApp OTP...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Phone className="w-4 h-4" />
                                                            <span>Verify Phone via WhatsApp</span>
                                                        </>
                                                    )}
                                                </button>
                                            </form>
                                        ) : (
                                            <form onSubmit={handleVerifyOtp} className="space-y-4">
                                                <div className="text-center py-2">
                                                    <h5 className="font-extrabold text-gray-800 text-sm mb-1">Enter Verification Code</h5>
                                                    <p className="text-xs text-gray-500">We sent a 6-digit OTP code to <strong className="text-gray-700">{leadPhone}</strong> via WhatsApp.</p>
                                                </div>
                                                <div>
                                                    <input
                                                        type="text"
                                                        required
                                                        maxLength={6}
                                                        value={otpCode}
                                                        onChange={(e) => setOtpCode(e.target.value.replace(/[^\d]/g, ''))}
                                                        placeholder="Enter OTP Code"
                                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-center text-lg font-black tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                                                    />
                                                </div>

                                                <div className="flex gap-3 mt-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => setOtpStep(1)}
                                                        className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-extrabold text-xs uppercase tracking-wider hover:bg-gray-200 transition-all text-center"
                                                    >
                                                        Back
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={isSubmittingLead}
                                                        className="flex-[2] py-3.5 bg-primary text-white rounded-xl font-extrabold text-xs uppercase tracking-widest hover:bg-primary-dark transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-2"
                                                    >
                                                        {isSubmittingLead ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                                <span>Verifying...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Check className="w-4 h-4" />
                                                                <span>Confirm & Submit</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                                <div className="text-center">
                                                    <button
                                                        type="button"
                                                        onClick={handleSendOtp}
                                                        disabled={isSendingOtp}
                                                        className="text-[10px] text-primary font-black uppercase tracking-wider hover:underline mt-2 disabled:text-gray-400"
                                                    >
                                                        {isSendingOtp ? "Sending..." : "Resend OTP Code"}
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                )}

                                {/* WhatsApp Fast Link */}
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    {(() => {
                                        let rawPhone = property.expand?.agencyId?.phone?.replace(/[^\d]/g, '') || '918268919143';
                                        if (rawPhone.length === 10) rawPhone = `91${rawPhone}`;
                                        const message = encodeURIComponent(`Hi, I'm interested in "${property.title}" (Ref: ${property.id}). Please share more details.`);
                                        const waLink = `https://api.whatsapp.com/send?phone=${rawPhone}&text=${message}`;
                                        
                                        return (
                                            <a 
                                                href={waLink} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                onClick={() => trackContactClick('whatsapp')}
                                                className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-4 rounded-xl font-extrabold text-xs uppercase tracking-widest hover:bg-[#128C7E] transition-all shadow-md shadow-green-100 hover:-translate-y-0.5 active:translate-y-0"
                                            >
                                                <Phone className="w-4.5 h-4.5" />
                                                <span>Send WhatsApp Inquiry</span>
                                            </a>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Trust Assurance Badge */}
                            <div className="bg-dark text-white rounded-[2rem] p-8 shadow-premium overflow-hidden relative border border-black/10">
                                <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/20 rounded-full translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-primary">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <h4 className="font-black text-base tracking-tight">Verified Property</h4>
                                </div>
                                <p className="text-white/60 text-xs font-semibold leading-relaxed">
                                    This property has been vetted by our quality control agents for registration, title deed ownership, and exact location markers.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lightbox / Gallery Fullscreen Modal */}
            <AnimatePresence>
                {isLightboxOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 md:p-6"
                    >
                        {/* Header bar */}
                        <div className="flex justify-between items-center text-white py-2">
                            <span className="font-extrabold text-sm tracking-wider uppercase">
                                Image {activeImageIndex + 1} of {allImagesUrls.length}
                            </span>
                            <button 
                                onClick={() => setIsLightboxOpen(false)}
                                className="p-2.5 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-all active:scale-95 shadow-md"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Slider Body */}
                        <div className="relative flex-1 flex items-center justify-center max-w-5xl mx-auto w-full group">
                            
                            {/* Left Navigation */}
                            {allImagesUrls.length > 1 && (
                                <button 
                                    onClick={() => setActiveImageIndex((prev) => (prev === 0 ? allImagesUrls.length - 1 : prev - 1))}
                                    className="absolute left-4 z-10 p-3 rounded-full bg-black/55 text-white/80 hover:text-white hover:bg-black/85 transition-all shadow-lg active:scale-90 border border-white/5 opacity-0 group-hover:opacity-100"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                            )}

                            {/* Image Container */}
                            <div className="w-full max-h-[75vh] flex justify-center items-center select-none overflow-hidden rounded-2xl">
                                <motion.img 
                                    key={activeImageIndex}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                    src={allImagesUrls[activeImageIndex]} 
                                    alt="Fullscreen viewing" 
                                    className="max-w-full max-h-[75vh] object-contain rounded-xl"
                                />
                            </div>

                            {/* Right Navigation */}
                            {allImagesUrls.length > 1 && (
                                <button 
                                    onClick={() => setActiveImageIndex((prev) => (prev === allImagesUrls.length - 1 ? 0 : prev + 1))}
                                    className="absolute right-4 z-10 p-3 rounded-full bg-black/55 text-white/80 hover:text-white hover:bg-black/85 transition-all shadow-lg active:scale-90 border border-white/5 opacity-0 group-hover:opacity-100"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            )}
                        </div>

                        {/* Thumbnail Bar */}
                        {allImagesUrls.length > 1 && (
                            <div className="flex justify-center gap-2 overflow-x-auto pb-4 max-w-2xl mx-auto w-full scrollbar-hide shrink-0">
                                {allImagesUrls.map((url, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={() => setActiveImageIndex(idx)}
                                        className={clsx(
                                            "w-16 h-12 rounded-lg overflow-hidden cursor-pointer border-2 shrink-0 transition-all",
                                            activeImageIndex === idx ? "border-primary scale-105" : "border-transparent opacity-50 hover:opacity-80"
                                        )}
                                    >
                                        <img src={url} alt="thumbnail cursor" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x400/f3f4f6/9ca3af?text=No+Image+Available"; }} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PropertyDetails;
