import React, { useState } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';

// Unsplash images
const HERO_CLASSIC = "https://images.unsplash.com/photo-1600585154526-990dced4de0d?auto=format&fit=crop&q=80&w=1400&h=700";
const HERO_MODERN  = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1400&h=700";
const HERO_MINIMAL = "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=1400&h=700";
const CARD_1 = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=70&w=400&h=260";
const CARD_2 = "https://images.unsplash.com/photo-1600585154340-be6191dae10c?auto=format&fit=crop&q=70&w=400&h=260";
const CARD_3 = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=70&w=400&h=260";

// ─── CLASSIC ────────────────────────────────────────────────────────────────
const ClassicPreview = ({ primary, agencyName }) => (
    <div style={{ width: '100%', height: '100%', background: '#fff', fontFamily: 'system-ui,sans-serif', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 40px', borderBottom: '1px solid #eee', background: '#fff', flexShrink: 0 }}>
            <span style={{ fontWeight: 900, fontSize: 22, fontStyle: 'italic', color: primary }}>{agencyName || 'RR Estate'}</span>
            <div style={{ display: 'flex', gap: 28, fontSize: 13, color: '#555', fontWeight: 600 }}>
                <span>Home</span><span>Properties</span><span>About</span><span>Contact</span>
            </div>
            <div style={{ background: primary, color: '#fff', padding: '9px 20px', borderRadius: 9, fontSize: 12, fontWeight: 700 }}>Post Property</div>
        </div>
        <div style={{ position: 'relative', flexShrink: 0, height: '42%' }}>
            <img src={HERO_CLASSIC} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.75),rgba(0,0,0,0.25))', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 50px', gap: 12 }}>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 38, lineHeight: 1.1 }}>Find Your Dream Home</div>
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15 }}>Exclusive properties in prime locations.</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                    <div style={{ background: '#fff', color: '#111', padding: '11px 24px', borderRadius: 50, fontWeight: 700, fontSize: 13 }}>Browse Properties</div>
                    <div style={{ border: '2px solid rgba(255,255,255,0.55)', color: '#fff', padding: '11px 24px', borderRadius: 50, fontWeight: 700, fontSize: 13 }}>Talk to Saathi AI</div>
                </div>
            </div>
        </div>
        <div style={{ padding: '22px 40px 10px', background: '#fff', flexShrink: 0 }}>
            <span style={{ color: primary, fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: 3 }}>Featured</span>
            <div style={{ fontWeight: 800, fontSize: 24, color: '#111', marginTop: 3 }}>Latest <span style={{ color: '#008080' }}>Properties</span></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, padding: '0 40px 30px', background: '#fff', flex: 1 }}>
            {[CARD_1, CARD_2, CARD_3].map((img, i) => (
                <div key={i} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #eee', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
                    <img src={img} alt="" style={{ width: '100%', height: '55%', objectFit: 'cover' }} />
                    <div style={{ padding: '12px 14px' }}>
                        <div style={{ width: 36, height: 3, background: primary, borderRadius: 2, marginBottom: 7 }} />
                        <div style={{ fontWeight: 800, fontSize: 15, color: '#111' }}>₹{45 + i * 12}L</div>
                        <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>2 BHK · Baner, Pune</div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// ─── MODERN ────────────────────────────────────────────────────────────────
const ModernPreview = ({ primary, secondary, agencyName }) => (
    <div style={{ width: '100%', height: '100%', background: '#080610', fontFamily: 'system-ui,sans-serif', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div style={{ position: 'absolute', top: -40, left: -40, width: 280, height: 280, borderRadius: '50%', background: primary, filter: 'blur(100px)', opacity: 0.25 }} />
        <div style={{ position: 'absolute', bottom: 20, right: -20, width: 240, height: 240, borderRadius: '50%', background: secondary, filter: 'blur(90px)', opacity: 0.2 }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 40px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.04)', flexShrink: 0, zIndex: 10 }}>
            <span style={{ fontWeight: 900, fontSize: 22, fontStyle: 'italic', color: '#fff' }}>{agencyName || 'RR Estate'}</span>
            <div style={{ display: 'flex', gap: 28, fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>
                <span>Home</span><span>Properties</span><span>About</span>
            </div>
            <div style={{ background: primary, color: '#fff', padding: '9px 20px', borderRadius: 9, fontSize: 12, fontWeight: 700 }}>Post Property</div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 50px', position: 'relative', zIndex: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 4, color: primary, marginBottom: 14 }}>Next-Gen Real Estate</div>
            <div style={{ fontWeight: 900, fontSize: 46, color: '#fff', textAlign: 'center', lineHeight: 1.08, marginBottom: 12 }}>
                The Future of<br />
                <span style={{ background: `linear-gradient(to right, ${primary}, ${secondary})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Living is Here.</span>
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center', maxWidth: 420, marginBottom: 26 }}>Find ultra-luxury properties with AI-powered guidance from Saathi.</div>
            <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ background: primary, color: '#fff', padding: '12px 28px', borderRadius: 10, fontWeight: 700, fontSize: 14 }}>Explore Spaces</div>
                <div style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)', padding: '12px 28px', borderRadius: 10, fontWeight: 700, fontSize: 14 }}>Talk to AI</div>
            </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, padding: '0 40px 28px', position: 'relative', zIndex: 10 }}>
            {[CARD_1, CARD_2, CARD_3].map((img, i) => (
                <div key={i} style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}>
                    <img src={img} alt="" style={{ width: '100%', height: 90, objectFit: 'cover', opacity: 0.75 }} />
                    <div style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>₹{55 + i * 18}L</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>Premium Space · Pune</div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// ─── MINIMAL ───────────────────────────────────────────────────────────────
const MinimalPreview = ({ primary, agencyName }) => (
    <div style={{ width: '100%', height: '100%', background: '#FAF9F6', fontFamily: 'Georgia,serif', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 40px', borderBottom: '1px solid #e0e0e0', background: '#fff', flexShrink: 0 }}>
            <span style={{ fontWeight: 700, fontSize: 20, color: '#111', fontFamily: 'system-ui,sans-serif', letterSpacing: -0.5 }}>{agencyName || 'Luxury Estates'}</span>
            <div style={{ display: 'flex', gap: 28, fontSize: 12, color: '#666', fontFamily: 'system-ui,sans-serif', fontWeight: 500 }}>
                <span>Home</span><span>Properties</span><span>About</span>
            </div>
            <div style={{ border: '1.5px solid #111', color: '#111', padding: '8px 18px', fontSize: 11, fontWeight: 600, fontFamily: 'system-ui,sans-serif', letterSpacing: 0.8 }}>POST PROPERTY</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flexShrink: 0, height: '40%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 40px', gap: 14, background: '#FAF9F6' }}>
                <span style={{ color: primary, fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: 4, fontFamily: 'system-ui,sans-serif' }}>Bespoke Real Estate</span>
                <div style={{ fontWeight: 400, fontSize: 30, color: '#111', lineHeight: 1.2 }}>Select spaces, crafted for clarity.</div>
                <div style={{ fontSize: 12, color: '#999', lineHeight: 1.65, fontFamily: 'system-ui,sans-serif', fontWeight: 400 }}>Premium properties across India's most sought-after localities.</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                    <div style={{ border: '1.5px solid #111', color: '#111', padding: '10px 22px', fontSize: 11, fontWeight: 600, fontFamily: 'system-ui,sans-serif', letterSpacing: 0.8 }}>BROWSE CATALOGUE</div>
                </div>
            </div>
            <div>
                <img src={HERO_MINIMAL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
        </div>
        <div style={{ background: '#fff', padding: '18px 40px', borderTop: '1px solid #e5e5e5', borderBottom: '1px solid #e5e5e5', flexShrink: 0 }}>
            <div style={{ fontSize: 9, color: primary, textTransform: 'uppercase', letterSpacing: 4, fontFamily: 'system-ui,sans-serif', fontWeight: 700, marginBottom: 10 }}>Philosophy</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 30 }}>
                {['Bespoke Curation', 'Direct Access', 'Clear Metadata'].map((t, i) => (
                    <div key={i} style={{ fontFamily: 'system-ui,sans-serif' }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: primary, fontFamily: 'monospace' }}>0{i+1} /</span>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#111', marginTop: 3 }}>{t}</div>
                    </div>
                ))}
            </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, padding: '18px 40px', background: '#FAF9F6', flex: 1 }}>
            {[CARD_1, CARD_2, CARD_3].map((img, i) => (
                <div key={i} style={{ overflow: 'hidden', background: '#fff', border: '1px solid #E5E7EB' }}>
                    <img src={img} alt="" style={{ width: '100%', height: '55%', objectFit: 'cover' }} />
                    <div style={{ padding: '10px 12px', fontFamily: 'system-ui,sans-serif' }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: '#111' }}>₹{55 + i * 15}L</div>
                        <div style={{ fontSize: 10, color: '#aaa', marginTop: 3 }}>Estate · Pune</div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// ─── Config ────────────────────────────────────────────────────────────────
const TEMPLATES = [
    { id: 'classic', name: 'Classic Elegance', tag: 'Most Popular', tagColor: '#16A34A', desc: 'Clean white layout — floating navbar, full-bleed hero, classic 3-col property grid.', Preview: ClassicPreview },
    { id: 'modern',  name: 'Modern Vibrant',   tag: 'Premium Dark',  tagColor: '#7C3AED', desc: 'Dark glassmorphism design with glowing gradients — for luxury ultra-modern agencies.', Preview: ModernPreview },
    { id: 'minimal', name: 'Minimalist Clean', tag: 'Editorial',     tagColor: '#B45309', desc: 'Serif editorial layout — off-white canvas, side-by-side hero, sharp outline cards.', Preview: MinimalPreview },
];

// ─── Main ──────────────────────────────────────────────────────────────────
const TemplatePicker = ({ agencyData, setAgencyData }) => {
    const primary    = agencyData.primaryColor   || '#DC2626';
    const secondary  = agencyData.secondaryColor || '#1E293B';
    const agencyName = agencyData.agencyName     || '';

    const selectedIdx  = TEMPLATES.findIndex(t => t.id === (agencyData.templateId || 'classic'));
    const activeIdx    = selectedIdx === -1 ? 0 : selectedIdx;
    const activeTpl    = TEMPLATES[activeIdx];

    const goTo = (idx) => setAgencyData({ ...agencyData, templateId: TEMPLATES[idx].id });
    const prev  = () => goTo((activeIdx - 1 + TEMPLATES.length) % TEMPLATES.length);
    const next  = () => goTo((activeIdx + 1) % TEMPLATES.length);

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <label className="dash-label !mb-0">Choose Portal Template</label>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{activeIdx + 1} of {TEMPLATES.length}</span>
                    <div className="flex gap-1">
                        <button onClick={prev} className="w-7 h-7 rounded-full border border-gray-200 hover:border-gray-400 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-all">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button onClick={next} className="w-7 h-7 rounded-full border border-gray-200 hover:border-gray-400 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-all">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── BIG MAIN PREVIEW ── */}
            <div className="rounded-2xl overflow-hidden border-2 border-primary shadow-xl shadow-primary/10 mb-5">
                {/* macOS Chrome */}
                <div className="bg-[#EDEDED] border-b border-gray-300/60 flex items-center gap-1.5 px-4 py-2.5 shrink-0">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                    <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                    <div className="w-3 h-3 rounded-full bg-[#28C840]" />
                    <div className="flex-1 mx-3 bg-white border border-gray-300/60 rounded-md text-xs text-gray-400 px-3 py-1 text-center truncate">
                        {agencyData.subdomain || 'yourname'}.yourdomain.com
                    </div>
                    <div className="text-[10px] font-bold text-white px-2.5 py-1 rounded-full shrink-0" style={{ backgroundColor: activeTpl.tagColor }}>
                        {activeTpl.tag}
                    </div>
                </div>

                {/* Preview (fills container, no scale tricks) */}
                <div style={{ height: 380, position: 'relative', overflow: 'hidden' }}>
                    <activeTpl.Preview primary={primary} secondary={secondary} agencyName={agencyName} />
                </div>

                {/* Info bar */}
                <div className="bg-white border-t border-gray-100 flex items-center justify-between px-5 py-3">
                    <div>
                        <span className="font-bold text-sm text-gray-900">{activeTpl.name}</span>
                        <span className="text-xs text-gray-400 ml-2">{activeTpl.desc}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-primary font-bold ml-4 shrink-0">
                        <Check className="w-3.5 h-3.5" />
                        Active Template
                    </div>
                </div>
            </div>

            {/* ── 3 THUMBNAIL SWITCHER CARDS ── */}
            <div className="grid grid-cols-3 gap-3">
                {TEMPLATES.map((tpl, idx) => {
                    const isActive = idx === activeIdx;
                    return (
                        <div
                            key={tpl.id}
                            onClick={() => goTo(idx)}
                            className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                                isActive ? 'border-primary shadow-md shadow-primary/15' : 'border-gray-150 hover:border-gray-300 shadow-sm hover:shadow-md'
                            }`}
                        >
                            {/* Mini chrome */}
                            <div className="bg-[#EDEDED] flex items-center gap-1 px-2 py-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#FF5F57]" />
                                <div className="w-1.5 h-1.5 rounded-full bg-[#FEBC2E]" />
                                <div className="w-1.5 h-1.5 rounded-full bg-[#28C840]" />
                            </div>

                            {/* Thumbnail preview */}
                            <div style={{ height: 96, position: 'relative', overflow: 'hidden' }}>
                                <tpl.Preview primary={primary} secondary={secondary} agencyName={agencyName} />
                            </div>

                            {/* Label */}
                            <div className={`px-2 py-2 flex items-center justify-between ${isActive ? 'bg-primary/5' : 'bg-white'}`}>
                                <span className={`text-[11px] font-bold ${isActive ? 'text-primary' : 'text-gray-700'}`}>{tpl.name}</span>
                                {isActive && <Check className="w-3 h-3 text-primary" />}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TemplatePicker;
