"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, User, Bot, HeartPulse, Loader2, Sparkles, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage, sendChatMessage } from "@/lib/api";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function ChatInterface() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const result = await sendChatMessage(input);
            const agentMessage: ChatMessage = {
                role: "agent",
                content: result.response,
                sentiment: result.sentiment,
                safety: result.safety,
            };
            setMessages((prev) => [...prev, agentMessage]);
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages((prev) => [
                ...prev,
                { role: "agent", content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment." },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans selection:bg-indigo-500/30">
            {/* Background Orbs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-500/10 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>

            {/* Header */}
            <header className="relative z-10 border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-teal-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <HeartPulse className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            True Companion
                        </h1>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-teal-400" /> AI Wellness Guide
                        </p>
                    </div>
                </div>
            </header>

            {/* Chat Area */}
            <main className="relative z-10 flex-1 overflow-y-auto px-4 py-8 space-y-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                <div className="max-w-3xl mx-auto space-y-6">
                    {messages.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-20 space-y-4"
                        >
                            <h2 className="text-3xl font-light text-slate-300">Hello, I'm here to listen.</h2>
                            <p className="text-slate-500 max-w-md mx-auto">
                                Whether you're feeling overwhelmed, stressed, or just need someone to talk to, I'm here for you.
                            </p>
                        </motion.div>
                    )}

                    <AnimatePresence mode="popLayout">
                        {messages.map((msg, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.3 }}
                                className={cn(
                                    "flex items-start gap-4",
                                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                    msg.role === "user" ? "bg-slate-800" : "bg-gradient-to-br from-indigo-500 to-teal-500"
                                )}>
                                    {msg.role === "user" ? <User size={16} /> : <Bot size={16} className="text-white" />}
                                </div>

                                <div className="flex flex-col gap-2 max-w-[80%]">
                                    <div className={cn(
                                        "px-5 py-3 rounded-2xl shadow-sm leading-relaxed",
                                        msg.role === "user"
                                            ? "bg-indigo-600 text-white rounded-tr-none"
                                            : "bg-slate-900 border border-slate-800/50 text-slate-200 rounded-tl-none"
                                    )}>
                                        {msg.content}
                                    </div>

                                    {msg.safety?.includes("TRUE") && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex items-center gap-2 text-rose-400 text-xs font-medium bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/20"
                                        >
                                            <ShieldAlert size={14} />
                                            Safety Alert: Professional support recommended.
                                        </motion.div>
                                    )}

                                    {msg.sentiment && !msg.safety?.includes("TRUE") && (
                                        <span className="text-[10px] text-slate-500 ml-1 italic opacity-60">
                                            Detected: {msg.sentiment.replace("Emotion: ", "").split("\n")[0]}
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {isLoading && (
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center animate-pulse">
                                <Bot size={16} className="text-slate-500" />
                            </div>
                            <div className="bg-slate-900/50 border border-slate-800/50 px-4 py-2 rounded-2xl flex items-center gap-2">
                                <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
                                <span className="text-sm text-slate-500">Listening...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </main>

            {/* Input Area */}
            <footer className="relative z-10 p-6 bg-slate-950/80 backdrop-blur-md border-t border-slate-800/50">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative group">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message here..."
                        className="w-full bg-slate-900/50 border border-slate-800 group-focus-within:border-indigo-500/50 rounded-2xl px-6 py-4 pr-16 outline-none transition-all placeholder:text-slate-600 text-slate-200 shadow-inner"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 top-2 bottom-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white transition-colors flex items-center justify-center shadow-lg shadow-indigo-500/20"
                    >
                        <Send size={18} />
                    </button>
                </form>
                <p className="text-center text-[10px] text-slate-600 mt-4">
                    I'm an AI assistant. If you're in immediate danger, please contact local emergency services.
                </p>
            </footer>
        </div>
    );
}
