import React, { useState } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';

const Header = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [mobileExpanded, setMobileExpanded] = useState(null);
    const pathname = useLocation().pathname;

    React.useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Home', href: '/' },
        {
            name: 'Properties',
            href: '#',
            submenu: [
                { name: 'Residential Property', href: '/properties/residential' },
                { name: 'Commercial Property', href: '/properties/commercial' },
                { name: 'Under Development', href: '/properties/under-development' }
            ]
        },
        { name: 'About Us', href: '/' },
        { name: 'Contact', href: '/' },
    ];

    const isHomePage = pathname === '/';
    const forceGlassy = !isHomePage || scrolled;

    return (
        <header className={clsx(
            "fixed left-1/2 -translate-x-1/2 top-0 md:top-6 z-50 transition-all duration-500 w-full container-custom px-4 sm:px-6 lg:px-8",
            scrolled ? "md:translate-y-[-10px]" : "md:translate-y-0"
        )}>
            <div className={clsx(
                "rounded-2xl transition-all duration-300 px-6 py-4 flex justify-between items-center",
                forceGlassy ? "glass-panel bg-white/90 shadow-premium text-dark" : "bg-transparent text-white"
            )}>
                {/* Logo Area */}
                <div className="flex-1 flex justify-start">
                    <Link to="/" className="text-3xl font-black italic tracking-tighter">
                        <span className={clsx(
                            forceGlassy ? "text-primary" : "text-white"
                        )}>RR</span>
                        <span className={clsx(
                        forceGlassy ? "text-dark" : "text-white/80"
                        )}> Estate</span>
                    </Link>
                </div>

                {/* Center Navigation */}
                <nav className="hidden md:flex flex-1 justify-center space-x-8 items-center">
                    {navLinks.map((link, index) => (
                        <div
                            key={link.name}
                            className="relative group"
                            onMouseEnter={() => setActiveDropdown(index)}
                            onMouseLeave={() => setActiveDropdown(null)}
                        >
                            {link.submenu ? (
                                <button className={clsx(
                                    "flex items-center gap-1 font-bold text-sm tracking-wide transition-all py-2 focus:outline-none",
                                    forceGlassy ? "text-dark hover:text-primary" : "text-white hover:text-primary-light"
                                )}>
                                    {link.name}
                                    <ChevronDown className={clsx(
                                        "w-4 h-4 transition-transform duration-300",
                                        activeDropdown === index ? "rotate-180" : ""
                                    )} />
                                </button>
                            ) : (
                                <Link
                                    to={link.href}
                                    className={clsx(
                                        "font-bold text-sm tracking-wide transition-all py-2",
                                        forceGlassy ? "text-dark hover:text-primary" : "text-white hover:text-primary-light"
                                    )}
                                >
                                    {link.name}
                                </Link>
                            )}

                            {/* Dropdown */}
                            <AnimatePresence>
                                {link.submenu && activeDropdown === index && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95, x: "-50%" }}
                                        animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95, x: "-50%" }}
                                        className="absolute left-1/2 pt-4 w-60 z-50"
                                    >
                                        <div className="bg-white rounded-2xl shadow-premium border border-gray-50 overflow-hidden py-3">
                                            {link.submenu.map((subItem) => (
                                                <Link
                                                    key={subItem.name}
                                                    to={subItem.href}
                                                    className="block px-6 py-3 text-sm font-bold text-dark hover:text-primary hover:bg-gray-50 transition-colors"
                                                >
                                                    {subItem.name}
                                                </Link>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </nav>

                {/* Right Area (CTA & Mobile Toggle) */}
                <div className="flex-1 flex justify-end items-center gap-4">
                    <Link to="/login" className="hidden md:flex bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-bold text-xs lg:text-sm transition-all shadow-lg shadow-primary/20 whitespace-nowrap">
                        Post Property
                    </Link>

                    {/* Mobile Menu Toggle */}
                    <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-inherit">
                        {isOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
                    </button>
                </div>
            </div>

            {/* Mobile Nav */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden mt-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
                    >
                        <div className="px-6 py-6 space-y-2">
                            {navLinks.map((link, index) => (
                                <div key={link.name}>
                                    {link.submenu ? (
                                        <>
                                            <button onClick={() => setMobileExpanded(mobileExpanded === index ? null : index)} className="w-full flex justify-between items-center py-4 text-dark font-bold">
                                                {link.name}
                                                <ChevronDown className={clsx("w-5 h-5", mobileExpanded === index ? "rotate-180" : "")} />
                                            </button>
                                            {mobileExpanded === index && (
                                                <div className="bg-gray-50 rounded-xl px-4 pb-2">
                                                    {link.submenu.map(sub => (
                                                        <Link key={sub.name} to={sub.href} onClick={() => setIsOpen(false)} className="block py-3 text-dark/70 font-medium">{sub.name}</Link>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <Link to={link.href} onClick={() => setIsOpen(false)} className="block py-4 text-dark font-bold">{link.name}</Link>
                                    )}
                                </div>
                            ))}
                            <Link to="/login" onClick={() => setIsOpen(false)} className="block text-center bg-primary text-white py-4 rounded-xl font-bold mt-6">Post Property</Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Header;
