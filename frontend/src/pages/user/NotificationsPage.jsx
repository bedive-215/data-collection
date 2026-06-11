import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import NotificationDetailModal from '../../components/common/Notification/NotificationDetailModal';
import AnimatedSurveyBackdrop from '../../components/AnimatedSurveyBackdrop';
import {
    Bell, CheckCheck, Mail, FileText, Clock, AlertCircle,
    Users, Calendar, User, Award, Trash2, Eye, BellOff,
    Sparkles, Filter
} from 'lucide-react';
import { createPortal } from 'react-dom';

/* ── TYPE_CONFIG — key UPPERCASE, lookup qua normalizeType() ── */
const TYPE_CONFIG = {
    SURVEY_INVITATION: {
        icon: Mail, gradient: 'from-indigo-500 to-purple-600',
        bgAccent: 'bg-indigo-50/80 dark:bg-indigo-950/30', textAccent: 'text-indigo-600 dark:text-indigo-400',
        avatarBg: 'bg-indigo-100 dark:bg-indigo-900/50',
        cardBg: 'bg-gradient-to-br from-indigo-50/60 to-purple-50/40 dark:from-indigo-950/25 dark:to-purple-950/15',
        glowColor: 'shadow-indigo-200/50 dark:shadow-indigo-900/30', dotColor: 'bg-indigo-500', label: 'Lời mời',
        actionColor: 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg'
    },
    SURVEY_RESPONSE: {
        icon: FileText, gradient: 'from-emerald-500 to-teal-500',
        bgAccent: 'bg-emerald-50/80 dark:bg-emerald-950/30', textAccent: 'text-emerald-600 dark:text-emerald-400',
        avatarBg: 'bg-emerald-100 dark:bg-emerald-900/50',
        cardBg: 'bg-gradient-to-br from-emerald-50/60 to-teal-50/40 dark:from-emerald-950/25 dark:to-teal-950/15',
        glowColor: 'shadow-emerald-200/50 dark:shadow-emerald-900/30', dotColor: 'bg-emerald-500', label: 'Phản hồi',
        actionColor: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg'
    },
    SURVEY_EXPIRED: {
        icon: AlertCircle, gradient: 'from-orange-500 to-amber-500',
        bgAccent: 'bg-orange-50/80 dark:bg-orange-950/30', textAccent: 'text-orange-600 dark:text-orange-400',
        avatarBg: 'bg-orange-100 dark:bg-orange-900/50',
        cardBg: 'bg-gradient-to-br from-orange-50/60 to-amber-50/40 dark:from-orange-950/25 dark:to-amber-950/15',
        glowColor: 'shadow-orange-200/50 dark:shadow-orange-900/30', dotColor: 'bg-orange-500', label: 'Hết hạn',
        actionColor: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg'
    },
    SURVEY_TIMEOUT: {
        icon: AlertCircle, gradient: 'from-orange-500 to-amber-500',
        bgAccent: 'bg-orange-50/80 dark:bg-orange-950/30', textAccent: 'text-orange-600 dark:text-orange-400',
        avatarBg: 'bg-orange-100 dark:bg-orange-900/50',
        cardBg: 'bg-gradient-to-br from-orange-50/60 to-amber-50/40 dark:from-orange-950/25 dark:to-amber-950/15',
        glowColor: 'shadow-orange-200/50 dark:shadow-orange-900/30', dotColor: 'bg-orange-500', label: 'Hết hạn',
        actionColor: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg'
    },
    SURVEY_PUBLISHED: {
        icon: Sparkles, gradient: 'from-teal-500 to-cyan-500',
        bgAccent: 'bg-teal-50/80 dark:bg-teal-950/30', textAccent: 'text-teal-600 dark:text-teal-400',
        avatarBg: 'bg-teal-100 dark:bg-teal-900/50',
        cardBg: 'bg-gradient-to-br from-teal-50/60 to-cyan-50/40 dark:from-teal-950/25 dark:to-cyan-950/15',
        glowColor: 'shadow-teal-200/50 dark:shadow-teal-900/30', dotColor: 'bg-teal-500', label: 'Công khai',
        actionColor: 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg'
    },
    SURVEY_CLOSED: {
        icon: AlertCircle, gradient: 'from-red-500 to-pink-500',
        bgAccent: 'bg-red-50/80 dark:bg-red-950/30', textAccent: 'text-red-600 dark:text-red-400',
        avatarBg: 'bg-red-100 dark:bg-red-900/50',
        cardBg: 'bg-gradient-to-br from-red-50/60 to-pink-50/40 dark:from-red-950/25 dark:to-pink-950/15',
        glowColor: 'shadow-red-200/50 dark:shadow-red-900/30', dotColor: 'bg-red-500', label: 'Đã đóng',
        actionColor: 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg'
    },
    NEW_PARTICIPANT: {
        icon: Users, gradient: 'from-purple-500 to-fuchsia-500',
        bgAccent: 'bg-purple-50/80 dark:bg-purple-950/30', textAccent: 'text-purple-600 dark:text-purple-400',
        avatarBg: 'bg-purple-100 dark:bg-purple-900/50',
        cardBg: 'bg-gradient-to-br from-purple-50/60 to-fuchsia-50/40 dark:from-purple-950/25 dark:to-fuchsia-950/15',
        glowColor: 'shadow-purple-200/50 dark:shadow-purple-900/30', dotColor: 'bg-purple-500', label: 'Tham gia',
        actionColor: 'bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white shadow-lg'
    },
    SYSTEM: {
        icon: Bell, gradient: 'from-slate-500 to-gray-500',
        bgAccent: 'bg-slate-50/80 dark:bg-slate-800/50', textAccent: 'text-slate-600 dark:text-slate-400',
        avatarBg: 'bg-slate-100 dark:bg-slate-800',
        cardBg: 'bg-gradient-to-br from-slate-50/60 to-gray-50/40 dark:from-slate-800/40 dark:to-gray-800/20',
        glowColor: 'shadow-slate-200/50 dark:shadow-slate-900/30', dotColor: 'bg-slate-400', label: 'Hệ thống',
        actionColor: 'bg-gradient-to-r from-slate-500 to-gray-500 hover:from-slate-600 hover:to-gray-600 text-white shadow-lg'
    },
    SURVEY_INVITATION_SENT: {
        icon: Mail, gradient: 'from-indigo-500 to-purple-600',
        bgAccent: 'bg-indigo-50 dark:bg-indigo-950/30',
        textAccent: 'text-indigo-600 dark:text-indigo-400',
        borderAccent: 'border-indigo-200 dark:border-indigo-800',
        avatarBg: 'bg-indigo-100 dark:bg-indigo-900/50',
        lightGradient: 'bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20',
        actionColor: 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg',
        label: 'Đã gửi lời mời',
    },
};

/* ─── Helpers ─── */

/** BE có thể trả lowercase ("survey_timeout") hoặc uppercase ("SURVEY_TIMEOUT") → chuẩn hoá */
const normalizeType = (type) => (type || '').toUpperCase();

const getConfig = (type) => TYPE_CONFIG[normalizeType(type)] || TYPE_CONFIG.SYSTEM;

/** title có thể là "" → fallback sang label của type */
const getDisplayTitle = (n) => {
    if (n.title && n.title.trim()) return n.title;
    const labels = {
        SURVEY_TIMEOUT: 'Khảo sát đã hết hạn',
        SURVEY_EXPIRED: 'Khảo sát đã hết hạn',
        SURVEY_RESPONSE: 'Có phản hồi mới',
        SURVEY_INVITATION: 'Bạn được mời tham gia',
        SURVEY_PUBLISHED: 'Khảo sát đã công khai',
        SURVEY_CLOSED: 'Khảo sát đã đóng',
        NEW_PARTICIPANT: 'Có người tham gia mới',
    };
    return labels[normalizeType(n.type)] || 'Thông báo';
};

/**
 * Tên khảo sát:
 *  - data.surveyTitle  (service mới)
 *  - data.title        (format cũ / socket event)
 *  - parse từ message  (fallback)
 */
const getSurveyTitle = (n) => {
    const d = n.data || {};
    if (d.surveyTitle?.trim()) return d.surveyTitle;
    if (d.title?.trim()) return d.title;
    if (n.message) {
        const m = n.message.match(/"([^"]+)"/);
        if (m) return m[1];
    }
    return null;
};

/** Tên người liên quan (inviter / responder / participant) */
const getPersonName = (n) => {
    const d = n.data || {};
    return d.inviterName || d.responderName || d.participantName || null;
};

const getAvatarInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.substring(0, 2).toUpperCase();
};

/** createdAt có thể null → trả '' thay vì crash */
const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const diffMs = Date.now() - date;
    const m = Math.floor(diffMs / 60000);
    const h = Math.floor(diffMs / 3600000);
    const d = Math.floor(diffMs / 86400000);
    if (m < 1) return 'Vừa xong';
    if (m < 60) return `${m} phút trước`;
    if (h < 24) return `${h} giờ trước`;
    if (d < 7) return `${d} ngày trước`;
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' });
};

/** surveyEndAt có thể null → trả null thay vì crash */
const formatEndDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return {
        text: date.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' }),
        isExpired: date < new Date()
    };
};

/* ── Component ── */
const NotificationsPage = () => {
    const navigate = useNavigate();
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, refreshNotifications } = useNotification();
    const [filter, setFilter] = useState('all');
    const [selectedNotification, setSelectedNotification] = useState(null);

    useEffect(() => {
        refreshNotifications();
        const interval = setInterval(refreshNotifications, 15000);
        return () => clearInterval(interval);
    }, []);

    const filtered = notifications.filter(n => {
        if (filter === 'unread') return !n.read;
        if (filter === 'read') return n.read;
        return true;
    });

    const handleClick = async (notification) => {
        if (!notification.read) await markAsRead(notification.id);
        setSelectedNotification(notification);
    };

    const filterOptions = [
        { value: 'all', label: 'Tất cả', count: notifications.length },
        { value: 'unread', label: 'Chưa đọc', count: unreadCount },
        { value: 'read', label: 'Đã đọc', count: notifications.length - unreadCount }
    ];

    const emptyMsg = {
        all: { title: 'Chưa có thông báo nào', sub: 'Các thông báo sẽ xuất hiện khi có hoạt động mới' },
        unread: { title: 'Bạn đã đọc hết rồi!', sub: 'Không còn thông báo chưa đọc nào' },
        read: { title: 'Chưa đọc thông báo nào', sub: 'Hãy đọc một số thông báo trước' }
    };

    return (
        <>
            {/* Nền animate — fixed z-0, pointer-events none (từ component gốc) */}
            <AnimatedSurveyBackdrop />

            {/* Nội dung trang — z-1 */}
            <div className="relative z-[1] min-h-screen">
                <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">

                    {/* ── Header ── */}
                    <div className="mb-8 flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200/50">
                                    <Bell className="w-5 h-5 text-white" />
                                </div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Thông báo</h1>
                                {unreadCount > 0 && (
                                    <span className="px-2.5 py-1 text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full shadow-md animate-pulse">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 ml-1">Theo dõi mọi hoạt động quan trọng của bạn</p>
                        </div>
                        {unreadCount > 0 && (
                            <button onClick={markAllAsRead} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0">
                                <CheckCheck className="w-4 h-4" />
                                <span className="hidden sm:inline">Đánh dấu tất cả đã đọc</span>
                                <span className="sm:hidden">Đọc tất cả</span>
                            </button>
                        )}
                    </div>

                    {/* ── Filter tabs ── */}
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1 p-1 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-white/80 dark:border-slate-700/50 shadow-sm">
                            {filterOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setFilter(opt.value)}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${filter === opt.value
                                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200/60 dark:ring-slate-600/40'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                        }`}
                                >
                                    {opt.label}
                                    {opt.count > 0 && (
                                        <span className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${filter === opt.value
                                            ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                            }`}>{opt.count}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                            <Filter className="w-3 h-3" />
                            {filtered.length} thông báo
                        </div>
                    </div>

                    {/* ── List ── */}
                    <div className="space-y-2.5">
                        {filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 px-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-700/40">
                                <div className="w-16 h-16 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 flex items-center justify-center mb-4">
                                    <BellOff className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                </div>
                                <p className="text-base font-semibold text-slate-600 dark:text-slate-300 mb-1">{emptyMsg[filter].title}</p>
                                <p className="text-sm text-slate-400 dark:text-slate-500 text-center max-w-xs">{emptyMsg[filter].sub}</p>
                            </div>
                        ) : (
                            filtered.map((notification) => {
                                const config = getConfig(notification.type);
                                const { icon: Icon } = config;
                                const isUnread = !notification.read;
                                const name = getPersonName(notification);
                                const sTitle = getSurveyTitle(notification);
                                const endDate = formatEndDate(notification.data?.surveyEndAt);
                                const time = formatTime(notification.createdAt);
                                const dTitle = getDisplayTitle(notification);

                                return (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleClick(notification)}
                                        className={`relative rounded-2xl border transition-all duration-300 cursor-pointer group overflow-hidden ${isUnread
                                            ? `${config.cardBg} border-white/90 dark:border-slate-700/60 shadow-lg ${config.glowColor}`
                                            : 'bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/70 dark:border-slate-700/40 hover:shadow-md hover:bg-white/80 dark:hover:bg-slate-800/80'
                                            } hover:-translate-y-0.5 active:translate-y-0`}
                                    >
                                        {/* Left accent bar */}
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${config.gradient} rounded-l-2xl`} />

                                        {/* Unread indicator */}
                                        {isUnread && (
                                            <div className="absolute top-4 right-4">
                                                <span className={`w-2 h-2 rounded-full ${config.dotColor} block`} />
                                            </div>
                                        )}

                                        <div className="flex items-start gap-4 px-5 py-4 pl-6">
                                            {/* Avatar */}
                                            <div className="flex-shrink-0 mt-0.5">
                                                {name ? (
                                                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-md`}>
                                                        <span className="text-sm font-bold text-white">{getAvatarInitials(name)}</span>
                                                    </div>
                                                ) : (
                                                    <div className={`w-11 h-11 rounded-xl ${config.avatarBg} flex items-center justify-center shadow-sm border border-white/60 dark:border-slate-600/30`}>
                                                        <Icon className={`w-5 h-5 ${config.textAccent}`} />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0 pr-10">

                                                        {/* Title + badge */}
                                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                                            <h3 className={`text-sm font-bold leading-snug ${isUnread ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                                                                {dTitle}
                                                            </h3>
                                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${config.bgAccent} ${config.textAccent}`}>
                                                                {config.label}
                                                            </span>
                                                        </div>

                                                        {/* Tên khảo sát (data.title hoặc data.surveyTitle) */}
                                                        {sTitle && (
                                                            <div className={`flex items-center gap-1.5 text-xs font-medium mb-1.5 ${isUnread ? 'text-slate-600 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                                                                <FileText className="w-3 h-3 flex-shrink-0 opacity-70" />
                                                                <span className="truncate">{sTitle}</span>
                                                            </div>
                                                        )}

                                                        {/* Meta */}
                                                        <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400 dark:text-slate-500 mb-1">
                                                            {name && <span className="flex items-center gap-1"><User className="w-3 h-3" />{name}</span>}
                                                            {endDate && (
                                                                <span className={`flex items-center gap-1 ${endDate.isExpired ? 'text-red-400 dark:text-red-500' : ''}`}>
                                                                    <Calendar className="w-3 h-3" />
                                                                    {endDate.isExpired ? 'Đã hết hạn' : `Hạn: ${endDate.text}`}
                                                                </span>
                                                            )}
                                                            {notification.data?.responseCount !== undefined && (
                                                                <span className="flex items-center gap-1"><Award className="w-3 h-3" />{notification.data.responseCount} câu trả lời</span>
                                                            )}
                                                            {notification.data?.roleLabel && (
                                                                <span className={`px-1.5 py-0.5 rounded-md font-semibold text-[10px] ${config.bgAccent} ${config.textAccent}`}>
                                                                    {notification.data.roleLabel}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Message nếu có (có thể null từ BE) */}
                                                        {notification.message && (
                                                            <p className="text-xs text-slate-400 dark:text-slate-500 truncate mb-1">
                                                                {notification.message}
                                                            </p>
                                                        )}

                                                        {/* Time — createdAt có thể null */}
                                                        {time && (
                                                            <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />{time}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Hover actions */}
                                                    <div className="flex-shrink-0 flex flex-col items-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
                                                        <button onClick={(e) => { e.stopPropagation(); handleClick(notification); }} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg ${config.actionColor}`}>
                                                            <Eye className="w-3 h-3" />Chi tiết
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }} className="p-1.5 hover:bg-red-50/80 dark:hover:bg-red-950/30 rounded-lg transition-colors" title="Xóa">
                                                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    {filtered.length > 0 && <div className="h-8" />}
                </div>
            </div>

            {selectedNotification && createPortal(
                <NotificationDetailModal
                    notification={selectedNotification}
                    onClose={() => setSelectedNotification(null)}
                    onMarkRead={markAsRead}
                    onDelete={deleteNotification}
                />,
                document.body
            )}
        </>
    );
};

export default NotificationsPage;