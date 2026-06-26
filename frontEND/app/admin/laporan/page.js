'use client';

import { useState, useEffect } from 'react';
import { Download, Calendar, Users, CheckCircle, Clock, Volume2, UserPlus, Activity, FileSpreadsheet, Loader2 } from 'lucide-react';
import PageHeader from '../../../components/PageHeader';

export default function LaporanPage() {
  const [filterMode, setFilterMode] = useState('Hari Ini');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loket, setLoket] = useState('Semua Loket');
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Set initial dates based on filterMode
  useEffect(() => {
    if (filterMode === 'Custom') return;

    const today = new Date();
    const tzOffset = 8 * 60 * 60 * 1000; // WITA
    const getLocalISODate = (d) => new Date(d.getTime() + tzOffset).toISOString().split('T')[0];
    
    let end = new Date();
    let start = new Date();

    if (filterMode === 'Hari Ini') {
      start = end;
    } else if (filterMode === '7 Hari') {
      start.setDate(end.getDate() - 6);
    } else if (filterMode === '30 Hari') {
      start.setDate(end.getDate() - 29);
    } else if (filterMode === '3 Bulan') {
      start.setMonth(end.getMonth() - 3);
    }

    setStartDate(getLocalISODate(start));
    setEndDate(getLocalISODate(end));
  }, [filterMode]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchLaporan();
    }
  }, [startDate, endDate, loket]);

  const fetchLaporan = async () => {
    setIsLoading(true);
    try {
      const API_URL = typeof window !== 'undefined' ? `http://${window.location.hostname}:5000` : 'http://localhost:5000';
      const res = await fetch(`${API_URL}/antrian/laporan?startDate=${startDate}&endDate=${endDate}&loket=${encodeURIComponent(loket)}`);
      if (res.ok) {
        const result = await res.json();
        setReportData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch laporan', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = async () => {
    if (!reportData || reportData.tickets.length === 0) return alert('Tidak ada data untuk diekspor');
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(reportData.tickets.map(t => ({
      'Tanggal': t.ticket_date,
      'Waktu Panggil': t.called_time || '-',
      'Nomor': t.number,
      'Jenis': t.type,
      'Status': t.status,
      'Loket': t.counter_name || '-'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Antrian");
    XLSX.writeFile(wb, `Laporan_Antrian_${startDate}_to_${endDate}.xlsx`);
  };

  const exportToPDF = async () => {
    if (!reportData || reportData.tickets.length === 0) return alert('Tidak ada data untuk diekspor');
    const jsPDFModule = await import('jspdf');
    await import('jspdf-autotable');
    const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF;
    const doc = new jsPDF();
    doc.text(`Laporan Antrian (${startDate} s/d ${endDate})`, 14, 15);
    doc.text(`Loket: ${loket}`, 14, 22);
    
    const tableData = reportData.tickets.map(t => [
      t.ticket_date, t.called_time || '-', t.number, t.type, t.status, t.counter_name || '-'
    ]);

    doc.autoTable({
      startY: 30,
      head: [['Tanggal', 'Waktu', 'Nomor', 'Jenis', 'Status', 'Loket']],
      body: tableData,
    });
    doc.save(`Laporan_Antrian_${startDate}_to_${endDate}.pdf`);
  };

  const completionRate = reportData?.total > 0 ? Math.round((reportData.selesai / reportData.total) * 100) : 0;
  const dashOffset = 251.2 - (251.2 * completionRate / 100);

  // Prepare Daily Trend Data
  const dailyDates = Object.keys(reportData?.trenHarian || {}).sort();
  const maxDaily = Math.max(...dailyDates.map(d => reportData.trenHarian[d].total), 1);

  if (!isMounted) {
    return <div className="flex-1 flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>;
  }

  return (
    <div className="flex flex-col gap-6 flex-1 h-full overflow-y-auto pb-8">
      <PageHeader 
        title="Laporan Antrian" 
        subtitle="Analisis traffic antrian dengan filter tanggal dan loket" 
      />

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-4 text-sm font-bold text-slate-600">
        <div className="flex gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
          {['Hari Ini', '7 Hari', '30 Hari', '3 Bulan'].map(mode => (
            <button 
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-4 py-2 rounded-lg transition-all ${filterMode === mode ? 'bg-white shadow-sm text-blue-600' : 'hover:text-slate-900'}`}
            >
              {mode}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-4 py-2.5 bg-white">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input type="date" value={startDate} onChange={(e) => {setStartDate(e.target.value); setFilterMode('Custom');}} className="bg-transparent border-none outline-none font-bold text-slate-700" />
          <span className="text-slate-300 mx-1">-</span>
          <input type="date" value={endDate} onChange={(e) => {setEndDate(e.target.value); setFilterMode('Custom');}} className="bg-transparent border-none outline-none font-bold text-slate-700" />
        </div>
        
        <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-4 py-2.5 bg-white">
          <span className="font-bold text-slate-700 cursor-pointer text-center">
            <select value={loket} onChange={e => setLoket(e.target.value)} className="bg-transparent border-none outline-none font-bold text-slate-700 cursor-pointer">
              <option value="Semua Loket">Semua Loket</option>
              <option value="Loket IGD">Loket IGD</option>
              <option value="Loket Rawat Inap">Loket Rawat Inap</option>
            </select>
          </span>
        </div>
        
        <div className="ml-auto flex gap-3">
          <button onClick={exportToPDF} className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2.5 rounded-xl hover:bg-red-100 transition-colors">
            <Download className="w-4 h-4" /> PDF
          </button>
          <button onClick={exportToExcel} className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2.5 rounded-xl hover:bg-emerald-100 transition-colors">
            <FileSpreadsheet className="w-4 h-4" /> EXCEL
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex justify-center items-center h-64">
           <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
      <>
      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'TOTAL ANTRIAN', value: reportData?.total || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'SELESAI', value: reportData?.selesai || 0, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'MENUNGGU', value: reportData?.menunggu || 0, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'DIPANGGIL', value: reportData?.dipanggil || 0, icon: Volume2, color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'PASIEN IGD', value: reportData?.igd || 0, icon: UserPlus, color: 'text-indigo-500', bg: 'bg-indigo-50' },
          { label: 'EMERGENCY', value: reportData?.emergency || 0, icon: Activity, color: 'text-rose-500', bg: 'bg-rose-50' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col items-center justify-center gap-2 text-center hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-1">
                <span className={`p-1.5 rounded-lg ${s.bg} ${s.color}`}>
                  <Icon className="w-4 h-4" strokeWidth={2.5} />
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</span>
              </div>
              <p className="text-3xl font-black text-slate-800">{s.value}</p>
            </div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 flex flex-col items-center justify-center">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Tingkat Penyelesaian</h3>
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset={dashOffset} className="text-emerald-500" strokeLinecap="round" />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-black text-slate-800">{completionRate}%</span>
              <span className="text-xs font-bold text-slate-400">Selesai</span>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">Tren Harian</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Volume antrian per hari</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> IGD</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Emergency</div>
            </div>
          </div>
          
          <div className="flex-1 min-h-[200px] flex items-end gap-2 px-2 pb-2 border-b border-slate-100 relative">
            {dailyDates.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-400">Belum ada data</div>
            ) : (
                dailyDates.map((dateStr, i) => {
                const vals = reportData.trenHarian[dateStr];
                const hIgd = (vals.IGD / maxDaily) * 100;
                const hEmer = (vals.EMERGENCY / maxDaily) * 100;
                return (
                <div key={i} className="flex-1 flex flex-col justify-end items-center gap-1 h-full group">
                    <div style={{height: `${hIgd}%`}} className="w-full bg-blue-500 rounded-t-sm group-hover:bg-blue-600 transition-colors relative">
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded transition-opacity z-10 whitespace-nowrap">
                            Total: {vals.total}
                        </div>
                    </div>
                    <div style={{height: `${hEmer}%`}} className="w-full bg-emerald-500 rounded-t-sm mt-0.5 group-hover:bg-emerald-600 transition-colors"></div>
                </div>
                );
            })
            )}
          </div>
          <div className="flex justify-between mt-2 px-2 text-[10px] font-bold text-slate-400 uppercase overflow-hidden">
            {dailyDates.map((d, i) => <span key={i} className="whitespace-nowrap px-1">{d.slice(5)}</span>)}
          </div>
        </div>
      </div>
      
      {/* Distribution */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
        <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-6">Distribusi per Loket</h3>
        <div className="flex flex-col sm:flex-row gap-8">
          {Object.keys(reportData?.distribusiLoket || {}).map((lk, i) => {
            const data = reportData.distribusiLoket[lk];
            const pct = reportData.total > 0 ? (data.total / reportData.total) * 100 : 0;
            return (
              <div key={i} className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-slate-700 text-sm">{lk}</span>
                  <span className="font-black text-slate-800 text-xl">{data.total}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all" style={{width: `${pct}%`}}></div>
                </div>
                <div className="flex gap-4 mt-2 text-xs font-bold text-slate-400 flex-wrap">
                  <span className="text-blue-500">IGD: {data.IGD}</span>
                  <span className="text-emerald-500">Emergency: {data.EMERGENCY}</span>
                  <span>Selesai: {data.selesai}</span>
                </div>
              </div>
            )
          })}
          {Object.keys(reportData?.distribusiLoket || {}).length === 0 && (
            <div className="w-full text-center text-sm font-bold text-slate-400 py-4">Belum ada distribusi loket</div>
          )}
        </div>
      </div>
      </>
      )}
    </div>
  );
}
