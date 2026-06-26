'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, User, LogOut, Loader2, ListOrdered } from 'lucide-react';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Exclude login page from auth check
    if (pathname === '/admin/login') {
      setIsLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    const userDataStr = localStorage.getItem('user');

    if (!token || !userDataStr) {
      router.push('/');
    } else {
      setUser(JSON.parse(userDataStr));
      setIsLoading(false);
    }
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const menuItems = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/akun', icon: Users, label: 'Manajemen Akun' },
    { href: '/admin/laporan', icon: ListOrdered, label: 'Laporan' }, // Changed to ListOrdered for now, or BarChart2 if imported
  ];

  return (
    <div className="flex min-h-screen bg-[#f4f7fb] text-slate-900 font-sans">
      {/* Sidebar */}
      <div className="w-[280px] bg-white border-r border-slate-200/60 flex flex-col z-10 shrink-0">
        <div className="h-28 flex items-center px-8 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="font-black text-xl">+</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-none mb-1">Antrian IGD</h1>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Admin Dashboard</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 py-8 px-6 space-y-3">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-4 px-5 py-3.5 rounded-[2rem] transition-all duration-300 font-semibold ${
                  isActive 
                    ? 'border-[1.5px] border-blue-600 text-blue-600 bg-blue-50/30' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-[1.5px] border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="p-6">
          <div className="bg-[#f8fafc] rounded-[1.5rem] p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200/60 flex items-center justify-center text-slate-500 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{user?.username === 'admin' ? 'Admin Antrian' : user?.username}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.username}@hospital.com</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto h-full flex flex-col">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
