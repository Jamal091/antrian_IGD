import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function PageHeader({ title, subtitle }) {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':'));
      setDate(now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">{subtitle}</p>
      </div>
      
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex flex-col text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{date.split(',')[0]}</span>
          <span className="text-sm font-bold text-slate-700">{date.split(',')[1]?.trim() || date}</span>
        </div>
        <div className="bg-white border border-blue-100 px-4 py-2.5 rounded-xl shadow-sm text-blue-600 font-bold flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>{time}</span>
        </div>
      </div>
    </div>
  );
}
