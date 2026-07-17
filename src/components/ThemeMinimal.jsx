import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Square } from 'lucide-react';
import PropertyGrid from './PropertyGrid';
import Partners from './Partners';

const ThemeMinimal = () => {
    const scrollToProperties = () => {
        const element = document.getElementById('minimal-properties');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="bg-[#FAF9F6] text-gray-900 min-h-screen font-serif pt-16 selection:bg-primary/10">
            {/* Minimal Hero Section */}
            <section className="relative min-h-[85vh] flex items-center py-20 border-b border-gray-200">
                <div className="container-custom px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8 max-w-xl">
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-xs uppercase tracking-widest text-primary font-sans font-bold"
                        >
                            Est. 2026 / Bespoke Real Estate
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 25 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                            className="text-4xl sm:text-5xl md:text-6xl font-normal leading-tight tracking-tight text-gray-900"
                        >
                            Select spaces, <br />
                            crafted for clarity and elegant living.
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="text-base sm:text-lg text-gray-600 font-sans font-light leading-relaxed"
                        >
                            We curate premium residential developments, strategic plot projects, and luxury commercial spaces across the country's most sought-after localities.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="flex flex-col sm:flex-row gap-4 pt-4"
                        >
                            <button
                                onClick={scrollToProperties}
                                className="border border-gray-900 text-gray-900 font-sans font-semibold px-8 py-3.5 hover:bg-gray-900 hover:text-white transition-all text-sm tracking-wide"
                            >
                                Browse Catalogue
                            </button>
                            <button
                                onClick={() => {
                                    const event = new CustomEvent('openVoiceAgent');
                                    window.dispatchEvent(event);
                                }}
                                className="text-gray-900 font-sans font-semibold px-8 py-3.5 flex items-center justify-center gap-2 text-sm hover:underline"
                            >
                                Inquire with Saathi AI
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="relative h-[450px] w-full bg-cover bg-center border border-gray-250/60 hidden lg:block"
                        style={{
                            backgroundImage: "url('https://images.unsplash.com/photo-1600585154340-be6191dae10c?auto=format&fit=crop&q=80&w=1200')"
                        }}
                    >
                        <div className="absolute bottom-6 left-6 bg-white/95 border border-gray-200 px-6 py-4 space-y-1">
                            <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-primary">Featured Space</span>
                            <h3 className="text-base font-normal">Symphony Heights</h3>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Partners */}
            <div className="py-12 border-b border-gray-200 bg-white">
                <Partners />
            </div>

            {/* Minimal Features List */}
            <section className="py-24 border-b border-gray-200 bg-white">
                <div className="container-custom px-6 md:px-12">
                    <div className="max-w-2xl mb-16">
                        <span className="text-xs uppercase tracking-widest text-primary font-sans font-bold">Philosophy</span>
                        <h2 className="text-3xl sm:text-4xl font-normal mt-2">Bespoke estate curation focusing on details and pure transparency.</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 font-sans">
                        {[
                            { title: 'Bespoke Curation', desc: 'We only showcase unique spaces with architecture that speaks. No generic builder floors.' },
                            { title: 'Direct Access', desc: 'Direct mapping of phone leads to agents on WhatsApp ensuring 10-second response latency.' },
                            { title: 'Clear Metadata', desc: 'RERA registered projects only. Full transparency on road widths, power sources, and possession schedules.' }
                        ].map((feat, idx) => (
                            <div key={idx} className="space-y-4">
                                <span className="text-xs font-bold text-primary font-mono">0{idx + 1} /</span>
                                <h3 className="text-lg font-bold text-gray-900">{feat.title}</h3>
                                <p className="text-gray-600 text-sm leading-relaxed font-light">{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Properties */}
            <section id="minimal-properties" className="py-24">
                <div className="container-custom px-6 md:px-12">
                    <div className="mb-16 text-center">
                        <span className="text-xs uppercase tracking-widest text-primary font-sans font-bold">Showcase</span>
                        <h2 className="text-3xl sm:text-4xl font-normal mt-2">Available Estates</h2>
                    </div>
                    <PropertyGrid />
                </div>
            </section>
        </div>
    );
};

export default ThemeMinimal;
