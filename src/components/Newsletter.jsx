import React, { useState } from 'react';
import { Mail, ArrowRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    await new Promise(r => setTimeout(r, 1000));
    setStatus('success');
    setEmail('');
  };

  return (
    <section className="section-padding bg-gradient-to-br from-dark via-dark to-primary/5 text-white relative overflow-hidden" id="newsletter">
      {/* Decorative gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/15 rounded-full blur-3xl -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent-teal/15 rounded-full blur-3xl -ml-64 -mb-64" />

      <div className="container-custom relative z-10">
        <div className="glass-panel-dark p-8 md:p-12 lg:p-16 rounded-3xl flex flex-col items-center text-center max-w-4xl mx-auto border border-white/10">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="w-20 h-20 bg-gradient-to-br from-primary/20 to-accent-teal/20 rounded-2xl flex items-center justify-center mb-8"
          >
            <Mail className="w-10 h-10 bg-gradient-to-r from-primary to-accent-teal bg-clip-text text-transparent" />
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight"
          >
            Subscribe to our <span className="bg-gradient-to-r from-primary to-accent-teal bg-clip-text text-transparent italic">Newsletter</span>
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-white/60 text-lg mb-10 max-w-2xl leading-relaxed"
          >
            Stay updated with the latest properties, market trends, and exclusive investment opportunities delivered straight to your inbox.
          </motion.p>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSubmit}
            className="w-full max-w-lg flex flex-col sm:flex-row gap-4"
          >
            <div className="relative flex-1">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-primary transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                disabled={status === 'submitting' || status === 'success'}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 pl-14 outline-none focus:border-primary/50 focus:bg-white/10 transition-all text-white placeholder:text-white/30 disabled:opacity-50"
                required
                autoComplete="email"
              />
            </div>
            <motion.button
              type="submit"
              disabled={status === 'submitting' || status === 'success'}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'submitting' && (
                <>
                  <motion.div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Subscribing...</span>
                </>
              )}
              {status === 'success' && (
                <>
                  <Check className="w-5 h-5" />
                  <span>Subscribed!</span>
                </>
              )}
              {status === 'idle' && (
                <>
                  <span>Join Now</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </motion.form>

          {/* Success Message */}
          {status === 'success' && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 text-green-400 text-sm flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              You're now subscribed. Check your inbox for a confirmation.
            </motion.p>
          )}

          <p className="mt-6 text-white/30 text-sm">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;