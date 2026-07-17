import React, { useState } from 'react';
import { X, Check, ExternalLink, Monitor } from 'lucide-react';

// Real Unsplash images matching real estate aesthetic
const HERO_IMG_CLASSIC = "https://images.unsplash.com/photo-1600585154526-990dced4de0d?auto=format&fit=crop&q=80&w=900&h=450";
const HERO_IMG_MODERN  = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=900&h=450";
const HERO_IMG_MINIMAL = "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=900&h=450";

const CARD_IMG_1 = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=60&w=200&h=140";
const CARD_IMG_2 = "https://images.unsplash.com/photo-1600585154340-be6191dae10c?auto=format&fit=crop&q=60&w=200&h=140";
const CARD_IMG_3 = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=60&w=200&h=140";

// ─── Classic Theme Preview (Light, trustworthy, grid) ──────────────────────
const ClassicPreview = ({ primary, secondary, agencyName }) => (
    <div className="w-full h-full bg-white flex flex-col text-[5px] overflow-hidden select-none pointer-events-none">
        {/* Navbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-white shrink-0">
            <span className="font-black text-[8px] italic" style={{ color: primary }}>
                {agencyName || 'RE Estate'}
            </span>
            <div className="flex gap-2 text-[4.5px] text-gray-500">
                <span>Home</span><span>Properties</span><span>About</span>
            </div>
            <div className="text-[4.5px] text-white font-bold px-2 py-0.5 rounded" style={{ backgroundColor: primary }}>
                Post Property
            </div>
        </div>

        {/* Hero */}
        <div className="relative w-full" style={{ height: '80px', flexShrink: 0 }}>
            <img src={HERO_IMG_CLASSIC} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30 flex flex-col justify-center px-4 gap-1">
                <div className="text-white font-black text-[7px] leading-tight">Find Your Dream Home</div>
                <div className="text-white/80 text-[4px]">Exclusive properties in prime locations</div>
                <div className="flex gap-1.5 mt-1">
                    <div className="text-[4px] text-white font-bold px-2 py-0.5 rounded-full bg-white text-gray-900">Browse Properties</div>
                    <div className="text-[4px] text-white font-bold px-2 py-0.5 rounded-full border border-white/50">Talk to AI</div>
                </div>
            </div>
        </div>

        {/* Section Label */}
        <div className="px-4 pt-2 pb-1 bg-white">
            <span className="text-[4px] font-bold uppercase tracking-widest" style={{ color: primary }}>Featured</span>
            <div className="text-[6px] font-bold text-gray-900 mt-0.5">Latest Properties</div>
        </div>

        {/* Property Card Grid */}
        <div className="grid grid-cols-3 gap-1.5 px-4 pb-3 bg-white flex-1">
            {[CARD_IMG_1, CARD_IMG_2, CARD_IMG_3].map((img, i) => (
                <div key={i} className="rounded-sm overflow-hidden border border-gray-100 shadow-sm bg-white">
                    <img src={img} alt="" className="w-full object-cover" style={{ height: '28px' }} />
                    <div className="p-1">
                        <div className="w-8 h-0.5 rounded mb-0.5" style={{ backgroundColor: primary }} />
                        <div className="text-[3.5px] text-gray-800 font-bold">₹{45 + i * 12}L</div>
                        <div className="text-[3px] text-gray-400">2 BHK · Baner, Pune</div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// ─── Modern Theme Preview (Dark glass, vibrant gradient) ────────────────────
const ModernPreview = ({ primary, secondary, agencyName }) => (
    <div className="w-full h-full flex flex-col text-[5px] overflow-hidden select-none pointer-events-none" style={{ background: '#09080F' }}>
        {/* Glow blobs */}
        <div className="absolute top-2 left-2 w-16 h-16 rounded-full opacity-20 blur-md" style={{ backgroundColor: primary }} />
        <div className="absolute bottom-4 right-2 w-16 h-16 rounded-full opacity-15 blur-md" style={{ backgroundColor: secondary }} />

        {/* Navbar (glass) */}
        <div className="relative flex items-center justify-between px-4 py-2 border-b z-10" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <span className="font-black text-[8px] italic text-white">{agencyName || 'RE Estate'}</span>
            <div className="flex gap-2 text-[4.5px] text-white/50">
                <span>Home</span><span>Properties</span><span>About</span>
            </div>
            <div className="text-[4.5px] text-white font-bold px-2 py-0.5 rounded" style={{ backgroundColor: primary }}>Post Property</div>
        </div>

        {/* Hero */}
        <div className="relative flex-1 flex flex-col items-center justify-center z-10 py-2" style={{ minHeight: '85px' }}>
            <div className="text-[4.5px] font-bold uppercase tracking-widest mb-1" style={{ color: primary }}>Next-Gen Portal</div>
            <div className="text-white font-black text-[8px] text-center leading-tight mb-1">
                The Future of<br />
                <span style={{ background: `linear-gradient(to right, ${primary}, ${secondary})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Living is Here.</span>
            </div>
            <div className="text-white/50 text-[3.5px] text-center mb-2 max-w-[70%]">Find ultra-luxury properties with AI guidance</div>
            <div className="flex gap-1.5">
                <div className="text-[4px] text-white font-bold px-2 py-0.5 rounded" style={{ backgroundColor: primary }}>Explore Spaces</div>
                <div className="text-[4px] text-white/80 font-bold px-2 py-0.5 rounded border" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>Talk to AI</div>
            </div>
        </div>

        {/* Dark Cards */}
        <div className="grid grid-cols-3 gap-1 px-4 pb-3 z-10">
            {[CARD_IMG_1, CARD_IMG_2, CARD_IMG_3].map((img, i) => (
                <div key={i} className="rounded overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}>
                    <img src={img} alt="" className="w-full object-cover opacity-75" style={{ height: '28px' }} />
                    <div className="p-1">
                        <div className="text-[3.5px] text-white/80 font-bold">₹{45 + i * 12}L</div>
                        <div className="text-[3px] text-white/30">Premium Space</div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// ─── Minimal Theme Preview (Serif, off-white, editorial) ────────────────────
const MinimalPreview = ({ primary, secondary, agencyName }) => (
    <div className="w-full h-full flex flex-col text-[5px] overflow-hidden select-none pointer-events-none" style={{ background: '#FAF9F6', fontFamily: 'Georgia, serif' }}>
        {/* Flat Top Nav */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white shrink-0">
            <span className="font-bold text-[7px] text-gray-900 tracking-tight">{agencyName || 'Luxury Estates'}</span>
            <div className="flex gap-2 text-[4.5px] text-gray-500">
                <span>Home</span><span>Properties</span><span>About</span>
            </div>
            <div className="text-[4px] text-gray-900 font-semibold px-2 py-0.5 border border-gray-900">Post Property</div>
        </div>

        {/* Side-by-side Hero */}
        <div className="grid grid-cols-2 gap-0 flex-1" style={{ minHeight: '80px' }}>
            {/* Left - text */}
            <div className="flex flex-col justify-center px-4 py-3 gap-1.5">
                <div className="text-[4px] uppercase tracking-widest font-sans" style={{ color: primary }}>Bespoke Real Estate</div>
                <div className="text-[7px] font-normal text-gray-900 leading-tight">Select spaces, crafted for clarity.</div>
                <div className="text-[3.5px] text-gray-400 leading-relaxed">We curate premium properties across prime localities.</div>
                <div className="flex gap-1.5 mt-1">
                    <div className="text-[3.5px] font-semibold font-sans px-2 py-0.5 border border-gray-900 text-gray-900">Browse Catalogue</div>
                </div>
            </div>
            {/* Right - image */}
            <div className="relative">
                <img src={HERO_IMG_MINIMAL} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/5" />
            </div>
        </div>

        {/* Cards (outline style) */}
        <div className="grid grid-cols-3 gap-1 px-4 py-2" style={{ background: '#FAF9F6' }}>
            {[CARD_IMG_1, CARD_IMG_2, CARD_IMG_3].map((img, i) => (
                <div key={i} className="overflow-hidden bg-white" style={{ border: '1px solid #E5E7EB' }}>
                    <img src={img} alt="" className="w-full object-cover" style={{ height: '26px' }} />
                    <div className="p-1">
                        <div className="text-[3.5px] font-bold text-gray-900">₹{55 + i * 15}L</div>
                        <div className="text-[3px] text-gray-400 mt-0.5">Estate · Pune</div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// ─── Template config ────────────────────────────────────────────────────────
const TEMPLATES = [
    {
        id: 'classic',
        name: 'Classic Elegance',
        tag: 'Most Popular',
        desc: 'Traditional clean layout, white background, floating card navbar, and a bold full-bleed hero with classic property grid.',
        Preview: ClassicPreview,
    },
    {
        id: 'modern',
        name: 'Modern Vibrant',
        tag: 'Premium',
        desc: 'Dark glassmorphism design, glowing gradient accents, and a sleek dark card grid — for luxury ultra-modern agencies.',
        Preview: ModernPreview,
    },
    {
        id: 'minimal',
        name: 'Minimalist Clean',
        tag: 'Editorial',
        desc: 'Serif typography, off-white canvas, side-by-side hero layout, and sharp-cornered outlines — an editorial premium feel.',
        Preview: MinimalPreview,
    },
];

// ─── Main exported component ────────────────────────────────────────────────
const TemplatePicker = ({ agencyData, setAgencyData }) => {
    const [previewModal, setPreviewModal] = useState(null); // null | template object

    const primary   = agencyData.primaryColor   || '#DC2626';
    const secondary = agencyData.secondaryColor || '#1E293B';
    const agencyName = agencyData.agencyName    || '';

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <label className="dash-label !mb-0">Choose Portal Template</label>
                <span className="text-xs text-gray-400">3 themes available</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {TEMPLATES.map((tpl) => {
                    const isSelected = agencyData.templateId === tpl.id;
                    return (
                        <div
                            key={tpl.id}
                            onClick={() => setAgencyData({ ...agencyData, templateId: tpl.id })}
                            className={`group cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-200 flex flex-col ${
                                isSelected
                                    ? 'border-primary ring-2 ring-primary/20 shadow-lg shadow-primary/10'
                                    : 'border-gray-150 hover:border-gray-300 shadow-sm hover:shadow-md'
                            }`}
                        >
                            {/* ── BROWSER CHROME ── */}
                            <div className="bg-gray-100 border-b border-gray-200 flex items-center gap-1.5 px-3 py-2 shrink-0">
                                <div className="w-2 h-2 rounded-full bg-red-400" />
                                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                                <div className="w-2 h-2 rounded-full bg-green-400" />
                                <div className="flex-1 mx-2 bg-white border border-gray-200 rounded text-[9px] text-gray-400 px-2 py-0.5 text-center leading-none">
                                    {agencyData.subdomain || 'yourname'}.yourdomain.com
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setPreviewModal(tpl); }}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Preview fullscreen"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                </button>
                            </div>

                            {/* ── SCALED LIVE PREVIEW ── */}
                            <div className="relative bg-white overflow-hidden" style={{ height: '200px' }}>
                                <div
                                    className="absolute top-0 left-0 origin-top-left"
                                    style={{
                                        width: '900px',
                                        height: '600px',
                                        transform: 'scale(0.31)',
                                        transformOrigin: 'top left',
                                        pointerEvents: 'none',
                                        userSelect: 'none',
                                    }}
                                >
                                    <div style={{ width: '900px', height: '600px', overflow: 'hidden', position: 'relative' }}>
                                        <tpl.Preview primary={primary} secondary={secondary} agencyName={agencyName} />
                                    </div>
                                </div>
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-200" />
                                {/* Selected badge */}
                                {isSelected && (
                                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-md" style={{ backgroundColor: primary }}>
                                        <Check className="w-3.5 h-3.5 text-white" />
                                    </div>
                                )}
                                {/* Tag badge */}
                                <div className="absolute top-2 left-2 text-[9px] font-bold text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: isSelected ? primary : '#6B7280' }}>
                                    {tpl.tag}
                                </div>
                            </div>

                            {/* ── INFO ── */}
                            <div className="px-3 py-3 bg-white flex flex-col gap-0.5">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-sm text-gray-900">{tpl.name}</span>
                                    {isSelected && (
                                        <span className="text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full" style={{ color: primary, backgroundColor: `${primary}18` }}>Active</span>
                                    )}
                                </div>
                                <p className="text-[11px] text-gray-400 leading-relaxed">{tpl.desc}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── FULLSCREEN PREVIEW MODAL ── */}
            {previewModal && (
                <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setPreviewModal(null)}>
                    <div className="bg-white rounded-3xl overflow-hidden w-full max-w-5xl shadow-2xl" style={{ maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
                        {/* Modal header */}
                        <div className="bg-gray-50 border-b border-gray-200 flex items-center gap-3 px-6 py-4">
                            <Monitor className="w-4 h-4 text-gray-400" />
                            <span className="font-bold text-gray-900">{previewModal.name}</span>
                            <div className="flex-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-400 px-3 py-1.5">
                                {agencyData.subdomain || 'yourname'}.yourdomain.com
                            </div>
                            <div className="text-[10px] font-bold px-3 py-1 rounded-full text-white" style={{ backgroundColor: primary }}>
                                {previewModal.tag}
                            </div>
                            <button onClick={() => setPreviewModal(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Full preview (bigger scale) */}
                        <div className="relative bg-gray-100 overflow-auto" style={{ height: '70vh' }}>
                            <div className="origin-top-left" style={{ width: '900px', transform: 'scale(0.72) translateX(-50%)', marginLeft: '50%', transformOrigin: 'top center' }}>
                                <div style={{ width: '900px', height: '700px', overflow: 'hidden' }}>
                                    <previewModal.Preview primary={primary} secondary={secondary} agencyName={agencyName} />
                                </div>
                            </div>
                        </div>

                        {/* Modal footer */}
                        <div className="bg-white border-t border-gray-100 flex items-center justify-between px-6 py-4">
                            <p className="text-sm text-gray-500">{previewModal.desc}</p>
                            <button
                                onClick={() => { setAgencyData({ ...agencyData, templateId: previewModal.id }); setPreviewModal(null); }}
                                className="text-sm text-white font-bold px-6 py-2.5 rounded-xl transition-all hover:opacity-90 active:scale-95 flex items-center gap-2"
                                style={{ backgroundColor: primary }}
                            >
                                <Check className="w-4 h-4" />
                                Select This Template
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TemplatePicker;
