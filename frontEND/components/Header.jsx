'use client';
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Clock, Maximize, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/utils/basePath";

const Header = ({ 
    title = "RSUP MAKASSAR", 
    subtitle = "INSTALASI GAWAT DARURAT",
    onLogout
}) => {
    const router = useRouter();
    const [currentTime, setCurrentTime] = useState(null);

    useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.log(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogoutClick = () => {
        if (onLogout) {
            onLogout();
        } else {
            setShowLogoutConfirm(true);
        }
    };

    const confirmLogout = () => {
        setShowLogoutConfirm(false);
        if (onLogout) {
            onLogout();
        } else {
            router.push('/');
        }
    };

    // Format Date
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
        <>
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
            <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between py-5 sm:py-6 gap-4">
                {/* Left side: Logo & Title */}
                <div className="flex items-center gap-4">
                    <Image src={withBasePath('/RSUP.png')} alt="Logo" width={150} height={45} className="w-auto h-10 sm:h-12" priority />
                    <div className="hidden sm:block h-10 w-px bg-gray-300 mx-1" />
                    <div className="flex flex-col justify-center">
                        <h1 className="text-base sm:text-xl font-bold text-gray-900 leading-tight tracking-wide">{title}</h1>
                        <p className="text-xs sm:text-sm font-bold text-[#1f87e8] leading-tight mt-0.5 uppercase">{subtitle}</p>
                    </div>
                </div>

                {/* Right side: DateTime & Controls */}
                <div className="flex items-center gap-3">
                    {/* Date */}
                    <div className="hidden sm:flex flex-col items-end justify-center mr-2 lg:mr-4">
                        <span className="text-xs sm:text-sm font-extrabold text-[#1f87e8] tracking-widest">{dayName}</span>
                        <span className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">{dateText}</span>
                    </div>

                    {/* Time Box */}
                    <div className="flex items-center gap-2 bg-[#1f87e8] text-white px-3 sm:px-4 py-2 rounded-xl font-bold text-base sm:text-lg shadow-sm">
                        <Clock size={18} className="sm:w-5 sm:h-5" />
                        <span>{timeText}</span>
                    </div>

                    {/* Fullscreen Button */}
                    <button 
                        onClick={toggleFullscreen}
                        className="p-2 sm:p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl border border-gray-200 transition-colors sm:ml-2"
                        title="Toggle Fullscreen"
                    >
                        <Maximize size={18} className="sm:w-5 sm:h-5" />
                    </button>

                    {/* Logout Button */}
                    <button 
                        onClick={handleLogoutClick}
                        className="p-2 sm:p-2.5 bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-xl border border-gray-200 transition-colors"
                        title="Logout"
                    >
                        <LogOut size={18} className="sm:w-5 sm:h-5" />
                    </button>
                </div>
            </div>
        </header>
            
            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <LogOut size={32} className="text-red-600 ml-1" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Keluar Sistem?</h3>
                        <p className="text-sm font-medium text-gray-500 mb-8">Apakah Anda yakin ingin keluar dari halaman ini?</p>
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
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
