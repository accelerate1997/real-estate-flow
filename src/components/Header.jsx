import React, { useState } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

const Header = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [mobileExpanded, setMobileExpanded] = useState(null);

    const navLinks = [
        { name: 'Home', href: '/' },
        {
            name: 'Properties',
            href: '#',
            submenu: [
                { name: 'Residential Property', href: '/properties/residential' },
                { name: 'Commercial Property', href: '/properties/commercial' },
                { name: 'Under Development Properties', href: '/properties/under-development' }
            ]
        },
        { name: 'About', href: '#' },
    ];

    const handleMouseEnter = (index) => {
        setActiveDropdown(index);
    };

    const handleMouseLeave = () => {
        setActiveDropdown(null);
    };

    const toggleMobileSubmenu = (index) => {
        setMobileExpanded(mobileExpanded === index ? null : index);
    };

    return (
        <header className="fixed w-full top-0 md:top-10 z-50 glass-panel border-b border-gray-100 transition-all duration-300 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-red-800 bg-clip-text text-transparent cursor-pointer">
                            RR Estate
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex space-x-8 items-center">
                        {navLinks.map((link, index) => (
                            <div
                                key={link.name}
                                className="relative group"
                                onMouseEnter={() => handleMouseEnter(index)}
                                onMouseLeave={handleMouseLeave}
                            >
                                {link.submenu ? (
                                    <button
                                        className="flex items-center gap-1 text-[#1A1A1A] hover:text-primary font-medium transition-colors py-2 focus:outline-none"
                                    >
                                        {link.name}
                                        <ChevronDown className={clsx(
                                            "w-4 h-4 transition-transform duration-200",
                                            activeDropdown === index ? "rotate-180" : ""
                                        )} />
                                    </button>
                                ) : (
                                    <Link
                                        to={link.href}
                                        className="flex items-center gap-1 text-[#1A1A1A] hover:text-primary font-medium transition-colors py-2"
                                    >
                                        {link.name}
                                    </Link>
                                )}

                                {/* Desktop Dropdown */}
                                <AnimatePresence>
                                    {link.submenu && activeDropdown === index && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute left-0 pt-2 w-64 z-50"
                                        >
                                            <div className="bg-white rounded-xl shadow-premium border border-gray-100 overflow-hidden py-2">
                                                {link.submenu.map((subItem) => (
                                                    <Link
                                                        key={subItem.name}
                                                        to={subItem.href}
                                                        className="block px-4 py-3 text-sm text-[#1A1A1A] hover:text-primary hover:bg-gray-50 transition-colors"
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
                        <Link to="/login" className="bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-all shadow-lg shadow-primary/30 transform hover:-translate-y-0.5">
                            Post Property
                        </Link>
                    </nav>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-[#1A1A1A] hover:text-primary focus:outline-none"
                        >
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
                    >
                        <div className="px-4 pt-2 pb-6 space-y-1">
                            {navLinks.map((link, index) => (
                                <div key={link.name}>
                                    {link.submenu ? (
                                        <>
                                            <button
                                                onClick={() => toggleMobileSubmenu(index)}
                                                className="w-full flex justify-between items-center px-3 py-3 text-base font-medium text-[#1A1A1A] hover:text-primary hover:bg-gray-50 rounded-md"
                                            >
                                                {link.name}
                                                <ChevronDown className={clsx(
                                                    "w-5 h-5 transition-transform duration-200",
                                                    mobileExpanded === index ? "rotate-180" : ""
                                                )} />
                                            </button>
                                            <AnimatePresence>
                                                {mobileExpanded === index && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden bg-gray-50 rounded-md"
                                                    >
                                                        {link.submenu.map((subItem) => (
                                                            <Link
                                                                key={subItem.name}
                                                                to={subItem.href}
                                                                onClick={() => setIsOpen(false)}
                                                                className="block pl-8 pr-3 py-3 text-sm font-medium text-gray-600 hover:text-primary"
                                                            >
                                                                {subItem.name}
                                                            </Link>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </>
                                    ) : (
                                        <Link
                                            to={link.href}
                                            onClick={() => setIsOpen(false)}
                                            className="block px-3 py-3 text-base font-medium text-[#1A1A1A] hover:text-primary hover:bg-gray-50 rounded-md"
                                        >
                                            {link.name}
                                        </Link>
                                    )}
                                </div>
                            ))}
                            <Link to="/login" onClick={() => setIsOpen(false)} className="block text-center w-full mt-4 bg-primary text-white px-6 py-3 rounded-lg font-medium shadow-md">
                                Post Property
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Header;
