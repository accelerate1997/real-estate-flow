import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import FloatingSearch from './components/FloatingSearch';
import PropertyGrid from './components/PropertyGrid';
import TopBar from './components/TopBar';
import ResidentialProperties from './components/ResidentialProperties';
import CommercialProperties from './components/CommercialProperties';
import UnderDevelopment from './components/UnderDevelopment';
import Register from './components/Register';
import Login from './components/Login';
import AgencyDashboard from './components/AgencyDashboard';
import AgentInviteRegister from './components/AgentInviteRegister';
import PropertyDetails from './components/PropertyDetails';

// Layout wrapper to conditionally render Header/Footer
const Layout = ({ children }) => {
  const location = useLocation();
  const isAuthPage = ['/login', '/register', '/agency-dashboard', '/invite'].includes(location.pathname);

  return (
    <>
      {!isAuthPage && <TopBar />}
      {!isAuthPage && <Header />}
      <main>
        {children}
      </main>
      {!isAuthPage && (
        <footer className="bg-white border-t border-gray-100 py-12 mt-12">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-6">
            <div>
              <span className="text-xl font-bold text-primary">RR Estate</span>
              <p className="text-gray-500 text-sm mt-2">© 2026 RR Estate. All rights reserved.</p>
            </div>
            <div className="flex gap-8 text-gray-500 text-sm">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors">Contact</a>
            </div>
          </div>
        </footer>
      )}
    </>
  );
};

// Home Page Component
const Home = () => (
  <>
    <Hero />
    <FloatingSearch />
    <PropertyGrid />
  </>
);

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans text-text">
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
