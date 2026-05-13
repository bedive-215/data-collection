import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { io } from 'socket.io-client';
import notificationService from '../services/notificationService';
import { useAuth } from '../hooks/useAuth';

const NotificationContext = createContext(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

const NotificationProvider = ({ children }) => {
  const { accessToken, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  const API_URL = 'http://10.0.2.2:3000'; // Android emulator localhost

  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  }, []);

  const fetchNotifications = useCallback(async (limit = 50) => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const res = await notificationService.getNotifications({ limit });
      const data = res?.data || res;
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      Alert.alert('Lỗi', 'Không thể đánh dấu đã đọc');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      Alert.alert('Thành công', 'Đã đánh dấu tất cả là đã đọc');
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('Lỗi', 'Không thể đánh dấu tất cả');
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => {
        const deleted = prev.find(n => n.id === notificationId);
        if (deleted && !deleted.read) {
          setUnreadCount(count => Math.max(0, count - 1));
        }
        return prev.filter(n => n.id !== notificationId);
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Lỗi', 'Không thể xóa thông báo');
    }
  }, []);

  // DELETE /api/v1/notifications/read - Xóa tất cả thông báo đã đọc
  const deleteReadNotifications = useCallback(async () => {
    try {
      await notificationService.deleteReadNotifications();
      setNotifications(prev => prev.filter(n => !n.read));
      Alert.alert('Thành công', 'Đã xóa các thông báo đã đọc');
    } catch (error) {
      console.error('Error deleting read notifications:', error);
      Alert.alert('Lỗi', 'Không thể xóa các thông báo đã đọc');
    }
  }, []);

  // GET /api/v1/notifications/unread-count - Lấy số thông báo chưa đọc
  const refreshUnreadCount = useCallback(async () => {
    try {
      const res = await notificationService.getUnreadCount();
      const count = res?.data?.unreadCount ?? res?.unreadCount ?? 0;
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  useEffect(() => {
    if (accessToken) {
      fetchNotifications();
    }
  }, [accessToken, fetchNotifications]);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    refreshUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteReadNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
