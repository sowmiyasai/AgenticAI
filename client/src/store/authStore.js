import create from 'zustand';
import api from '../services/api';
import { joinUserRoom } from '../services/socket';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initAuth: async () => {
    if (typeof window === 'undefined') return;
    try {
      const storedToken = localStorage.getItem('agentflow_token');
      const storedUser = localStorage.getItem('agentflow_user');

      if (storedToken && storedUser) {
        set({
          token: storedToken,
          user: JSON.parse(storedUser),
          isAuthenticated: true,
          isLoading: false,
        });

        // Verify with /api/auth/me
        try {
          const res = await api.get('/auth/me');
          set({ user: res.data.data, isAuthenticated: true });
          joinUserRoom(res.data.data.id);
        } catch (e) {
          localStorage.removeItem('agentflow_token');
          localStorage.removeItem('agentflow_user');
          set({ user: null, token: null, isAuthenticated: false });
        }
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data.data;

      localStorage.setItem('agentflow_token', token);
      localStorage.setItem('agentflow_user', JSON.stringify(user));

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      joinUserRoom(user.id);
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Login failed';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  register: async (name, email, password, role = 'operator') => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      const { token, user } = res.data.data;

      localStorage.setItem('agentflow_token', token);
      localStorage.setItem('agentflow_user', JSON.stringify(user));

      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      joinUserRoom(user.id);
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Registration failed';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  logout: () => {
    localStorage.removeItem('agentflow_token');
    localStorage.removeItem('agentflow_user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },
}));
