'use client';

import { useEffect, useState } from 'react';
import { Trash2, UserPlus, Shield, User, Loader2, Edit3, X } from 'lucide-react';
import PageHeader from '../../../components/PageHeader';

export default function AkunPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('Loket IGD');
  const [actionLoading, setActionLoading] = useState(false);

  const [editId, setEditId] = useState(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState('Loket IGD');

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = typeof window !== 'undefined' ? `http://${window.location.hostname}:5000` : 'http://localhost:5000';
      const res = await fetch(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const API_URL = typeof window !== 'undefined' ? `http://${window.location.hostname}:5000` : 'http://localhost:5000';
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole })
      });
      
      const data = await res.json();
      if (res.ok) {
        setNewUsername('');
        setNewPassword('');
        setNewRole('Loket IGD');
        setIsAdding(false);
        fetchUsers();
      } else {
        alert(data.error || 'Gagal menambahkan user');
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const API_URL = typeof window !== 'undefined' ? `http://${window.location.hostname}:5000` : 'http://localhost:5000';
      const res = await fetch(`${API_URL}/users/${editId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username: editUsername, password: editPassword, role: editRole })
      });
      
      const data = await res.json();
      if (res.ok) {
        setEditId(null);
        fetchUsers();
      } else {
        alert(data.error || 'Gagal mengubah user');
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus akun ini?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const API_URL = typeof window !== 'undefined' ? `http://${window.location.hostname}:5000` : 'http://localhost:5000';
      const res = await fetch(`${API_URL}/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      if (res.ok) {
        fetchUsers();
      } else {
        alert(data.error || 'Gagal menghapus user');
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    }
  };

  return (
    <div className="flex flex-col gap-8 flex-1 h-full overflow-y-auto pb-8">
      <PageHeader 
        title="Manajemen Akun Pengguna" 
        subtitle="Kelola akun pengguna untuk semua role sistem" 
      />

      <div className="flex justify-between items-center mb-4 gap-4">
        <h3 className="text-xl font-bold text-slate-800">Daftar Pengguna</h3>
        <button 
          onClick={() => { setIsAdding(!isAdding); setEditId(null); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
        >
          <UserPlus className="w-5 h-5" />
          Tambah Akun Baru
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 mb-2 relative">
          <button onClick={() => setIsAdding(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
          <h3 className="text-lg font-bold text-slate-800 mb-6 tracking-tight">Tambah Akun Baru</h3>
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Username</label>
              <input 
                type="text" 
                required
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-medium text-slate-800 transition-all"
                placeholder="Misal: loket1"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Password</label>
              <input 
                type="password" 
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-medium text-slate-800 transition-all"
                placeholder="******"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Role (Akses)</label>
              <select 
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-medium text-slate-800 transition-all appearance-none"
              >
                <option value="Loket IGD">Petugas Loket IGD</option>
                <option value="Loket Rawat Inap">Petugas Loket Rawat Inap</option>
                <option value="Admin">Administrator</option>
              </select>
            </div>
            <div>
              <button 
                type="submit"
                disabled={actionLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white px-4 py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-md shadow-emerald-500/20"
              >
                {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Akun'}
              </button>
            </div>
          </form>
        </div>
      )}

      {editId && (
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 mb-2 relative ring-2 ring-blue-100">
          <button onClick={() => setEditId(null)} className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
          <h3 className="text-lg font-bold text-slate-800 mb-6 tracking-tight flex items-center gap-2"><Edit3 className="w-5 h-5 text-blue-500" /> Edit Akun</h3>
          <form onSubmit={handleUpdateUser} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Username</label>
              <input 
                type="text" 
                required
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-medium text-slate-800 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Password Baru <span className="text-[9px] lowercase text-slate-400 font-normal">(Opsional)</span></label>
              <input 
                type="password" 
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-medium text-slate-800 transition-all"
                placeholder="Kosongkan jika tidak diubah"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Role (Akses)</label>
              <select 
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-medium text-slate-800 transition-all appearance-none"
              >
                <option value="Loket IGD">Petugas Loket IGD</option>
                <option value="Loket Rawat Inap">Petugas Loket Rawat Inap</option>
                <option value="Admin">Administrator</option>
              </select>
            </div>
            <div>
              <button 
                type="submit"
                disabled={actionLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-4 py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-md shadow-blue-500/20"
              >
                {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                <th className="px-8 py-5">Nama / ID</th>
                <th className="px-8 py-5">Username Login</th>
                <th className="px-8 py-5">Hak Akses</th>
                <th className="px-8 py-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-8 py-10 text-center text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
                    <span className="font-medium">Memuat data...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-8 py-10 text-center text-slate-400 font-medium">
                    Tidak ada akun ditemukan.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${
                          user.role === 'Admin' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'
                        }`}>
                          <User className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-800">{user.username === 'admin' ? 'Administrator' : user.username.toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-medium text-slate-500">{user.username}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest ${
                        user.role === 'Admin' ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setIsAdding(false);
                            setEditId(user.id);
                            setEditUsername(user.username);
                            setEditRole(user.role);
                            setEditPassword('');
                          }}
                          className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Edit Akun"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id)}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Hapus Akun"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
