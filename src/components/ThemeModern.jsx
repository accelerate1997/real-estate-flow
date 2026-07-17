import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, Mic, Sparkles, Building2, ShieldCheck, HelpCircle } from 'lucide-react';
import PropertyGrid from './PropertyGrid';
import Partners from './Partners';
import Testimonials from './Testimonials';
import Neighborhoods from './Neighborhoods';

const ThemeModern = () => {
    const scrollToProperties = () => {
        const element = document.getElementById('modern-properties');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="bg-dark text-white min-h-screen overflow-x-hidden font-sans">
            {/* Glowing Accent Blobs */}
            <div className="absolute top-0 left-0 right-0 h-[80vh] overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[150px] animate-pulse" />
                <div className="absolute top-20 right-[-200px] w-[500px] h-[500px] rounded-full bg-accent-teal/15 blur-[120px] animate-pulse delay-1000" />
            </div>

            {/* Hero Section */}
            <section className="relative h-[95vh] min-h-[750px] flex items-center justify-center pt-24 z-10">
                <div className="container-custom px-4 sm:px-6 lg:px-8 text-center max-w-5xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-8 text-accent-teal"
                    >
                        <Sparkles className="w-4 h-4 animate-spin text-accent-teal" />
                        Next-Gen Real Estate Portal
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] mb-8"
                    >
                        The Future of <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent-teal to-primary-light">
                            Living is Here.
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-12 font-medium"
                    >
                        Find ultra-luxury properties with dynamic pricing, immersive 4K video walk-throughs, and personalized AI agent guidance.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <button
                            onClick={scrollToProperties}
                            className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white font-bold px-10 py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
                        >
                            Explore Spaces
                            <ArrowDown className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => {
                                const event = new CustomEvent('openVoiceAgent');
                                window.dispatchEvent(event);
                            }}
                            className="w-full sm:w-auto bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold px-10 py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            <Mic className="w-5 h-5 text-accent-teal" />
                            Talk to Saathi AI
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* Partners section */}
            <div className="bg-black/40 py-10 border-y border-white/5 relative z-10">
                <Partners />
            </div>

            {/* Features (Modern Grid) */}
            <section className="py-24 relative z-10">
                <div className="container-custom">
                    <div className="text-center mb-16">
                        <span className="text-accent-teal uppercase tracking-widest font-bold text-xs">Excellence</span>
                        <h2 className="text-4xl md:text-5xl font-black mt-2">Why Choose Our Platform</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { title: 'Verified Listings', icon: ShieldCheck, desc: 'Every single listing goes through rigorous background checks and video verifications.' },
                            { title: 'AI Assistant', icon: Mic, desc: 'Saathi, your personal real estate voice bot, available 24/7 to match your criteria.' },
                            { title: 'Prime Spaces', icon: Building2, desc: 'Specialized collection of premium highrise office complexes and luxury vills.' }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-xl hover:border-primary/50 transition-all">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                                    <item.icon className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Properties (Dark Grid) */}
            <section id="modern-properties" className="py-24 bg-black/30 border-t border-white/5 relative z-10">
                <div className="container-custom">
                    <div className="mb-16">
                        <span className="text-primary font-bold uppercase tracking-widest text-xs">Showcase</span>
                        <h2 className="text-4xl md:text-5xl font-black mt-2">Modern Portfolios</h2>
                    </div>
                    <PropertyGrid />
                </div>
            </section>

            {/* Neighborhoods (Modern theme) */}
            <section className="py-24 relative z-10">
                <div className="container-custom">
                    <Neighborhoods />
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24 bg-white/5 relative z-10">
                <div className="container-custom">
                    <Testimonials />
                </div>
            </section>
        </div>
    );
};

export default ThemeModern;
