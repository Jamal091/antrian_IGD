'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Lock, User, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { withBasePath } from '@/utils/basePath';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage('');

        try {
            // Coba cek ke database backend (untuk Admin/Petugas DB)
            const API_URL = typeof window !== 'undefined' ? `http://${window.location.hostname}:5000` : 'http://localhost:5000';
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Username atau password tidak sesuai');
            }

            // Simpan token untuk admin atau petugas
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            if (data.user.role === 'Admin') {
                router.push('/admin/dashboard');
            } else {
                // Tentukan nama loket berdasarkan Role
                let counterName = `Loket ${data.user.username.toUpperCase()}`;
                if (data.user.role === 'Loket IGD') counterName = 'Loket IGD';
                else if (data.user.role === 'Loket Rawat Inap') counterName = 'Loket Rawat Inap';

                window.sessionStorage.setItem('callerSession', JSON.stringify({
                    username: data.user.username,
                    name: `Petugas ${data.user.username}`,
                    counterName: counterName,
                }));
                router.push('/caller');
            }

        } catch (error) {
            setErrorMessage(error.message || 'Username atau password tidak sesuai');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f0f5f5] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-96 bg-[#00b7ad] rounded-b-[100px] shadow-lg transform -translate-y-20 z-0"></div>

            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 relative z-10 border border-gray-100"
            >
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-white p-3 rounded-2xl shadow-sm mb-4 border border-gray-100">
                        <Image src={withBasePath('/RSUP.png')} alt="Logo RSUP Makassar" width={200} height={60} priority className="w-40 sm:w-48 h-auto" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 text-center">Login Sistem Antrian</h1>
                    <p className="text-sm font-semibold text-[#00b7ad] mt-1 text-center uppercase tracking-wide">Instalasi Gawat Darurat</p>
                    {errorMessage && (
                        <p className="mt-4 text-sm font-bold text-red-600 bg-red-50 border border-red-100 px-4 py-2 rounded-xl text-center">
                            {errorMessage}
                        </p>
                    )}
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Username</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <User size={18} className="text-gray-400" />
                            </div>
                            <input 
                                type="text" 
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00b7ad] focus:border-transparent transition-all outline-none text-gray-800 font-medium"
                                placeholder="Masukkan username"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock size={18} className="text-gray-400" />
                            </div>
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00b7ad] focus:border-transparent transition-all outline-none text-gray-800 font-medium"
                                placeholder="Masukkan password"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-3.5 mt-4 bg-[#00b7ad] hover:bg-[#009e95] active:bg-[#008c84] text-white rounded-xl font-bold shadow-lg shadow-[#00b7ad]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {loading ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                            />
                        ) : (
                            <>
                                <LogIn size={20} />
                                Masuk ke Panel
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center text-sm font-medium">
                    <button 
                        onClick={() => router.push('/overview')}
                        className="text-gray-500 hover:text-[#00b7ad] transition-colors"
                    >
                        Lihat TV Display
                    </button>
                    <button 
                        onClick={() => router.push('/kiosk')}
                        className="text-gray-500 hover:text-[#00b7ad] transition-colors"
                    >
                        Buka Mesin Kiosk
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
