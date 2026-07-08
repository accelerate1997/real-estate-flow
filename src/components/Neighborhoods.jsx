import React from 'react';
import { motion } from 'framer-motion';
import villaImg from '../assets/redesign/neighborhood_villa.png';
import highriseImg from '../assets/redesign/neighborhood_highrise.png';
import { ArrowRight, MapPin, Star } from 'lucide-react';

const neighborhoods = [
  {
    name: "Luxury Waterfront",
    description: "Exclusive seaside living with private marina access and panoramic ocean views.",
    image: villaImg,
    size: "large",
    stats: { properties: 42, avgPrice: "₹8.5Cr", rating: 4.9 }
  },
  {
    name: "Downtown Pulse",
    description: "Ultra-modern living in the heart of the city with premium amenities.",
    image: highriseImg,
    size: "medium",
    stats: { properties: 128, avgPrice: "₹4.2Cr", rating: 4.7 }
  },
  {
    name: "Green Meadows",
    description: "Sustainable family-friendly suburban retreats with vast green spaces.",
    image: villaImg,
    size: "small",
    stats: { properties: 67, avgPrice: "₹2.1Cr", rating: 4.6 }
  },
  {
    name: "Skyline Heights",
    description: "Iconic penthouses with 360-degree city views and exclusive sky lounges.",
    image: highriseImg,
    size: "small",
    stats: { properties: 23, avgPrice: "₹12Cr", rating: 4.8 }
  }
];

const Neighborhoods = () => {
  return (
    <section className="section-padding bg-white" id="neighborhoods">
      <div className="container-custom">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold tracking-wider uppercase"
            >
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              Curation
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold mt-4"
            >
              Explore the <span className="bg-gradient-to-r from-accent-teal to-accent-teal-dark bg-clip-text text-transparent">Neighborhoods</span>
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-text-muted md:max-w-xs"
          >
            Discover the most prestigious and sought-after locations tailored to your refined lifestyle.
          </motion.p>
        </div>

        {/* Neighborhood Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 h-[600px] md:h-[700px]">
          {neighborhoods.map((area, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className={`relative overflow-hidden group rounded-3xl ${
                area.size === 'large' ? 'md:col-span-4 md:row-span-2' :
                area.size === 'medium' ? 'md:col-span-3 md:row-span-2' :
                'md:col-span-3'
              }`}
            >
              <motion.img
                src={area.image}
                alt={area.name}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                initial={{ scale: 1 }}
                whileInView={{ scale: 1 }}
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-dark/90 via-dark/20 to-transparent" />

              {/* Content */}
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                {/* Stats Bar */}
                <div className="flex flex-wrap gap-4 mb-6 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-white text-sm font-medium">{area.stats.properties} Properties</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl">
                    <Star className="w-4 h-4 text-amber-400 fill-current" />
                    <span className="text-white text-sm font-medium">{area.stats.rating} Rating</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl">
                    <span className="text-white/70 text-sm">Avg:</span>
                    <span className="text-white text-sm font-bold">{area.stats.avgPrice}</span>
                  </div>
                </div>

                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                  {area.name}
                </h3>
                <p className="text-white/70 text-sm md:text-base max-w-sm mb-6">
                  {area.description}
                </p>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="group flex items-center gap-2 bg-white text-text px-6 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all shadow-lg"
                  >
                    Explore Area
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                  <div className="w-1 h-1 bg-primary transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12"
        >
          <button className="group inline-flex items-center gap-3 text-primary font-bold text-lg hover:text-primary-dark transition-colors">
            View All Neighborhoods
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default Neighborhoods;