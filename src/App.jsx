import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import PropertyGrid from './components/PropertyGrid';
import ResidentialProperties from './components/ResidentialProperties';
import CommercialProperties from './components/CommercialProperties';
import UnderDevelopment from './components/UnderDevelopment';
import Register from './components/Register';
import Login from './components/Login';
import AgencyDashboard from './components/AgencyDashboard';
import AgentInviteRegister from './components/AgentInviteRegister';
import PropertyDetails from './components/PropertyDetails';
import PrivacyPolicy from './components/PrivacyPolicy';

// New Redesign Components
import Features from './components/Features';
import Neighborhoods from './components/Neighborhoods';
import Newsletter from './components/Newsletter';
import Testimonials from './components/Testimonials';
import Team from './components/Team';
import PropertyCard from './components/PropertyCard';
import Partners from './components/Partners';
import Footer from './components/Footer';

import { initializeTracking, trackPageView } from './services/tracking';
import { pb } from './services/pocketbase';

// Layout wrapper to conditionally render Header/Footer
const Layout = ({ children }) => {
  const location = useLocation();
  const isAuthPage = ['/login', '/register', '/agency-dashboard', '/invite'].includes(location.pathname);

  // Initialize and track global page views on public pages
  React.useEffect(() => {
    if (isAuthPage) return;

    const setupGlobalTracking = async () => {
      try {
        // Fetch the first owner (primary agency) profile
        const owner = await pb.collection('users').getFirstListItem("role='owner'");
        if (owner?.metadata?.googleTagId || owner?.metadata?.metaPixelId) {
          initializeTracking(owner.metadata.googleTagId, owner.metadata.metaPixelId);
          trackPageView(location.pathname);
        }
      } catch (err) {
        console.log("Failed to load global tracking settings (no primary owner yet).");
      }
    };

    setupGlobalTracking();
  }, []);

  // Track page views on route changes
  React.useEffect(() => {
    if (isAuthPage) return;
    trackPageView(location.pathname);
  }, [location.pathname, isAuthPage]);

  return (
    <>
      {!isAuthPage && <Header />}
      <main>
        {children}
      </main>
      {!isAuthPage && <Footer />}
    </>
  );
};

// Home Page Component
const Home = () => (
  <>
    <Hero />
    <Partners />
    <Features />
    <div className="section-padding bg-white">
      <div className="container-custom">
        <div className="mb-12">
          <span className="text-primary font-bold tracking-widest uppercase text-sm">Featured</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-2">Latest <span className="text-accent-teal">Properties</span></h2>
        </div>
        <PropertyGrid />
      </div>
    </div>
    <Newsletter />
    <Neighborhoods />
    <Testimonials />
    <Team />
  </>
);

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white font-sans text-text">
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/properties/residential" element={<ResidentialProperties />} />
            <Route path="/properties/commercial" element={<CommercialProperties />} />
            <Route path="/properties/under-development" element={<UnderDevelopment />} />
            <Route path="/property/:id" element={<PropertyDetails />} />
            <Route path="/properties/:id" element={<PropertyDetails />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/invite" element={<AgentInviteRegister />} />
            <Route path="/agency-dashboard" element={<AgencyDashboard />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          </Routes>
        </Layout>
      </div>
    </Router>
  );
}

export default App;
