'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
    LogOut, Play, PlayCircle, RotateCcw, Megaphone,
    Siren, HeartPulse, ListOrdered, Inbox, CheckCircle,
    Phone
} from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
import LogoutModal from '@/components/LogoutModal';
import Header from '@/components/Header';

// ── Dummy data generator (Admisi IGD) ─────────────────────────
const generateInitialWaiting = () => {
    const now = new Date();
    const igd = [];
    const emergency = [];

    for (let i = 1; i <= 8; i++) {
        const time = new Date(now.getTime() + i * 3 * 60000);
        igd.push({
            id: `I-${i}`,
            number: `I-${String(i).padStart(3, '0')}`,
            time: `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`,
        });
    }

    for (let i = 1; i <= 3; i++) {
        const time = new Date(now.getTime() + i * 2 * 60000);
        emergency.push({
            id: `E-${i}`,
            number: `E-${String(i).padStart(3, '0')}`,
            time: `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`,
        });
    }

    return { IGD: igd, EMERGENCY: emergency };
};

import { playQueueAudio } from '@/utils/audioQueue';

// ── Notification Toast Component ──────────────────────────────
function NotificationToast({ message, onDone }) {
    useEffect(() => {
        const timer = setTimeout(onDone, 3000);
        return () => clearTimeout(timer);
    }, [onDone]);

    return (
        <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-gray-800/95 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-base sm:text-lg font-bold border border-gray-700/50"
        >
            <CheckCircle size={28} className="text-green-400 flex-shrink-0" />
            {message}
        </motion.div>
    );
}

// ── Main Caller Page ──────────────────────────────────────────
export default function CallerPage() {
    const router = useRouter();
    const myCounter = 'Loket Admisi IGD'; // Simulated counter name

    const [waitingList, setWaitingList] = useState({ IGD: [], EMERGENCY: [] });
    const [currentCall, setCurrentCall] = useState({ number: null, type: null });
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState('');
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        icon: 'warning',
        color: 'red',
        onConfirm: () => {},
    });

    // Initialize dummy data
    useEffect(() => {
        setWaitingList(generateInitialWaiting());
    }, []);

    // ── Notification handler ──────────────────────────────────
    const showNotification = useCallback((msg) => {
        setNotification(msg);
    }, []);

    const clearNotification = useCallback(() => {
        setNotification('');
    }, []);

    // ── Call next in queue ────────────────────────────────────
    const handleCallNext = useCallback((type) => {
        setLoading(true);

        setTimeout(() => {
            setWaitingList((prev) => {
                const list = [...(prev[type] || [])];
                if (list.length === 0) {
                    showNotification('Tidak ada antrian menunggu');
                    setLoading(false);
                    return prev;
                }

                const called = list.shift();
                setCurrentCall({ number: called.number, type });
                showNotification(`Memanggil Antrian ${called.number}`);
                
                // Play audio
                playQueueAudio(called.number, 'admisi1');

                return { ...prev, [type]: list };
            });
            setLoading(false);
        }, 300);
    }, [showNotification]);

    // ── Auto call (Emergency first, then IGD) ────────────────
    const handleCallAuto = useCallback(() => {
        if (waitingList.EMERGENCY?.length > 0) {
            handleCallNext('EMERGENCY');
        } else if (waitingList.IGD?.length > 0) {
            handleCallNext('IGD');
        } else {
            showNotification('Tidak ada antrian menunggu');
        }
    }, [waitingList, handleCallNext, showNotification]);

    // ── Recall current number ────────────────────────────────
    const handleRecall = useCallback(() => {
        if (!currentCall.number) return;
        setLoading(true);
        setTimeout(() => {
            showNotification(`Memanggil Ulang ${currentCall.number}`);
            playQueueAudio(currentCall.number, 'admisi1');
            setLoading(false);
        }, 300);
    }, [currentCall, showNotification]);

    // ── Call specific ticket ─────────────────────────────────
    const handleCallSpecific = useCallback((ticketNumber, type) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Panggil Antrian',
            message: `Panggil nomor ${ticketNumber} sekarang?`,
            icon: 'campaign',
            color: 'blue',
            onConfirm: () => {
                setLoading(true);
                setTimeout(() => {
                    setWaitingList((prev) => {
                        const list = (prev[type] || []).filter((t) => t.number !== ticketNumber);
                        return { ...prev, [type]: list };
                    });
                    setCurrentCall({ number: ticketNumber, type });
                    showNotification(`Memanggil Manual ${ticketNumber}`);
                    playQueueAudio(ticketNumber, 'admisi1');
                    setLoading(false);
                }, 300);
            },
        });
    }, [showNotification]);

    // ── Close confirm modal ──────────────────────────────────
    const closeConfirm = useCallback(() => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
    }, []);

    // ── Logout ───────────────────────────────────────────────
    const handleLogoutConfirm = useCallback(() => {
        router.push('/');
    }, [router]);

    // ── Derived counts ───────────────────────────────────────
    const igdCount = waitingList.IGD?.length || 0;
    const emergencyCount = waitingList.EMERGENCY?.length || 0;
    const totalWaiting = igdCount + emergencyCount;

    return (
        <div className="min-h-screen bg-[#f0f5f5] relative">
            {/* ── Header ─────────────────────────────────────── */}
            <Header 
                title="RSUP MAKASSAR"
                subtitle="PANEL PETUGAS ADMISI IGD"
                onLogout={() => setIsLogoutModalOpen(true)}
            />

            {/* ── Notification Toast ─────────────────────────── */}
            <AnimatePresence>
                {notification && (
                    <NotificationToast message={notification} onDone={clearNotification} />
                )}
            </AnimatePresence>

            {/* ── Main Content ────────────────────────────────── */}
            <main className="w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* LEFT COLUMN: CALL CONTROLS */}
                <div className="lg:col-span-2 flex flex-col gap-4 sm:gap-6">

                    {/* ── Active Call Status ───────────────────── */}
                    <motion.div
                        className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-[#00b7ad]/20"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Megaphone size={20} className="text-[#00b7ad]" />
                            Panggilan Aktif
                        </h2>

                        <div className="bg-gradient-to-br from-[#00b7ad]/5 to-[#00b7ad]/10 rounded-xl p-6 sm:p-8 text-center border border-[#00b7ad]/15">
                            <p className="text-[#00b7ad] font-semibold mb-1 text-sm">Nomor Sedang Dipanggil</p>

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentCall.number || 'empty'}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                    className="my-3"
                                >
                                    <span className="text-5xl sm:text-7xl font-black text-gray-900 tracking-tight">
                                        {currentCall.number || '---'}
                                    </span>
                                </motion.div>
                            </AnimatePresence>

                            {currentCall.number && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="inline-flex items-center gap-2 mt-1"
                                >
                                    <motion.div
                                        className="w-2 h-2 rounded-full bg-green-500"
                                        animate={{ opacity: [1, 0.3, 1] }}
                                        transition={{ duration: 1.2, repeat: Infinity }}
                                    />
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                        currentCall.type === 'EMERGENCY'
                                            ? 'bg-red-100 text-red-600'
                                            : 'bg-emerald-100 text-emerald-600'
                                    }`}>
                                        {currentCall.type === 'EMERGENCY' ? 'EMERGENCY' : 'IGD'}
                                    </span>
                                </motion.div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-5">
                            <button
                                onClick={handleRecall}
                                disabled={loading || !currentCall.number}
                                className="flex items-center justify-center gap-2 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm sm:text-base"
                            >
                                <RotateCcw size={18} />
                                Panggil Ulang
                            </button>
                            <button
                                onClick={handleCallAuto}
                                disabled={loading || totalWaiting === 0}
                                className="flex items-center justify-center gap-2 py-3 bg-[#00b7ad] text-white rounded-xl font-bold hover:bg-[#009e95] transition-all shadow-lg shadow-[#00b7ad]/30 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed text-sm sm:text-base"
                            >
                                <PlayCircle size={18} />
                                Panggil Berikutnya
                            </button>
                        </div>
                    </motion.div>

                    {/* ── Queue Type Cards ─────────────────────── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

                        {/* IGD */}
                        <motion.div
                            className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200 relative overflow-hidden group"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <div className="absolute top-2 right-2 opacity-5 group-hover:opacity-10 transition-opacity">
                                <HeartPulse size={80} className="text-emerald-500" />
                            </div>
                            <div className="flex items-center gap-2 mb-1 relative z-10">
                                <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-md">I</span>
                                <h3 className="text-base sm:text-lg font-bold text-gray-800">Antrian IGD</h3>
                            </div>
                            <div className="flex items-end gap-2 mb-5 relative z-10">
                                <span className="text-4xl sm:text-5xl font-black text-emerald-600">{igdCount}</span>
                                <span className="text-sm text-gray-400 mb-1.5 font-medium">Menunggu</span>
                            </div>
                            <button
                                onClick={() => handleCallNext('IGD')}
                                disabled={loading || igdCount === 0}
                                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed relative z-10 text-sm sm:text-base"
                            >
                                <Play size={18} />
                                Panggil Berikutnya
                            </button>
                        </motion.div>

                        {/* EMERGENCY */}
                        <motion.div
                            className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200 relative overflow-hidden group"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <div className="absolute top-2 right-2 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Siren size={80} className="text-red-500" />
                            </div>
                            <div className="flex items-center gap-2 mb-1 relative z-10">
                                <span className="text-xs font-bold px-2 py-0.5 bg-red-100 text-red-600 rounded-md">E</span>
                                <h3 className="text-base sm:text-lg font-bold text-gray-800">Antrian Emergency</h3>
                            </div>
                            <div className="flex items-end gap-2 mb-5 relative z-10">
                                <span className="text-4xl sm:text-5xl font-black text-red-500">{emergencyCount}</span>
                                <span className="text-sm text-gray-400 mb-1.5 font-medium">Menunggu</span>
                            </div>
                            <button
                                onClick={() => handleCallNext('EMERGENCY')}
                                disabled={loading || emergencyCount === 0}
                                className="w-full py-3.5 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed relative z-10 text-sm sm:text-base"
                            >
                                <Play size={18} />
                                Panggil Berikutnya
                            </button>
                        </motion.div>
                    </div>
                </div>

                {/* RIGHT COLUMN: WAITING LIST */}
                <motion.div
                    className="lg:col-span-1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 lg:h-[calc(100vh-120px)] flex flex-col lg:sticky lg:top-20">
                        {/* Waiting List Header */}
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-2xl">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
                                <ListOrdered size={18} className="text-gray-400" />
                                Daftar Tunggu
                            </h3>
                            <span className="text-xs font-bold px-2.5 py-1 bg-[#00b7ad]/10 text-[#00b7ad] rounded-lg">
                                Total: {totalWaiting}
                            </span>
                        </div>

                        {/* Waiting List Body */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {/* Emergency Section */}
                            {waitingList.EMERGENCY?.length > 0 && (
                                <div className="mb-3">
                                    <div className="px-2 py-1.5 text-xs font-bold text-red-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Siren size={12} />
                                        Emergency
                                    </div>
                                    {waitingList.EMERGENCY.map((ticket) => (
                                        <motion.div
                                            key={ticket.id}
                                            layout
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            className="group flex items-center justify-between p-2.5 sm:p-3 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-100 transition-all mb-1 cursor-default"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs shadow-sm">
                                                    {ticket.number.split('-')[1]}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-gray-800 block leading-tight text-sm">
                                                        {ticket.number}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-mono">
                                                        {ticket.time}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleCallSpecific(ticket.number, 'EMERGENCY')}
                                                disabled={loading}
                                                className="opacity-0 group-hover:opacity-100 px-2.5 py-1.5 bg-white border border-red-200 text-red-600 text-xs font-bold rounded-lg shadow-sm hover:bg-red-500 hover:text-white hover:border-red-500 transition-all transform scale-95 group-hover:scale-100"
                                            >
                                                <Phone size={12} className="inline mr-1" />
                                                Panggil
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {/* IGD Section */}
                            {waitingList.IGD?.length > 0 && (
                                <div>
                                    <div className="px-2 py-1.5 text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                                        <HeartPulse size={12} />
                                        IGD
                                    </div>
                                    {waitingList.IGD.map((ticket) => (
                                        <motion.div
                                            key={ticket.id}
                                            layout
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            className="group flex items-center justify-between p-2.5 sm:p-3 rounded-xl hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all mb-1 cursor-default"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs shadow-sm">
                                                    {ticket.number.split('-')[1]}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-gray-800 block leading-tight text-sm">
                                                        {ticket.number}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-mono">
                                                        {ticket.time}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleCallSpecific(ticket.number, 'IGD')}
                                                disabled={loading}
                                                className="opacity-0 group-hover:opacity-100 px-2.5 py-1.5 bg-white border border-emerald-200 text-emerald-600 text-xs font-bold rounded-lg shadow-sm hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all transform scale-95 group-hover:scale-100"
                                            >
                                                <Phone size={12} className="inline mr-1" />
                                                Panggil
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {/* Empty State */}
                            {totalWaiting === 0 && (
                                <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                                    <Inbox size={48} className="mb-3 opacity-50" />
                                    <p className="text-sm font-medium text-gray-400">Tidak ada antrian menunggu</p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </main>

            {/* ── Modals ─────────────────────────────────────── */}
            <LogoutModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={handleLogoutConfirm}
            />

            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                onClose={closeConfirm}
                onConfirm={confirmConfig.onConfirm}
                title={confirmConfig.title}
                message={confirmConfig.message}
                icon={confirmConfig.icon}
                color={confirmConfig.color}
                confirmText="Ya, Panggil"
            />
        </div>
    );
}
