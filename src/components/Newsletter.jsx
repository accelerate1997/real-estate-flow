import React from 'react';
import { Mail, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Newsletter = () => {
  return (
    <section className="section-padding bg-dark text-white relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -mr-48 -mt-48"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-teal/20 rounded-full blur-[120px] -ml-48 -mb-48"></div>

      <div className="container-custom relative z-10">
        <div className="glass-dark p-12 md:p-16 rounded-[40px] flex flex-col items-center text-center max-w-4xl mx-auto">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mb-8"
          >
            <Mail className="w-10 h-10 text-primary" />
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            Subscribe to our <span className="text-primary italic">newsletter</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-white/60 text-lg mb-10 max-w-2xl"
          >
            Stay updated with the latest properties, market trends, and exclusive investment opportunities delivered straight to your inbox.
          </motion.p>

          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="w-full max-w-lg flex flex-col sm:flex-row gap-4"
          >
            <input 
              type="email" 
              placeholder="Your email address" 
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-primary/50 transition-colors"
              required
            />
            <button 
              type="submit" 
              className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group"
            >
              Join Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.form>
          
          <p className="mt-6 text-white/30 text-sm">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
