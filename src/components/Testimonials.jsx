import React from 'react';
import { Star, Quote } from 'lucide-react';
import { motion } from 'framer-motion';

const testimonials = [
  {
    name: "James Wilson",
    role: "Property Investor",
    content: "The level of professionalism and market insight provided by RR Estate is unparalleled. They helped me secure a high-yield property in months.",
    rating: 5,
    property: "Commercial Tower, BKC"
  },
  {
    name: "Sara Ahmed",
    role: "Homeowner",
    content: "Finding my dream home felt effortless. The team's dedication to understanding my needs made all the difference. Truly exceptional service.",
    rating: 5,
    property: "Luxury Villa, Alibaug"
  },
  {
    name: "Michael Chen",
    role: "Business Owner",
    content: "Transparent, reliable, and sharp. RR Estate is the only partner I trust for my commercial real estate requirements.",
    rating: 5,
    property: "Office Space, Lower Parel"
  }
];

const Testimonials = () => {
  return (
    <section className="section-padding bg-gradient-to-br from-white via-white to-accent-teal/5 relative" id="testimonials">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%239C92AC%22 fill-opacity=%220.03%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />

      <div className="container-custom relative">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold tracking-wider uppercase"
          >
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            Testimonials
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold mt-4 mb-6 leading-tight"
          >
            What Our Clients Say<br />
            <span className="bg-gradient-to-r from-accent-teal to-accent-teal-dark bg-clip-text text-transparent">About Their Experience</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-text-muted text-lg max-w-2xl mx-auto leading-relaxed"
          >
            Trusted by thousands of homeowners, investors, and businesses across the country. Read their stories.
          </motion.p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="glass-card p-8 relative group hover:-translate-y-2 transition-all duration-50000"
            >
              {/* Quote Icon */}
              <Quote className="absolute top-8 right-8 w-14 h-14 text-primary/5 group-hover:text-primary/10 transition-colors duration-500" />

              {/* Rating */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
                className="flex gap-0.5 mb-6"
              >
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </motion.div>

              {/* Content */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                className="text-lg text-text-muted mb-8 italic leading-relaxed relative z-10"
              >
                "{t.content}"
              </motion.p>

              {/* Author */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.4 }}
                className="flex items-center gap-4 pt-6 border-t border-gray-100 relative z-10"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent-teal flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {t.name.charAt(0)}{t.name.split(' ')[1]?.charAt(0) || ''}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-lg text-text">{t.name}</h4>
                  <p className="text-accent-teal text-sm font-medium">{t.role}</p>
                  <p className="text-text-light text-xs mt-0.5">{t.property}</p>
                </div>
              </motion.div>
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
            View All Testimonials
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.span>
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;