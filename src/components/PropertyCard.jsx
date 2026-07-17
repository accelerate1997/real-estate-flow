import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, BedDouble, Bath, Square, Heart, ArrowRight, Tag, Droplets, Zap, Compass, Building2, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { pb } from '../services/pocketbase';

// Helper to format currency
const formatCurrency = (amount) => {
    if (!amount) return 'Price on Request';
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000)   return `₹${(amount / 100000).toFixed(2)} L`;
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

// Helper to get image URL
const getImageUrl = (property) => {
    if (!property) return "https://placehold.co/600x400/f3f4f6/9ca3af?text=No+Image+Available";

    const images = property.images || [];
    const firstImage = Array.isArray(images) ? images[0] : images;

    if (firstImage && typeof firstImage === 'string') {
        if (firstImage.startsWith('http')) return firstImage;
        return pb.files.getURL(property, firstImage);
    }

    return "https://placehold.co/600x400/f3f4f6/9ca3af?text=No+Image+Available";
};

// ─── CLASSIC THEME CARD ──────────────────────────────────────────────────────
const ClassicCardStyle = ({ property, handleCardClick }) => {
    const isRent = property.transactionType === 'Rent';
    return (
        <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            whileHover={{ y: -6 }}
            onClick={handleCardClick}
            className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-400 border border-gray-150 flex flex-col h-full text-gray-900"
        >
            <div className="relative overflow-hidden aspect-[4/3]">
                <img
                    src={getImageUrl(property)}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600"
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1600585154340-be6191dae10c?auto=format&fit=crop&q=80&w=800'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
                <span className={`absolute top-4 left-4 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${isRent ? 'bg-teal-500/90' : 'bg-primary/90'} backdrop-blur-sm`}>
                    For {property.transactionType || 'Sale'}
                </span>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="text-white font-display font-bold text-2xl drop-shadow-lg">
                        {formatCurrency(property.price)}
                        {isRent && <span className="text-sm font-normal opacity-85">/mo</span>}
                    </div>
                </div>
            </div>
            <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-1 group-hover:text-primary transition-colors mb-1">
                    {property.title}
                </h3>
                <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-4">
                    <MapPin className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                    <span className="line-clamp-1">{property.location}</span>
                </div>
                <div className="flex items-center gap-4 pt-4 border-t border-gray-100 mt-auto">
                    {property.bhkType && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                            <BedDouble className="w-4 h-4 text-primary/60" />
                            <span className="text-xs font-semibold">{property.bhkType}</span>
                        </div>
                    )}
                    {property.bathrooms && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                            <Bath className="w-4 h-4 text-primary/60" />
                            <span className="text-xs font-semibold">{property.bathrooms}</span>
                        </div>
                    )}
                    {(property.carpetArea || property.builtUpArea) && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                            <Square className="w-4 h-4 text-primary/60" />
                            <span className="text-xs font-semibold">{property.carpetArea || property.builtUpArea} sqft</span>
                        </div>
                    )}
                    <div className="ml-auto">
                        <div className="w-9 h-9 rounded-full border-2 border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                            <ArrowRight className="w-4 h-4 text-primary group-hover:text-white transition-colors" />
                        </div>
                    </div>
                </div>
            </div>
        </motion.article>
    );
};

// ─── MODERN THEME CARD ───────────────────────────────────────────────────────
const ModernCardStyle = ({ property, handleCardClick }) => {
    const isRent = property.transactionType === 'Rent';
    return (
        <motion.article
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            whileHover={{ y: -6 }}
            onClick={handleCardClick}
            className="group cursor-pointer relative rounded-2xl overflow-hidden border border-white/8 bg-white/4 backdrop-blur-sm hover:border-primary/40 transition-all duration-400 flex flex-col h-full text-white"
            style={{ background: 'rgba(255,255,255,0.04)' }}
        >
            <div className="relative overflow-hidden aspect-[16/10]">
                <img
                    src={getImageUrl(property)}
                    alt={property.title}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                <span className={`absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full backdrop-blur-md border ${isRent ? 'bg-teal-500/20 border-teal-400/40 text-teal-300' : 'bg-primary/20 border-primary/40 text-primary'}`}>
                    For {property.transactionType || 'Sale'}
                </span>
                <div className="absolute bottom-4 left-4">
                    <div className="text-white font-black text-xl leading-none drop-shadow-lg">
                        {formatCurrency(property.price)}
                        {isRent && <span className="text-sm font-normal text-white/70 ml-1">/mo</span>}
                    </div>
                </div>
                <div className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-primary/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <ArrowRight className="w-4 h-4 text-white" />
                </div>
            </div>
            <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-white/90 text-sm leading-snug line-clamp-1 group-hover:text-white mb-2 transition-colors">
                    {property.title}
                </h3>
                <div className="flex items-center gap-1.5 text-white/40 text-xs mb-4">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="line-clamp-1">{property.location}</span>
                </div>
                <div className="flex items-center gap-4 pt-4 border-t border-white/8 mt-auto">
                    {property.bhkType && (
                        <div className="flex items-center gap-1.5 text-white/50 text-xs">
                            <BedDouble className="w-3.5 h-3.5 text-primary/70" />
                            {property.bhkType}
                        </div>
                    )}
                    {property.bathrooms && (
                        <div className="flex items-center gap-1.5 text-white/50 text-xs">
                            <Bath className="w-3.5 h-3.5 text-primary/70" />
                            {property.bathrooms}
                        </div>
                    )}
                    {(property.carpetArea || property.builtUpArea) && (
                        <div className="flex items-center gap-1.5 text-white/50 text-xs">
                            <Square className="w-3.5 h-3.5 text-primary/70" />
                            {property.carpetArea || property.builtUpArea} sqft
                        </div>
                    )}
                </div>
            </div>
        </motion.article>
    );
};

// ─── MINIMAL THEME CARD ──────────────────────────────────────────────────────
const MinimalCardStyle = ({ property, handleCardClick }) => {
    const isRent = property.transactionType === 'Rent';
    return (
        <motion.article
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            onClick={handleCardClick}
            className="group cursor-pointer bg-white border border-gray-200 hover:border-gray-900 transition-all duration-300 flex flex-col h-full text-gray-900"
        >
            <div className="relative overflow-hidden aspect-[4/3]">
                <img
                    src={getImageUrl(property)}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=800'; }}
                />
                <div className="absolute top-4 left-4">
                    <span className="bg-white text-gray-900 text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 border border-gray-200">
                        {property.propertyCategory || 'Residential'}
                    </span>
                </div>
            </div>
            <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isRent ? 'text-teal-600' : 'text-primary'}`}>
                        For {property.transactionType || 'Sale'}
                    </span>
                    <div className="w-7 h-7 border border-gray-200 flex items-center justify-center group-hover:bg-gray-900 group-hover:border-gray-900 transition-all duration-300">
                        <ArrowUpRight className="w-3.5 h-3.5 group-hover:text-white transition-colors" />
                    </div>
                </div>
                <div className="text-2xl font-serif font-normal text-gray-900 mb-1">
                    {formatCurrency(property.price)}
                    {isRent && <span className="text-base text-gray-400 ml-1">/mo</span>}
                </div>
                <h3 className="font-sans font-semibold text-gray-900 text-sm leading-snug line-clamp-1 mb-2 mt-1">
                    {property.title}
                </h3>
                <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-5">
                    <MapPin className="w-3 h-3 text-primary/70 shrink-0" />
                    <span className="line-clamp-1 font-sans">{property.location}</span>
                </div>
                <div className="flex items-center gap-5 pt-4 border-t border-gray-100 mt-auto font-sans">
                    {property.bhkType && (
                        <div className="flex items-center gap-1.5">
                            <BedDouble className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs text-gray-600 font-medium">{property.bhkType}</span>
                        </div>
                    )}
                    {property.bathrooms && (
                        <div className="flex items-center gap-1.5">
                            <Bath className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs text-gray-600 font-medium">{property.bathrooms}</span>
                        </div>
                    )}
                    {(property.carpetArea || property.builtUpArea) && (
                        <div className="flex items-center gap-1.5">
                            <Square className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs text-gray-600 font-medium">{property.carpetArea || property.builtUpArea} sqft</span>
                        </div>
                    )}
                </div>
            </div>
        </motion.article>
    );
};

const PropertyCard = ({ property, onClick }) => {
    const navigate = useNavigate();

    const handleCardClick = () => {
        if (onClick) {
            onClick(property);
        } else {
            navigate(`/property/${property.id}`);
        }
    };

    const templateId = window.agencyConfig?.templateId || 'classic';

    if (templateId === 'modern') {
        return <ModernCardStyle property={property} handleCardClick={handleCardClick} />;
    }

    if (templateId === 'minimal') {
        return <MinimalCardStyle property={property} handleCardClick={handleCardClick} />;
    }

    return <ClassicCardStyle property={property} handleCardClick={handleCardClick} />;
};

export default PropertyCard;
