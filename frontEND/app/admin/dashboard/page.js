'use client';

import { useEffect, useState } from 'react';
import { Users, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import PageHeader from '../../../components/PageHeader';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [laporan, setLaporan] = useState(null);
  const [display, setDisplay] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchData = async () => {
    try {
      const API_URL = typeof window !== 'undefined' ? `http://${window.location.hostname}:5000` : 'http://localhost:5000';
      const today = new Date();
      const tzOffset = 8 * 60 * 60 * 1000;
      const dateStr = new Date(today.getTime() + tzOffset).toISOString().split('T')[0];

      const [resSummary, resLaporan, resDisplay] = await Promise.all([
        fetch(`${API_URL}/antrian/summary`),
        fetch(`${API_URL}/antrian/laporan?startDate=${dateStr}&endDate=${dateStr}`),
        fetch(`${API_URL}/antrian/display`)
      ]);

      if (resSummary.ok) setSummary((await resSummary.json()).summary);
      if (resLaporan.ok) setLaporan((await resLaporan.json()).data);
      if (resDisplay.ok) setDisplay((await resDisplay.json()));

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return <div className="text-gray-500">Memuat data dashboard...</div>;
  }

  const stats = [
    { 
      label: 'Total Antrian', 
      value: summary?.total || 0, 
      icon: Users,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50'
    },
    { 
      label: 'Menunggu', 
      value: (summary?.IGD?.WAITING || 0) + (summary?.EMERGENCY?.WAITING || 0) + (summary?.RANAP?.WAITING || 0), 
      icon: Clock,
      color: 'bg-yellow-500',
      lightColor: 'bg-yellow-50'
    },
    { 
      label: 'Sedang Dipanggil', 
      value: (summary?.IGD?.CALLED || 0) + (summary?.EMERGENCY?.CALLED || 0) + (summary?.RANAP?.CALLED || 0), 
      icon: AlertCircle,
      color: 'bg-indigo-500',
      lightColor: 'bg-indigo-50'
    },
    { 
      label: 'Selesai', 
      value: (summary?.IGD?.DONE || 0) + (summary?.EMERGENCY?.DONE || 0) + (summary?.RANAP?.DONE || 0), 
      icon: CheckCircle,
      color: 'bg-green-500',
      lightColor: 'bg-green-50'
    },
  ];

  if (!isMounted) {
    return <div className="flex-1 flex justify-center items-center h-full"><span className="text-slate-400 font-bold">Memuat Dashboard...</span></div>;
  }

  return (
    <div className="flex flex-col gap-6 flex-1 h-full max-h-full overflow-hidden">
      <PageHeader 
        title="Dashboard Overview" 
        subtitle="Pantau metrik dan antrian secara real-time" 
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
              <div className="flex items-center gap-3 text-slate-500 mb-2">
                <span className={`p-2 rounded-lg ${stat.lightColor} ${stat.color.replace('bg-', 'text-')}`}>
                  <Icon size={20} strokeWidth={2} />
                </span>
                <span className="text-sm font-medium">{stat.label}</span>
              </div>
              <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
              <p className="text-xs text-slate-400">Total hari ini</p>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 mt-2">
        {/* Left Side: Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col h-[500px] lg:h-auto overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">Tren Antrian Real-time</h3>
              <p className="text-xs text-slate-400 font-bold mt-1">Volume antrean per 2 jam</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> IGD</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Emergency</div>
            </div>
          </div>
          
          <div className="flex-1 min-h-0 flex items-end gap-4 px-2 pb-2 border-b border-slate-100 relative mt-4">
            {['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'].map((hourKey, i) => {
              const vals = laporan?.trenPerJam?.[hourKey] || { IGD: 0, EMERGENCY: 0, total: 0 };
              const maxHour = Math.max(...Object.values(laporan?.trenPerJam || {}).map(h => h.total), 1);
              const hIgd = (vals.IGD / maxHour) * 100;
              const hEmer = (vals.EMERGENCY / maxHour) * 100;

              return (
              <div key={i} className="flex-1 flex flex-col justify-end items-center gap-1 h-full group">
                <div style={{height: `${hIgd}%`}} className="w-full bg-blue-500 hover:bg-blue-600 transition-colors relative">
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded transition-opacity z-10">
                    {vals.total}
                  </div>
                </div>
                <div style={{height: `${hEmer}%`}} className="w-full bg-emerald-500 hover:bg-emerald-600 transition-colors"></div>
              </div>
            )})}
          </div>
          <div className="flex justify-between mt-4 px-4 text-[10px] font-bold text-slate-400 uppercase overflow-hidden">
            <span>08:00</span><span>10:00</span><span>12:00</span><span>14:00</span><span>16:00</span><span>18:00</span><span>20:00</span><span>22:00</span>
          </div>
        </div>

        {/* Right Side: Komparasi and Antrian Terakhir */}
        <div className="flex flex-col gap-6 h-[500px] lg:h-auto overflow-hidden">
          {/* Komparasi */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 shrink-0">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight mb-4">Komparasi</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-600">IGD</span>
                  <span className="text-blue-600">
                    {summary?.total > 0 ? Math.round((summary?.IGD?.total / summary?.total) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{width: `${summary?.total > 0 ? Math.round((summary?.IGD?.total / summary?.total) * 100) : 0}%`}}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-600">Emergency</span>
                  <span className="text-emerald-600">
                    {summary?.total > 0 ? Math.round((summary?.EMERGENCY?.total / summary?.total) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{width: `${summary?.total > 0 ? Math.round((summary?.EMERGENCY?.total / summary?.total) * 100) : 0}%`}}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Antrian Terakhir */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="p-4 border-b border-slate-100 shrink-0 flex items-center gap-2">
              <span className="text-blue-500"><Users className="w-4 h-4" /></span>
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Antrian Sedang Dilayani</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <table className="w-full text-left">
                <tbody className="divide-y divide-slate-50">
                  {(!display?.active || display?.active.length === 0) ? (
                    <tr><td colSpan="3" className="px-4 py-8 text-center text-xs font-bold text-slate-400">Belum ada antrian terpanggil</td></tr>
                  ) : (
                    display.active.map((ticket, i) => (
                    <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-sm text-slate-800">{ticket.number}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
                          ticket.type === 'EMERGENCY' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {ticket.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-[9px] font-bold text-slate-400">{ticket.counter_name}</span>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
