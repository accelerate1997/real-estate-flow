import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowRight, MapPin, BedDouble, Bath, Square, Heart,
    Calculator, ShieldCheck, Star, ArrowUpRight, Search, ChevronRight
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
    return 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=800';
};

// ─── Minimal Property Card ───────────────────────────────────────────────────

const MinimalCard = ({ property, index }) => {
    const navigate = useNavigate();
    const isRent = property.transactionType === 'Rent';

    return (
        <motion.article
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            onClick={() => navigate(`/property/${property.id}`)}
            className="group cursor-pointer bg-white border border-gray-200 hover:border-gray-900 transition-all duration-300 flex flex-col"
        >
            {/* Image */}
            <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <img
                    src={getImageUrl(property)}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-600"
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=800'; }}
                    style={{ '--tw-scale-x': 1.03, '--tw-scale-y': 1.03 }}
                />
                {/* Category tag */}
                <div className="absolute top-4 left-4">
                    <span className="bg-white text-gray-900 text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 border border-gray-200">
                        {property.propertyCategory || 'Residential'}
                    </span>
                </div>
                {/* Wishlist */}
                <button
                    onClick={e => e.stopPropagation()}
                    className="absolute top-4 right-4 w-9 h-9 bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all duration-200"
                >
                    <Heart className="w-4 h-4" />
                </button>
            </div>

            {/* Info */}
            <div className="p-6 flex flex-col flex-1">
                {/* For Sale / Rent */}
                <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest font-sans ${isRent ? 'text-teal-600' : 'text-primary'}`}>
                        For {property.transactionType || 'Sale'}
                    </span>
                    <div className="w-7 h-7 border border-gray-200 flex items-center justify-center group-hover:bg-gray-900 group-hover:border-gray-900 transition-all duration-300">
                        <ArrowUpRight className="w-3.5 h-3.5 group-hover:text-white transition-colors" />
                    </div>
                </div>

                {/* Price */}
                <div className="text-2xl font-serif font-normal text-gray-900 mb-1">
                    {formatCurrency(property.price)}
                    {isRent && <span className="text-base text-gray-400 ml-1">/mo</span>}
                </div>

                {/* Title */}
                <h3 className="font-sans font-semibold text-gray-900 text-sm leading-snug line-clamp-1 mb-2 mt-1">
                    {property.title}
                </h3>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-5">
                    <MapPin className="w-3 h-3 text-primary/70 shrink-0" />
                    <span className="line-clamp-1 font-sans">{property.location}</span>
                </div>

                {/* Divider + Stats */}
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

// ─── Property Section ────────────────────────────────────────────────────────

const MinimalPropertySection = () => {
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
        { id: 'NewProjects', label: 'Projects' },
    ];

    const displayed = (tab === 'all' ? properties : properties.filter(p => (p.propertyCategory || '').toLowerCase() === tab.toLowerCase())).slice(0, 8);

    return (
        <section id="minimal-properties" className="py-24 bg-[#FAF9F6] border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-14">
                    <div>
                        <span className="text-xs uppercase tracking-widest text-primary font-sans font-bold">Showcase</span>
                        <h2 className="text-4xl md:text-5xl font-serif font-normal text-gray-900 mt-2 leading-tight">
                            Available Estates
                        </h2>
                    </div>
                    {/* Tabs — minimal pill style */}
                    <div className="flex items-center gap-3 font-sans self-start md:self-auto">
                        {tabs.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 border ${
                                    tab === t.id
                                        ? 'bg-gray-900 text-white border-gray-900'
                                        : 'bg-transparent text-gray-500 border-gray-300 hover:border-gray-900 hover:text-gray-900'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid: 4-col on large, 2-col on md */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white border border-gray-200 animate-pulse">
                                <div className="aspect-[4/3] bg-gray-100" />
                                <div className="p-6 space-y-3">
                                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                                    <div className="h-2 bg-gray-50 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : displayed.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {displayed.map((p, i) => <MinimalCard key={p.id} property={p} index={i} />)}
                    </div>
                ) : (
                    <div className="text-center py-20 text-gray-400 font-sans">
                        <p>No properties in this category.</p>
                    </div>
                )}

                {displayed.length > 0 && (
                    <div className="mt-14 flex items-center justify-between border-t border-gray-200 pt-10">
                        <p className="text-sm text-gray-400 font-sans">Showing {displayed.length} of {properties.length} estates</p>
                        <button
                            onClick={() => navigate('/properties/residential')}
                            className="group flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-primary font-sans transition-colors"
                        >
                            Browse Full Catalogue
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
};

// ─── Philosophy Section ───────────────────────────────────────────────────────

const philosophy = [
    {
        num: '01',
        title: 'Bespoke Curation',
        desc: 'We only showcase spaces with architecture that speaks. No generic builder floors, no templated apartments.'
    },
    {
        num: '02',
        title: 'Complete Transparency',
        desc: 'RERA registered only. Full disclosure on road widths, power sources, floor plans, and possession timelines.'
    },
    {
        num: '03',
        title: 'Direct Access',
        desc: 'Your query connects to an agent via WhatsApp in under 10 seconds — no call centers, no middlemen.'
    },
];

const PhilosophySection = () => (
    <section className="py-24 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                {/* Left */}
                <div>
                    <span className="text-xs uppercase tracking-widest text-primary font-sans font-bold">Philosophy</span>
                    <h2 className="text-4xl md:text-5xl font-serif font-normal text-gray-900 mt-3 leading-tight">
                        Bespoke estate curation built on transparency and clarity.
                    </h2>
                    <div className="mt-10 relative h-72 overflow-hidden">
                        <img
                            src="https://images.unsplash.com/photo-1600585154340-be6191dae10c?auto=format&fit=crop&q=80&w=800"
                            alt=""
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-5 left-5 bg-white/95 border border-gray-200 px-6 py-4">
                            <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-primary">Featured Space</span>
                            <p className="text-sm font-serif mt-1">Symphony Heights, Pune</p>
                        </div>
                    </div>
                </div>
                {/* Right: Numbered list */}
                <div className="space-y-0">
                    {philosophy.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.15 }}
                            className="py-8 border-b border-gray-200 group cursor-default"
                        >
                            <div className="flex items-start gap-6">
                                <span className="text-xs font-bold text-primary font-mono shrink-0 mt-1">{item.num} /</span>
                                <div className="flex-1">
                                    <h3 className="font-sans font-bold text-gray-900 text-base mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed font-sans">{item.desc}</p>
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mt-1" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    </section>
);

// ─── Testimonials ────────────────────────────────────────────────────────────

const testimonials = [
    { name: 'Meera Iyer', role: 'Interior Designer', content: 'The curation is exceptional. Every property felt handpicked. No noise, just quality. Exactly what I was looking for.', rating: 5 },
    { name: 'Karan Malhotra', role: 'Architect', content: 'Discovered a plot through their catalogue that matched my brief perfectly. The process was simple, documented, and stress-free.', rating: 5 },
    { name: 'Divya Anand', role: 'Homeowner', content: 'Clean interface, honest pricing, and a genuine agent. Rare in real estate. Would recommend without hesitation.', rating: 5 },
];

const MinimalTestimonials = () => (
    <section className="py-24 bg-[#FAF9F6] border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
            <div className="mb-14">
                <span className="text-xs uppercase tracking-widest text-primary font-sans font-bold">Testimonials</span>
                <h2 className="text-4xl font-serif font-normal text-gray-900 mt-2">What Our Clients Say</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {testimonials.map((t, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white border border-gray-200 p-8 font-sans"
                    >
                        <div className="flex gap-0.5 mb-5">
                            {[...Array(t.rating)].map((_, j) => (
                                <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                            ))}
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed italic mb-6">"{t.content}"</p>
                        <div className="flex items-center gap-3 pt-5 border-t border-gray-100">
                            <div className="w-9 h-9 bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                                {t.name.charAt(0)}{t.name.split(' ')[1]?.charAt(0)}
                            </div>
                            <div>
                                <div className="font-bold text-gray-900 text-sm">{t.name}</div>
                                <div className="text-xs text-gray-400">{t.role}</div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    </section>
);

// ─── CTA ─────────────────────────────────────────────────────────────────────

const MinimalCTA = () => {
    const navigate = useNavigate();
    return (
        <section
            className="relative py-24 overflow-hidden"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=2000')", backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
            <div className="absolute inset-0 bg-gray-900/85" />
            <div className="relative z-10 max-w-3xl mx-auto px-6 text-center font-sans">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <span className="text-xs uppercase tracking-widest text-primary font-bold">Begin Your Search</span>
                    <h2 className="text-4xl md:text-5xl font-serif font-normal text-white mt-4 mb-5 leading-tight">
                        Are You Looking to<br />Buy a Property?
                    </h2>
                    <p className="text-white/60 mb-10 text-sm font-sans">
                        Browse our curated catalogue or use our mortgage calculator to find your budget.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => document.getElementById('minimal-properties')?.scrollIntoView({ behavior: 'smooth' })}
                            className="bg-white text-gray-900 font-semibold px-10 py-4 hover:bg-gray-100 transition-colors text-sm tracking-wide uppercase"
                        >
                            Browse Catalogue
                        </button>
                        <button
                            onClick={() => navigate('/calculator')}
                            className="flex items-center justify-center gap-2 border border-white/30 text-white font-semibold px-10 py-4 hover:bg-white/10 transition-colors text-sm tracking-wide uppercase"
                        >
                            <Calculator className="w-4 h-4" />
                            Mortgage Calculator
                        </button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

// ─── Main Export ─────────────────────────────────────────────────────────────

const ThemeMinimal = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-[#FAF9F6] text-gray-900 min-h-screen selection:bg-primary/10 pt-16">

            {/* ── HERO — Split Layout ── */}
            <section className="border-b border-gray-200 relative min-h-[88vh] flex items-center">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch min-h-[80vh]">

                        {/* Left: Text */}
                        <div className="flex flex-col justify-center py-20 pr-0 lg:pr-16">

                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="text-xs uppercase tracking-widest text-primary font-sans font-bold mb-8"
                            >
                                Est. 2015 · Bespoke Real Estate
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 25 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.1 }}
                                className="text-5xl sm:text-6xl md:text-7xl font-serif font-normal leading-tight tracking-tight text-gray-900 mb-8"
                            >
                                Find Your<br />
                                Perfect Home<br />
                                <span className="text-primary">Without</span> the<br />
                                Hassle
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="text-gray-500 font-sans font-light leading-relaxed text-base mb-10 max-w-sm"
                            >
                                We curate premium residential, commercial, and investment properties with complete transparency and zero compromise on quality.
                            </motion.p>

                            {/* Stats */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex items-center gap-8 mb-10 font-sans"
                            >
                                {[{ v: '500+', l: 'Properties' }, { v: '10+', l: 'Years' }, { v: '95%', l: 'Satisfaction' }].map((s, i) => (
                                    <div key={i} className="text-center">
                                        <div className="text-2xl font-bold text-gray-900">{s.v}</div>
                                        <div className="text-xs text-gray-400 mt-0.5 uppercase tracking-wide">{s.l}</div>
                                    </div>
                                ))}
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className="flex flex-col sm:flex-row gap-4 font-sans"
                            >
                                <button
                                    onClick={() => document.getElementById('minimal-properties')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="border border-gray-900 bg-gray-900 text-white font-semibold px-8 py-3.5 hover:bg-transparent hover:text-gray-900 transition-all text-sm tracking-wide uppercase"
                                >
                                    Browse Catalogue
                                </button>
                                <button
                                    onClick={() => navigate('/calculator')}
                                    className="border border-gray-300 text-gray-700 font-semibold px-8 py-3.5 hover:border-gray-900 hover:text-gray-900 transition-all text-sm tracking-wide uppercase flex items-center gap-2"
                                >
                                    Mortgage Calculator
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </motion.div>
                        </div>

                        {/* Right: Image */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="relative hidden lg:block w-full h-full min-h-[550px]"
                        >
                            {/* Main tall image */}
                            <div className="absolute inset-0 overflow-hidden">
                                <img
                                    src="https://images.unsplash.com/photo-1600585154340-be6191dae10c?auto=format&fit=crop&q=80&w=1200"
                                    alt="Luxury estate"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-[#FAF9F6]/40 to-transparent" />

                                {/* Floating info card */}
                                <div className="absolute bottom-10 right-8 bg-white border border-gray-200 px-7 py-5 shadow-xl">
                                    <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-primary">Featured Estate</span>
                                    <h3 className="text-base font-serif font-normal mt-1 text-gray-900">Symphony Heights</h3>
                                    <div className="text-xl font-sans font-bold text-gray-900 mt-1">₹2.8 Cr</div>
                                    <div className="flex items-center gap-4 mt-3 text-gray-400 text-xs font-sans">
                                        <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" /> 3 BHK</span>
                                        <span className="flex items-center gap-1"><Square className="w-3 h-3" /> 1850 sqft</span>
                                    </div>
                                </div>

                                {/* Small card top left */}
                                <div className="absolute top-10 left-4 bg-white/95 border border-gray-200 px-4 py-3 shadow-sm">
                                    <div className="flex items-center gap-1 mb-1">
                                        {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                                    </div>
                                    <div className="text-xs text-gray-900 font-sans font-semibold">Trusted by 2000+ families</div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── PHILOSOPHY ── */}
            <PhilosophySection />

            {/* ── PROPERTIES ── */}
            <MinimalPropertySection />

            {/* ── TESTIMONIALS ── */}
            <MinimalTestimonials />

            {/* ── CTA ── */}
            <MinimalCTA />
        </div>
    );
};

export default ThemeMinimal;
