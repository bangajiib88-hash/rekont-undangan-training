import React, { useState } from 'react';
import { AppUser } from '../types/auth';
import { Lock, User, Key, ArrowRight, AlertCircle, Building2, Shield } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: AppUser) => void;
  users: AppUser[];
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  users,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUsername) {
      setErrorMsg('Silakan masukkan username.');
      return;
    }

    if (!cleanPassword) {
      setErrorMsg('Silakan masukkan password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const found = users.find(u => u.username.toLowerCase() === cleanUsername);
      if (!found) {
        setErrorMsg('Username tidak terdaftar. Hubungi Admin Pusat jika belum memiliki akun.');
        setIsLoading(false);
        return;
      }

      if (found.password && found.password !== cleanPassword) {
        setErrorMsg('Password yang Anda masukkan salah.');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      onLogin(found);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-[#005BAC] selection:text-white transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Indomaret Authentic Tri-Color Accent */}
        <div className="h-2 w-full indomaret-stripe" />

        <div className="p-8 space-y-6">
          {/* Brand Logo & Title */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xs h-14 w-32 mx-auto">
              <img 
                src="/indomaret.svg" 
                alt="Logo Indomaret" 
                className="h-full w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).setAttribute('src', 'https://upload.wikimedia.org/wikipedia/commons/4/44/Indomaret.svg');
                }}
              />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
                Sistem Validasi Training
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Portal Penjadwalan &amp; Kroscek Multi-Cabang
              </p>
            </div>
          </div>

          {/* Error message */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-red-300 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-[#E31B23] dark:text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                USERNAME
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  autoComplete="username"
                  autoFocus
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-[#005BAC] focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden font-medium transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                PASSWORD
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-[#005BAC] focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden font-medium transition-all font-mono"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 text-xs font-bold text-white bg-[#005BAC] hover:bg-[#004785] active:scale-[0.99] rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <span>{isLoading ? 'Memverifikasi...' : 'Masuk ke Aplikasi'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Info Card */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
              <Shield className="w-3.5 h-3.5 text-[#005BAC] dark:text-blue-400" />
              <span>Ketentuan Akses:</span>
            </div>
            <p>• <strong>Admin Pusat</strong>: Mengelola seluruh cabang dan mendaftarkan user cabang baru.</p>
            <p>• <strong>Admin Cabang</strong>: Login hanya dapat dilakukan setelah user didaftarkan oleh Admin Pusat.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 text-center text-[10px] text-slate-500 dark:text-slate-400">
          Sistem Penjadwalan &amp; Validasi Training Toko
        </div>
      </div>
    </div>
  );
};
