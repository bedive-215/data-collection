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
            // Top-level fields từ socket payload (flattened, không nằm trong data)
            surveyId:      n.surveyId      || raw.surveyId      || raw.survey_id      || null,
            surveyTitle:   n.surveyTitle   || raw.surveyTitle   || raw.title          || null,
            surveyEndAt:   n.surveyEndAt   || raw.surveyEndAt   || raw.end_at         || null,
            responseCount: n.responseCount ?? raw.responseCount ?? raw.response_count ?? null,
            inviterName:   n.inviterName   || raw.inviterName   || raw.inviter_name   || null,
            inviterId:     n.inviterId     || raw.inviterId     || raw.inviter_id     || null,
            responderName: n.responderName || raw.responderName || raw.responder_name || null,
            responderId:   n.responderId   || raw.responderId   || raw.responder_id   || null,
            participantName: n.participantName || raw.participantName || raw.participant_name || null,
            participantId: n.participantId || raw.participantId || raw.participant_id || null,
            roleLabel:     n.roleLabel     || raw.roleLabel     || raw.role_label     || null,
            role:          n.role          || raw.role          || null,
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

    const fetchNotifications = useCallback(async (options = {}) => {
        if (!accessToken) return;
        try {
            const response = await fetch(`${API_URL}/api/v1/notifications?limit=50`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (response.ok) {
                const data = await response.json();
                const fetched = (data.notifications || []).map(normalizeNotification);
                // Replace state with fresh server data so the user always sees
                // up-to-date notifications immediately after a fetch.
                setNotifications(fetched);
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
        socketRef.current = null;

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

        // Helper: tạo toast element đơn giản (tránh JSX syntax error)
        const makeToast = (content, type) => {
            toast[type || 'info'](content, {
                position: 'bottom-right',
                autoClose: 5000,
            });
        };

        socketInstance.on('notification', (notification) => {
            console.log('[Socket] New notification:', notification);
            addNotification(notification);

            const normalized = normalizeNotification(notification);
            const type = normalized.type?.toUpperCase() || '';
            const data = normalized.data || {};

            if (type === 'STAR_EARNED') {
                const amount = data.amount || 0;
                const multiplier = data.multiplier || 1;
                const isBig = amount >= 100;
                const emoji = isBig ? '💠' : amount >= 50 ? '⭐' : '✨';
                const msg = `+${amount} sao${multiplier > 1 ? ` (x${multiplier})` : ''} — ${normalized.message || ''}`;
                const balance = `💰 Số dư: ${(data.balance_after || 0).toLocaleString('vi-VN')} sao`;
                makeToast(`${emoji} ${msg}\n${balance}`, isBig ? 'success' : 'info');
            } else if (type === 'STREAK_MILESTONE') {
                const streak = data.streak_count || 0;
                const record = data.is_new_record ? ' 🏆 Kỷ lục mới!' : '';
                makeToast(`🔥 Streak ${streak} ngày! ${data.multiplier ? `(x${data.multiplier})` : ''}${record}\n${normalized.message}`, 'success');
            } else if (type === 'ACHIEVEMENT_UNLOCKED') {
                const icon = data.achievement_icon || '🏅';
                const name = data.achievement_name || 'Huy hiệu mới';
                const reward = data.star_reward || 0;
                makeToast(`${icon} Mở khóa: ${name}!\n+${reward} ⭐`, 'success');
            } else if (type === 'RANK_UP') {
                const emoji = data.rank_emoji || '🏅';
                const name = data.rank_name || '';
                makeToast(`${emoji} Thăng rank: ${name}!\n${normalized.message}`, 'success');
            } else if (type === 'STAR_PENALTY') {
                makeToast(`⚠️ ${normalized.title}\n${normalized.message}`, 'warn');
            } else if (type === 'TOP_PRIZE') {
                makeToast(`🎉 ${normalized.title}\n${normalized.message}`, 'success');
            } else {
                makeToast(normalized.message || normalized.title || 'Có thông báo mới', 'info');
            }

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
