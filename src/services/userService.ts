import { AppUser, INITIAL_DEFAULT_USERS } from '../types/auth';
import { supabase } from '../lib/supabase';

const USERS_STORAGE_KEY = 'indomaret_training_branch_users_v3';
const CURRENT_USER_STORAGE_KEY = 'indomaret_training_active_session_v3';

export const USERS_TABLE_NAME = 'app_users';

/**
 * Loads all users from localStorage (starting only with Admin Pusat)
 */
export function getLocalUsers(): AppUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure Admin Pusat always exists
        const hasAdminPusat = parsed.some(u => u.username === 'adminpusat');
        if (!hasAdminPusat) {
          const merged = [...INITIAL_DEFAULT_USERS, ...parsed];
          return merged;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse local users:', e);
  }
  return INITIAL_DEFAULT_USERS;
}

export function saveLocalUsers(users: AppUser[]) {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn('Failed to save users to localStorage:', e);
  }
}

/**
 * Returns current authenticated user session or null if not logged in
 */
export function getCurrentUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.username) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse current user session:', e);
  }
  return null;
}

export function setCurrentUser(user: AppUser | null) {
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    }
  } catch (e) {
    console.warn('Failed to set current user:', e);
  }
}

/**
 * Syncs user to Supabase app_users table if available
 */
export async function syncUserToSupabase(user: AppUser): Promise<boolean> {
  try {
    const { error } = await supabase.from(USERS_TABLE_NAME).upsert({
      id: user.id,
      username: user.username.trim().toLowerCase(),
      password: user.password || '123',
      nama: user.nama,
      role: user.role,
      cabang: user.cabang || 'ALL',
      created_at: user.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'username' });

    if (error) {
      console.warn('Supabase user upsert skipped:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Supabase user sync error:', e);
    return false;
  }
}

/**
 * Loads users from Supabase app_users table
 */
export async function fetchUsersFromSupabase(): Promise<AppUser[]> {
  try {
    const { data, error } = await supabase
      .from(USERS_TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map(row => ({
      id: row.id || `user-${row.username}`,
      username: row.username,
      password: row.password,
      nama: row.nama,
      role: row.role as any,
      cabang: row.cabang,
      createdAt: row.created_at,
      lastLogin: row.last_login,
    }));
  } catch {
    return [];
  }
}

/**
 * Deletes user from Supabase
 */
export async function deleteUserFromSupabase(username: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(USERS_TABLE_NAME)
      .delete()
      .eq('username', username);
    return !error;
  } catch {
    return false;
  }
}
