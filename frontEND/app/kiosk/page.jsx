'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, LogOut, Maximize, Pill, FlaskConical, Clock, HandMetal, Pointer, HeartPulse, Siren, Bed, Download, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toPng } from 'html-to-image';
import { createTicket } from '@/utils/antrianApi';
import { withBasePath } from '@/utils/basePath';

export default function KioskPage() {
    const router = useRouter();
    const [currentTime, setCurrentTime] = useState(null);
    const [printingTicket, setPrintingTicket] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    const [ticketData, setTicketData] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const ticketRef = useRef(null);

    useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);



    const handleTakeQueue = async (type) => {
        if (printingTicket) return;

        setErrorMessage('');
        setPrintingTicket(type);

        try {
            const ticket = await createTicket(type);
            setTicketData(ticket);
        } catch (error) {
            setErrorMessage(error.message || 'Gagal mengambil nomor antrean');
        } finally {
            setPrintingTicket(null);
        }
    };

    const handleDownloadTicket = async () => {
        if (!ticketRef.current || downloading) return;
        setDownloading(true);
        try {
            const dataUrl = await toPng(ticketRef.current, {
                cacheBust: true,
                pixelRatio: 2,
                backgroundColor: '#ffffff'
            });
            const link = document.createElement('a');
            link.download = `Tiket-Antrean-${ticketData.number}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Failed to download ticket', err);
            alert('Gagal mengunduh tiket. Silakan coba lagi.');
        } finally {
            setDownloading(false);
        }
    };

    const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    const dayName = currentTime ? days[currentTime.getDay()] : '';
    const dateText = currentTime
        ? `${currentTime.getDate()} ${months[currentTime.getMonth()]} ${currentTime.getFullYear()}`
        : '';
    const timeText = currentTime
        ? `${String(currentTime.getHours()).padStart(2, '0')}.${String(currentTime.getMinutes()).padStart(2, '0')} WITA`
        : '--.--';

    return (
        <div className="h-[100dvh] bg-[#fafafa] flex flex-col relative overflow-hidden select-none font-sans">
            {/* Header */}
            <header className="bg-white px-4 md:px-6 py-3 md:py-4 flex justify-between items-center z-10 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-3 md:gap-5">
                    <Image src={withBasePath('/RSUP.png')} alt="Logo" width={180} height={50} className="w-auto h-8 md:h-10" priority />
                    <div className="h-8 md:h-10 w-px bg-gray-200 hidden sm:block" />
                    <div className="flex-col justify-center hidden sm:flex">
                        <h1 className="text-xs md:text-sm lg:text-base font-extrabold text-[#1e293b] tracking-wide">RSUP MAKASSAR</h1>
                        <p className="text-[9px] md:text-[11px] font-semibold text-gray-400 uppercase tracking-widest mt-0.5">INSTALASI GAWAT DARURAT</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <div className="flex flex-col items-end justify-center mr-1 md:mr-2">
                        <span className="text-[8px] md:text-[10px] font-extrabold text-gray-400 tracking-widest uppercase">{dayName}</span>
                        <span className="text-[10px] md:text-xs font-bold text-gray-700">{dateText}</span>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2 bg-[#f4f6f9] px-2 md:px-4 py-1.5 md:py-2.5 rounded-lg md:rounded-xl border border-gray-100">
                        <Clock className="text-[#3b82f6] w-3 h-3 md:w-4 md:h-4" />
                        <span className="text-xs md:text-base font-black text-[#1e293b]">{timeText}</span>
                    </div>

                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 md:p-8 z-10 w-full max-w-6xl mx-auto overflow-hidden">
                <div className="text-center mb-3 sm:mb-6 md:mb-10 flex flex-col items-center shrink-0">
                    <h2 className="text-xl sm:text-3xl md:text-[2.75rem] font-black text-[#0f172a] mb-1 sm:mb-2 md:mb-4 tracking-tight">
                        {ticketData ? 'Tiket Anda' : 'Selamat Datang'}
                    </h2>
                    <p className="text-sm md:text-base text-gray-500 font-medium px-4">
                        {ticketData ? 'Ini adalah tiket elektronik Anda. Unduh atau tunjukkan di loket.' : 'Silakan sentuh tombol di bawah sesuai dengan jenis layanan Anda.'}
                    </p>
                    {errorMessage && (
                        <p className="mt-4 text-xs md:text-sm font-bold text-red-600 bg-red-50 border border-red-100 px-4 py-2 rounded-xl">
                            {errorMessage}
                        </p>
                    )}
                </div>

                {ticketData ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center w-full max-w-[300px] md:max-w-[320px] mx-auto mt-0 sm:mt-2 h-full justify-center pb-2"
                    >
                        {/* Ticket Content */}
                        <div
                            ref={ticketRef}
                            className="bg-white w-full shadow-2xl rounded-[20px] md:rounded-[24px] overflow-hidden flex flex-col relative shrink-0"
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-white to-gray-50 pointer-events-none"></div>
                            <div className="relative z-10 p-6 flex flex-col items-center text-center gap-1">
                                <div className="flex items-center gap-2 mb-2 opacity-90">
                                    <p className="text-base font-bold text-gray-800 uppercase tracking-widest">RSUP MAKASSAR</p>
                                </div>
                                <div className="w-full border-y-2 border-dashed border-gray-200 py-4 md:py-6 mb-4 md:mb-6">
                                    <p className="text-[10px] md:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1 md:mb-2">Nomor Antrean</p>
                                    <h3 className="text-6xl md:text-7xl font-black text-black tracking-tighter leading-none mb-1">
                                        {ticketData.number}
                                    </h3>
                                    <div className="mt-2 md:mt-4 inline-block px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold text-black uppercase tracking-wider border-2 border-black">
                                        {ticketData.label || ticketData.type}
                                    </div>
                                </div>

                                <div className="w-full flex justify-between text-xs text-gray-500 mb-4 md:mb-6 px-2">
                                    <div className="flex flex-col items-start gap-1">
                                        <span className="uppercase tracking-wide text-[10px]">Tanggal</span>
                                        <span className="font-bold text-gray-800 text-sm">
                                            {new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(ticketData.created_at || Date.now()))}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="uppercase tracking-wide text-[10px]">Waktu</span>
                                        <span className="font-bold text-gray-800 text-sm">
                                            {new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(ticketData.created_at || Date.now()))} WITA
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-gray-100 w-full p-2 md:p-3 rounded-lg md:rounded-xl mb-4 md:mb-6 border border-gray-200">
                                    <p className="text-[10px] md:text-xs text-gray-700 font-medium leading-relaxed">
                                        Silakan tunggu di ruang tunggu. Nomor Anda akan dipanggil petugas.
                                    </p>
                                </div>
                            </div>
                            {/* Zigzag bottom edge manually implemented using clip-path */}
                            <div className="h-4 bg-white w-full absolute bottom-0 left-0" style={{ clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)' }}></div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-row md:flex-col gap-2 md:gap-3 w-full mt-4 md:mt-8 px-1 shrink-0">
                            <button
                                onClick={handleDownloadTicket}
                                disabled={downloading}
                                className="flex-1 md:w-full py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-white bg-[#3b82f6] hover:bg-[#2563eb] transition-colors shadow-[0_4px_15px_-5px_rgba(59,130,246,0.5)] flex items-center justify-center gap-1.5 md:gap-2 disabled:opacity-50 text-[11px] md:text-base"
                            >
                                {downloading ? 'Menyimpan...' : <><Download size={16} className="md:w-[18px] md:h-[18px]" /> Unduh ke HP</>}
                            </button>
                            <button
                                onClick={() => setTicketData(null)}
                                className="flex-1 md:w-full py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-[0_4px_15px_-5px_rgba(0,0,0,0.1)] flex items-center justify-center gap-1.5 md:gap-2 border border-gray-200 text-[11px] md:text-base"
                            >
                                Antrean Baru
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <div className="flex flex-col md:grid md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 lg:gap-12 w-full max-w-6xl px-4 sm:px-6 md:px-4 shrink-0 flex-1 justify-center pb-4">
                        {/* IGD Button */}
                        <motion.div
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-white rounded-[24px] md:rounded-[32px] p-5 sm:p-6 md:p-8 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08)] border border-gray-50 flex flex-row md:flex-col items-center md:text-center transition-all cursor-pointer group flex-1"
                            onClick={() => handleTakeQueue('IGD')}
                        >
                            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 shrink-0 bg-[#ecfdf5] rounded-[16px] md:rounded-[24px] flex items-center justify-center mb-0 md:mb-8 mr-4 sm:mr-6 md:mr-0 group-hover:scale-105 transition-transform">
                                <HeartPulse className="w-8 h-8 sm:w-10 sm:h-10 text-[#059669]" />
                            </div>
                            <div className="flex-1 text-left md:text-center flex flex-col justify-center">
                                <h3 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 md:mb-3 leading-tight">PASIEN IGD</h3>
                                <p className="text-[11px] sm:text-xs md:text-sm text-gray-400 font-medium mb-3 md:mb-10 px-0 md:px-4 block">Pendaftaran Pasien Reguler.</p>

                                <button
                                    disabled={Boolean(printingTicket)}
                                    className="w-full md:w-auto mt-1 sm:mt-0 bg-[#10b981] hover:bg-[#059669] text-white py-3 sm:py-3.5 md:py-4 px-4 md:px-8 rounded-xl md:rounded-2xl font-bold text-xs sm:text-sm tracking-wide shadow-md md:shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 md:gap-3 disabled:opacity-50 disabled:cursor-wait"
                                >
                                    {printingTicket === 'IGD' ? 'MENCETAK...' : 'AMBIL ANTREAN'}
                                </button>
                            </div>
                        </motion.div>

                        {/* Emergency Button */}
                        <motion.div
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-white rounded-[24px] md:rounded-[32px] p-5 sm:p-6 md:p-8 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08)] border border-gray-50 flex flex-row md:flex-col items-center md:text-center transition-all cursor-pointer group flex-1"
                            onClick={() => handleTakeQueue('EMERGENCY')}
                        >
                            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 shrink-0 bg-[#fef2f2] rounded-[16px] md:rounded-[24px] flex items-center justify-center mb-0 md:mb-8 mr-4 sm:mr-6 md:mr-0 group-hover:scale-105 transition-transform">
                                <Siren className="w-8 h-8 sm:w-10 sm:h-10 text-[#dc2626]" />
                            </div>
                            <div className="flex-1 text-left md:text-center flex flex-col justify-center">
                                <h3 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 md:mb-3 leading-tight">EMERGENCY</h3>
                                <p className="text-[11px] sm:text-xs md:text-sm text-gray-400 font-medium mb-3 md:mb-10 px-0 md:px-4 block">Pendaftaran Pasien Darurat.</p>

                                <button
                                    disabled={Boolean(printingTicket)}
                                    className="w-full md:w-auto mt-1 sm:mt-0 bg-[#ef4444] hover:bg-[#dc2626] text-white py-3 sm:py-3.5 md:py-4 px-4 md:px-8 rounded-xl md:rounded-2xl font-bold text-xs sm:text-sm tracking-wide shadow-md md:shadow-lg shadow-red-500/25 transition-all flex items-center justify-center gap-2 md:gap-3 disabled:opacity-50 disabled:cursor-wait"
                                >
                                    {printingTicket === 'EMERGENCY' ? 'MENCETAK...' : 'AMBIL ANTREAN'}
                                </button>
                            </div>
                        </motion.div>

                        {/* Rawat Inap Button */}
                        <motion.div
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-white rounded-[24px] md:rounded-[32px] p-5 sm:p-6 md:p-8 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08)] border border-gray-50 flex flex-row md:flex-col items-center md:text-center transition-all cursor-pointer group flex-1"
                            onClick={() => handleTakeQueue('RANAP')}
                        >
                            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 shrink-0 bg-[#eff6ff] rounded-[16px] md:rounded-[24px] flex items-center justify-center mb-0 md:mb-8 mr-4 sm:mr-6 md:mr-0 group-hover:scale-105 transition-transform">
                                <Bed className="w-8 h-8 sm:w-10 sm:h-10 text-[#3b82f6]" />
                            </div>
                            <div className="flex-1 text-left md:text-center flex flex-col justify-center">
                                <h3 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 md:mb-3 leading-tight">RAWAT INAP</h3>
                                <p className="text-[11px] sm:text-xs md:text-sm text-gray-400 font-medium mb-3 md:mb-10 px-0 md:px-4 block">Pendaftaran Pasien Rawat Inap.</p>

                                <button
                                    disabled={Boolean(printingTicket)}
                                    className="w-full md:w-auto mt-1 sm:mt-0 bg-[#3b82f6] hover:bg-[#2563eb] text-white py-3 sm:py-3.5 md:py-4 px-4 md:px-8 rounded-xl md:rounded-2xl font-bold text-xs sm:text-sm tracking-wide shadow-md md:shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 md:gap-3 disabled:opacity-50 disabled:cursor-wait"
                                >
                                    {printingTicket === 'RANAP' ? 'MENCETAK...' : 'AMBIL ANTREAN'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </main>
            <footer className="py-2 sm:py-4 md:py-6 text-center z-10 shrink-0">
                <p className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-gray-300 tracking-widest uppercase px-4 leading-relaxed">
                    © 2026 SIMRS RSUP MAKASSAR. ALL RIGHTS RESERVED.
                </p>
            </footer>
        </div>
    );
}
