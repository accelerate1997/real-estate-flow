import React from 'react';
import { Star, Quote } from 'lucide-react';
import { motion } from 'framer-motion';

const testimonials = [
  {
    name: "James Wilson",
    role: "Property Investor",
    content: "The level of professionalism and market insight provided by RR Estate is unparalleled. They helped me secure a high-yield property in months.",
    rating: 5
  },
  {
    name: "Sara Ahmed",
    role: "Homeowner",
    content: "Finding my dream home felt effortless. The team's dedication to understanding my needs made all the difference.",
    rating: 5
  },
  {
    name: "Michael Chen",
    role: "Business Owner",
    content: "Transparent, reliable, and sharp. RR Estate is the only partner I trust for my commercial real estate requirements.",
    rating: 5
  }
];

const Testimonials = () => {
  return (
    <section className="section-padding bg-accent-teal/5 relative">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">What people are saying <br /> <span className="text-primary italic">about our real estate</span></h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-panel p-10 rounded-3xl relative"
            >
              <Quote className="absolute top-8 right-8 w-12 h-12 text-primary/10" />
              <div className="flex gap-1 mb-6">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-lg text-text-muted mb-8 italic">"{t.content}"</p>
              <div>
                <h4 className="font-bold text-xl">{t.name}</h4>
                <p className="text-accent-teal text-sm">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
