'use client';

import React, { useEffect, useState } from "react";
import StatCard from "@/components/StatCard";
import { Bed, Sidebar } from "lucide-react";
import { motion } from "framer-motion";
import KamarTabel from "@/components/KamarTabel";
import QueueDisplay from "@/components/QueueDisplay";
import Header from "@/components/Header";

const Overview = () => {
    const [overviewData, setOverviewData] = useState([]);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}ruang_kamar_tidur/dashboard`)
            .then((response) => response.json())
            .then((data) => {
                console.log('=== RAW API DATA ===');
                console.log(data);
                console.log('===================');

                // Verification
                console.log('\n=== VERIFIKASI DATA ===');
                console.log('VVIP: Total=' + data.jumlah_kamar_vvip + ', Tersedia=' + data.kamar_vvip_tersedia + ', Terpesan=' + data.kamar_vvip_terpesan + ', Terisi=' + data.kamar_vvip_terisi);
                console.log('VIP: Total=' + data.jumlah_kamar_vip + ', Tersedia=' + data.kamar_vip_tersedia + ', Terpesan=' + data.kamar_vip_terpesan + ', Terisi=' + data.kamar_vip_terisi);
                console.log('President: Total=' + data.jumlah_kamar_president + ', Tersedia=' + data.kamar_president_tersedia + ', Terpesan=' + data.kamar_president_terpesan + ', Terisi=' + data.kamar_president_terisi);
                console.log('Kelas: Total=' + data.jumlah_kamar_kelas + ', Tersedia=' + data.kamar_kelas_tersedia + ', Terpesan=' + data.kamar_kelas_terpesan + ', Terisi=' + data.kamar_kelas_terisi);

                const checkVVIP = (parseInt(data.kamar_vvip_tersedia) || 0) + (parseInt(data.kamar_vvip_terpesan) || 0) + (parseInt(data.kamar_vvip_terisi) || 0);
                const checkVIP = (parseInt(data.kamar_vip_tersedia) || 0) + (parseInt(data.kamar_vip_terpesan) || 0) + (parseInt(data.kamar_vip_terisi) || 0);
                const checkPresident = (parseInt(data.kamar_president_tersedia) || 0) + (parseInt(data.kamar_president_terpesan) || 0) + (parseInt(data.kamar_president_terisi) || 0);
                const checkKelas = (parseInt(data.kamar_kelas_tersedia) || 0) + (parseInt(data.kamar_kelas_terpesan) || 0) + (parseInt(data.kamar_kelas_terisi) || 0);

                console.log('\n=== CHECK (Tersedia + Terpesan + Terisi) ===');
                console.log('VVIP: ' + data.kamar_vvip_tersedia + ' + ' + data.kamar_vvip_terpesan + ' + ' + data.kamar_vvip_terisi + ' = ' + checkVVIP + ' (Total: ' + data.jumlah_kamar_vvip + ') ' + (checkVVIP == data.jumlah_kamar_vvip ? '✓ MATCH' : '✗ MISMATCH'));
                console.log('VIP: ' + data.kamar_vip_tersedia + ' + ' + data.kamar_vip_terpesan + ' + ' + data.kamar_vip_terisi + ' = ' + checkVIP + ' (Total: ' + data.jumlah_kamar_vip + ') ' + (checkVIP == data.jumlah_kamar_vip ? '✓ MATCH' : '✗ MISMATCH'));
                console.log('President: ' + data.kamar_president_tersedia + ' + ' + data.kamar_president_terpesan + ' + ' + data.kamar_president_terisi + ' = ' + checkPresident + ' (Total: ' + data.jumlah_kamar_president + ') ' + (checkPresident == data.jumlah_kamar_president ? '✓ MATCH' : '✗ MISMATCH'));
                console.log('Kelas: ' + data.kamar_kelas_tersedia + ' + ' + data.kamar_kelas_terpesan + ' + ' + data.kamar_kelas_terisi + ' = ' + checkKelas + ' (Total: ' + data.jumlah_kamar_kelas + ') ' + (checkKelas == data.jumlah_kamar_kelas ? '✓ MATCH' : '✗ MISMATCH'));
                console.log('=========================');

                setOverviewData(data)
            })
            .catch((error) => console.error('Error fetching overview data:', error));
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            fetch(`${process.env.NEXT_PUBLIC_API_URL}ruang_kamar_tidur/dashboard`)
                .then(response => response.json())
                .then(data => setOverviewData(data))
                .catch(error => console.error('Error fetching Kamar data:', error));
        }, 10000); // fetch every 10 seconds

        return () => clearInterval(interval);
    }, []);


    return (
        <div className="flex-1 overflow-auto relative z-10">
            <div className="w-full mx-auto">
                <Header />

                <main className="w-full mx-auto py-4 px-4 lg:px-8 gap-4">
                    <motion.div
                        className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1 }}
                    >
                        <StatCard
                            name="KRIS (BPJS)"
                            icon={Bed}
                            value={overviewData.jumlah_kamar_kelas}
                            value1={overviewData.kamar_kelas_tersedia}
                            value2={overviewData.kamar_kelas_terisi}
                            value3={overviewData.kamar_kelas_terpesan}
                            background={'bg-emerald-300'}
                            backgroundImage={'/kamar4.jpg'}
                        />
                        <StatCard
                            name="VIP"
                            icon={Bed}
                            value={overviewData.jumlah_kamar_vip}
                            value1={overviewData.kamar_vip_tersedia}
                            value2={overviewData.kamar_vip_terisi}
                            value3={overviewData.kamar_vip_terpesan}
                            background={'bg-sky-500'}
                            backgroundImage={'/kamar3.jpg'}
                        />
                        <StatCard
                            name="VVIP"
                            icon={Bed}
                            value={overviewData.jumlah_kamar_vvip}
                            value1={overviewData.kamar_vvip_tersedia}
                            value2={overviewData.kamar_vvip_terisi}
                            value3={overviewData.kamar_vvip_terpesan}
                            background={'bg-indigo-500'}
                            backgroundImage={'/kamar2.jpg'}
                        />
                        <StatCard
                            name="President Suite"
                            icon={Bed}
                            value={overviewData.jumlah_kamar_president}
                            value1={overviewData.kamar_president_tersedia}
                            value2={overviewData.kamar_president_terisi}
                            value3={overviewData.kamar_president_terpesan}
                            background={'bg-amber-500'}
                            backgroundImage={'/kamar1.jpg'}
                        />

                    </motion.div>

                    <motion.div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-2">
                        <div className="lg:col-span-1">
                            <KamarTabel />
                        </div>
                        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <QueueDisplay loketName="Loket IGD" />
                            <QueueDisplay loketName="Loket Rawat Inap" />
                        </div>
                    </motion.div>

                </main>

            </div>
        </div>

    );
};

export default Overview;