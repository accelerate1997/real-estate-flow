import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-dark text-white pt-20 pb-10">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-3xl font-black mb-8 italic tracking-tighter">RR Estate</h3>
            <p className="text-white/40 leading-relaxed mb-8 max-w-xs">
              Redefining the standards of real estate with luxury, transparency, and innovation. Find your future with us.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-primary hover:border-primary transition-all">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-primary hover:border-primary transition-all">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-primary hover:border-primary transition-all">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-primary hover:border-primary transition-all">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-8">Quick Links</h4>
            <ul className="space-y-4 text-white/40">
              <li><a href="#" className="hover:text-primary transition-colors">Home</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Properties</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Services</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-8">Properties</h4>
            <ul className="space-y-4 text-white/40">
              <li><a href="#" className="hover:text-primary transition-colors">Residential</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Commercial</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Investments</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Developers</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-8">Get in Touch</h4>
            <ul className="space-y-4 text-white/40">
              <li>info@rrestate.com</li>
              <li>+1 (555) 123-4567</li>
              <li>123 Luxury Lane, <br />Downtown Metropolis</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:row justify-between items-center gap-4 text-white/20 text-sm">
          <p>© 2026 RR Estate. Built with precision.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white/40 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white/40 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
