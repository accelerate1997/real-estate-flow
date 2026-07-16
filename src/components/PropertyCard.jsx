import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, BedDouble, Bath, Square, Heart, ArrowRight, Tag } from 'lucide-react';
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

    // Helper to get image URL
    const getImageUrl = () => {
        if (!property) return "https://placehold.co/600x400/f3f4f6/9ca3af?text=No+Image+Available";

        const images = property.images || [];
        const firstImage = Array.isArray(images) ? images[0] : images;

        if (firstImage && typeof firstImage === 'string') {
            if (firstImage.startsWith('http')) return firstImage;
            return firstImage;
        }

        return "https://placehold.co/600x400/f3f4f6/9ca3af?text=No+Image+Available";
    };

    const getCategoryBadge = () => {
        if (!property.propertyCategory) return null;
        const isCommercial = property.propertyCategory.toLowerCase().includes('commercial');
        return (
            <span className="glass-panel text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full shadow-lg">
                {property.propertyCategory}
                {isCommercial && <Tag className="w-3 h-3 ml-1 -mt-0.5 inline-block text-accent-teal" />}
            </span>
        );
    };

    const getTransactionBadge = () => {
        if (!property.transactionType) return null;
        const isRent = property.transactionType === 'Rent';
        return (
            <span className={clsx(
                "text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full shadow-lg",
                isRent ? "bg-accent-teal/80 backdrop-blur-md" : "bg-primary/80 backdrop-blur-md"
            )}>
                For {property.transactionType}
            </span>
        );
    };

    const handleCardClick = () => {
        if (onClick) {
            onClick(property);
        } else {
            navigate(`/property/${property.id}`);
        }
    };

    return (
        <motion.article
            layout
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            whileHover={{ y: -8, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
            onClick={handleCardClick}
            className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-premium transition-all duration-500 flex flex-col h-full"
        >
            {/* Image Container */}
            <div className="relative aspect-[4/3] overflow-hidden">
                <motion.img
                    src={getImageUrl()}
                    alt={property.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    initial={{ scale: 1 }}
                    whileInView={{ scale: 1 }}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/600x400/f3f4f6/9ca3af?text=No+Image+Available";
                    }}
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    {getCategoryBadge()}
                    {getTransactionBadge()}
                </div>

                {/* Wishlist button */}
                <button
                    onClick={(e) => { e.stopPropagation(); }}
                    className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white hover:text-primary transition-all duration-300"
                    aria-label="Add to favorites"
                >
                    <Heart className="w-4 h-4" strokeWidth={2} />
                </button>
            </div>

            {/* Content Container */}
            <div className="p-6 flex flex-col flex-grow">
                {/* Title & Location */}
                <div className="mb-2">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors duration-300 line-clamp-1">
                        {property.title}
                    </h3>
                </div>

                <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-4">
                    <MapPin className="w-3.5 h-3.5 text-primary/70 flex-shrink-0" />
                    <span className="line-clamp-1">{property.location}</span>
                </div>

                {/* Property Features Grid */}
                <div className="grid grid-cols-3 gap-4 py-4 border-y border-gray-50 mb-4">
                    <div className="flex flex-col gap-1 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-gray-400">
                            <BedDouble className="w-3.5 h-3.5" />
                            <span className="text-[10px] uppercase tracking-wider font-semibold">Beds</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{property.bhkType || '—'}</span>
                    </div>
                    <div className="flex flex-col gap-1 text-center border-x border-gray-100 px-4">
                        <div className="flex items-center justify-center gap-1.5 text-gray-400">
                            <Bath className="w-3.5 h-3.5" />
                            <span className="text-[10px] uppercase tracking-wider font-semibold">Baths</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{property.bathrooms || '—'}</span>
                    </div>
                    <div className="flex flex-col gap-1 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-gray-400">
                            <Square className="w-3.5 h-3.5" />
                            <span className="text-[10px] uppercase tracking-wider font-semibold">Area</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900 truncate">
                            {property.carpetArea || property.builtUpArea || '—'}
                            <span className="text-[10px] font-normal text-gray-400"> sqft</span>
                        </span>
                    </div>
                </div>

                {/* Footer - Price & Arrow */}
                <div className="mt-auto flex items-center justify-between">
                    <div>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-0.5">Price</span>
                        <span className="text-2xl font-display font-bold text-gray-900">
                            {formatCurrency(property.price)}
                            {property.transactionType === 'Rent' && <span className="text-sm font-normal text-gray-400"> /mo</span>}
                        </span>
                    </div>

                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 45 }}
                        transition={{ duration: 0.3 }}
                        className="w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300"
                    >
                        <ArrowRight className="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                    </motion.div>
                </div>
            </div>
        </motion.article>
    );
};

export default PropertyCard;
