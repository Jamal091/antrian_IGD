'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Dummy queue data for simulation (IGD Admisi)
const generateDummyQueue = () => {
    const queue = [];
    // IGD queue
    for (let i = 1; i <= 10; i++) {
        queue.push(`I-${String(i).padStart(3, '0')}`);
    }
    // Emergency queue
    for (let i = 1; i <= 5; i++) {
        queue.push(`E-${String(i).padStart(3, '0')}`);
    }
    return queue;
};

export default function QueueDisplay({ loketName = "Display Antrian Admisi IGD" }) {
    const [allQueue] = useState(generateDummyQueue);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isCallActive, setIsCallActive] = useState(true);
    const [isAnimating, setIsAnimating] = useState(false);

    const currentNumber = allQueue[currentIndex];

    // Manage animation duration (e.g. animate for 5 seconds when number changes)
    useEffect(() => {
        setIsAnimating(true);
        const timer = setTimeout(() => {
            setIsAnimating(false);
        }, 5000);
        return () => clearTimeout(timer);
    }, [currentNumber]);

    // Auto-advance queue every 8 seconds (simulating calls)
    useEffect(() => {
        const interval = setInterval(() => {
            setIsCallActive(false);
            setTimeout(() => {
                setCurrentIndex((prev) => {
                    if (prev + 1 >= allQueue.length) return 0;
                    return prev + 1;
                });
                setIsCallActive(true);
            }, 600);
        }, 8000);

        return () => clearInterval(interval);
    }, [allQueue.length]);

    // Derive category color from prefix
    const getCategoryColor = useCallback((number) => {
        if (!number) return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300', glow: 'shadow-gray-200', label: '' };
        const prefix = number.charAt(0);
        switch (prefix) {
            case 'I':
                return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300', glow: 'shadow-emerald-200', label: 'IGD' };
            case 'E':
                return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300', glow: 'shadow-red-200', label: 'EMERGENCY' };
            default:
                return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-300', glow: 'shadow-gray-200', label: '' };
        }
    }, []);

    const currentColor = getCategoryColor(currentNumber);

    return (
        <motion.div
            className="bg-white/95 backdrop-blur-md shadow-lg rounded-xl p-4 md:p-6 border border-[#00b7ad] mx-2 md:mx-0 mb-0 overflow-hidden flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-[#00b7ad] text-center w-full">
                    {loketName}
                </h2>
            </div>

            {/* Current Queue Number */}
            <div className="flex-1 flex flex-col items-center justify-center">
                <p className="text-xs sm:text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">
                    Nomor Antrian Saat Ini
                </p>

                <div className="relative w-full min-h-[160px] sm:min-h-[200px] flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        {isCallActive && (
                            <motion.div
                                key={currentNumber}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                className="absolute"
                            >
                                {/* Pulsing glow ring */}
                                {isAnimating && (
                                    <motion.div
                                        className={`absolute inset-0 rounded-2xl ${currentColor.glow} opacity-40`}
                                        animate={{
                                            boxShadow: [
                                                '0 0 0 0px rgba(0, 183, 173, 0.3)',
                                                '0 0 0 15px rgba(0, 183, 173, 0)',
                                            ],
                                        }}
                                        transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                            ease: 'easeOut',
                                        }}
                                    />
                                )}

                                <div
                                    className={`relative ${currentColor.bg} ${currentColor.border} border-2 rounded-2xl px-6 sm:px-10 md:px-12 py-6 sm:py-8 shadow-xl`}
                                >
                                    <motion.p
                                        className={`text-5xl sm:text-7xl md:text-8xl lg:text-6xl xl:text-7xl font-extrabold ${currentColor.text} tracking-wider text-center whitespace-nowrap`}
                                        animate={isAnimating ? { scale: [1, 1.03, 1] } : { scale: 1 }}
                                        transition={isAnimating ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.5 }}
                                    >
                                        {currentNumber}
                                    </motion.p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Call status indicator */}
                <div className="flex items-center gap-2">
                    <motion.div
                        className={`w-2.5 h-2.5 rounded-full ${isAnimating ? 'bg-green-500' : 'bg-gray-300'}`}
                        animate={isAnimating ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
                        transition={isAnimating ? { duration: 1.2, repeat: Infinity } : { duration: 0.5 }}
                    />
                    <span className="text-xs sm:text-sm font-medium text-gray-500">
                        {isAnimating ? `Sedang Dipanggil — ${currentColor.label}` : `Menunggu — ${currentColor.label}`}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
