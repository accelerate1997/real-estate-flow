import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle } from 'lucide-react';

const LeadModal = ({ isOpen, onClose, property }) => {
    const [submitted, setSubmitted] = React.useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Simulate API call
        setTimeout(() => {
            setSubmitted(true);
            setTimeout(() => {
                setSubmitted(false);
                onClose();
            }, 2000);
        }, 1000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-primary px-6 py-4 flex justify-between items-center">
                            <h3 className="text-white font-semibold text-lg">
                                {submitted ? 'Success!' : 'Interested in this property?'}
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 md:p-8">
                            {submitted ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                        <CheckCircle className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-800 mb-2">Request Sent!</h4>
                                    <p className="text-gray-600">Our agent will contact you shortly.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <p className="text-gray-500 text-sm mb-4">
                                        Fill out the form below to get the best price and details for <span className="font-semibold text-text">{property?.title}</span>.
                                    </p>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all hover:border-gray-400"
                                            placeholder="John Doe"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                                        <input
                                            type="tel"
                                            required
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all hover:border-gray-400"
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all hover:border-gray-400"
                                            placeholder="john@example.com"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-all shadow-lg hover:shadow-primary/30 mt-4"
                                    >
                                        View Price & Schedule Visit
                                    </button>

                                    <p className="text-xs text-center text-gray-400 mt-4">
                                        By submitting, you agree to our Terms of Service.
                                    </p>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default LeadModal;
