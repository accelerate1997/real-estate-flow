import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, MapPin, Home, Building2, Layers, ChevronDown, ArrowRight,
    BedDouble, Bath, Square, Heart, Phone, Calculator, ShieldCheck,
    Star, Quote, Loader2, Compass, Zap, Droplets, Tag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { pb } from '../services/pocketbase';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatCurrency = (amount) => {
    if (!amount) return 'Price on Request';
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000)   return `₹${(amount / 100000).toFixed(2)} L`;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

const getImageUrl = (property) => {
    const images = property?.images || [];
    const first = Array.isArray(images) ? images[0] : images;
    if (first && typeof first === 'string') {
        if (first.startsWith('http')) return first;
        return pb.files.getURL(property, first);
    }
    return 'https://images.unsplash.com/photo-1600585154340-be6191dae10c?auto=format&fit=crop&q=80&w=800';
};

// ─── Search Bar ─────────────────────────────────────────────────────────────

const PROPERTY_TYPES = ['All Types', 'Residential', 'Commercial', 'Plots & Land', 'New Projects'];
const BUDGETS = ['Any Budget', 'Under ₹30L', '₹30L – ₹80L', '₹80L – ₹2Cr', '₹2Cr+'];

const SearchBar = ({ onSearch }) => {
    const [location, setLocation]   = useState('');
    const [type, setType]           = useState('All Types');
    const [budget, setBudget]       = useState('Any Budget');
    const [typeOpen, setTypeOpen]   = useState(false);
    const [budgetOpen, setBudgetOpen] = useState(false);

    const Dropdown = ({ label, value, options, open, setOpen, onChange }) => (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-5 py-3.5 text-gray-700 font-semibold text-sm whitespace-nowrap hover:text-primary transition-colors"
            >
                {value}
                <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl shadow-black/10 z-50 min-w-[180px] overflow-hidden"
                    >
                        {options.map(o => (
                            <button
                                key={o}
                                onClick={() => { onChange(o); setOpen(false); }}
                                className={`w-full text-left px-5 py-3 text-sm font-medium transition-colors hover:bg-primary/5 hover:text-primary ${value === o ? 'text-primary bg-primary/5' : 'text-gray-700'}`}
                            >
                                {o}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="bg-white rounded-2xl md:rounded-full shadow-2xl shadow-black/20 flex flex-col md:flex-row items-stretch md:items-center overflow-visible p-2 gap-2 border border-gray-150"
            onClick={() => { setTypeOpen(false); setBudgetOpen(false); }}
        >
            {/* Location Input */}
            <div className="flex items-center gap-3 px-4 py-2 flex-1 md:border-r border-gray-100">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <input
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="City, locality, or project name..."
                    className="flex-1 text-sm font-semibold text-gray-700 placeholder-gray-400 outline-none bg-transparent"
                />
            </div>

            {/* Type Dropdown */}
            <div
                className="md:border-r border-gray-100 flex items-center"
                onClick={e => e.stopPropagation()}
            >
                <Dropdown
                    label="Type"
                    value={type}
                    options={PROPERTY_TYPES}
                    open={typeOpen}
                    setOpen={setTypeOpen}
                    onChange={setType}
                />
            </div>

            {/* Budget Dropdown */}
            <div className="flex items-center" onClick={e => e.stopPropagation()}>
                <Dropdown
                    label="Budget"
                    value={budget}
                    options={BUDGETS}
                    open={budgetOpen}
                    setOpen={setBudgetOpen}
                    onChange={setBudget}
                />
            </div>

            {/* Search Button */}
            <div className="shrink-0">
                <button
                    onClick={() => onSearch && onSearch({ location, type, budget })}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold px-8 py-3.5 rounded-xl md:rounded-full transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-primary/30 w-full md:w-auto justify-center"
                >
                    <Search className="w-4 h-4" />
                    Search
                </button>
            </div>
        </motion.div>
    );
};

// ─── Classic Property Card ───────────────────────────────────────────────────

const ClassicCard = ({ property }) => {
    const navigate = useNavigate();
    const imgSrc = getImageUrl(property);
    const isRent = property.transactionType === 'Rent';

    return (
        <motion.article
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            whileHover={{ y: -6 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => navigate(`/property/${property.id}`)}
            className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-400 border border-gray-100 flex flex-col"
        >
            {/* Image */}
            <div className="relative overflow-hidden aspect-[4/3]">
                <img
                    src={imgSrc}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600"
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1600585154340-be6191dae10c?auto=format&fit=crop&q=80&w=800'; }}
                />
                {/* Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />

                {/* Transaction Badge */}
                <span className={`absolute top-4 left-4 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${isRent ? 'bg-teal-500/90' : 'bg-primary/90'} backdrop-blur-sm`}>
                    For {property.transactionType || 'Sale'}
                </span>

                {/* Heart */}
                <button
                    onClick={e => e.stopPropagation()}
                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white hover:text-primary transition-all"
                >
                    <Heart className="w-4 h-4" />
                </button>

                {/* Price overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="text-white font-display font-bold text-2xl drop-shadow-lg">
                        {formatCurrency(property.price)}
                        {isRent && <span className="text-sm font-normal opacity-80">/mo</span>}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-1 group-hover:text-primary transition-colors mb-1">
                    {property.title}
                </h3>
                <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-4">
                    <MapPin className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                    <span className="line-clamp-1">{property.location}</span>
                </div>

                {/* Divider with stats */}
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

// ─── Stats Bar ───────────────────────────────────────────────────────────────

const stats = [
    { value: '500+', label: 'Properties Listed' },
    { value: '12+',  label: 'Years of Experience' },
    { value: '2000+', label: 'Happy Families' },
    { value: '50+',  label: 'Projects Delivered' },
];

const StatsBar = () => (
    <section className="bg-white border-y border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {stats.map((s, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="text-center"
                    >
                        <div className="text-4xl font-display font-black text-primary mb-1">{s.value}</div>
                        <div className="text-sm text-gray-500 font-medium">{s.label}</div>
                    </motion.div>
                ))}
            </div>
        </div>
    </section>
);

// ─── Property Section ────────────────────────────────────────────────────────

const PropertySection = () => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading]       = useState(true);
    const [activeTab, setActiveTab]   = useState('all');
    const navigate = useNavigate();

    useEffect(() => {
        pb.collection('properties').getList(1, 40, { sort: '-id' })
            .then(r => setProperties(r.items))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const tabs = [
        { id: 'all',         label: 'All Properties' },
        { id: 'Residential', label: 'Residential' },
        { id: 'Commercial',  label: 'Commercial' },
        { id: 'NewProjects', label: 'New Projects' },
    ];

    const filtered = activeTab === 'all'
        ? properties
        : properties.filter(p => (p.propertyCategory || '').toLowerCase() === activeTab.toLowerCase());

    const displayed = filtered.slice(0, 8);

    return (
        <section id="classic-properties" className="py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <span className="text-primary font-bold text-xs uppercase tracking-widest">Our Portfolio</span>
                        <h2 className="text-4xl md:text-5xl font-display font-black text-gray-900 mt-2 leading-tight">
                            Premium <span className="text-primary">Properties</span>
                        </h2>
                    </div>
                    {/* Tabs */}
                    <div className="flex items-center gap-2 bg-white rounded-xl p-1.5 border border-gray-100 shadow-sm self-start md:self-auto">
                        {tabs.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                                    activeTab === t.id
                                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                                        : 'text-gray-600 hover:text-primary'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-md animate-pulse">
                                <div className="aspect-[4/3] bg-gray-200" />
                                <div className="p-5 space-y-3">
                                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : displayed.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {displayed.map(p => <ClassicCard key={p.id} property={p} />)}
                    </div>
                ) : (
                    <div className="text-center py-20 text-gray-400">
                        <Home className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>No properties in this category yet.</p>
                    </div>
                )}

                {/* Browse Button */}
                {displayed.length > 0 && (
                    <div className="text-center mt-14">
                        <button
                            onClick={() => navigate('/properties/residential')}
                            className="group inline-flex items-center gap-3 border-2 border-primary text-primary font-bold px-10 py-4 rounded-full hover:bg-primary hover:text-white transition-all duration-300"
                        >
                            View All Properties
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
};

// ─── Why Choose Us ───────────────────────────────────────────────────────────

const whyUs = [
    {
        icon: ShieldCheck,
        title: 'Verified Listings Only',
        desc: 'Every property is physically verified by our team. No fake listings, no hidden charges.',
        color: 'from-emerald-500 to-teal-500',
    },
    {
        icon: Calculator,
        title: 'Mortgage Calculator',
        desc: 'Estimate your monthly home loan installments and interest payouts instantly with our smart tool.',
        color: 'from-primary to-rose-400',
        onClickRoute: '/calculator',
    },
    {
        icon: Phone,
        title: '10-Second Connect',
        desc: 'Your query is routed to the right agent via WhatsApp within 10 seconds, every time.',
        color: 'from-amber-500 to-orange-500',
    },
];

const WhySection = () => {
    const navigate = useNavigate();
    return (
        <section className="py-24 bg-white">
            <div className="max-w-6xl mx-auto px-6 lg:px-8">
                <div className="text-center mb-16">
                    <span className="text-primary font-bold text-xs uppercase tracking-widest">Why Us</span>
                    <h2 className="text-4xl md:text-5xl font-display font-black text-gray-900 mt-2">
                        The Smart Way to Buy Property
                    </h2>
                    <p className="text-gray-500 mt-4 max-w-xl mx-auto">
                        We combine technology with local expertise to deliver the best real estate experience in India.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {whyUs.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.15 }}
                            onClick={() => item.onClickRoute && navigate(item.onClickRoute)}
                            className={`group relative bg-gray-50 hover:bg-white rounded-3xl p-8 border border-gray-100 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-400 ${
                                item.onClickRoute ? 'cursor-pointer' : ''
                            }`}
                        >
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 shadow-lg`}>
                                <item.icon className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                            <div className="absolute bottom-8 right-8 w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// ─── Testimonials ────────────────────────────────────────────────────────────

const testimonials = [
    {
        name: 'Priya Sharma',
        role: 'Homeowner',
        content: 'RR Estate made buying our first home a completely stress-free experience. The mortgage calculator was incredibly helpful to estimate budgets!',
        rating: 5,
        property: 'Residential Villa, Baner Pune'
    },
    {
        name: 'Rajesh Mehta',
        role: 'Property Investor',
        content: 'I have worked with multiple agencies. RR Estate stands apart — transparent pricing, zero surprises, and genuine market advice.',
        rating: 5,
        property: 'Commercial Office, Kharadi Pune'
    },
    {
        name: 'Anita Joshi',
        role: 'Business Owner',
        content: 'Found the perfect office space within a week. The WhatsApp connect feature is brilliant — got a response within seconds!',
        rating: 5,
        property: 'Commercial Shop, Wakad Pune'
    },
];

const TestimonialsSection = () => (
    <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-14">
                <span className="text-primary font-bold text-xs uppercase tracking-widest">Reviews</span>
                <h2 className="text-4xl md:text-5xl font-display font-black text-gray-900 mt-2">
                    What Our Clients Say
                </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {testimonials.map((t, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative"
                    >
                        <Quote className="absolute top-6 right-6 w-10 h-10 text-primary/8" />
                        <div className="flex gap-1 mb-5">
                            {[...Array(t.rating)].map((_, j) => (
                                <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                            ))}
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed mb-6 italic">"{t.content}"</p>
                        <div className="flex items-center gap-3 pt-5 border-t border-gray-100">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-rose-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                {t.name.charAt(0)}{t.name.split(' ')[1]?.charAt(0)}
                            </div>
                            <div>
                                <div className="font-bold text-gray-900 text-sm">{t.name}</div>
                                <div className="text-xs text-primary font-medium">{t.role}</div>
                                <div className="text-xs text-gray-400 mt-0.5">{t.property}</div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    </section>
);

// ─── CTA Banner ──────────────────────────────────────────────────────────────

const CTABanner = () => {
    const navigate = useNavigate();
    return (
        <section
            className="relative py-24 overflow-hidden"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=2000')", backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/70 to-gray-900/50" />
            <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <span className="text-primary font-bold text-xs uppercase tracking-widest">Ready to Begin?</span>
                    <h2 className="text-4xl md:text-5xl font-display font-black text-white mt-3 mb-5 leading-tight">
                        Find Your Dream Property Today
                    </h2>
                    <p className="text-white/70 mb-10 text-lg">
                        Browse 500+ verified listings or estimate your payments with our smart calculator.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => { const el = document.getElementById('classic-properties'); el?.scrollIntoView({ behavior: 'smooth' }); }}
                            className="bg-white text-gray-900 font-bold px-9 py-4 rounded-full hover:bg-primary hover:text-white transition-all duration-300 shadow-2xl"
                        >
                            Browse Properties
                        </button>
                        <button
                            onClick={() => navigate('/calculator')}
                            className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/30 text-white font-bold px-9 py-4 rounded-full hover:bg-white/20 transition-all duration-300"
                        >
                            <Calculator className="w-5 h-5" />
                            Mortgage Calculator
                        </button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

// ─── Main Export ─────────────────────────────────────────────────────────────

const ThemeClassic = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-white text-gray-900 min-h-screen font-sans pt-0">

            {/* ── HERO ── */}
            <section
                className="relative min-h-[92vh] flex items-center overflow-hidden"
                style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1600585154340-be6191dae10c?auto=format&fit=crop&w=1920&q=80')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center 30%',
                }}
            >
                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-r from-gray-950/70 via-gray-900/40 to-gray-900/10" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/40 via-transparent to-transparent" />

                {/* Ticker at bottom */}
                <div className="absolute bottom-0 left-0 right-0 bg-primary/90 backdrop-blur-sm py-3 overflow-hidden z-10">
                    <motion.div
                        animate={{ x: ['0%', '-50%'] }}
                        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                        className="flex gap-12 whitespace-nowrap"
                    >
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="flex gap-12">
                                {['Residential Properties', 'Commercial Spaces', 'Luxury Villas', 'New Projects', 'Premium Plots', 'RERA Verified'].map((item, j) => (
                                    <span key={j} className="text-white text-sm font-bold uppercase tracking-widest flex items-center gap-4">
                                        {item} <span className="text-white/40">◆</span>
                                    </span>
                                ))}
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Content */}
                <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full py-20">
                    <div className="max-w-3xl">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest mb-8"
                        >
                            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                            Trusted Real Estate Partner
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                            className="text-5xl sm:text-6xl md:text-7xl font-display font-black text-white leading-[1.05] mb-6 tracking-tight"
                        >
                            Explore Your<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-rose-300 to-orange-300">
                                Dream Living
                            </span><br />
                            Space
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="text-white/75 text-lg mb-10 leading-relaxed max-w-xl"
                        >
                            Discover premium residential, commercial, and investment properties across India's finest locations.
                        </motion.p>

                        {/* Search Bar */}
                        <div className="max-w-2xl">
                            <SearchBar onSearch={({ location, type, budget }) => {
                                let targetRoute = '/properties/residential';
                                if (type === 'Commercial') targetRoute = '/properties/commercial';
                                else if (type === 'Plots & Land') targetRoute = '/properties/plots-land';
                                else if (type === 'New Projects') targetRoute = '/properties/under-development';
                                
                                const params = new URLSearchParams();
                                if (location) params.append('location', location);
                                if (budget && budget !== 'Any Budget') params.append('budget', budget);
                                navigate(`${targetRoute}?${params.toString()}`);
                            }} />
                        </div>

                        {/* Quick Links */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="flex items-center gap-3 mt-8 flex-wrap"
                        >
                            <span className="text-white/50 text-xs font-medium">Quick:</span>
                            {['Residential', 'Commercial', 'New Projects', 'Plots'].map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => navigate('/properties/residential')}
                                    className="text-xs text-white/70 hover:text-white border border-white/20 hover:border-white/50 px-3 py-1 rounded-full transition-all duration-200"
                                >
                                    {tag}
                                </button>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── STATS ── */}
            <StatsBar />

            {/* ── PROPERTIES ── */}
            <PropertySection />

            {/* ── WHY US ── */}
            <WhySection />

            {/* ── TESTIMONIALS ── */}
            <TestimonialsSection />

            {/* ── CTA BANNER ── */}
            <CTABanner />
        </div>
    );
};

export default ThemeClassic;
