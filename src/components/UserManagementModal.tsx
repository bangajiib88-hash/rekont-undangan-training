import React, { useState } from 'react';
import { AppUser, UserRole } from '../types/auth';
import { Users, UserPlus, Trash2, Shield, Building2, Key, CheckCircle2, AlertCircle, X, ShieldAlert, KeyRound, Check } from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: AppUser[];
  onAddUser: (user: AppUser) => Promise<void>;
  onDeleteUser: (username: string) => Promise<void>;
  onUpdatePassword?: (username: string, newPassword: string) => Promise<void>;
  currentUser: AppUser | null;
  availableBranches?: string[];
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  users,
  onAddUser,
  onDeleteUser,
  onUpdatePassword,
  currentUser,
  availableBranches = ['SBY', 'JAP', 'MNK', 'SON', 'MRK'],
}) => {
  const [showAddForm, setShowAddForm] = useState(true);
  const [username, setUsername] = useState('');
  const [nama, setNama] = useState('');
  const [password, setPassword] = useState('123');
  const [role, setRole] = useState<UserRole>('CABANG');
  const [cabang, setCabang] = useState('SBY');
  const [customCabang, setCustomCabang] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Quick Inline Password Reset State
  const [editingPasswordUser, setEditingPasswordUser] = useState<string | null>(null);
  const [inlineNewPassword, setInlineNewPassword] = useState('');

  if (!isOpen) return null;

  const isSuperAdmin = currentUser?.role === 'PUSAT';

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const cleanNama = nama.trim();
    const finalCabang = role === 'PUSAT' ? 'ALL' : (customCabang.trim().toUpperCase() || cabang);

    if (!cleanUsername) {
      setMessage({ type: 'error', text: 'Username wajib diisi (hanya huruf, angka, underscore).' });
      return;
    }

    if (!cleanNama) {
      setMessage({ type: 'error', text: 'Nama Lengkap pengguna wajib diisi.' });
      return;
    }

    if (!password.trim()) {
      setMessage({ type: 'error', text: 'Password wajib diisi.' });
      return;
    }

    if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
      setMessage({ type: 'error', text: `Username "${cleanUsername}" sudah digunakan. Gunakan username lain.` });
      return;
    }

    setIsSubmitting(true);
    try {
      const newUser: AppUser = {
        id: `user-${Date.now()}`,
        username: cleanUsername,
        password: password.trim(),
        nama: cleanNama,
        role,
        cabang: finalCabang,
        createdAt: new Date().toISOString().split('T')[0],
      };

      await onAddUser(newUser);
      setMessage({ 
        type: 'success', 
        text: `Akun ${role === 'PUSAT' ? 'Admin Pusat' : 'Admin Cabang ' + finalCabang} (${cleanUsername}) berhasil ditambahkan! Pengguna dapat langsung login.` 
      });
      // Reset form
      setUsername('');
      setNama('');
      setPassword('123');
      setCustomCabang('');
    } catch (err: any) {
      setMessage({ type: 'error', text: `Gagal menyimpan user: ${err.message || 'Error'}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (targetUsername: string, targetNama: string) => {
    if (targetUsername === 'adminpusat') {
      setMessage({ type: 'error', text: 'Akun Admin Pusat utama ("adminpusat") tidak boleh dihapus.' });
      return;
    }

    if (currentUser?.username === targetUsername) {
      setMessage({ type: 'error', text: 'Anda tidak bisa menghapus akun yang sedang Anda gunakan saat ini.' });
      return;
    }

    try {
      await onDeleteUser(targetUsername);
      setMessage({ type: 'success', text: `Akun ${targetNama} (${targetUsername}) berhasil dihapus.` });
    } catch (err: any) {
      setMessage({ type: 'error', text: `Gagal menghapus user: ${err.message}` });
    }
  };

  const handleSaveInlinePassword = async (targetUsername: string) => {
    if (!inlineNewPassword.trim()) {
      setMessage({ type: 'error', text: 'Password baru tidak boleh kosong.' });
      return;
    }
    if (onUpdatePassword) {
      try {
        await onUpdatePassword(targetUsername, inlineNewPassword.trim());
        setMessage({ type: 'success', text: `Password untuk user "${targetUsername}" berhasil diubah menjadi "${inlineNewPassword.trim()}".` });
        setEditingPasswordUser(null);
        setInlineNewPassword('');
      } catch (e: any) {
        setMessage({ type: 'error', text: `Gagal mengubah password: ${e.message}` });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col transition-colors max-h-[92vh]">
        {/* Indomaret Authentic Tri-Color Accent */}
        <div className="h-1.5 w-full indomaret-stripe shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#005BAC] text-white shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 leading-tight">
                Tambah &amp; Manajemen User Per Cabang
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Admin cabang hanya dapat login setelah akun didaftarkan oleh Admin Pusat.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Status Message */}
          {message && (
            <div className={`p-3 rounded-xl flex items-start gap-2 text-xs animate-in fade-in duration-150 ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-red-300 border border-rose-300 dark:border-rose-800'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[#E31B23] dark:text-red-400 shrink-0 mt-0.5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Access Warning if not Super Admin */}
          {!isSuperAdmin && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>Akses Khusus Admin Pusat:</strong> Anda saat ini login sebagai Admin Cabang ({currentUser?.cabang}). Hanya <strong>Admin Pusat</strong> yang berwenang menambah dan menghapus akun pengguna.
              </div>
            </div>
          )}

          {/* Add User Form */}
          {isSuperAdmin && (
            <form onSubmit={handleCreateUser} className="p-4 bg-blue-50/50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800/80 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 border-b border-blue-200 dark:border-blue-800 pb-2">
                <UserPlus className="w-4 h-4 text-[#005BAC] dark:text-blue-400" />
                <h4 className="text-xs font-bold text-[#005BAC] dark:text-blue-300 uppercase tracking-wider">
                  Tambah Akun Pengguna Baru
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ROLE / TINGKAT AKSES *
                  </label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-[#005BAC] focus:outline-hidden"
                  >
                    <option value="CABANG">Admin Cabang (Hanya Melihat Cabangnya Sendiri)</option>
                    <option value="PUSAT">Admin Pusat (Melihat Semua Cabang)</option>
                  </select>
                </div>

                {role === 'CABANG' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      PILIH WILAYAH CABANG *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={cabang}
                        onChange={e => setCabang(e.target.value)}
                        className="px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-[#005BAC] focus:outline-hidden"
                      >
                        {availableBranches.map(b => (
                          <option key={b} value={b}>Cabang {b}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={customCabang}
                        onChange={e => setCustomCabang(e.target.value.toUpperCase())}
                        placeholder="Kode Lain (mis: MDN)..."
                        className="px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-mono uppercase"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    USERNAME LOGIN *
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase())}
                    placeholder="Contoh: adminsby, userjap"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-mono font-bold focus:ring-2 focus:ring-[#005BAC] focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    NAMA LENGKAP PENGGUNA *
                  </label>
                  <input
                    type="text"
                    value={nama}
                    onChange={e => setNama(e.target.value)}
                    placeholder="Misal: Budi Santoso"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-medium focus:ring-2 focus:ring-[#005BAC] focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    PASSWORD / PIN *
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-mono focus:ring-2 focus:ring-[#005BAC] focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#005BAC] hover:bg-[#004785] rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Menyimpan...' : '+ Tambahkan User Cabang'}
                </button>
              </div>
            </form>
          )}

          {/* User Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Daftar Pengguna Terdaftar ({users.length})
              </h4>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Admin Pusat dapat mengubah password atau menghapus user cabang di bawah ini
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">No</th>
                      <th className="py-2.5 px-3">Nama Pengguna</th>
                      <th className="py-2.5 px-3">Username</th>
                      <th className="py-2.5 px-3">Tingkat Akses (Role)</th>
                      <th className="py-2.5 px-3">Wilayah Cabang</th>
                      <th className="py-2.5 px-3">Password</th>
                      {isSuperAdmin && <th className="py-2.5 px-3 text-center w-24">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {users.map((u, idx) => {
                      const isPusat = u.role === 'PUSAT';
                      const isCurrent = currentUser?.username === u.username;
                      const isEditingThis = editingPasswordUser === u.username;

                      return (
                        <tr key={u.id || u.username} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                          isCurrent ? 'bg-blue-50/50 dark:bg-blue-950/40' : ''
                        }`}>
                          <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              <span>{u.nama}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-100 dark:bg-blue-900 text-[#005BAC] dark:text-blue-300 font-bold">
                                  (Anda)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {u.username}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              isPusat
                                ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                : 'bg-blue-100 dark:bg-blue-950/80 text-[#005BAC] dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            }`}>
                              <Shield className="w-3 h-3" />
                              <span>{isPusat ? 'ADMIN PUSAT' : 'ADMIN CABANG'}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            {isPusat ? (
                              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                Semua Cabang (Nasional)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-mono">
                                <Building2 className="w-3 h-3" />
                                <span>Cabang {u.cabang || 'SBY'}</span>
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                            {isEditingThis ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={inlineNewPassword}
                                  onChange={e => setInlineNewPassword(e.target.value)}
                                  placeholder="Password baru..."
                                  className="px-2 py-1 text-xs border border-[#005BAC] rounded bg-white dark:bg-slate-800 font-mono w-28 focus:outline-hidden"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveInlinePassword(u.username)}
                                  className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                                  title="Simpan password"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setEditingPasswordUser(null); setInlineNewPassword(''); }}
                                  className="p-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-300"
                                  title="Batal"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span>{u.password || '123'}</span>
                            )}
                          </td>
                          {isSuperAdmin && (
                            <td className="py-2.5 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPasswordUser(u.username);
                                    setInlineNewPassword(u.password || '123');
                                  }}
                                  className="p-1.5 rounded text-amber-600 hover:text-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/60 transition-colors"
                                  title={`Ubah password akun ${u.nama}`}
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                </button>
                                {u.username !== 'adminpusat' && !isCurrent ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(u.username, u.nama)}
                                    className="p-1.5 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                                    title={`Hapus akun ${u.nama}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic px-1">Terkunci</span>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
