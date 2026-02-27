import React, { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, Clock, CheckCircle2, Bot, User, Loader2 } from 'lucide-react';

const LeadDetailsModal = ({ isOpen, onClose, lead }) => {
    const [chats, setChats] = useState([]);
    const [isLoadingChats, setIsLoadingChats] = useState(false);
    const chatContainerRef = useRef(null);

    useEffect(() => {
        if (isOpen && lead?.phone) {
            fetchChats(lead.phone);
        }
    }, [isOpen, lead]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chats]);

    const fetchChats = async (phone) => {
        setIsLoadingChats(true);
        try {
            // Remove non-numeric characters for the API call
            const cleanPhone = phone.replace(/\D/g, '');
            const response = await fetch(`http://localhost:3000/api/chats/${cleanPhone}`);
            if (response.ok) {
                const data = await response.json();
                setChats(data.chats || []);
            }
        } catch (error) {
            console.error("Failed to fetch AI chat logs", error);
        } finally {
            setIsLoadingChats(false);
        }
    };

    if (!isOpen || !lead) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-5xl h-[85vh] shadow-2xl flex flex-col md:flex-row overflow-hidden relative animate-in zoom-in-95 duration-200">

                {/* Mobile Close Button */}
                <button
                    onClick={onClose}
                    className="md:hidden absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-full text-gray-500 shadow-sm"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* LEFT SIDE: Lead Data */}
                <div className="w-full md:w-1/3 bg-gray-50 flex flex-col border-r border-gray-100 overflow-y-auto">
                    <div className="p-6 bg-white border-b border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                            <h2 className="text-xl font-bold text-gray-900">{lead.name}</h2>
                            <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-100">
                                {lead.status}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                            <MessageCircle className="w-4 h-4" />
                            {lead.phone}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`, '_blank')}
                                className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 font-semibold py-2 px-4 rounded-xl transition-colors flex justify-center items-center gap-2 text-sm"
                            >
                                <MessageCircle className="w-4 h-4" />
                                WhatsApp
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Requirement Overview</h3>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {lead.requirement || "No detailed requirements recorded yet."}
                            </div>
                        </div>

                        {lead.date && (
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Next Action</h3>
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                                    <div className="bg-orange-50 p-2 rounded-lg">
                                        <Clock className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">Follow-up Scheduled</p>
                                        <p className="text-xs text-gray-500">{new Date(lead.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Lead Source</h3>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                                <div className="bg-blue-50 p-2 rounded-lg">
                                    <Bot className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">AI WhatsApp Agent</p>
                                    <p className="text-xs text-gray-500">Processed seamlessly via ChatGPT</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: AI Chat Log */}
                <div className="w-full md:w-2/3 bg-[#efeae2] flex flex-col h-full relative">

                    {/* Chat Header */}
                    <div className="bg-white px-6 py-4 flex justify-between items-center shadow-sm z-10 sticky top-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Live AI Chat Log</h3>
                                <p className="text-xs text-gray-500">Viewing exact conversation history</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="hidden md:flex text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Chat Messages Area */}
                    <div
                        ref={chatContainerRef}
                        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4"
                        style={{ backgroundImage: `url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')`, backgroundSize: 'cover', backgroundAttachment: 'fixed', opacity: 0.95 }}
                    >
                        {isLoadingChats ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 bg-white/50 backdrop-blur-sm rounded-2xl">
                                <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                                <p className="text-sm font-medium">Fetching conversation log...</p>
                            </div>
                        ) : chats.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 bg-white/80 backdrop-blur-md rounded-2xl mx-4">
                                <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
                                <p className="text-sm font-medium text-gray-600">No active chat session found.</p>
                                <p className="text-xs text-gray-400 text-center mt-2 max-w-[250px]">
                                    If this is an older lead, the AI's temporary server memory may have cleared.
                                </p>
                            </div>
                        ) : (
                            chats.map((msg, index) => {
                                // Try to format JSON responses nicely if it's the assistant
                                let displayContent = msg.content;
                                if (msg.role === 'assistant') {
                                    try {
                                        const parsed = JSON.parse(msg.content);
                                        displayContent = parsed.human_response || msg.content;
                                    } catch (e) {
                                        // Ignore parse error, just show string
                                    }
                                }

                                const isBot = msg.role === 'assistant';

                                return (
                                    <div key={index} className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4`}>
                                        <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 shadow-md relative ${isBot
                                                ? 'bg-white text-gray-800 rounded-tl-sm'
                                                : 'bg-[#dcf8c6] text-gray-900 rounded-tr-sm'
                                            }`}>
                                            <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap font-messaging">
                                                {displayContent}
                                            </p>

                                            <div className="flex justify-end items-center gap-1 mt-1 opacity-60">
                                                <span className="text-[10px]">AI Logger</span>
                                                <CheckCircle2 className="w-3 h-3 text-blue-500" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default LeadDetailsModal;
