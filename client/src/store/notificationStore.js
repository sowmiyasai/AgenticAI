import create from 'zustand';
import api from '../services/api';
import { getSocket } from '../services/socket';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isDrawerOpen: false,
  isLoading: false,

  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
  setDrawerOpen: (open) => set({ isDrawerOpen: open }),

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/notifications');
      const list = res.data.data || [];
      const unread = list.filter((n) => !n.isRead).length;
      set({ notifications: list, unreadCount: unread, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      set((state) => {
        const updated = state.notifications.map((n) => (n._id === id || n.id === id ? { ...n, isRead: true } : n));
        return {
          notifications: updated,
          unreadCount: updated.filter((n) => !n.isRead).length,
        };
      });
    } catch (e) {
      console.error(e);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.post('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (e) {
      console.error(e);
    }
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  setupSocketListener: () => {
    const socket = getSocket();
    if (!socket) return;

    socket.off('notification:new');
    socket.off('notification:broadcast');

    const handleNew = (notification) => {
      get().addNotification(notification);
    };

    socket.on('notification:new', handleNew);
    socket.on('notification:broadcast', handleNew);
  },
}));
