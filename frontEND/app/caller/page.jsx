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
import {
    callAutoTicket,
    callNextTicket,
    callSpecificTicket,
    getCallLockStatus,
    getWaitingTickets,
    recallTicket,
} from '@/utils/antrianApi';

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
    const [callerSession, setCallerSession] = useState(null);
    const [sessionReady, setSessionReady] = useState(false);
    const myCounter = callerSession?.counterName || '';

    const [waitingList, setWaitingList] = useState({ IGD: [], EMERGENCY: [] });
    const [currentCall, setCurrentCall] = useState({ number: null, type: null });
    const [loading, setLoading] = useState(false);
    const [callLock, setCallLock] = useState({
        is_locked: false,
        locked_by: null,
        remaining_ms: 0,
        lock_duration_ms: 12000,
    });
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

    useEffect(() => {
        const savedSession = window.sessionStorage.getItem('callerSession');

        if (!savedSession) {
            router.push('/');
            return;
        }

        try {
            const parsedSession = JSON.parse(savedSession);
            if (!parsedSession?.counterName) {
                router.push('/');
                return;
            }

            setCallerSession(parsedSession);
            setSessionReady(true);
        } catch {
            window.sessionStorage.removeItem('callerSession');
            router.push('/');
        }
    }, [router]);

    // ── Notification handler ──────────────────────────────────
    const showNotification = useCallback((msg) => {
        setNotification(msg);
    }, []);

    const clearNotification = useCallback(() => {
        setNotification('');
    }, []);

    const syncCallLock = useCallback((data) => {
        if (data?.call_lock) {
            setCallLock(data.call_lock);
        }
    }, []);

    const loadCallLock = useCallback(async () => {
        try {
            const data = await getCallLockStatus();
            setCallLock(data);
        } catch {
            // Keep the last known lock state if the short polling request fails.
        }
    }, []);

    const loadWaitingList = useCallback(async () => {
        try {
            const data = await getWaitingTickets();
            setWaitingList({
                IGD: data.IGD || [],
                EMERGENCY: data.EMERGENCY || [],
            });
        } catch (error) {
            showNotification(error.message || 'Gagal memuat daftar antrean');
        }
    }, [showNotification]);

    useEffect(() => {
        if (!sessionReady) return undefined;

        loadWaitingList();
        const interval = setInterval(loadWaitingList, 3000);
        return () => clearInterval(interval);
    }, [loadWaitingList, sessionReady]);

    useEffect(() => {
        if (!sessionReady) return undefined;

        loadCallLock();
        const interval = setInterval(loadCallLock, 1000);
        return () => clearInterval(interval);
    }, [loadCallLock, sessionReady]);

    // ── Call next in queue ────────────────────────────────────
    const handleCallNext = useCallback(async (type) => {
        setLoading(true);

        try {
            const data = await callNextTicket(type, myCounter);
            syncCallLock(data);
            setCurrentCall(data.ticket);
            showNotification(`Memanggil Antrian ${data.ticket.number}`);
            await loadWaitingList();
        } catch (error) {
            syncCallLock(error.data);
            showNotification(error.message || 'Tidak ada antrian menunggu');
        } finally {
            setLoading(false);
        }
    }, [loadWaitingList, myCounter, showNotification, syncCallLock]);

    // ── Auto call (Emergency first, then IGD) ────────────────
    const handleCallAuto = useCallback(async () => {
        setLoading(true);

        try {
            const data = await callAutoTicket(myCounter);
            syncCallLock(data);
            setCurrentCall(data.ticket);
            showNotification(`Memanggil Antrian ${data.ticket.number}`);
            await loadWaitingList();
        } catch (error) {
            syncCallLock(error.data);
            showNotification(error.message || 'Tidak ada antrian menunggu');
        } finally {
            setLoading(false);
        }
    }, [loadWaitingList, myCounter, showNotification, syncCallLock]);

    // ── Recall current number ────────────────────────────────
    const handleRecall = useCallback(async () => {
        if (!currentCall.number) return;
        setLoading(true);

        try {
            const data = await recallTicket(currentCall, myCounter);
            syncCallLock(data);
            setCurrentCall(data.ticket);
            showNotification(`Memanggil Ulang ${data.ticket.number}`);
        } catch (error) {
            syncCallLock(error.data);
            showNotification(error.message || 'Gagal memanggil ulang');
        } finally {
            setLoading(false);
        }
    }, [currentCall, myCounter, showNotification, syncCallLock]);

    // ── Call specific ticket ─────────────────────────────────
    const handleCallSpecific = useCallback((ticket) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Panggil Antrian',
            message: `Panggil nomor ${ticket.number} sekarang?`,
            icon: 'campaign',
            color: 'blue',
            onConfirm: async () => {
                setLoading(true);

                try {
                    const data = await callSpecificTicket(ticket, myCounter);
                    syncCallLock(data);
                    setCurrentCall(data.ticket);
                    showNotification(`Memanggil Manual ${data.ticket.number}`);
                    await loadWaitingList();
                } catch (error) {
                    syncCallLock(error.data);
                    showNotification(error.message || 'Gagal memanggil antrean');
                } finally {
                    setLoading(false);
                }
            },
        });
    }, [loadWaitingList, myCounter, showNotification, syncCallLock]);

    // ── Close confirm modal ──────────────────────────────────
    const closeConfirm = useCallback(() => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
    }, []);

    // ── Logout ───────────────────────────────────────────────
    const handleLogoutConfirm = useCallback(() => {
        window.sessionStorage.removeItem('callerSession');
        router.push('/');
    }, [router]);

    // ── Derived counts ───────────────────────────────────────
    const igdCount = waitingList.IGD?.length || 0;
    const emergencyCount = waitingList.EMERGENCY?.length || 0;
    const totalWaiting = igdCount + emergencyCount;
    const isCallLocked = Boolean(callLock?.is_locked);
    const callLockSeconds = Math.ceil((callLock?.remaining_ms || 0) / 1000);
    const callLockOwner = callLock?.locked_by || 'loket lain';

    if (!sessionReady) {
        return (
            <div className="min-h-screen bg-[#f0f5f5] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#00b7ad] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f0f5f5] relative">
            {/* ── Header ─────────────────────────────────────── */}
            <Header 
                title="RSUP MAKASSAR"
                subtitle={`PANEL PETUGAS ${myCounter.toUpperCase()}`}
                onLogout={() => setIsLogoutModalOpen(true)}
            />

            {/* ── Notification Toast ─────────────────────────── */}
            <AnimatePresence>
                {notification && (
                    <NotificationToast message={notification} onDone={clearNotification} />
                )}
            </AnimatePresence>

            {isCallLocked && (
                <div className="mx-4 sm:mx-6 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-bold text-amber-700">
                    Pemanggilan sedang berlangsung di {callLockOwner}. Tombol aktif kembali dalam {callLockSeconds} detik.
                </div>
            )}

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
                                disabled={loading || isCallLocked || !currentCall.number}
                                className="flex items-center justify-center gap-2 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm sm:text-base"
                            >
                                <RotateCcw size={18} />
                                Panggil Ulang
                            </button>
                            <button
                                onClick={handleCallAuto}
                                disabled={loading || isCallLocked || totalWaiting === 0}
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
                                disabled={loading || isCallLocked || igdCount === 0}
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
                                disabled={loading || isCallLocked || emergencyCount === 0}
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
                                                onClick={() => handleCallSpecific(ticket)}
                                                disabled={loading || isCallLocked}
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
                                                onClick={() => handleCallSpecific(ticket)}
                                                disabled={loading || isCallLocked}
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
