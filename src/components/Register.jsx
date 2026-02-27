import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { pb } from '../services/pocketbase';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        agencyName: '',
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        terms: false
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const validate = () => {
        let newErrors = {};
        if (!formData.agencyName) newErrors.agencyName = 'Agency Name is required';
        if (!formData.fullName) newErrors.fullName = 'Full Name is required';
        if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Valid Email is required';
        if (!formData.phone || formData.phone.length < 10) newErrors.phone = 'Valid Phone Number is required';
        if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        if (!formData.terms) newErrors.terms = 'You must agree to the Terms & Privacy';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);

        try {
            // Register with PocketBase
            const datatoSend = {
                username: formData.email.split('@')[0] + Math.floor(Math.random() * 1000),
                email: formData.email,
                emailVisibility: true,
                password: formData.password,
                passwordConfirm: formData.password,
                name: formData.fullName,
                agencyName: formData.agencyName,
                phone: formData.phone,
                role: 'owner',
                metadata: { terms_accepted: formData.terms }
            };

            const record = await pb.collection('users').create(datatoSend);

            if (record) {
                // Auto login after registration
                const authData = await pb.collection('users').authWithPassword(
                    formData.email,
                    formData.password
                );
                navigate('/agency-dashboard');
            }
        } catch (error) {
            console.error('Registration error:', error);
            const pbError = error?.response?.data;
            let errorMessage = 'Registration failed. Please check your network and try again.';

            if (pbError && pbError.email) {
                if (pbError.email.code === 'validation_not_unique') {
                    errorMessage = 'This email is already in use by another agency or agent.';
                } else {
                    errorMessage = pbError.email.message;
                }
            } else if (error?.message) {
                errorMessage = error.message;
            }

            setErrors({ email: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    return (
        <div className="min-h-screen flex bg-white font-sans">
            {/* Left Side: Image */}
            <div className="hidden lg:block lg:w-1/2 relative">
                <img
                    src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2700&auto=format&fit=crop"
                    alt="Modern Architecture"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="text-white text-center px-12">
                        <h2 className="text-4xl font-bold mb-6">Build Your Digital Legacy</h2>
                        <p className="text-xl font-light">Join the platform redefining real estate management.</p>
                    </div>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    <div className="mb-10">
                        <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2">Create Your Agency Account</h1>
                        <p className="text-gray-500">Manage your team, properties, and leads with RR Estate.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Agency Name</label>
                            <input
                                type="text"
                                name="agencyName"
                                value={formData.agencyName}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 rounded-lg border ${errors.agencyName ? 'border-primary' : 'border-gray-200'} focus:outline-none focus:border-primary transition-colors`}
                                placeholder="e.g. Eleveto Real Estate"
                            />
                            {errors.agencyName && <p className="text-primary text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.agencyName}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 rounded-lg border ${errors.fullName ? 'border-primary' : 'border-gray-200'} focus:outline-none focus:border-primary transition-colors`}
                                placeholder="Agency Owner Name"
                            />
                            {errors.fullName && <p className="text-primary text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.fullName}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 rounded-lg border ${errors.email ? 'border-primary' : 'border-gray-200'} focus:outline-none focus:border-primary transition-colors`}
                                placeholder="name@example.com"
                            />
                            {errors.email && <p className="text-primary text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                            <div className="flex">
                                <select className="bg-gray-50 border border-gray-200 text-gray-600 rounded-l-lg px-3 focus:outline-none focus:border-primary">
                                    <option>+91</option>
                                    <option>+1</option>
                                    <option>+44</option>
                                </select>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-r-lg border ${errors.phone ? 'border-primary' : 'border-l-0 border-gray-200'} focus:outline-none focus:border-primary transition-colors`}
                                    placeholder="98765 43210"
                                />
                            </div>
                            {errors.phone && <p className="text-primary text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.phone}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 rounded-lg border ${errors.password ? 'border-primary' : 'border-gray-200'} focus:outline-none focus:border-primary transition-colors`}
                                        placeholder="••••••"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-primary text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.password}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 rounded-lg border ${errors.confirmPassword ? 'border-primary' : 'border-gray-200'} focus:outline-none focus:border-primary transition-colors`}
                                        placeholder="••••••"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.confirmPassword && <p className="text-primary text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.confirmPassword}</p>}
                            </div>
                        </div>

                        <div className="flex items-start gap-2">
                            <input
                                type="checkbox"
                                name="terms"
                                checked={formData.terms}
                                onChange={handleChange}
                                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                            <label className="text-sm text-gray-600">
                                I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
                            </label>
                        </div>
                        {errors.terms && <p className="text-primary text-xs -mt-3 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.terms}</p>}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary text-white font-bold py-3.5 rounded-lg shadow-lg hover:bg-red-800 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Agency Account'}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-gray-500">
                        Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Sign In</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default Register;
