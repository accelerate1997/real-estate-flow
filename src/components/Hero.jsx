import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, Mic } from 'lucide-react';

const Hero = () => {
    const scrollToProperties = () => {
        const element = document.getElementById('properties');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <section className="relative h-[90vh] min-h-[700px] w-full overflow-hidden flex items-center justify-center">
            {/* Full-bleed Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform"
                style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1600585154526-990dced4de0d?auto=format&fit=crop&q=80&w=2000')"
                }}
            >
                {/* Gradient overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent-teal/10" />
            </div>

            {/* Floating geometric accents */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent-teal/10 blur-3xl animate-pulse delay-1000" />
            </div>

            {/* Content */}
            <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-7xl w-full">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-sm font-semibold tracking-wider uppercase mb-8">
                            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                            Finding Your Legacy
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight leading-[1.1] mb-8"
                    >
                        Finding Your Legacy, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-gray-200">
                            One Door at a Time.
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto font-light leading-relaxed mb-12"
                    >
                        Discover exclusive properties in prime locations with AI-powered insights and personalized guidance from Saathi.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <motion.button
                            onClick={scrollToProperties}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="group flex items-center gap-3 bg-white text-text px-10 py-4 rounded-full font-semibold text-lg shadow-2xl hover:shadow-white/30 transition-all duration-300 w-full sm:w-auto justify-center"
                        >
                            Browse Properties
                            <ArrowDown className="w-5 h-5 group-hover:translate-y-1 transition-transform duration-300" />
                        </motion.button>

                        <motion.button
                            onClick={() => {
                                const event = new CustomEvent('openVoiceAgent');
                                window.dispatchEvent(event);
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="group relative flex items-center gap-3 bg-primary/20 backdrop-blur-md border border-white/30 text-white px-10 py-4 rounded-full font-semibold text-lg hover:bg-primary/30 hover:border-primary/50 transition-all duration-300 shadow-2xl w-full sm:w-auto justify-center overflow-hidden"
                        >
                            <Mic className="w-5 h-5" />
                            Talk to Saathi
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="absolute right-6 top-1/2 -translate-y-1/2 flex gap-1"
                            >
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </motion.div>
                        </motion.button>
                    </motion.div>

                    {/* Scroll indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 1 }}
                        className="absolute bottom-10 left-1/2 -translate-x-1/2"
                    >
                        <motion.div
                            animate={{ y: [0, 10, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                            className="flex flex-col items-center gap-2 text-white/50"
                        >
                            <span className="text-xs uppercase tracking-widest font-semibold">Explore</span>
                            <ArrowDown className="w-6 h-6" />
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
