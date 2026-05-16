import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';

const NotificationContext = createContext(null);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within NotificationProvider');
    }
    return context;
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const normalizeNotification = (n) => {
    const raw = n.data || {};
    return {
        ...n,
        type: (n.type || '').toUpperCase(),
        title: n.title || '',
        message: n.message || null,
        createdAt: n.createdAt || n.created_at || null,
        data: {
            ...raw,
            surveyTitle: raw.surveyTitle || raw.title || null,
            surveyId: raw.surveyId || raw.survey_id || null,
            surveyEndAt: raw.surveyEndAt || raw.end_at || null,
            responseCount: raw.responseCount ?? null,
            inviterName: raw.inviterName || null,
            responderName: raw.responderName || null,
            participantName: raw.participantName || null,
            roleLabel: raw.roleLabel || null,
            role: raw.role || null,
        },
    };
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const { user, accessToken } = useAuth();
    const toastCallbackRef = useRef(null);
    const socketRef = useRef(null);
    const fetchNotificationsRef = useRef(null);

    const fetchNotifications = useCallback(async () => {
        if (!accessToken) return;
        try {
            const response = await fetch(`${API_URL}/api/v1/notifications?limit=50`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications((data.notifications || []).map(normalizeNotification));
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }, [accessToken]);

    fetchNotificationsRef.current = fetchNotifications;

    const markAsRead = useCallback(async (notificationId) => {
        try {
            const response = await fetch(
                `${API_URL}/api/v1/notifications/${notificationId}/read`,
                { method: 'PUT', headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (response.ok) {
                setNotifications(prev =>
                    prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }, [accessToken]);

    const markAllAsRead = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/api/v1/notifications/read-all`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (response.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }, [accessToken]);

    const deleteNotification = useCallback(async (notificationId) => {
        try {
            const response = await fetch(
                `${API_URL}/api/v1/notifications/${notificationId}`,
                { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (response.ok) {
                setNotifications(prev => {
                    const deleted = prev.find(n => n.id === notificationId);
                    if (deleted && !deleted.read) {
                        setUnreadCount(count => Math.max(0, count - 1));
                    }
                    return prev.filter(n => n.id !== notificationId);
                });
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    }, [accessToken]);

    const addNotification = useCallback((notification) => {
        const normalized = normalizeNotification(notification);
        setNotifications(prev => [normalized, ...prev]);
        setUnreadCount(prev => prev + 1);
    }, []);

    const setToastCallback = useCallback((callback) => {
        toastCallbackRef.current = callback;
    }, []);

    // Main socket effect
    useEffect(() => {
        // Clear on user change
        setNotifications([]);
        setUnreadCount(0);
        setIsConnected(false);

        // Disconnect old socket
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        if (!user || !accessToken) {
            return;
        }

        console.log('[Socket] Connecting for user:', user.user_id);

        const socketInstance = io(API_URL, {
            auth: { token: accessToken },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketInstance.on('connect', () => {
            console.log('[Socket] Connected for user:', user.user_id);
            setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log('[Socket] Disconnected');
            setIsConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
            console.error('[Socket] Connection error:', error.message);
            setIsConnected(false);
        });

        socketInstance.on('notification', (notification) => {
            console.log('[Socket] New notification:', notification);
            console.log('[Socket] Current user:', user.user_id);
            addNotification(notification);

            const normalized = normalizeNotification(notification);
            const toastMessage = normalized.message || normalized.title || 'Có thông báo mới';
            toast.info(toastMessage, {
                position: 'bottom-right',
                autoClose: 4000,
            });

            if (toastCallbackRef.current) {
                toastCallbackRef.current(normalized);
            }
        });

        socketRef.current = socketInstance;

        // Fetch notifications
        fetchNotificationsRef.current();

        return () => {
            socketInstance.disconnect();
        };
    }, [user?.user_id, accessToken]);

    const value = {
        notifications,
        unreadCount,
        isConnected,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications: fetchNotifications,
        setToastCallback,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationContext;
