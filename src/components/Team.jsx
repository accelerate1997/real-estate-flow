import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, Linkedin, User, Award, TrendingUp, Star } from 'lucide-react';
import memberImg from '../assets/redesign/team_member_1.png';

const team = [
  {
    name: "Rajesh Sharma",
    role: "CEO & Founder",
    experience: "20+ Years",
    specialty: "Luxury Real Estate",
    image: memberImg,
    stats: { deals: 1200, rating: "4.9", volume: "₹2,400Cr" }
  },
  {
    name: "Priya Mehta",
    role: "Senior Consultant",
    experience: "15+ Years",
    specialty: "Residential Properties",
    image: memberImg,
    stats: { deals: 850, rating: "4.8", volume: "₹1,200Cr" }
  },
  {
    name: "Ahmed Khan",
    role: "Market Analyst",
    experience: "12+ Years",
    specialty: "Investment Analysis",
    image: memberImg,
    stats: { deals: 400, rating: "4.9", volume: "₹3,100Cr" }
  },
  {
    name: "Lisa Wong",
    role: "Property Specialist",
    experience: "10+ Years",
    specialty: "Commercial Leasing",
    image: memberImg,
    stats: { deals: 600, rating: "4.7", volume: "₹800Cr" }
  }
];

const Team = () => {
  return (
    <section className="section-padding bg-white" id="team">
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
            Leadership
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold mt-4 mb-4"
          >
            Meet Our <span className="bg-gradient-to-r from-accent-teal to-accent-teal-dark bg-clip-text text-transparent">Experts</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-text-muted text-lg max-w-2xl mx-auto leading-relaxed"
          >
            A team of seasoned professionals dedicated to delivering excellence in every transaction.
          </motion.p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="group"
            >
              {/* Image Card */}
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl mb-6 bg-gray-100">
                <motion.img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                  initial={{ scale: 1 }}
                  whileInView={{ scale: 1 }}
                />

                {/* Experience Badge */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full text-sm font-bold text-primary shadow-lg">
                  {member.experience} Experience
                </div>

                {/* Stats Overlay */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-premium opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="border-r border-gray-100 last:border-0">
                      <div className="text-2xl font-bold text-primary">{member.stats.deals}+</div>
                      <div className="text-xs text-text-muted">Deals Closed</div>
                    </div>
                    <div className="border-r border-gray-100 last:border-0">
                      <div className="text-2xl font-bold text-accent-teal">{member.stats.rating}</div>
                      <div className="text-xs text-text-muted">Client Rating</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-text">{member.stats.volume}</div>
                      <div className="text-xs text-text-muted">Sales Volume</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Member Info */}
              <div className="text-center">
                <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors duration-300">
                  {member.name}
                </h3>
                <p className="text-accent-teal font-semibold uppercase text-xs tracking-widest mb-2">
                  {member.role}
                </p>
                <p className="text-text-muted text-sm mb-4">
                  <span className="font-medium text-text">{member.specialty}</span> Specialist
                </p>

                {/* Action Buttons */}
                <div className="flex justify-center gap-2 pt-4 border-t border-gray-100">
                  <button className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-primary hover:text-white hover:border-primary transition-all border border-gray-100 flex items-center justify-center" aria-label="Email">
                    <Mail className="w-4 h-4" />
                  </button>
                  <button className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-primary hover:text-white hover:border-primary transition-all border border-gray-100 flex items-center justify-center" aria-label="Call">
                    <Phone className="w-4 h-4" />
                  </button>
                  <button className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-primary hover:text-white hover:border-primary transition-all border border-gray-100 flex items-center justify-center" aria-label="LinkedIn">
                    <Linkedin className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Team Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-16 glass-panel p-8 md:p-12 rounded-3xl"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <User className="w-6 h-6 text-primary" />
                <span className="text-4xl font-bold text-text">4</span>
              </div>
              <p className="text-text-muted">Senior Experts</p>
            </div>
            <div className="border-l border-gray-100">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Award className="w-6 h-6 text-accent-teal" />
                <span className="text-4xl font-bold text-text">48+</span>
              </div>
              <p className="text-text-muted">Years Combined</p>
            </div>
            <div className="border-l border-gray-100">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                <span className="text-4xl font-bold text-text">₹7,500Cr+</span>
              </div>
              <p className="text-text-muted">Total Volume</p>
            </div>
            <div className="border-l border-gray-100">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-6 h-6 text-amber-400 fill-current" />
                <span className="text-4xl font-bold text-text">4.85</span>
              </div>
              <p className="text-text-muted">Avg. Rating</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Team;