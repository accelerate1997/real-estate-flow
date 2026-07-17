import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
    Sparkles, ArrowRight, MapPin, BedDouble, Bath, Square,
    Heart, Calculator, ShieldCheck, Building2, Star, Quote, Loader2,
    ChevronDown, Search, Zap, Globe, Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { pb } from '../services/pocketbase';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatCurrency = (amount) => {
    if (!amount) return 'Price on Request';
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000)   return `₹${(amount / 100000).toFixed(2)} L`;
    return `₹${amount.toLocaleString('en-IN')}`;
};

const getImageUrl = (property) => {
    const images = property?.images || [];
    const first = Array.isArray(images) ? images[0] : images;
    if (first && typeof first === 'string') {
        if (first.startsWith('http')) return first;
        return pb.files.getURL(property, first);
    }
    return 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800';
};

// ─── Modern Property Card ────────────────────────────────────────────────────

const ModernCard = ({ property, index }) => {
    const navigate = useNavigate();
    const isRent = property.transactionType === 'Rent';

    return (
        <motion.article
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => navigate(`/property/${property.id}`)}
            className="group cursor-pointer relative rounded-2xl overflow-hidden border border-white/8 bg-white/4 backdrop-blur-sm hover:border-primary/40 transition-all duration-400 flex flex-col"
            style={{ background: 'rgba(255,255,255,0.04)' }}
        >
            {/* Image */}
            <div className="relative overflow-hidden" style={{ aspectRatio: '16/10' }}>
                <img
                    src={getImageUrl(property)}
                    alt={property.title}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800'; }}
                />

                {/* Dark gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Badge */}
                <span className={`absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full backdrop-blur-md border ${isRent ? 'bg-teal-500/20 border-teal-400/40 text-teal-300' : 'bg-primary/20 border-primary/40 text-primary'}`}>
                    For {property.transactionType || 'Sale'}
                </span>

                {/* Wishlist */}
                <button
                    onClick={e => e.stopPropagation()}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"
                >
                    <Heart className="w-3.5 h-3.5" />
                </button>

                {/* Price */}
                <div className="absolute bottom-4 left-4">
                    <div className="text-white font-black text-xl leading-none drop-shadow-lg">
                        {formatCurrency(property.price)}
                        {isRent && <span className="text-sm font-normal text-white/70 ml-1">/mo</span>}
                    </div>
                </div>

                {/* Arrow on hover */}
                <div className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-primary/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <ArrowRight className="w-4 h-4 text-white" />
                </div>
            </div>

            {/* Info */}
            <div className="p-5">
                <h3 className="font-bold text-white/90 text-sm leading-snug line-clamp-1 group-hover:text-white mb-2 transition-colors">
                    {property.title}
                </h3>
                <div className="flex items-center gap-1.5 text-white/40 text-xs mb-4">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="line-clamp-1">{property.location}</span>
                </div>
                <div className="flex items-center gap-4 pt-4 border-t border-white/8">
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

// ─── Properties Section ──────────────────────────────────────────────────────

const ModernPropertySection = () => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading]       = useState(true);
    const [tab, setTab]               = useState('all');
    const navigate = useNavigate();

    useEffect(() => {
        pb.collection('properties').getList(1, 40, { sort: '-id' })
            .then(r => setProperties(r.items))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const tabs = [
        { id: 'all',         label: 'All' },
        { id: 'Residential', label: 'Residential' },
        { id: 'Commercial',  label: 'Commercial' },
        { id: 'NewProjects', label: 'New Projects' },
    ];

    const displayed = (tab === 'all' ? properties : properties.filter(p => (p.propertyCategory || '').toLowerCase() === tab.toLowerCase())).slice(0, 9);

    return (
        <section id="modern-properties" className="py-24 relative z-10">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <span className="text-primary uppercase tracking-widest font-bold text-xs">Portfolio</span>
                        <h2 className="text-4xl md:text-5xl font-black text-white mt-2 leading-tight">
                            Premium <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-rose-400">Spaces</span>
                        </h2>
                    </div>
                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1.5 backdrop-blur-md self-start md:self-auto">
                        {tabs.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-200 ${
                                    tab === t.id
                                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                        : 'text-white/50 hover:text-white'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="rounded-2xl overflow-hidden border border-white/8 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                <div className="aspect-[16/10] bg-white/8" />
                                <div className="p-5 space-y-3">
                                    <div className="h-3 bg-white/10 rounded w-3/4" />
                                    <div className="h-2 bg-white/5 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : displayed.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayed.map((p, i) => <ModernCard key={p.id} property={p} index={i} />)}
                    </div>
                ) : (
                    <div className="text-center py-20 text-white/30">
                        <Building2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>No properties available</p>
                    </div>
                )}

                {displayed.length > 0 && (
                    <div className="text-center mt-14">
                        <button
                            onClick={() => navigate('/properties/residential')}
                            className="group inline-flex items-center gap-3 bg-white/5 border border-white/10 hover:border-primary/50 text-white font-bold px-10 py-4 rounded-full transition-all duration-300 backdrop-blur-sm"
                        >
                            Explore All Properties
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
};

// ─── Features ────────────────────────────────────────────────────────────────

const features = [
    { icon: ShieldCheck, title: 'Verified Premium',   desc: 'Every listing is physically verified, RERA registered, and legally cleared by our expert team.', accent: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
    { icon: Calculator,  title: 'Mortgage Calculator', desc: 'Estimate home loan monthly installments and interest payouts instantly with our smart calculator.', accent: 'text-primary bg-primary/10 border-primary/20' },
    { icon: Zap,         title: 'Instant Connect',    desc: 'WhatsApp-first approach: your lead reaches the right agent in under 10 seconds, any time of day.', accent: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
];

const FeaturesSection = () => (
    <section className="py-24 relative z-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
                <span className="text-accent-teal uppercase tracking-widest font-bold text-xs">Why We're Different</span>
                <h2 className="text-4xl md:text-5xl font-black text-white mt-3">
                    Built for the Future
                </h2>
                <p className="text-white/40 mt-4 max-w-xl mx-auto text-sm">
                    Combining instant communication, verified listings, and premium calculators for the most reliable real estate platform in India.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {features.map((f, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.15 }}
                        className="relative rounded-2xl p-8 border border-white/8 hover:border-white/15 transition-all duration-300 group"
                        style={{ background: 'rgba(255,255,255,0.03)' }}
                    >
                        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-6 ${f.accent}`}>
                            <f.icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-3">{f.title}</h3>
                        <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
                        <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <ArrowRight className="w-5 h-5 text-white/30" />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    </section>
);

// ─── Testimonials ────────────────────────────────────────────────────────────

const testimonials = [
    { name: 'Rahul Verma', role: 'Tech Investor', content: 'The AI assistant found me 3 office spaces matching my brief in under a minute. Absolutely mind-blowing experience.', rating: 5, city: 'Pune' },
    { name: 'Sneha Kulkarni', role: 'Homeowner', content: 'Dark, sleek, fast — just like the platform. Got my dream home verified and documented in 48 hours.', rating: 5, city: 'Mumbai' },
    { name: 'Arjun Nair', role: 'Developer', content: 'Finally a platform that shows me what I want without the noise. Premium experience, premium properties.', rating: 5, city: 'Bangalore' },
];

const ModernTestimonials = () => (
    <section className="py-24 relative z-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="mb-14">
                <span className="text-primary uppercase tracking-widest font-bold text-xs">Client Stories</span>
                <h2 className="text-4xl md:text-5xl font-black text-white mt-3">
                    Trusted by <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-rose-400">2000+ Families</span>
                </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {testimonials.map((t, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="rounded-2xl p-7 border border-white/8 hover:border-primary/30 transition-all duration-300 relative"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                        <div className="flex gap-1 mb-5">
                            {[...Array(t.rating)].map((_, j) => (
                                <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                            ))}
                        </div>
                        <p className="text-white/60 text-sm leading-relaxed mb-6 italic">"{t.content}"</p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-rose-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                {t.name.charAt(0)}{t.name.split(' ')[1]?.charAt(0)}
                            </div>
                            <div>
                                <div className="text-white font-bold text-sm">{t.name}</div>
                                <div className="text-white/40 text-xs">{t.role} · {t.city}</div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    </section>
);

// ─── CTA ─────────────────────────────────────────────────────────────────────

const ModernCTA = () => {
    const navigate = useNavigate();
    return (
        <section className="py-24 relative z-10">
            <div className="max-w-5xl mx-auto px-6 text-center">
                <div className="relative rounded-3xl p-12 md:p-20 border border-white/8 overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/20 blur-[120px]" />
                    <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent-teal/15 blur-[120px]" />
                    <div className="relative z-10">
                        <Sparkles className="w-10 h-10 text-primary mx-auto mb-6 animate-pulse" />
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
                            Ready to Find Your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-rose-300 to-orange-300">Perfect Space?</span>
                        </h2>
                        <p className="text-white/50 mb-10 text-base max-w-lg mx-auto">
                            Estimate your loan installments or explore our verified collection of ultra-premium properties.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => document.getElementById('modern-properties')?.scrollIntoView({ behavior: 'smooth' })}
                                className="bg-primary hover:bg-primary-dark text-white font-bold px-10 py-4 rounded-xl transition-all duration-300 shadow-lg shadow-primary/30 hover:-translate-y-0.5"
                            >
                                Explore Properties
                            </button>
                            <button
                                onClick={() => navigate('/calculator')}
                                className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-bold px-10 py-4 rounded-xl transition-all duration-300"
                            >
                                <Calculator className="w-5 h-5 text-accent-teal" />
                                Mortgage Calculator
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

// ─── Main Export ─────────────────────────────────────────────────────────────

const ThemeModern = () => {
    return (
        <div className="bg-dark text-white min-h-screen overflow-x-hidden font-sans" style={{ background: '#080610' }}>

            {/* Global Ambient Glows */}
            <div className="fixed top-0 left-0 right-0 h-screen overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full bg-primary/15 blur-[180px] animate-pulse" />
                <div className="absolute top-40 right-[-200px] w-[600px] h-[600px] rounded-full bg-accent-teal/10 blur-[160px] animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* ── HERO ── */}
            <section className="relative min-h-screen flex items-center pt-20 z-10">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh]">

                        {/* Left: Text */}
                        <div className="space-y-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest text-primary"
                            >
                                <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
                                Next-Gen Real Estate Portal
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.9, delay: 0.1 }}
                                className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight"
                            >
                                Discover Homes<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-rose-300 to-orange-200">
                                    Designed For
                                </span><br />
                                Your Lifestyle
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="text-white/50 text-lg leading-relaxed max-w-md"
                            >
                                Ultra-premium properties verified physically, instant connect, and zero compromise.
                            </motion.p>

                            {/* Stats Row */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex items-center gap-8"
                            >
                                {[{ v: '98%', l: 'Satisfaction' }, { v: '15+', l: 'Years Active' }, { v: '500+', l: 'Properties' }].map((s, i) => (
                                    <div key={i} className="text-center">
                                        <div className="text-3xl font-black text-white">{s.v}</div>
                                        <div className="text-white/35 text-xs font-medium mt-0.5">{s.l}</div>
                                    </div>
                                ))}
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="flex flex-col sm:flex-row gap-4"
                            >
                                <button
                                    onClick={() => document.getElementById('modern-properties')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold px-9 py-4 rounded-xl transition-all duration-300 shadow-lg shadow-primary/30 hover:-translate-y-0.5"
                                >
                                    Explore Spaces
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => navigate('/calculator')}
                                    className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold px-9 py-4 rounded-xl transition-all duration-300"
                                >
                                    <Calculator className="w-5 h-5 text-accent-teal" />
                                    Mortgage Calculator
                                </button>
                            </motion.div>
                        </div>

                        {/* Right: Hero Image Collage */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, delay: 0.3 }}
                            className="relative hidden lg:block"
                        >
                            {/* Main Image */}
                            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl" style={{ height: '500px' }}>
                                <img
                                    src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800"
                                    alt="Luxury Property"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                {/* Floating card */}
                                <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                                    <div className="text-xs text-white/50 uppercase tracking-widest mb-1">Featured</div>
                                    <div className="text-white font-bold text-base">Luxury Penthouse</div>
                                    <div className="text-primary font-black text-xl mt-1">₹3.2 Cr</div>
                                    <div className="flex items-center gap-3 mt-3 text-white/40 text-xs">
                                        <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" /> 4 BHK</span>
                                        <span className="flex items-center gap-1"><Square className="w-3 h-3" /> 3200 sqft</span>
                                    </div>
                                </div>
                            </div>

                            {/* Second small image */}
                            <div className="absolute -bottom-8 -right-8 w-56 h-40 rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                                <img
                                    src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=400"
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40" />
                                <div className="absolute bottom-3 left-3 text-white">
                                    <div className="text-[10px] text-white/50 uppercase tracking-widest">Commercial</div>
                                    <div className="text-sm font-bold">Premium Office</div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── FEATURES ── */}
            <FeaturesSection />

            {/* ── PROPERTIES ── */}
            <ModernPropertySection />

            {/* ── TESTIMONIALS ── */}
            <ModernTestimonials />

            {/* ── CTA ── */}
            <ModernCTA />
        </div>
    );
};

export default ThemeModern;
