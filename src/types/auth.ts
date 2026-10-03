export type UserRole = 'PUSAT' | 'CABANG';

export interface AppUser {
  id: string;
  username: string;
  password?: string;
  nama: string;
  role: UserRole;
  cabang?: string; // 'ALL' for Admin Pusat; 'SBY', 'JAP', 'MNK', etc. for Admin Cabang
  createdAt?: string;
  lastLogin?: string;
}

// Hanya Admin Pusat di awal yang dapat melakukan login
export const INITIAL_DEFAULT_USERS: AppUser[] = [
  {
    id: 'user-adminpusat-01',
    username: 'adminpusat',
    password: '123',
    nama: 'Admin Pusat',
    role: 'PUSAT',
    cabang: 'ALL',
    createdAt: '2026-01-01',
  },
];
