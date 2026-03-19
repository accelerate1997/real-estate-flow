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

// New Redesign Components
import Features from './components/Features';
import Neighborhoods from './components/Neighborhoods';
import Newsletter from './components/Newsletter';
import Testimonials from './components/Testimonials';
import Team from './components/Team';
import PropertyCard from './components/PropertyCard';
import Partners from './components/Partners';
import Footer from './components/Footer';

// Layout wrapper to conditionally render Header/Footer
const Layout = ({ children }) => {
  const location = useLocation();
  const isAuthPage = ['/login', '/register', '/agency-dashboard', '/invite'].includes(location.pathname);

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
          </Routes>
        </Layout>
      </div>
    </Router>
  );
}

export default App;
