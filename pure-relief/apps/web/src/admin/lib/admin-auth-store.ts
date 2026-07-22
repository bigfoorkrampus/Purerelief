import { create } from 'zustand';
import { api, setAccessToken, readCsrfCookie, ApiClientError } from '@/lib/api-client';
import type { AdminUser } from '@pure-relief/shared';

type AdminAuthState = {
  user: AdminUser | null;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  tryRestoreSession: () => Promise<void>;
};

export const useAdminAuthStore = create<AdminAuthState>((set, get) => ({
  user: null,
  isInitializing: true,

  login: async (email, password) => {
    const result = await api.post<{ accessToken: string; user: AdminUser }>('/api/auth/login', { email, password });
    setAccessToken(result.accessToken);
    set({ user: result.user, isInitializing: false });
  },

  logout: async () => {
    try {
      await api.post('/api/auth/logout', undefined, readCsrfCookie());
    } catch {
      // best-effort — clear local state regardless
    }
    setAccessToken(null);
    set({ user: null });
  },

  tryRestoreSession: async () => {
    try {
      const result = await api.post<{ accessToken: string }>('/api/auth/refresh');
      setAccessToken(result.accessToken);
      const user = await api.get<AdminUser>('/api/auth/me');
      set({ user, isInitializing: false });
    } catch (err) {
      if (err instanceof ApiClientError) {
        // No valid session — this is expected for logged-out visitors, not an error state.
      }
      setAccessToken(null);
      set({ user: null, isInitializing: false });
    }
  },
}));

/** Call once at admin app mount to attempt silent session restore via the refresh cookie. */
export function initAdminAuth() {
  void useAdminAuthStore.getState().tryRestoreSession();
}
