import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    quick: [
      { name: 'Home', href: '/' },
      { name: 'Properties', href: '/properties/residential' },
      { name: 'About Us', href: '/#about' },
      { name: 'Services', href: '/#services' },
      { name: 'Contact', href: '/#contact' },
    ],
    properties: [
      { name: 'Residential', href: '/properties/residential' },
      { name: 'Commercial', href: '/properties/commercial' },
      { name: 'Investments', href: '/properties/investments' },
      { name: 'Developers', href: '/developers' },
      { name: 'Under Development', href: '/properties/under-development' },
    ],
    resources: [
      { name: 'Blog', href: '/blog' },
      { name: 'Market Insights', href: '/insights' },
      { name: 'Property Valuation', href: '/valuation' },
      { name: 'Mortgage Calculator', href: '/calculator' },
      { name: 'Legal Guide', href: '/legal' },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
    { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
  ];

  const contactInfo = [
    { icon: Mail, text: 'info@rrestate.com', href: 'mailto:info@rrestate.com' },
    { icon: Phone, text: '+91 22 4000 1234', href: 'tel:+912240001234' },
    { icon: MapPin, text: '123 Luxury Lane, Downtown, Mumbai 400001', href: 'https://maps.google.com' },
  ];

  return (
    <footer className="relative bg-dark text-white overflow-hidden" id="contact">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-teal/5 rounded-full blur-3xl" />

      <div className="relative container-custom section-padding">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <Link to="/" className="inline-block mb-6" aria-label="Rajesh Real Estate Home">
              <span className="text-3xl font-black italic tracking-tighter">
                <span className="text-primary">RR</span>
                <span className="text-white/80"> Estate</span>
              </span>
            </Link>
            <p className="text-white/40 leading-relaxed mb-8 max-w-xs text-base">
              Redefining the standards of real estate with luxury, transparency, and innovation. Find your legacy, one door at a time.
            </p>

            {/* Social Links */}
            <div className="flex gap-3 mb-8">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary/20 hover:border-primary/50 hover:text-primary transition-all duration-300 group"
                  aria-label={label}
                >
                  <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </a>
              ))}
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-4 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                RERA Registered
              </div>
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <span className="w-2 h-2 rounded-full bg-accent-teal" />
                500+ Properties
              </div>
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <span className="w-2 h-2 rounded-full bg-primary" />
                50K+ Happy Clients
              </div>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h4 className="text-lg font-bold mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {footerLinks.quick.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-white/50 hover:text-primary transition-colors duration-300 flex items-center gap-2 group"
                  >
                    {link.name}
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Properties */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="text-lg font-bold mb-6">Properties</h4>
            <ul className="space-y-3">
              {footerLinks.properties.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-white/50 hover:text-accent-teal transition-colors duration-300 flex items-center gap-2 group"
                  >
                    {link.name}
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Resources */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="text-lg font-bold mb-6">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-white/50 hover:text-accent-teal transition-colors duration-300 flex items-center gap-2 group"
                  >
                    {link.name}
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <h4 className="text-lg font-bold mb-6">Contact Us</h4>
            <ul className="space-y-4">
              {contactInfo.map(({ icon: Icon, text, href }) => (
                <li key={text} className="flex items-start gap-3">
                  <Icon className="w-5 h-5 text-primary/80 mt-0.5 flex-shrink-0" />
                  <a
                    href={href}
                    className="text-white/50 hover:text-white transition-colors duration-300 text-sm leading-relaxed"
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {text}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-10"
        />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pt-8">
          {/* Copyright */}
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-white/30 text-sm"
          >
            © {currentYear} RR Estate. Crafted with precision.
          </motion.p>

          {/* Legal Links */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex gap-8"
          >
            <Link to="/privacy" className="text-white/30 hover:text-white/60 transition-colors text-sm">Privacy Policy</Link>
            <Link to="/terms" className="text-white/30 hover:text-white/60 transition-colors text-sm">Terms of Service</Link>
            <Link to="/cookies" className="text-white/30 hover:text-white/60 transition-colors text-sm">Cookie Policy</Link>
            <Link to="/accessibility" className="text-white/30 hover:text-white/60 transition-colors text-sm">Accessibility</Link>
          </motion.div>

          {/* Back to Top */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 md:static w-12 h-12 md:w-auto md:h-auto px-6 py-2 bg-primary/20 backdrop-blur-md border border-primary/30 text-white rounded-xl font-semibold hover:bg-primary/30 transition-all duration-300 flex items-center gap-2 group"
            aria-label="Back to top"
          >
            <span className="hidden md:block">Back to Top</span>
            <ArrowRight className="w-4 h-4 -rotate-45 group-hover:rotate-0 transition-transform" />
          </motion.button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;