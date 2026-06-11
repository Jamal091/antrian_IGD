"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const KamarTabel = () => {
    const [Kamar, setKamar] = useState([]);

    useEffect(() => {
        const fetchKamarData = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}ruang_kamar_tidur/dashboard`);
                const data = await response.json();
                console.log('Data Kamar:', data);
                setKamar(data);
            } catch (error) {
                console.error('Error fetching Kamar data:', error);
            }
        };

        fetchKamarData();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            fetch(`${process.env.NEXT_PUBLIC_API_URL}ruang_kamar_tidur/dashboard`)
                .then(response => response.json())
                .then(data => setKamar(data))
                .catch(error => console.error('Error fetching Kamar data:', error));
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            className="bg-white/90 backdrop-blur-md shadow-lg rounded-xl p-4 md:p-6 border border-[#00b7ad] mx-2 md:mx-0 mb-0 overflow-hidden flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
        >
            <h2 className="text-lg sm:text-xl font-bold text-[#00b7ad] mb-4 text-center">
                Daftar Kamar Tidur
            </h2>

            <div className="relative z-10 overflow-x-auto rounded-lg flex-1">
                <table className="w-full text-xs sm:text-sm md:text-base text-left text-gray-800 h-full">
                    <thead className="text-xs sm:text-sm md:text-base text-white uppercase bg-[#00b7ad]">
                        <tr>
                            <th className="px-2 sm:px-4 py-3 font-bold text-center w-12">No</th>
                            <th className="px-2 sm:px-4 py-3 font-bold text-center">Jenis Kamar</th>
                            <th className="px-2 sm:px-4 py-3 font-bold text-center">Tersedia</th>
                            <th className="px-2 sm:px-4 py-3 font-bold text-center">Terpesan</th>
                            <th className="px-2 sm:px-4 py-3 font-bold text-center">Terisi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        <tr className="bg-emerald-50 hover:bg-emerald-100 transition duration-300">
                            <td className="px-2 sm:px-4 py-3 font-semibold text-center">1</td>
                            <td className="px-2 sm:px-4 py-3 font-semibold">BPJS / KRIS</td>
                            <td className="px-2 sm:px-4 py-3 font-bold text-center text-green-600">{Kamar?.kamar_kelas_tersedia ?? '-'}</td>
                            <td className="px-2 sm:px-4 py-3 font-bold text-center text-yellow-600">{Kamar?.kamar_kelas_terpesan ?? '-'}</td>
                            <td className="px-2 sm:px-4 py-3 font-bold text-center text-red-600">{Kamar?.kamar_kelas_terisi ?? '-'}</td>
                        </tr>
                        <tr className="bg-sky-50 hover:bg-sky-100 transition duration-300">
                            <td className="px-2 sm:px-4 py-3 font-semibold text-center">2</td>
                            <td className="px-2 sm:px-4 py-3 font-semibold">VIP</td>
                            <td className="px-2 sm:px-4 py-3 font-bold text-center text-green-600">{Kamar?.kamar_vip_tersedia ?? '-'}</td>
                            <td className="px-2 sm:px-4 py-3 font-bold text-center text-yellow-600">{Kamar?.kamar_vip_terpesan ?? '-'}</td>
                            <td className="px-2 sm:px-4 py-3 font-bold text-center text-red-600">{Kamar?.kamar_vip_terisi ?? '-'}</td>
                        </tr>
                        <tr className="bg-indigo-50 hover:bg-indigo-100 transition duration-300">
                            <td className="px-2 sm:px-4 py-3 font-semibold text-center">3</td>
                            <td className="px-2 sm:px-4 py-3 font-semibold">VVIP</td>
                            <td className="px-2 sm:px-4 py-3 font-bold text-center text-green-600">{Kamar?.kamar_vvip_tersedia ?? '-'}</td>
                            <td className="px-2 sm:px-4 py-3 font-bold text-center text-yellow-600">{Kamar?.kamar_vvip_terpesan ?? '-'}</td>
                            <td className="px-2 sm:px-4 py-3 font-bold text-center text-red-600">{Kamar?.kamar_vvip_terisi ?? '-'}</td>
                        </tr>
                        <tr className="bg-amber-50 hover:bg-amber-100 transition duration-300">
                            <td className="px-2 sm:px-4 py-3 font-semibold text-center">4</td>
                            <td className="px-2 sm:px-4 py-3 font-semibold">President Suite</td>
                            <td className="px-2 sm:px-4 py-3 font-bold text-center text-green-600">{Kamar?.kamar_president_tersedia ?? '-'}</td>
                            <td className="px-2 sm:px-4 py-3 font-bold text-center text-yellow-600">{Kamar?.kamar_president_terpesan ?? '-'}</td>
                            <td className="px-2 sm:px-4 py-3 font-bold text-center text-red-600">{Kamar?.kamar_president_terisi ?? '-'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

export default KamarTabel;