import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calculator, DollarSign, Calendar, Percent, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MortgageCalculator = () => {
    const navigate = useNavigate();
    const [loanAmount, setLoanAmount] = useState(5000000); // 50 Lakhs default
    const [interestRate, setInterestRate] = useState(8.5); // 8.5% default
    const [loanTenure, setLoanTenure] = useState(20); // 20 years default

    const [emi, setEmi] = useState(0);
    const [totalInterest, setTotalInterest] = useState(0);
    const [totalPayment, setTotalPayment] = useState(0);

    useEffect(() => {
        const principal = parseFloat(loanAmount);
        const calculatedInterest = parseFloat(interestRate) / 12 / 100;
        const calculatedPayments = parseFloat(loanTenure) * 12;

        // Formula: [P x R x (1+R)^N]/[(1+R)^N-1]
        const x = Math.pow(1 + calculatedInterest, calculatedPayments);
        const monthly = (principal * x * calculatedInterest) / (x - 1);

        if (isFinite(monthly)) {
            setEmi(monthly);
            const totalPay = monthly * calculatedPayments;
            setTotalPayment(totalPay);
            setTotalInterest(totalPay - principal);
        } else {
            setEmi(0);
            setTotalPayment(0);
            setTotalInterest(0);
        }
    }, [loanAmount, interestRate, loanTenure]);

    const formatCurrency = (amount) => {
        if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
        return `₹${Math.round(amount).toLocaleString('en-IN')}`;
    };

    const templateId = window.agencyConfig?.templateId || 'classic';
    const isModern = templateId === 'modern';
    const isMinimal = templateId === 'minimal';

    return (
        <div className={`min-h-screen pt-32 pb-20 transition-colors duration-300 ${
            isModern ? 'bg-[#080610] text-white' : isMinimal ? 'bg-[#FAF9F6] text-gray-900 font-serif' : 'bg-gray-50 text-gray-900 font-sans'
        }`}>
            <div className="max-w-4xl mx-auto px-6 lg:px-8">
                
                {/* Back Link */}
                <button
                    onClick={() => navigate(-1)}
                    className={`group flex items-center gap-2 mb-8 font-semibold text-sm ${
                        isModern ? 'text-white/60 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back
                </button>

                {/* Header */}
                <div className="mb-12">
                    <h1 className={`text-3xl md:text-5xl font-bold mb-3 ${
                        isModern ? 'text-white' : isMinimal ? 'text-gray-900 font-serif font-normal' : 'text-[#1A1A1A]'
                    }`}>
                        Mortgage &amp; EMI Calculator
                    </h1>
                    <p className={isModern ? 'text-white/50' : 'text-gray-500'}>
                        Estimate your monthly home loan installments easily with instant interest breakdowns.
                    </p>
                </div>

                {/* Calculator Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                    
                    {/* Left: Input Form */}
                    <div className={`p-8 border ${
                        isModern 
                            ? 'bg-white/4 border-white/8 rounded-2xl shadow-xl' 
                            : isMinimal 
                                ? 'bg-white border-gray-300 rounded-none shadow-none' 
                                : 'bg-white border-gray-100 rounded-3xl shadow-premium'
                    }`}>
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-primary" />
                            Loan Details
                        </h2>

                        <div className="space-y-6">
                            {/* Loan Amount */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Loan Amount</label>
                                    <span className="text-sm font-bold text-primary">{formatCurrency(loanAmount)}</span>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <input
                                        type="range"
                                        min="500000"
                                        max="100000000"
                                        step="50000"
                                        value={loanAmount}
                                        onChange={e => setLoanAmount(Number(e.target.value))}
                                        className="flex-1 accent-primary"
                                    />
                                    <input
                                        type="number"
                                        value={loanAmount}
                                        onChange={e => setLoanAmount(Number(e.target.value))}
                                        className={`w-32 px-3 py-2 border text-sm text-center focus:outline-none focus:border-primary ${
                                            isModern ? 'bg-white/5 border-white/10 text-white rounded-xl' : isMinimal ? 'bg-white border-gray-300 rounded-none' : 'bg-gray-50 border-gray-100 rounded-xl'
                                        }`}
                                    />
                                </div>
                            </div>

                            {/* Interest Rate */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Interest Rate (p.a.)</label>
                                    <span className="text-sm font-bold text-primary">{interestRate}%</span>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <input
                                        type="range"
                                        min="5"
                                        max="20"
                                        step="0.1"
                                        value={interestRate}
                                        onChange={e => setInterestRate(Number(e.target.value))}
                                        className="flex-1 accent-primary"
                                    />
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={interestRate}
                                        onChange={e => setInterestRate(Number(e.target.value))}
                                        className={`w-32 px-3 py-2 border text-sm text-center focus:outline-none focus:border-primary ${
                                            isModern ? 'bg-white/5 border-white/10 text-white rounded-xl' : isMinimal ? 'bg-white border-gray-300 rounded-none' : 'bg-gray-50 border-gray-100 rounded-xl'
                                        }`}
                                    />
                                </div>
                            </div>

                            {/* Tenure */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tenure (Years)</label>
                                    <span className="text-sm font-bold text-primary">{loanTenure} Yrs</span>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <input
                                        type="range"
                                        min="1"
                                        max="30"
                                        step="1"
                                        value={loanTenure}
                                        onChange={e => setLoanTenure(Number(e.target.value))}
                                        className="flex-1 accent-primary"
                                    />
                                    <input
                                        type="number"
                                        value={loanTenure}
                                        onChange={e => setLoanTenure(Number(e.target.value))}
                                        className={`w-32 px-3 py-2 border text-sm text-center focus:outline-none focus:border-primary ${
                                            isModern ? 'bg-white/5 border-white/10 text-white rounded-xl' : isMinimal ? 'bg-white border-gray-300 rounded-none' : 'bg-gray-50 border-gray-100 rounded-xl'
                                        }`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Results Breakdown */}
                    <div className={`p-8 border flex flex-col justify-between ${
                        isModern 
                            ? 'bg-white/4 border-white/8 rounded-2xl shadow-xl' 
                            : isMinimal 
                                ? 'bg-white border-gray-300 rounded-none shadow-none' 
                                : 'bg-white border-gray-100 rounded-3xl shadow-premium'
                    }`}>
                        <div>
                            <h2 className="text-xl font-bold mb-6">Payment Summary</h2>

                            <div className="space-y-6">
                                <div>
                                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-widest block mb-1">Monthly Loan EMI</span>
                                    <span className="text-4xl font-black text-primary tracking-tight">
                                        ₹{Math.round(emi).toLocaleString('en-IN')}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-150">
                                    <div>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Principal Amount</span>
                                        <span className={`text-base font-extrabold ${isModern ? 'text-white' : 'text-dark'}`}>{formatCurrency(loanAmount)}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Total Interest</span>
                                        <span className={`text-base font-extrabold ${isModern ? 'text-white' : 'text-dark'}`}>{formatCurrency(totalInterest)}</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-150">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Total Payment (Principal + Interest)</span>
                                    <span className={`text-lg font-black ${isModern ? 'text-white' : 'text-dark'}`}>{formatCurrency(totalPayment)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Visual Pie-Chart Sim */}
                        <div className="mt-8 pt-6 border-t border-gray-150">
                            <div className="flex gap-2 h-3.5 rounded-full overflow-hidden">
                                <div 
                                    className="bg-primary transition-all duration-300"
                                    style={{ width: `${(loanAmount / totalPayment) * 100}%` }}
                                    title="Principal"
                                />
                                <div 
                                    className="bg-teal-400 transition-all duration-300"
                                    style={{ width: `${(totalInterest / totalPayment) * 100}%` }}
                                    title="Interest"
                                />
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-gray-400 mt-2 font-bold uppercase">
                                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-primary rounded-full inline-block" /> Principal</span>
                                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-teal-400 rounded-full inline-block" /> Interest</span>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default MortgageCalculator;
