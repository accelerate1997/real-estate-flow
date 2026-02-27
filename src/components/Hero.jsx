import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

const Hero = () => {
    const scrollToProperties = () => {
        const element = document.getElementById('properties');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="relative h-[85vh] w-full overflow-hidden">
            {/* Background Image with Parallax-like fixity or just cover */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
                style={{
                    backgroundImage: "url('https://images.moneycontrol.com/static-mcnews/2021/03/Mumbai-Real-Estate-Building.jpg?impolicy=website&width=1600&height=900')"
                }}
            >
                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/40 backdrop-brightness-75"></div>
            </div>

            {/* Content */}
            <div className="relative h-full flex flex-col justify-center items-center text-center px-4 max-w-5xl mx-auto">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-tight mb-6"
                >
                    Finding Your Legacy, <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                        One Door at a Time.
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="text-lg md:text-xl text-gray-200 mb-10 max-w-2xl font-light"
                >
                    Discover exclusive properties in prime locations using our platform.
                </motion.p>

                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                    onClick={scrollToProperties}
                    className="group flex items-center gap-2 bg-white text-text px-8 py-3.5 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all shadow-2xl hover:shadow-white/20"
                >
                    Browse Properties
                    <ArrowDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                </motion.button>
            </div>
        </div>
    );
};

export default Hero;
