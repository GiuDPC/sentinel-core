import { create } from 'zustand';
import { apiClient } from '../api/client';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  intervalId: null,

  fetchNotifications: async () => {
    try {
      const data = await apiClient.get('/notifications');
      
      set({
        notifications: data.notifications,
        unreadCount: data.unreadCount
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  },

  startPolling: () => {
    const { fetchNotifications, intervalId } = get();
    if (intervalId) clearInterval(intervalId);
    
    fetchNotifications();
    const newIntervalId = setInterval(fetchNotifications, 30000); // M1: 30s reduce carga en Render (era 10s)
    set({ intervalId: newIntervalId });
  },

  stopPolling: () => {
    const { intervalId } = get();
    if (intervalId) clearInterval(intervalId);
    set({ intervalId: null, notifications: [], unreadCount: 0 });
  },

  markAsRead: async (id) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      
      set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (error) {
      console.error('Error marking as read', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await apiClient.patch('/notifications/all/read');
      
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error('Error marking all as read', error);
    }
  }
}));
