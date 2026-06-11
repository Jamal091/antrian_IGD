'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, LogOut, Maximize, Pill, FlaskConical, Clock, HandMetal, Pointer, HeartPulse, Siren } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function KioskPage() {
    const router = useRouter();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [printingTicket, setPrintingTicket] = useState(null);

    const [counters, setCounters] = useState({ IGD: 1, EMERGENCY: 1 });

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => console.log(err));
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
        }
    };

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
    };

    const confirmLogout = () => {
        setShowLogoutConfirm(false);
        router.push('/');
    };

    const handleTakeQueue = (type) => {
        const currentCount = counters[type];
        const prefix = type === 'IGD' ? 'I-' : 'E-';
        const ticketNumber = `${prefix}${String(currentCount).padStart(3, '0')}`;

        setCounters(prev => ({ ...prev, [type]: prev[type] + 1 }));

        const timestamp = new Date().getTime();
        window.open(`/kiosk/print?type=${type}&number=${ticketNumber}&time=${timestamp}`, '_blank');
    };

    const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    const dayName = days[currentTime.getDay()];
    const dateText = `${currentTime.getDate()} ${months[currentTime.getMonth()]} ${currentTime.getFullYear()}`;
    const timeText = `${String(currentTime.getHours()).padStart(2, '0')}.${String(currentTime.getMinutes()).padStart(2, '0')}`;

    return (
        <div className="min-h-screen bg-[#fafafa] flex flex-col relative overflow-hidden select-none font-sans">
            {/* Header */}
            <header className="bg-white px-6 py-4 flex justify-between items-center z-10 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-5">
                    <Image src="/RSUP.png" alt="Logo" width={180} height={50} className="w-auto h-10" priority />
                    <div className="h-10 w-px bg-gray-200" />
                    <div className="flex flex-col justify-center">
                        <h1 className="text-sm sm:text-base font-extrabold text-[#1e293b] tracking-wide">RSUP MAKASSAR</h1>
                        <p className="text-[11px] sm:text-xs font-semibold text-gray-400 uppercase tracking-widest mt-0.5">INSTALASI GAWAT DARURAT</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end justify-center mr-2">
                        <span className="text-[10px] font-extrabold text-gray-400 tracking-widest uppercase">{dayName}</span>
                        <span className="text-xs font-bold text-gray-700">{dateText}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-[#f4f6f9] px-4 py-2.5 rounded-xl border border-gray-100">
                        <Clock size={16} className="text-[#3b82f6]" />
                        <span className="text-base font-black text-[#1e293b]">{timeText}</span>
                    </div>
                    <button onClick={toggleFullscreen} className="p-3 border border-gray-100 hover:bg-gray-50 text-gray-400 hover:text-gray-600 rounded-xl transition-colors" title="Toggle Fullscreen">
                        <Maximize size={18} />
                    </button>
                    <button onClick={handleLogoutClick} className="p-3 border border-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors" title="Logout">
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-8 z-10 w-full max-w-6xl mx-auto">
                <div className="text-center mb-10 flex flex-col items-center">
                    <div className="bg-[#ecfdf5] text-[#059669] text-[10px] font-extrabold px-4 py-1.5 rounded-full tracking-widest uppercase mb-6 shadow-sm border border-emerald-100">
                        Sistem Antrean IGD RSUP Makassar
                    </div>
                    <h2 className="text-4xl sm:text-[2.75rem] font-black text-[#0f172a] mb-4 tracking-tight">Selamat Datang</h2>
                    <p className="text-base text-gray-500 font-medium">Silakan sentuh tombol di bawah sesuai dengan jenis layanan Anda.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 w-full max-w-4xl px-4">
                    {/* IGD Button */}
                    <motion.div
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-white rounded-[32px] p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-gray-50 flex flex-col items-center text-center transition-all cursor-pointer group"
                        onClick={() => handleTakeQueue('IGD')}
                    >
                        <div className="w-24 h-24 bg-[#ecfdf5] rounded-[24px] flex items-center justify-center mb-8 group-hover:scale-105 transition-transform">
                            <HeartPulse size={40} className="text-[#059669]" />
                        </div>
                        <h3 className="text-2xl font-black text-[#0f172a] mb-3">PASIEN IGD</h3>
                        <p className="text-sm text-gray-400 font-medium mb-10 px-4">Pendaftaran Pasien Reguler.</p>

                        <button className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-4 rounded-2xl font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-3">
                            AMBIL ANTREAN IGD
                        </button>
                    </motion.div>

                    {/* Emergency Button */}
                    <motion.div
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-white rounded-[32px] p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-gray-50 flex flex-col items-center text-center transition-all cursor-pointer group"
                        onClick={() => handleTakeQueue('EMERGENCY')}
                    >
                        <div className="w-24 h-24 bg-[#fef2f2] rounded-[24px] flex items-center justify-center mb-8 group-hover:scale-105 transition-transform">
                            <Siren size={40} className="text-[#dc2626]" />
                        </div>
                        <h3 className="text-2xl font-black text-[#0f172a] mb-3">PASIEN EMERGENCY</h3>
                        <p className="text-sm text-gray-400 font-medium mb-10 px-4">Pendaftaran Pasien Darurat.</p>

                        <button className="w-full bg-[#ef4444] hover:bg-[#dc2626] text-white py-4 rounded-2xl font-bold text-sm tracking-wide shadow-lg shadow-red-500/25 transition-all flex items-center justify-center gap-3">
                            AMBIL ANTREAN EMERGENCY
                        </button>
                    </motion.div>
                </div>
            </main>

            <footer className="py-6 text-center z-10">
                <p className="text-[10px] font-bold text-gray-300 tracking-widest uppercase">
                    © 2026 RSUP MAKASSAR. ALL RIGHTS RESERVED. SISTEM INFORMASI MANAJEMEN RUMAH SAKIT.
                </p>
            </footer>

            {/* Logout Confirmation Modal */}
            <AnimatePresence>
                {showLogoutConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/40 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
                        >
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <LogOut size={32} className="text-red-600 ml-1" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Keluar Sistem?</h3>
                            <p className="text-sm font-medium text-gray-500 mb-8">Apakah Anda yakin ingin keluar dari Kiosk Antrean?</p>
                            <div className="flex gap-4 w-full">
                                <button 
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="flex-1 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={confirmLogout}
                                    className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                                >
                                    Ya, Keluar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
