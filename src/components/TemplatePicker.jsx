import React, { useState } from 'react';
import { X, Check, ExternalLink, Monitor } from 'lucide-react';

// Real Unsplash images
const HERO_IMG_CLASSIC = "https://images.unsplash.com/photo-1600585154526-990dced4de0d?auto=format&fit=crop&q=80&w=1200&h=600";
const HERO_IMG_MODERN  = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200&h=600";
const HERO_IMG_MINIMAL = "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=1200&h=600";
const CARD_IMG_1 = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=70&w=400&h=260";
const CARD_IMG_2 = "https://images.unsplash.com/photo-1600585154340-be6191dae10c?auto=format&fit=crop&q=70&w=400&h=260";
const CARD_IMG_3 = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=70&w=400&h=260";

// ─── CLASSIC ────────────────────────────────────────────────────────────────
const ClassicPreview = ({ primary, agencyName }) => (
    <div style={{ width: 1200, height: 820, background: '#fff', fontFamily: 'system-ui,sans-serif', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 48px', borderBottom: '1px solid #f0f0f0', background: '#fff', flexShrink: 0 }}>
            <span style={{ fontWeight: 900, fontSize: 26, fontStyle: 'italic', color: primary }}>{agencyName || 'RR Estate'}</span>
            <div style={{ display: 'flex', gap: 32, fontSize: 14, color: '#555', fontWeight: 600 }}>
                <span>Home</span><span>Properties</span><span>About Us</span><span>Contact</span>
            </div>
            <div style={{ background: primary, color: '#fff', padding: '10px 22px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>Post Property</div>
        </div>
        {/* Hero */}
        <div style={{ position: 'relative', height: 340, flexShrink: 0 }}>
            <img src={HERO_IMG_CLASSIC} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.72), rgba(0,0,0,0.3))', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 60px', gap: 14 }}>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 46, lineHeight: 1.1 }}>Find Your Dream Home</div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 17 }}>Exclusive properties in prime locations with AI-powered guidance.</div>
                <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
                    <div style={{ background: '#fff', color: '#111', padding: '13px 28px', borderRadius: 50, fontWeight: 700, fontSize: 14 }}>Browse Properties</div>
                    <div style={{ border: '2px solid rgba(255,255,255,0.6)', color: '#fff', padding: '13px 28px', borderRadius: 50, fontWeight: 700, fontSize: 14 }}>Talk to Saathi AI</div>
                </div>
            </div>
        </div>
        {/* Featured section */}
        <div style={{ padding: '28px 48px 12px', background: '#fff' }}>
            <span style={{ color: primary, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 3 }}>Featured</span>
            <div style={{ fontWeight: 800, fontSize: 28, color: '#111', marginTop: 4 }}>Latest <span style={{ color: '#008080' }}>Properties</span></div>
        </div>
        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, padding: '0 48px 40px', background: '#fff' }}>
            {[CARD_IMG_1, CARD_IMG_2, CARD_IMG_3].map((img, i) => (
                <div key={i} style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #eee', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                    <img src={img} alt="" style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                    <div style={{ padding: '14px 16px' }}>
                        <div style={{ width: 40, height: 3, background: primary, borderRadius: 2, marginBottom: 8 }} />
                        <div style={{ fontWeight: 800, fontSize: 16, color: '#111' }}>₹{45 + i * 12}L</div>
                        <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>2 BHK · Baner, Pune</div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// ─── MODERN ────────────────────────────────────────────────────────────────
const ModernPreview = ({ primary, secondary, agencyName }) => (
    <div style={{ width: 1200, height: 820, background: '#080610', fontFamily: 'system-ui,sans-serif', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Blobs */}
        <div style={{ position: 'absolute', top: -60, left: -60, width: 360, height: 360, borderRadius: '50%', background: primary, filter: 'blur(120px)', opacity: 0.22 }} />
        <div style={{ position: 'absolute', bottom: 0, right: -40, width: 320, height: 320, borderRadius: '50%', background: secondary, filter: 'blur(100px)', opacity: 0.18 }} />
        {/* Nav */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 48px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', flexShrink: 0, zIndex: 10 }}>
            <span style={{ fontWeight: 900, fontSize: 24, fontStyle: 'italic', color: '#fff' }}>{agencyName || 'RR Estate'}</span>
            <div style={{ display: 'flex', gap: 32, fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                <span>Home</span><span>Properties</span><span>About</span>
            </div>
            <div style={{ background: primary, color: '#fff', padding: '10px 22px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>Post Property</div>
        </div>
        {/* Hero */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 60px', position: 'relative', zIndex: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 4, color: primary, marginBottom: 16 }}>Next-Gen Real Estate Portal</div>
            <div style={{ fontWeight: 900, fontSize: 58, color: '#fff', textAlign: 'center', lineHeight: 1.08, marginBottom: 14 }}>
                The Future of<br />
                <span style={{ background: `linear-gradient(to right, ${primary}, ${secondary})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Living is Here.</span>
            </div>
            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', textAlign: 'center', maxWidth: 520, marginBottom: 32 }}>Find ultra-luxury properties with dynamic AI-powered guidance from Saathi.</div>
            <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ background: primary, color: '#fff', padding: '14px 34px', borderRadius: 12, fontWeight: 700, fontSize: 15 }}>Explore Spaces</div>
                <div style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)', padding: '14px 34px', borderRadius: 12, fontWeight: 700, fontSize: 15 }}>Talk to AI</div>
            </div>
        </div>
        {/* Dark Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, padding: '0 48px 40px', position: 'relative', zIndex: 10 }}>
            {[CARD_IMG_1, CARD_IMG_2, CARD_IMG_3].map((img, i) => (
                <div key={i} style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}>
                    <img src={img} alt="" style={{ width: '100%', height: 130, objectFit: 'cover', opacity: 0.8 }} />
                    <div style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: 'rgba(255,255,255,0.85)' }}>₹{55 + i * 18}L</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Premium Space · Pune</div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// ─── MINIMAL ───────────────────────────────────────────────────────────────
const MinimalPreview = ({ primary, agencyName }) => (
    <div style={{ width: 1200, height: 820, background: '#FAF9F6', fontFamily: 'Georgia,serif', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 48px', borderBottom: '1px solid #e5e5e5', background: '#fff', flexShrink: 0 }}>
            <span style={{ fontWeight: 700, fontSize: 22, color: '#111', fontFamily: 'system-ui,sans-serif', letterSpacing: -1 }}>{agencyName || 'Luxury Estates'}</span>
            <div style={{ display: 'flex', gap: 32, fontSize: 13, color: '#666', fontFamily: 'system-ui,sans-serif', fontWeight: 500 }}>
                <span>Home</span><span>Properties</span><span>About</span>
            </div>
            <div style={{ border: '1.5px solid #111', color: '#111', padding: '9px 20px', fontSize: 12, fontWeight: 600, fontFamily: 'system-ui,sans-serif', letterSpacing: 1 }}>POST PROPERTY</div>
        </div>
        {/* Side-by-side Hero */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, flexShrink: 0, maxHeight: 360 }}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 60px', gap: 18, background: '#FAF9F6' }}>
                <span style={{ color: primary, fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: 4, fontFamily: 'system-ui,sans-serif' }}>Bespoke Real Estate</span>
                <div style={{ fontWeight: 400, fontSize: 42, color: '#111', lineHeight: 1.15 }}>Select spaces, crafted for clarity and elegant living.</div>
                <div style={{ fontSize: 14, color: '#888', lineHeight: 1.7, fontFamily: 'system-ui,sans-serif', fontWeight: 400 }}>We curate premium residential developments across India's most sought-after localities.</div>
                <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
                    <div style={{ border: '1.5px solid #111', color: '#111', padding: '12px 28px', fontSize: 12, fontWeight: 600, fontFamily: 'system-ui,sans-serif', letterSpacing: 1 }}>BROWSE CATALOGUE</div>
                </div>
            </div>
            <div style={{ position: 'relative' }}>
                <img src={HERO_IMG_MINIMAL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
        </div>
        {/* Philosophy strip */}
        <div style={{ background: '#fff', padding: '24px 48px', borderTop: '1px solid #e5e5e5', borderBottom: '1px solid #e5e5e5' }}>
            <div style={{ fontSize: 10, color: primary, textTransform: 'uppercase', letterSpacing: 4, fontFamily: 'system-ui,sans-serif', fontWeight: 700, marginBottom: 8 }}>Philosophy</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 40 }}>
                {['Bespoke Curation', 'Direct Access', 'Clear Metadata'].map((t, i) => (
                    <div key={i} style={{ fontFamily: 'system-ui,sans-serif' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: primary, fontFamily: 'monospace' }}>0{i+1} /</span>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#111', marginTop: 4 }}>{t}</div>
                    </div>
                ))}
            </div>
        </div>
        {/* Outline Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, padding: '20px 48px', background: '#FAF9F6' }}>
            {[CARD_IMG_1, CARD_IMG_2, CARD_IMG_3].map((img, i) => (
                <div key={i} style={{ overflow: 'hidden', background: '#fff', border: '1px solid #E5E7EB' }}>
                    <img src={img} alt="" style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                    <div style={{ padding: '12px 14px', fontFamily: 'system-ui,sans-serif' }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: '#111' }}>₹{55 + i * 15}L</div>
                        <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>Estate · Pune</div>
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
        tagColor: '#16A34A',
        desc: 'Traditional clean layout — white background, floating pill navbar, bold full-bleed hero with a classic 3-column property grid.',
        Preview: ClassicPreview,
    },
    {
        id: 'modern',
        name: 'Modern Vibrant',
        tag: 'Premium Dark',
        tagColor: '#7C3AED',
        desc: 'Dark glassmorphism design with glowing gradient accents and sleek dark card grid — built for luxury ultra-modern agencies.',
        Preview: ModernPreview,
    },
    {
        id: 'minimal',
        name: 'Minimalist Clean',
        tag: 'Editorial',
        tagColor: '#B45309',
        desc: 'Serif typography on an off-white canvas, side-by-side editorial hero layout, and clean sharp-cornered outline cards.',
        Preview: MinimalPreview,
    },
];

// Preview dimensions
const PREVIEW_W = 1200;
const PREVIEW_H = 820;
const CARD_H    = 280;   // rendered card preview height in px
const CARD_SCALE = CARD_H / PREVIEW_H;  // ~0.34

// ─── Main component ─────────────────────────────────────────────────────────
const TemplatePicker = ({ agencyData, setAgencyData }) => {
    const [previewModal, setPreviewModal] = useState(null);

    const primary    = agencyData.primaryColor   || '#DC2626';
    const secondary  = agencyData.secondaryColor || '#1E293B';
    const agencyName = agencyData.agencyName     || '';

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <label className="dash-label !mb-0">Choose Portal Template</label>
                <span className="text-xs text-gray-400">3 themes available</span>
            </div>

            {/* 2-column grid so cards are wide enough to be readable */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {TEMPLATES.map((tpl) => {
                    const isSelected = agencyData.templateId === tpl.id;
                    return (
                        <div
                            key={tpl.id}
                            onClick={() => setAgencyData({ ...agencyData, templateId: tpl.id })}
                            className={`group cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-200 flex flex-col ${
                                isSelected
                                    ? 'border-primary ring-2 ring-primary/20 shadow-xl'
                                    : 'border-gray-150 hover:border-gray-300 shadow-sm hover:shadow-lg'
                            }`}
                        >
                            {/* Browser chrome */}
                            <div className="bg-[#EDEDED] border-b border-gray-200 flex items-center gap-1.5 px-3 py-2.5 shrink-0">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                                <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                                <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                                <div className="flex-1 mx-2 bg-white border border-gray-300/70 rounded-md text-[10px] text-gray-400 px-2 py-0.5 text-center truncate">
                                    {agencyData.subdomain || 'yourname'}.yourdomain.com
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setPreviewModal(tpl); }}
                                    className="text-gray-400 hover:text-gray-700 transition-colors p-0.5"
                                    title="Fullscreen preview"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Scaled preview viewport */}
                            <div
                                className="relative overflow-hidden bg-gray-100"
                                style={{ height: `${CARD_H}px` }}
                            >
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: `${PREVIEW_W}px`,
                                        height: `${PREVIEW_H}px`,
                                        transform: `scale(${CARD_SCALE})`,
                                        transformOrigin: 'top left',
                                        pointerEvents: 'none',
                                        userSelect: 'none',
                                    }}
                                >
                                    <tpl.Preview primary={primary} secondary={secondary} agencyName={agencyName} />
                                </div>

                                {/* Hover dim overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/8 transition-all duration-200 pointer-events-none" />

                                {/* Checkmark when selected */}
                                {isSelected && (
                                    <div className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: primary }}>
                                        <Check className="w-4 h-4 text-white" />
                                    </div>
                                )}

                                {/* Tag */}
                                <div className="absolute top-3 left-3 text-[10px] font-bold text-white px-2.5 py-1 rounded-full shadow" style={{ backgroundColor: tpl.tagColor }}>
                                    {tpl.tag}
                                </div>
                            </div>

                            {/* Info strip */}
                            <div className="px-4 py-3 bg-white flex items-start justify-between gap-2">
                                <div>
                                    <div className="font-bold text-[13px] text-gray-900">{tpl.name}</div>
                                    <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{tpl.desc}</p>
                                </div>
                                {isSelected ? (
                                    <span className="shrink-0 text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full mt-0.5" style={{ color: primary, backgroundColor: `${primary}18` }}>Active</span>
                                ) : (
                                    <button className="shrink-0 text-[10px] font-bold text-gray-500 hover:text-gray-800 whitespace-nowrap mt-0.5 transition-colors">Preview →</button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── FULLSCREEN MODAL ── */}
            {previewModal && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
                    onClick={() => setPreviewModal(null)}
                >
                    <div
                        className="bg-white rounded-2xl overflow-hidden w-full shadow-2xl flex flex-col"
                        style={{ maxWidth: 1000, maxHeight: '92vh' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal nav */}
                        <div className="bg-[#EDEDED] border-b border-gray-200 flex items-center gap-2 px-5 py-3 shrink-0">
                            <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                            <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                            <div className="w-3 h-3 rounded-full bg-[#28C840]" />
                            <div className="flex-1 mx-3 bg-white border border-gray-300/70 rounded-md text-xs text-gray-400 px-3 py-1 text-center">
                                {agencyData.subdomain || 'yourname'}.yourdomain.com — {previewModal.name}
                            </div>
                            <div className="text-[10px] font-bold px-3 py-1 rounded-full text-white shrink-0" style={{ backgroundColor: previewModal.tagColor }}>
                                {previewModal.tag}
                            </div>
                            <button onClick={() => setPreviewModal(null)} className="text-gray-500 hover:text-gray-800 ml-1 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable full preview */}
                        <div className="overflow-y-auto flex-1 bg-gray-50">
                            <div
                                style={{
                                    width: `${PREVIEW_W}px`,
                                    height: `${PREVIEW_H}px`,
                                    transform: 'scale(0.78)',
                                    transformOrigin: 'top left',
                                    pointerEvents: 'none',
                                    userSelect: 'none',
                                }}
                            >
                                <previewModal.Preview primary={primary} secondary={secondary} agencyName={agencyName} />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-white border-t border-gray-100 flex items-center justify-between px-6 py-4 shrink-0">
                            <p className="text-sm text-gray-500 max-w-md">{previewModal.desc}</p>
                            <button
                                onClick={() => { setAgencyData({ ...agencyData, templateId: previewModal.id }); setPreviewModal(null); }}
                                className="flex items-center gap-2 text-sm text-white font-bold px-6 py-2.5 rounded-xl transition-all hover:opacity-90 active:scale-95 shrink-0 ml-4"
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
