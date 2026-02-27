import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { pb } from '../services/pocketbase';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const validate = () => {
        let newErrors = {};
        if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Valid Email is required';
        if (!formData.password) newErrors.password = 'Password is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);

        try {
            // Using PocketBase for Authentication
            const authData = await pb.collection('users').authWithPassword(
                formData.email,
                formData.password,
            );

            // Check if user is explicitly marked inactive
            if (authData?.record?.isActive === false) {
                pb.authStore.clear(); // Destroy the session immediately
                setErrors({ email: 'Your account has been deactivated. Please contact your agency owner.' });
                return;
            }

            if (authData?.token) {
                // PocketBase automatically stores auth in localStorage (pb_auth)
                // We'll also set standard ones if needed, or rely strictly on pb.authStore
                // localStorage.setItem('token', authData.token);
                // localStorage.setItem('user', JSON.stringify(authData.record));
                navigate('/agency-dashboard');
            }
        } catch (error) {
            console.error('Login error:', error);
            setErrors({ email: error?.message || 'Login failed. Please check your credentials.' });
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
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    return (
        <div className="min-h-screen flex bg-white font-sans">
            {/* Left Side: Image */}
            <div className="hidden lg:block lg:w-1/2 relative">
                <img
                    src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2669&auto=format&fit=crop"
                    alt="Modern Office"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="text-white text-center px-12">
                        <h2 className="text-4xl font-bold mb-6">Welcome Back</h2>
                        <p className="text-xl font-light">Access your agency dashboard and analytics.</p>
                    </div>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-sm"
                >
                    <div className="mb-10 text-center lg:text-left">
                        <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2">Sign In</h1>
                        <p className="text-gray-500">Welcome back! Please enter your details.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 rounded-lg border ${errors.email ? 'border-primary' : 'border-gray-200'} focus:outline-none focus:border-primary transition-colors`}
                                placeholder="name@company.com"
                            />
                            {errors.email && <p className="text-primary text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.email}</p>}
                        </div>

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

                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="rememberMe"
                                    checked={formData.rememberMe}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                />
                                <label className="text-gray-600">Remember Me</label>
                            </div>
                            <a href="#" className="text-primary font-medium hover:underline">Forgot Password?</a>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary text-white font-bold py-3.5 rounded-lg shadow-lg hover:bg-red-800 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-gray-500">
                        Don't have an agency account? <Link to="/register" className="text-primary font-bold hover:underline">Sign Up</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
