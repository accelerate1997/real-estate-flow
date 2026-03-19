import React from 'react';
import { motion } from 'framer-motion';
import villaImg from '../assets/redesign/neighborhood_villa.png';
import highriseImg from '../assets/redesign/neighborhood_highrise.png';

const neighborhoods = [
  {
    name: "Luxury Waterfront",
    description: "Exclusive seaside living with private marina access.",
    image: villaImg,
    size: "large"
  },
  {
    name: "Downtown Pulse",
    description: "Ultra-modern living in the heart of the city.",
    image: highriseImg,
    size: "medium"
  },
  {
    name: "Green Meadows",
    description: "Sustainable family-friendly suburban retreats.",
    image: villaImg,
    size: "small"
  },
  {
    name: "Skyline Heights",
    description: "Iconic penthouses with 360-degree city views.",
    image: highriseImg,
    size: "small"
  }
];

const Neighborhoods = () => {
  return (
    <section className="section-padding">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-primary font-semibold tracking-wider uppercase text-sm"
            >
              Curation
            </motion.span>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold mt-4"
            >
              Explore the <span className="text-accent-teal">Neighborhoods</span>
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

        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 h-[600px] md:h-[700px]">
          {neighborhoods.map((area, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative overflow-hidden group rounded-3xl ${
                area.size === 'large' ? 'md:col-span-3 h-full' : 
                area.size === 'medium' ? 'md:col-span-3 h-[300px] md:h-full' : 
                'md:col-span-3 h-[200px] md:h-full'
              }`}
            >
              <img 
                src={area.image} 
                alt={area.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark/90 via-dark/20 to-transparent p-8 flex flex-col justify-end">
                <h3 className="text-2xl font-bold text-white mb-2">{area.name}</h3>
                <p className="text-white/70 text-sm max-w-sm opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  {area.description}
                </p>
                <div className="mt-4 w-10 h-1 bg-primary transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Neighborhoods;
