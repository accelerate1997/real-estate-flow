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
import PlotsLandProperties from './components/PlotsLandProperties';

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

    const setupGlobalTracking = () => {
      try {
        const config = window.agencyConfig;
        if (config?.metadata?.googleTagId || config?.metadata?.metaPixelId) {
          initializeTracking(config.googleTagId || config.metadata.googleTagId, config.metaPixelId || config.metadata.metaPixelId);
          trackPageView(location.pathname);
        }
      } catch (err) {
        console.log("Failed to load global tracking settings.");
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
  const [isConfigLoaded, setIsConfigLoaded] = React.useState(false);

  React.useEffect(() => {
    const initShowcase = async () => {
      try {
        const parts = window.location.hostname.split('.');
        let subdomain = '';
        if (parts.length > 2) {
          subdomain = parts[0];
        }
        const queryParams = new URLSearchParams(window.location.search);
        const querySub = queryParams.get('subdomain');
        if (querySub) {
          subdomain = querySub;
        }

        const pbUrl = pb.baseUrl || window.location.origin;
        const res = await fetch(`${pbUrl}/api/public/showcase-config?host=${window.location.hostname}&subdomain=${subdomain}`);
        if (res.ok) {
          const data = await res.json();
          if (data.agency) {
            const agency = data.agency;
            window.agencyId = agency.id;
            window.agencyConfig = agency;

            const primary = agency.primaryColor || '#DC2626';
            const secondary = agency.secondaryColor || '#1E293B';

            const hexToRgbStr = (hex) => {
              try {
                let R = parseInt(hex.substring(1, 3), 16);
                let G = parseInt(hex.substring(3, 5), 16);
                let B = parseInt(hex.substring(5, 7), 16);
                if (isNaN(R) || isNaN(G) || isNaN(B)) return null;
                return `${R}, ${G}, ${B}`;
              } catch (e) {
                return null;
              }
            };

            const adjustColorBrightness = (hex, percent) => {
              try {
                let R = parseInt(hex.substring(1, 3), 16);
                let G = parseInt(hex.substring(3, 5), 16);
                let B = parseInt(hex.substring(5, 7), 16);

                R = parseInt(R * (100 + percent) / 100);
                G = parseInt(G * (100 + percent) / 100);
                B = parseInt(B * (100 + percent) / 100);

                R = (R < 255) ? R : 255;
                G = (G < 255) ? G : 255;
                B = (B < 255) ? B : 255;

                R = (R > 0) ? R : 0;
                G = (G > 0) ? G : 0;
                B = (B > 0) ? B : 0;

                const rHex = R.toString(16).padStart(2, '0');
                const gHex = G.toString(16).padStart(2, '0');
                const bHex = B.toString(16).padStart(2, '0');

                return `#${rHex}${gHex}${bHex}`;
              } catch (e) {
                return hex;
              }
            };

            const primaryRgb = hexToRgbStr(primary) || '204, 0, 0';
            const primaryDarkRgb = hexToRgbStr(adjustColorBrightness(primary, -20)) || '153, 0, 0';
            const primaryLightRgb = hexToRgbStr(adjustColorBrightness(primary, 20)) || '255, 51, 51';

            const secondaryRgb = hexToRgbStr(secondary) || '0, 128, 128';
            const secondaryDarkRgb = hexToRgbStr(adjustColorBrightness(secondary, -20)) || '0, 102, 102';
            const secondaryLightRgb = hexToRgbStr(adjustColorBrightness(secondary, 20)) || '51, 153, 153';

            document.documentElement.style.setProperty('--color-primary', primaryRgb);
            document.documentElement.style.setProperty('--color-primary-dark', primaryDarkRgb);
            document.documentElement.style.setProperty('--color-primary-light', primaryLightRgb);
            document.documentElement.style.setProperty('--color-secondary', secondaryRgb);
            document.documentElement.style.setProperty('--color-secondary-dark', secondaryDarkRgb);
            document.documentElement.style.setProperty('--color-secondary-light', secondaryLightRgb);

            if (agency.templateId) {
              document.documentElement.className = '';
              document.documentElement.classList.add(`template-${agency.templateId}`);
            }

            if (agency.agencyName) {
              document.title = `${agency.agencyName} - Showcase Portal`;
            }
          }
        }
      } catch (err) {
        console.error("Failed to load showcase config:", err);
      } finally {
        setIsConfigLoaded(true);
      }
    };
    initShowcase();
  }, []);

  if (!isConfigLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-white font-sans text-text">
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/properties/residential" element={<ResidentialProperties />} />
            <Route path="/properties/commercial" element={<CommercialProperties />} />
            <Route path="/properties/plots-land" element={<PlotsLandProperties />} />
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
