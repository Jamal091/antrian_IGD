'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDisplayTickets } from '@/utils/antrianApi';
import { playQueueAudio, unlockQueueAudio } from '@/utils/audioQueue';
import { Volume2, VolumeX } from 'lucide-react';

export default function QueueDisplay({ loketName = 'Loket 1 Admisi IGD' }) {
    const [currentTicket, setCurrentTicket] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    const [audioMessage, setAudioMessage] = useState('');
    const lastCallKeyRef = useRef(null);
    const hasLoadedRef = useRef(false);

    const currentNumber = currentTicket?.number || null;

    const getCategoryColor = useCallback((number) => {
        if (!number) {
            return {
                bg: 'bg-gray-100',
                text: 'text-gray-500',
                border: 'border-gray-200',
                glow: 'shadow-gray-200',
                label: 'Menunggu',
            };
        }

        const prefix = number.charAt(0);

        switch (prefix) {
            case 'I':
                return {
                    bg: 'bg-emerald-50',
                    text: 'text-emerald-700',
                    border: 'border-emerald-300',
                    glow: 'shadow-emerald-200',
                    label: 'IGD',
                };
            case 'E':
                return {
                    bg: 'bg-red-50',
                    text: 'text-red-700',
                    border: 'border-red-300',
                    glow: 'shadow-red-200',
                    label: 'EMERGENCY',
                };
            case 'R':
                return {
                    bg: 'bg-blue-50',
                    text: 'text-blue-700',
                    border: 'border-blue-300',
                    glow: 'shadow-blue-200',
                    label: 'RAWAT INAP',
                };
            default:
                return {
                    bg: 'bg-gray-50',
                    text: 'text-gray-700',
                    border: 'border-gray-300',
                    glow: 'shadow-gray-200',
                    label: '',
                };
        }
    }, []);

    const getLoketAudioName = useCallback(() => {
        if (loketName === 'Loket Pendaftaran Rawat Inap' || loketName === 'Loket Rawat Inap' || loketName.includes('2')) {
            return 'admisi2';
        }
        return 'admisi1';
    }, [loketName]);

    const handleEnableAudio = useCallback(async () => {
        const unlocked = await unlockQueueAudio();
        setIsAudioEnabled(unlocked);
        setAudioMessage(unlocked ? '' : 'Audio diblokir browser');

        if (unlocked) {
            window.localStorage.setItem('queueAudioEnabled', 'true');
            window.dispatchEvent(new Event('queue-audio-enabled'));

            if (currentTicket?.number) {
                playQueueAudio(currentTicket.number, getLoketAudioName()).catch(() => {
                    setIsAudioEnabled(false);
                    setAudioMessage('Audio diblokir browser');
                });
            }
        }
    }, [currentTicket, getLoketAudioName]);

    useEffect(() => {
        const syncAudioEnabled = () => {
            setIsAudioEnabled(true);
            setAudioMessage('');
        };

        if (window.localStorage.getItem('queueAudioEnabled') === 'true') {
            setIsAudioEnabled(true);
        }

        window.addEventListener('queue-audio-enabled', syncAudioEnabled);
        return () => window.removeEventListener('queue-audio-enabled', syncAudioEnabled);
    }, []);

    const fetchDisplay = useCallback(async () => {
        try {
            const data = await getDisplayTickets(loketName);
            const ticket = data.latest || data.active?.[0] || null;
            setCurrentTicket(ticket);
            setErrorMessage('');
        } catch (error) {
            setErrorMessage(error.message || 'Gagal memuat display antrean');
        } finally {
            setIsLoading(false);
        }
    }, [loketName]);

    useEffect(() => {
        fetchDisplay();
        const interval = setInterval(fetchDisplay, 1500);
        return () => clearInterval(interval);
    }, [fetchDisplay]);

    useEffect(() => {
        if (!currentTicket?.number) return;

        const callKey = [
            currentTicket.id,
            currentTicket.number,
            currentTicket.call_count,
            currentTicket.called_at,
        ].join(':');

        if (lastCallKeyRef.current === callKey) return;

        const shouldPlayAudio = hasLoadedRef.current;
        lastCallKeyRef.current = callKey;
        hasLoadedRef.current = true;
        setIsAnimating(true);

        const timer = setTimeout(() => {
            setIsAnimating(false);
        }, 5000);

        if (shouldPlayAudio) {
            playQueueAudio(currentTicket.number, getLoketAudioName()).then(() => {
                setIsAudioEnabled(true);
                setAudioMessage('');
            }).catch(() => {
                setIsAudioEnabled(false);
                setAudioMessage('Audio diblokir browser');
            });
        }

        return () => clearTimeout(timer);
    }, [currentTicket, getLoketAudioName, isAudioEnabled]);

    const currentColor = getCategoryColor(currentNumber);

    return (
        <motion.div
            className="bg-white/95 backdrop-blur-md shadow-lg rounded-xl p-4 md:p-6 border border-[#00b7ad] mx-2 md:mx-0 mb-0 overflow-hidden flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
        >
            <div className="flex items-center justify-between mb-4 gap-3">
                <div className="w-10" />
                <h2 className="text-lg sm:text-xl font-bold text-[#00b7ad] text-center flex-1">
                    {loketName}
                </h2>
                <button
                    type="button"
                    onClick={handleEnableAudio}
                    className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-colors ${
                        isAudioEnabled
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                            : 'bg-red-50 border-red-100 text-red-500 hover:bg-red-100'
                    }`}
                    title={isAudioEnabled ? 'Suara aktif' : 'Aktifkan suara'}
                    aria-label={isAudioEnabled ? 'Suara aktif' : 'Aktifkan suara'}
                >
                    {isAudioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
                <p className="text-xs sm:text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">
                    Nomor Antrian Saat Ini
                </p>

                <div className="relative w-full min-h-[160px] sm:min-h-[200px] flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentNumber || 'empty'}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="absolute"
                        >
                            {isAnimating && currentNumber && (
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
                                className={`relative ${currentColor.bg} ${currentColor.border} border-2 rounded-2xl px-6 sm:px-10 md:px-12 py-6 sm:py-8 shadow-xl min-w-[220px]`}
                            >
                                <motion.p
                                    className={`text-5xl sm:text-7xl md:text-8xl lg:text-6xl xl:text-7xl font-extrabold ${currentColor.text} tracking-wider text-center whitespace-nowrap`}
                                    animate={isAnimating ? { scale: [1, 1.03, 1] } : { scale: 1 }}
                                    transition={isAnimating ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.5 }}
                                >
                                    {currentNumber || '---'}
                                </motion.p>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="flex items-center gap-2 min-h-5">
                    <motion.div
                        className={`w-2.5 h-2.5 rounded-full ${isAnimating ? 'bg-green-500' : 'bg-gray-300'}`}
                        animate={isAnimating ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
                        transition={isAnimating ? { duration: 1.2, repeat: Infinity } : { duration: 0.5 }}
                    />
                    <span className="text-xs sm:text-sm font-medium text-gray-500">
                        {audioMessage || (isLoading
                            ? 'Memuat'
                            : errorMessage
                                ? errorMessage
                                : currentNumber
                                    ? `${isAnimating ? 'Sedang Dipanggil' : 'Panggilan Terakhir'} - ${currentColor.label}`
                                    : 'Belum ada panggilan')}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
