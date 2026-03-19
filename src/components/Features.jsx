import React from 'react';
import { Target, Users, Shield, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: <Target className="w-8 h-8 text-primary" />,
    title: "Expert Guidance",
    description: "Our seasoned experts lead you through every step of your real estate journey."
  },
  {
    icon: <Users className="w-8 h-8 text-accent-teal" />,
    title: "Client-Centric",
    description: "Your goals are our priority. We tailor our services to meet your unique needs."
  },
  {
    icon: <Shield className="w-8 h-8 text-primary" />,
    title: "Secure Transactions",
    description: "Experience peace of mind with our transparent and secure handling of all deals."
  },
  {
    icon: <TrendingUp className="w-8 h-8 text-accent-teal" />,
    title: "Market Insights",
    description: "Stay ahead with our deep analysis and exclusive insights into emerging markets."
  }
];

const Features = () => {
  return (
    <section className="section-padding bg-gray-50">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-primary font-semibold tracking-wider uppercase text-sm"
          >
            Our Mission
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mt-4 mb-6 leading-tight"
          >
            More Than Real Estate, <br />
            <span className="text-accent-teal">We Build Futures</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-text-muted text-lg"
          >
            We don't just sell properties; we cultivate lifestyles and create wealth through strategic property investments and personalized service.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-panel p-8 rounded-2xl hover:translate-y-[-8px] transition-all duration-300"
            >
              <div className="mb-6 bg-white w-16 h-16 rounded-xl shadow-premium flex items-center justify-center">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
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
