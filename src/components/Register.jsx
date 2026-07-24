import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { pb } from '../services/pocketbase';
import { auth } from '../services/firebase';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

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

    const validate = (isGoogle = false) => {
        let newErrors = {};
        if (!formData.agencyName) newErrors.agencyName = 'Agency Name is required';
        if (!formData.fullName) newErrors.fullName = 'Full Name is required';
        if (!isGoogle) {
            if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Valid Email is required';
            if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
            if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        }
        if (!formData.phone || formData.phone.length < 10) newErrors.phone = 'Valid Phone Number is required';
        if (!formData.terms) newErrors.terms = 'You must agree to the Terms & Privacy';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate(false)) return;

        setIsLoading(true);

        try {
            // Create user in Firebase first
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const uid = userCredential.user.uid;

            // Register with PostgreSQL
            const datatoSend = {
                id: uid,
                email: formData.email,
                password_hash: 'firebase_auth',
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
                if (authData?.token) {
                    localStorage.setItem('token', authData.token);
                    if (authData?.record) {
                        localStorage.setItem('user', JSON.stringify(authData.record));
                    }
                }
                navigate('/agency-dashboard');
            }
        } catch (error) {
            console.error('Registration error:', error);
            const pbError = error?.response?.data;
            let errorMessage = 'Registration failed. Please check your network and try again.';

            if (error?.code === 'auth/email-already-in-use' || error?.message?.includes('email-already-in-use')) {
                errorMessage = 'This email address is already registered. Please Sign In to your existing account or use a different email.';
            } else if (pbError && pbError.email) {
                if (pbError.email.code === 'validation_not_unique') {
                    errorMessage = 'This email is already in use by another agency or agent.';
                } else {
                    errorMessage = pbError.email.message;
                }
            } else if (error?.message) {
                errorMessage = error.message.replace('Firebase: ', '');
            }

            setErrors({ email: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleRegister = async () => {
        if (!validate(true)) return;

        setIsLoading(true);
        setErrors({});

        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            
            const userCredential = await signInWithPopup(auth, provider);
            const firebaseUser = userCredential.user;
            const uid = firebaseUser.uid;
            const email = firebaseUser.email;
            const name = formData.fullName || firebaseUser.displayName;

            // Register with PostgreSQL
            const datatoSend = {
                id: uid,
                email: email,
                password_hash: 'firebase_auth',
                name: name,
                agencyName: formData.agencyName,
                phone: formData.phone,
                role: 'owner',
                metadata: { terms_accepted: formData.terms }
            };

            const record = await pb.collection('users').create(datatoSend);

            if (record) {
                // Single Firebase token sync (prevents 2nd popup)
                const firebaseToken = await firebaseUser.getIdToken(true);
                const pbUrl = pb.baseUrl || window.location.origin;
                const syncRes = await fetch(`${pbUrl}/api/auth/sync`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${firebaseToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (syncRes.ok) {
                    const syncData = await syncRes.json();
                    if (syncData?.token) {
                        pb.authStore.save(syncData.token, syncData.record);
                        localStorage.setItem('token', syncData.token);
                        if (syncData.record) {
                            localStorage.setItem('user', JSON.stringify(syncData.record));
                        }
                    }
                }
                navigate('/agency-dashboard');
            }
        } catch (error) {
            console.error('Google registration error:', error);
            let errorMessage = 'Google registration failed. Please try again.';
            if (error?.message) {
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

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-gray-200"></div>
                            <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase tracking-wider">or continue with</span>
                            <div className="flex-grow border-t border-gray-200"></div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleRegister}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-semibold py-3 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                    fill="#EA4335"
                                />
                            </svg>
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-gray-500" /> : 'Google'}
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
