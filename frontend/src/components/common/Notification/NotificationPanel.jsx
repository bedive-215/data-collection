import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../hooks/useAuth';
import NotificationDetailModal from './NotificationDetailModal';
import {
    Bell, CheckCheck, X, Mail, Clock, FileText,
    Users, AlertCircle, ChevronRight, Sparkles
} from 'lucide-react';

const normalizeType = (t) => (t || '').toUpperCase();

const TYPE_CONFIG = {
    SURVEY_INVITATION: {
        icon: Mail, gradient: 'from-[#F59E0B] to-[#D97706]',
        bgAccent: 'bg-[rgba(245,158,11,0.08)]', textAccent: 'text-[#F59E0B]',
        avatarBg: 'bg-[rgba(245,158,11,0.12)]',
        lightGradient: 'bg-[rgba(245,158,11,0.04)]',
        label: 'Lời mời',
    },
    SURVEY_RESPONSE: {
        icon: FileText, gradient: 'from-[#10B981] to-[#059669]',
        bgAccent: 'bg-[rgba(16,185,129,0.08)]', textAccent: 'text-[#10B981]',
        avatarBg: 'bg-[rgba(16,185,129,0.12)]',
        lightGradient: 'bg-[rgba(16,185,129,0.04)]',
        label: 'Phản hồi',
    },
    SURVEY_EXPIRED: {
        icon: AlertCircle, gradient: 'from-[#F59E0B] to-[#D97706]',
        bgAccent: 'bg-[rgba(245,158,11,0.08)]', textAccent: 'text-[#F59E0B]',
        avatarBg: 'bg-[rgba(245,158,11,0.12)]',
        lightGradient: 'bg-[rgba(245,158,11,0.04)]',
        label: 'Hết hạn',
    },
    SURVEY_TIMEOUT: {
        icon: AlertCircle, gradient: 'from-[#F59E0B] to-[#D97706]',
        bgAccent: 'bg-[rgba(245,158,11,0.08)]', textAccent: 'text-[#F59E0B]',
        avatarBg: 'bg-[rgba(245,158,11,0.12)]',
        lightGradient: 'bg-[rgba(245,158,11,0.04)]',
        label: 'Hết hạn',
    },
    SURVEY_PUBLISHED: {
        icon: Sparkles, gradient: 'from-[#6366F1] to-[#8B5CF6]',
        bgAccent: 'bg-[rgba(99,102,241,0.08)]', textAccent: 'text-[#6366F1]',
        avatarBg: 'bg-[rgba(99,102,241,0.12)]',
        lightGradient: 'bg-[rgba(99,102,241,0.04)]',
        label: 'Đã công khai',
    },
    SURVEY_CLOSED: {
        icon: AlertCircle, gradient: 'from-[#EF4444] to-[#DC2626]',
        bgAccent: 'bg-[rgba(239,68,68,0.08)]', textAccent: 'text-[#EF4444]',
        avatarBg: 'bg-[rgba(239,68,68,0.12)]',
        lightGradient: 'bg-[rgba(239,68,68,0.04)]',
        label: 'Đã đóng',
    },
    NEW_PARTICIPANT: {
        icon: Users, gradient: 'from-[#8B5CF6] to-[#7C3AED]',
        bgAccent: 'bg-[rgba(139,92,246,0.08)]', textAccent: 'text-[#8B5CF6]',
        avatarBg: 'bg-[rgba(139,92,246,0.12)]',
        lightGradient: 'bg-[rgba(139,92,246,0.04)]',
        label: 'Người tham gia',
    },
    SYSTEM: {
        icon: Bell, gradient: 'from-[#9CA3AF] to-[#6B7280]',
        bgAccent: 'bg-[rgba(156,163,175,0.08)]', textAccent: 'text-[#9CA3AF]',
        avatarBg: 'bg-[rgba(156,163,175,0.12)]',
        lightGradient: 'bg-[rgba(156,163,175,0.04)]',
        label: 'Hệ thống',
    },
    SURVEY_INVITATION_SENT: {
        icon: Mail, gradient: 'from-[#F59E0B] to-[#D97706]',
        bgAccent: 'bg-[rgba(245,158,11,0.08)]',
        textAccent: 'text-[#F59E0B]',
        avatarBg: 'bg-[rgba(245,158,11,0.12)]',
        lightGradient: 'bg-[rgba(245,158,11,0.04)]',
        label: 'Đã gửi lời mời',
    },
};

const getConfig = (type) => TYPE_CONFIG[normalizeType(type)] || TYPE_CONFIG.SYSTEM;

const getDisplayTitle = (n) => {
    if (n.title?.trim()) return n.title;
    const map = {
        SURVEY_TIMEOUT:    'Khảo sát đã hết hạn',
        SURVEY_EXPIRED:    'Khảo sát đã hết hạn',
        SURVEY_RESPONSE:   'Có phản hồi mới',
        SURVEY_INVITATION: 'Bạn được mời tham gia',
        SURVEY_PUBLISHED:  'Khảo sát đã công khai',
        SURVEY_CLOSED:     'Khảo sát đã đóng',
        NEW_PARTICIPANT:   'Có người tham gia mới',
    };
    return map[normalizeType(n.type)] || 'Thông báo';
};

const getAvatarInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.substring(0, 2).toUpperCase();
};

const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const diff = Date.now() - date;
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 1)  return 'Vừa xong';
    if (m < 60) return `${m}p`;
    if (h < 24) return `${h}g`;
    if (d < 7)  return `${d}ng`;
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' });
};

/* ─── Component ─── */
const NotificationPanel = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotification();
    const [isOpen, setIsOpen]                           = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const panelRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) setIsOpen(false);
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleNotificationClick = async (notification) => {
        if (!notification.read) await markAsRead(notification.id);
        setSelectedNotification(notification);
        setIsOpen(false);
    };

    return (
        <>
            <div className="relative" ref={panelRef}>
                {/* Bell button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative p-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all duration-200 group"
                >
                    <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-lg shadow-indigo-200 dark:shadow-indigo-950 animate-pulse">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>

                {/* Dropdown */}
                {isOpen && (
                    <div className="absolute right-0 mt-2 w-[420px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-slate-300/50 dark:shadow-black/50 border border-slate-200/80 dark:border-slate-700/80 overflow-hidden z-50">

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 dark:from-indigo-950/40 dark:to-purple-950/40 border-b border-slate-200/60 dark:border-slate-700/60">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-200/50 dark:shadow-indigo-900/50">
                                    <Bell className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white text-sm">Thông báo</h3>
                                    {unreadCount > 0 && (
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{unreadCount} chưa đọc</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/40 rounded-lg transition-all"
                                    >
                                        <CheckCheck className="w-3.5 h-3.5" />Đánh dấu đã đọc
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4 text-slate-400" />
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="overflow-y-auto max-h-[480px]">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 px-4">
                                    <div className="w-14 h-14 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 flex items-center justify-center mb-3">
                                        <Bell className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Chưa có thông báo nào</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Các thông báo sẽ xuất hiện ở đây</p>
                                </div>
                            ) : (
                                <div className="py-1">
                                    {notifications.map((notification) => {
                                        const config   = getConfig(notification.type);
                                        const { icon: Icon } = config;
                                        const isUnread = !notification.read;
                                        const data     = notification.data || {};
                                        const name     = data.inviterName || data.responderName || data.participantName || null;
                                        const sTitle   = data.surveyTitle || null;
                                        const time     = formatTime(notification.createdAt);
                                        const dTitle   = getDisplayTitle(notification);

                                        return (
                                            <div
                                                key={notification.id}
                                                onClick={() => handleNotificationClick(notification)}
                                                className={`relative mx-2 my-1 rounded-xl cursor-pointer transition-all duration-200 group border border-transparent hover:border-slate-200/80 dark:hover:border-slate-700/80 ${
                                                    isUnread
                                                        ? `${config.lightGradient} shadow-sm`
                                                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                                                }`}
                                            >
                                                <div className="flex items-start gap-3.5 px-4 py-3.5">
                                                    {/* Avatar */}
                                                    <div className="flex-shrink-0 mt-0.5">
                                                        {name ? (
                                                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
                                                                <span className="text-xs font-bold text-white">{getAvatarInitials(name)}</span>
                                                            </div>
                                                        ) : (
                                                            <div className={`w-10 h-10 rounded-xl ${config.avatarBg} flex items-center justify-center shadow-md`}>
                                                                <Icon className={`w-5 h-5 ${config.textAccent}`} />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <p className={`text-sm truncate ${isUnread ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                                                                        {dTitle}
                                                                    </p>
                                                                    {isUnread && (
                                                                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-md shadow-sm">
                                                                            MỚI
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {sTitle && (
                                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate flex items-center gap-1">
                                                                        <FileText className="w-3 h-3 flex-shrink-0" />{sTitle}
                                                                    </p>
                                                                )}

                                                                <div className="flex items-center gap-3 mt-1">
                                                                    {time && (
                                                                        <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                                                            <Clock className="w-3 h-3" />{time}
                                                                        </span>
                                                                    )}
                                                                    {data.roleLabel && (
                                                                        <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-medium ${config.bgAccent} ${config.textAccent}`}>
                                                                            {data.roleLabel}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-colors ${isUnread ? 'text-indigo-400' : 'text-slate-300 dark:text-slate-600'} group-hover:text-indigo-500`} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="px-4 py-3 border-t border-slate-100/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/50">
                                <button
                                    onClick={() => { setIsOpen(false); navigate(user?.role === 'admin' ? '/admin/notifications' : '/user/notifications'); }}
                                    className="w-full text-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors py-1.5 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 rounded-lg"
                                >
                                    Xem tất cả thông báo →
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {selectedNotification && (
                <NotificationDetailModal
                    notification={selectedNotification}
                    onClose={() => setSelectedNotification(null)}
                    onMarkRead={markAsRead}
                    onDelete={deleteNotification}
                />
            )}
        </>
    );
};

export default NotificationPanel;