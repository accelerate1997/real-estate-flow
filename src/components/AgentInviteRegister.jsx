import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { pb } from '../services/pocketbase';

const AgentInviteRegister = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [inviteData, setInviteData] = useState(null);
    const [status, setStatus] = useState('verifying'); // verifying, valid, invalid, success
    const [errorMessage, setErrorMessage] = useState('');

    const [formData, setFormData] = useState({
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

    // Verify token on load
    useEffect(() => {
        if (!token) {
            setStatus('invalid');
            setErrorMessage('No invitation token provided.');
            return;
        }

        const verifyToken = async () => {
            try {
                // Find pending invite
                const records = await pb.collection('invites').getFullList({
                    filter: `token = "${token}" && status = "pending"`,
                    expand: 'agencyId',
                });

                if (records.length === 0) {
                    setStatus('invalid');
                    setErrorMessage('This invitation link is invalid or has already been used.');
                    return;
                }

                const invite = records[0];

                // Check expiration
                if (new Date(invite.expiresAt) < new Date()) {
                    setStatus('invalid');
                    setErrorMessage('This invitation link has expired.');
                    return;
                }

                setInviteData(invite);
                setStatus('valid');
            } catch (err) {
                console.error('Token verification error:', err);
                setStatus('invalid');
                setErrorMessage('An error occurred while verifying the invitation.');
            }
        };

        verifyToken();
    }, [token]);

    const validate = () => {
        let newErrors = {};
        if (!formData.fullName) newErrors.fullName = 'Full Name is required';
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Valid Email is required';
        if (!formData.phone || formData.phone.length < 10) newErrors.phone = 'Valid Phone Number is required';
        if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        if (!formData.terms) newErrors.terms = 'You must agree to the Terms & Privacy';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate() || !inviteData) return;

        setIsLoading(true);

        try {
            // 1. Register the Agent User
            const datatoSend = {
                username: formData.email.split('@')[0] + Math.floor(Math.random() * 1000),
                email: formData.email,
                emailVisibility: true,
                password: formData.password,
                passwordConfirm: formData.password,
                name: formData.fullName,
                phone: formData.phone,
                role: 'agent',
                isActive: true,
                agencyId: inviteData.agencyId, // Link to the agency
                metadata: { terms_accepted: formData.terms, joined_via_invite: inviteData.id }
            };

            const record = await pb.collection('users').create(datatoSend);

            if (record) {
                // 2. Mark invite as used
                try {
                    // Update as admin via backend or rely on relaxed permissions you set
                    await pb.collection('invites').update(inviteData.id, {
                        status: 'used'
                    });
                } catch (updateErr) {
                    console.error("Failed to mark invite as used (might require admin), continuing...", updateErr);
                }

                setStatus('success');

                // 3. Auto login after brief delay
                setTimeout(async () => {
                    await pb.collection('users').authWithPassword(formData.email, formData.password);
                    navigate('/agency-dashboard');
                }, 2000);
            }
        } catch (error) {
            console.error('Registration error:', error);
            const pbError = error?.response?.data;
            let errorMessage = 'Registration failed. Please check your network and try again.';

            if (pbError && pbError.email) {
                if (pbError.email.code === 'validation_not_unique') {
                    errorMessage = 'This email is already registered in the system.';
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
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    if (status === 'verifying') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700">Verifying Invitation...</h2>
                </div>
            </div>
        );
    }

    if (status === 'invalid') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-premium text-center border border-gray-100">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
                    <p className="text-gray-500 mb-8">{errorMessage}</p>
                    <Link to="/" className="inline-block bg-primary text-white font-medium px-6 py-3 rounded-lg hover:bg-red-800 transition-colors">
                        Return to Homepage
                    </Link>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-premium text-center border border-gray-100">
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Complete!</h2>
                    <p className="text-gray-500 mb-8">Welcome aboard. You are being redirected to your dashboard...</p>
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-gray-50 font-sans">
            <div className="w-full flex items-center justify-center p-4 sm:p-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-lg bg-white p-8 sm:p-10 rounded-2xl shadow-premium border border-gray-100"
                >
                    <div className="mb-8 text-center">
                        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Accept Agency Invitation</h1>
                        <p className="text-gray-500 text-sm">
                            You've been invited to join <span className="font-semibold text-gray-800">{inviteData?.expand?.agencyId?.name || inviteData?.expand?.agencyId?.agencyName || 'an Agency'}</span> as an Agent. Create your account below.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-lg border ${errors.fullName ? 'border-primary' : 'border-gray-200'} focus:outline-none focus:border-primary transition-colors`}
                                    placeholder="John Doe"
                                />
                                {errors.fullName && <p className="text-primary text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.fullName}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-lg border ${errors.phone ? 'border-primary' : 'border-gray-200'} focus:outline-none focus:border-primary transition-colors`}
                                    placeholder="98765 43210"
                                />
                                {errors.phone && <p className="text-primary text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.phone}</p>}
                            </div>
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
                                        placeholder="••••••••"
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
                                        placeholder="••••••••"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.confirmPassword && <p className="text-primary text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.confirmPassword}</p>}
                            </div>
                        </div>

                        <div className="flex items-start gap-2 pt-2">
                            <input
                                type="checkbox"
                                name="terms"
                                checked={formData.terms}
                                onChange={handleChange}
                                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                            <label className="text-sm text-gray-600 leading-tight">
                                I agree to join this agency and accept the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
                            </label>
                        </div>
                        {errors.terms && <p className="text-primary text-xs -mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.terms}</p>}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-4 bg-primary text-white font-bold py-3.5 rounded-lg shadow-lg hover:bg-red-800 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Join Agency as Agent'}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default AgentInviteRegister;
