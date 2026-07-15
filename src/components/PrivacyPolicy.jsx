import React from 'react';

const PrivacyPolicy = () => {
    return (
        <div className="bg-gray-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-150 p-8 sm:p-12">
                <div className="border-b border-gray-200 pb-6 mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        Privacy Policy
                    </h1>
                    <p className="text-sm text-gray-500 mt-2">
                        Last Updated: July 15, 2026
                    </p>
                </div>

                <div className="space-y-6 text-sm text-gray-700 leading-relaxed font-sans">
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">1. Introduction</h2>
                        <p>
                            Welcome to Rajesh Realty. We respect your privacy and are committed to protecting your personal data. This Privacy Policy describes how we collect, use, process, and share your personal information when you interact with our website, our WhatsApp Business services, and our real estate platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">2. Information We Collect</h2>
                        <p className="mb-2">
                            We may collect and process the following types of personal information:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Contact Information:</strong> Name, phone number, email address, and messaging identifiers (e.g., WhatsApp JID).</li>
                            <li><strong>Real Estate Preferences:</strong> Search filters, property interests, BHK requirements, and budget limits.</li>
                            <li><strong>Interaction History:</strong> Logs of chats, messages, and schedules of property site visits generated through our AI outreach features.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">3. How We Use Your Information</h2>
                        <p className="mb-2">
                            We use your data for the following legitimate business purposes:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>To provide customer service, reply to inquiries, and share property listings.</li>
                            <li>To send bulk marketing or transactional notifications via official WhatsApp APIs.</li>
                            <li>To schedule and track property site visits.</li>
                            <li>To authenticate and manage user profiles.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">4. Sharing Your Information</h2>
                        <p>
                            We do not sell, trade, or rent your personal information to third parties. We only share information with trusted third-party services necessary for operating our platform, including **Firebase Authentication**, **PostgreSQL Database Hosting**, and **Meta Graph API (WhatsApp Business Platform)**. All such third parties are obligated to keep your data confidential.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">5. Data Retention & Deletion</h2>
                        <p>
                            We retain your personal information only as long as necessary to fulfill the services requested. If you wish to delete your data or opt-out of communications, you may do so at any time. For WhatsApp, replying with "STOP" will automatically opt you out of further campaign outreach.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">6. Security of Your Data</h2>
                        <p>
                            We use industry-standard administrative, technical, and physical security measures to protect your personal data from unauthorized access, alteration, or disclosure.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">7. Contact Us</h2>
                        <p>
                            If you have questions, feedback, or data requests regarding this Privacy Policy, please reach out to us at:
                        </p>
                        <p className="mt-2 font-semibold text-gray-900">
                            Email: contact@elevetoai.com
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
