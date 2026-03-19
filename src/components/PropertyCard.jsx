import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, BedDouble, Bath, Square, Heart, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

const PropertyCard = ({ property, onClick }) => {
    const navigate = useNavigate();

    // Helper to format currency
    const formatCurrency = (amount) => {
        if (!amount) return 'Price on Request';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Helper to get image URL from PocketBase
    const getImageUrl = () => {
        if (!property) return "https://images.unsplash.com/photo-1600585154340-be6191dae10c?auto=format&fit=crop&q=80&w=1000";
        
        const images = property.images || [];
        const firstImage = Array.isArray(images) ? images[0] : images;
        
        if (firstImage && typeof firstImage === 'string') {
            // Check if it's already a full URL
            if (firstImage.startsWith('http')) return firstImage;
            
            // Otherwise construct PB URL (assuming pb is available or imported statically)
            // For now using a fallback if we can't resolve it easily here, 
            // but we'll assume the parent provides the resolved URL or we import PB.
            // Let's use a safe approach where we expect a full URL or a relative one.
            return firstImage;
        }
        
        return "https://images.unsplash.com/photo-1600585154340-be6191dae10c?auto=format&fit=crop&q=80&w=1000";
    };

    const handleCardClick = () => {
        if (onClick) {
            onClick(property);
        } else {
            navigate(`/property/${property.id}`);
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -8 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={handleCardClick}
            className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-premium transition-all duration-500 flex flex-col h-full"
        >
            {/* Image Container */}
            <div className="relative aspect-[4/3] overflow-hidden">
                <img
                    src={getImageUrl()}
                    alt={property.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Overlays & Badges */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    {property.propertyCategory && (
                        <span className="glass-panel text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full shadow-lg">
                            {property.propertyCategory}
                        </span>
                    )}
                    {property.transactionType && (
                        <span className={clsx(
                            "text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full shadow-lg",
                            property.transactionType === 'Rent' ? "bg-accent/80 backdrop-blur-md" : "bg-primary/80 backdrop-blur-md"
                        )}>
                            For {property.transactionType}
                        </span>
                    )}
                </div>

                <button 
                    onClick={(e) => { e.stopPropagation(); }}
                    className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white hover:text-primary transition-all duration-300"
                >
                    <Heart className="w-4 h-4" />
                </button>
            </div>

            {/* Content Container */}
            <div className="p-6 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors duration-300 line-clamp-1">
                        {property.title}
                    </h3>
                </div>

                <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-4">
                    <MapPin className="w-3.5 h-3.5 text-primary/70" />
                    <span className="line-clamp-1">{property.location}</span>
                </div>

                {/* Property Features */}
                <div className="grid grid-cols-3 gap-4 py-4 border-y border-gray-50 mb-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-gray-400">
                            <BedDouble className="w-3.5 h-3.5" />
                            <span className="text-[10px] uppercase tracking-wider font-semibold">Beds</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{property.bhkType || '-'}</span>
                    </div>
                    <div className="flex flex-col gap-1 border-x border-gray-100 px-4">
                        <div className="flex items-center gap-1.5 text-gray-400">
                            <Bath className="w-3.5 h-3.5" />
                            <span className="text-[10px] uppercase tracking-wider font-semibold">Baths</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{property.bathrooms || '-'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-gray-400">
                            <Square className="w-3.5 h-3.5" />
                            <span className="text-[10px] uppercase tracking-wider font-semibold">Area</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900 truncate">{property.carpetArea || property.builtUpArea || '-'} <span className="text-[10px] font-normal text-gray-400">sqft</span></span>
                    </div>
                </div>

                {/* Footer Component of Card */}
                <div className="mt-auto flex items-center justify-between">
                    <div>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-0.5">Price</span>
                        <span className="text-xl font-display font-bold text-gray-900">
                            {formatCurrency(property.price)}
                            {property.transactionType === 'Rent' && <span className="text-sm font-normal text-gray-400"> /mo</span>}
                        </span>
                    </div>
                    
                    <div className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                        <ArrowRight className="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default PropertyCard;
