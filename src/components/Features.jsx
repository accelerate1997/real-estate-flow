import React from 'react';
import { Target, Users, Shield, TrendingUp, Sparkles, Zap, Globe, Home } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: <Target className="w-8 h-8" />,
    title: "Expert Guidance",
    description: "Our seasoned experts lead you through every step of your real estate journey with precision and care.",
    gradient: "from-primary to-primary-dark"
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "Client-Centric Approach",
    description: "Your goals are our priority. We tailor our services to meet your unique needs and aspirations.",
    gradient: "from-accent-teal to-accent-teal-dark"
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Secure Transactions",
    description: "Experience peace of mind with our transparent and secure handling of all deals and documentation.",
    gradient: "from-primary to-accent-teal"
  },
  {
    icon: <TrendingUp className="w-8 h-8" />,
    title: "Market Intelligence",
    description: "Stay ahead with our deep analysis and exclusive insights into emerging markets and investment opportunities.",
    gradient: "from-accent-teal to-primary"
  },
  {
    icon: <Sparkles className="w-8 h-8" />,
    title: "AI-Powered Search",
    description: "Leverage Saathi, our intelligent voice agent, to find properties matching your exact criteria instantly.",
    gradient: "from-primary to-primary-light"
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Lightning Fast Closings",
    description: "Streamlined processes and digital workflows ensure you close deals faster than ever before.",
    gradient: "from-accent-teal to-accent-teal-light"
  },
  {
    icon: <Globe className="w-8 h-8" />,
    title: "Global Network",
    description: "Access exclusive international properties and cross-border investment opportunities through our partners.",
    gradient: "from-primary-dark to-accent-teal-dark"
  },
  {
    icon: <Home className="w-8 h-8" />,
    title: "End-to-End Service",
    description: "From search to settlement, we handle everything — legal, financial, and administrative — seamlessly.",
    gradient: "from-accent-teal-dark to-primary-dark"
  }
];

const Features = () => {
  return (
    <section className="section-padding bg-gray-50" id="services">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold tracking-wider uppercase"
          >
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            Our Commitment
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold mt-4 mb-6 leading-tight"
          >
            More Than Real Estate, <br />
            <span className="bg-gradient-to-r from-accent-teal to-accent-teal-dark bg-clip-text text-transparent">
              We Build Futures
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-text-muted text-lg leading-relaxed"
          >
            We don't just sell properties; we cultivate lifestyles and create wealth through strategic property investments and personalized service.
          </motion.p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              className="group glass-card p-8 hover:-translate-y-2 transition-all duration-500"
            >
              <div className={`mb-6 w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br ${feature.gradient} shadow-lg shadow-primary/20 group-hover:scale-110 group-hover:shadow-xl transition-all duration-500`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-text-muted leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;