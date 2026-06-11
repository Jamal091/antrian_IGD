'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Printer } from 'lucide-react';

function TicketContent() {
    const searchParams = useSearchParams();
    const type = searchParams.get('type') || 'IGD';
    const number = searchParams.get('number') || 'I-001';
    const timeParam = searchParams.get('time');
    
    const [dateTime, setDateTime] = useState(new Date());

    useEffect(() => {
        if (timeParam) {
            setDateTime(new Date(parseInt(timeParam)));
        }
    }, [timeParam]);

    // Auto-print logic
    useEffect(() => {
        const timer = setTimeout(() => {
            const originalTitle = document.title;
            document.title = "Tiket Antrean RSUP Makassar"; // Clearer title for print job
            window.print();
            document.title = originalTitle;
            
            // Close the tab after printing (or if user cancels)
            window.onafterprint = () => window.close();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const formatDate = (date) => {
        return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
    };

    const formatTime = (date) => {
        return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date) + ' WITA';
    };

    return (
        <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center p-4">
            <style>{`
                @media print {
                    @page { margin: 0; }
                    body { margin: 0; background: white; }
                    .no-print { display: none !important; }
                    .print-container {
                        margin: 0 !important;
                        padding: 20px !important;
                        width: 100% !important;
                        max-width: none !important;
                    }
                    #ticket-preview {
                        box-shadow: none !important;
                        border: none !important;
                        width: 100% !important;
                        max-width: 320px !important;
                        margin: 0 auto !important;
                    }
                }
            `}</style>
            
            <div className="print-container flex flex-col items-center gap-8 w-full max-w-md">
                <div className="relative bg-white w-[320px] shadow-2xl rounded-lg overflow-hidden flex flex-col transform transition-transform" id="ticket-preview">
                    <div className="absolute inset-0 bg-gradient-to-b from-white to-gray-50 pointer-events-none"></div>
                    <div className="relative z-10 p-6 flex flex-col items-center text-center gap-1">
                        <div className="flex items-center gap-2 mb-2 opacity-90">
                            <p className="text-base font-bold text-gray-800 uppercase tracking-widest">RSUP MAKASSAR</p>
                        </div>
                        <div className="w-full border-y-2 border-dashed border-gray-200 py-6 mb-6">
                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Nomor Antrean</p>
                            <h3 className="text-7xl font-black text-black tracking-tighter leading-none mb-1">
                                {number}
                            </h3>
                            <div className="mt-4 inline-block px-4 py-1.5 rounded-full text-xs font-bold text-black uppercase tracking-wider border-2 border-black">
                                {type === 'IGD' ? 'PASIEN IGD' : 'PASIEN EMERGENCY'}
                            </div>
                        </div>
                        
                        <div className="w-full flex justify-between text-xs text-gray-500 mb-6 px-2">
                            <div className="flex flex-col items-start gap-1">
                                <span className="uppercase tracking-wide text-[10px]">Tanggal</span>
                                <span className="font-bold text-gray-800 text-sm">{formatDate(dateTime)}</span>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="uppercase tracking-wide text-[10px]">Waktu</span>
                                <span className="font-bold text-gray-800 text-sm">{formatTime(dateTime)}</span>
                            </div>
                        </div>
                        <div className="bg-gray-100 w-full p-3 rounded mb-2 border border-gray-200">
                            <p className="text-xs text-gray-700 font-medium leading-relaxed">
                                Silakan tunggu di ruang tunggu IGD. Nomor Anda akan dipanggil oleh petugas admisi.
                            </p>
                        </div>
                    </div>
                    {/* Zigzag bottom edge */}
                    <div className="h-4 bg-white w-full absolute bottom-0 left-0" style={{ clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)' }}></div>
                </div>

                <div className="no-print flex flex-col items-center gap-4 text-center">
                    <p className="text-sm text-gray-500 max-w-xs">
                        Tiket siap dicetak secara otomatis.
                        Tab ini akan otomatis tertutup jika dialog cetak selesai.
                    </p>
                    <div className="flex gap-4">
                        <button
                            className="flex items-center justify-center gap-2 bg-gray-500 text-white hover:bg-gray-600 px-6 py-3 rounded-full font-bold shadow-lg transition-all"
                            onClick={() => window.close()}
                        >
                            Batal & Tutup
                        </button>
                        <button
                            className="flex items-center justify-center gap-2 bg-emerald-500 text-white hover:bg-emerald-600 px-6 py-3 rounded-full font-bold shadow-lg shadow-emerald-500/20 transition-all"
                            onClick={() => window.print()}
                        >
                            <Printer size={20} />
                            Cetak Ulang
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function TicketPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center min-h-screen font-bold text-gray-500">Memuat Tiket...</div>}>
            <TicketContent />
        </Suspense>
    );
}
