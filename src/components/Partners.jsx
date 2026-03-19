import React from 'react';
import { motion } from 'framer-motion';

const partners = [
  "DAMAC", "SOBHA", "AZIZI", "EMAAR", "NAKHEEL", "DANUBE"
];

const Partners = () => {
  return (
    <section className="py-12 bg-white">
      <div className="container-custom">
        <div className="flex flex-wrap items-center justify-center gap-12 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          {partners.map((partner, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-2xl font-black text-dark tracking-tighter"
            >
              {partner}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Partners;
