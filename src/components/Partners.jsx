import React from 'react';
import { motion } from 'framer-motion';

const partners = [
  { name: "DAMAC", color: "#E60023" },
  { name: "SOBHA", color: "#003366" },
  { name: "AZIZI", color: "#C41E3A" },
  { name: "EMAAR", color: "#000000" },
  { name: "NAKHEEL", color: "#0056A0" },
  { name: "DANUBE", color: "#0066CC" }
];

const Partners = () => {
  return (
    <section className="section-padding bg-gradient-to-b from-white to-gray-50">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold tracking-wider uppercase"
          >
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            Trusted Partners
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold mt-4"
          >
            Collaborating with <span className="bg-gradient-to-r from-accent-teal to-accent-teal-dark bg-clip-text text-transparent">Industry Leaders</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-text-muted text-lg max-w-2xl mx-auto mt-4 leading-relaxed"
          >
            We partner with the most reputable developers to bring you exclusive access to premium properties and investment opportunities.
          </motion.p>
        </div>

        {/* Partners Marquee */}
        <div className="overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex animate-marquee"
          >
            {Array.from({ length: 3 }).flatMap((_, arrayIndex) =>
              partners.map((partner, index) => (
                <motion.div
                  key={`${partner.name}-${arrayIndex}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (index + arrayIndex * partners.length) * 0.05 }}
                  className="flex-shrink-0 px-8 md:px-12 py-4"
                >
                  <div className={`font-black text-3xl md:text-4xl lg:text-5xl tracking-tighter uppercase text-white px-6 py-3 rounded-xl`} style={{ backgroundColor: partner.color }}>
                    {partner.name}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 glass-panel rounded-2xl p-8 md:p-12"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent mb-2">6+</div>
              <div className="text-text-muted">Premier Developers</div>
            </div>
            <div className="border-l border-gray-200">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-accent-teal to-accent-teal-dark bg-clip-text text-transparent mb-2">500+</div>
              <div className="text-text-muted">Exclusive Listings</div>
            </div>
            <div className="border-l border-gray-200">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-dark to-accent-teal-dark bg-clip-text text-transparent mb-2">₹50K Cr+</div>
              <div className="text-text-muted">Portfolio Value</div>
            </div>
            <div className="border-l border-gray-200">
              <div className="text-4xl md:text-5xl font-bold text-text mb-2">12</div>
              <div className="text-text-muted">Cities Covered</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Partners;