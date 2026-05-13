import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    X, Mail, Clock, AlertCircle, FileText, Users, Bell,
    Calendar, Award, ExternalLink, Edit3, Loader2, Check, Sparkles
} from 'lucide-react';

/* ─── Helpers (dùng chung với các file khác) ─── */
const normalizeType = (t) => (t || '').toUpperCase();

const TYPE_CONFIG = {
    SURVEY_INVITATION: {
        icon: Mail, gradient: 'from-indigo-500 to-purple-600',
        bgAccent: 'bg-indigo-50 dark:bg-indigo-950/30',
        textAccent: 'text-indigo-600 dark:text-indigo-400',
        borderAccent: 'border-indigo-200 dark:border-indigo-800',
        avatarBg: 'bg-indigo-100 dark:bg-indigo-900/50',
        actionColor: 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg',
    },
    SURVEY_RESPONSE: {
        icon: FileText, gradient: 'from-emerald-500 to-teal-500',
        bgAccent: 'bg-emerald-50 dark:bg-emerald-950/30',
        textAccent: 'text-emerald-600 dark:text-emerald-400',
        borderAccent: 'border-emerald-200 dark:border-emerald-800',
        avatarBg: 'bg-emerald-100 dark:bg-emerald-900/50',
        actionColor: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg',
    },
    SURVEY_EXPIRED: {
        icon: AlertCircle, gradient: 'from-orange-500 to-amber-500',
        bgAccent: 'bg-orange-50 dark:bg-orange-950/30',
        textAccent: 'text-orange-600 dark:text-orange-400',
        borderAccent: 'border-orange-200 dark:border-orange-800',
        avatarBg: 'bg-orange-100 dark:bg-orange-900/50',
        actionColor: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg',
    },
    SURVEY_TIMEOUT: {
        icon: AlertCircle, gradient: 'from-orange-500 to-amber-500',
        bgAccent: 'bg-orange-50 dark:bg-orange-950/30',
        textAccent: 'text-orange-600 dark:text-orange-400',
        borderAccent: 'border-orange-200 dark:border-orange-800',
        avatarBg: 'bg-orange-100 dark:bg-orange-900/50',
        actionColor: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg',
    },
    SURVEY_PUBLISHED: {
        icon: Sparkles, gradient: 'from-teal-500 to-cyan-500',
        bgAccent: 'bg-teal-50 dark:bg-teal-950/30',
        textAccent: 'text-teal-600 dark:text-teal-400',
        borderAccent: 'border-teal-200 dark:border-teal-800',
        avatarBg: 'bg-teal-100 dark:bg-teal-900/50',
        actionColor: 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg',
    },
    SURVEY_CLOSED: {
        icon: AlertCircle, gradient: 'from-red-500 to-pink-500',
        bgAccent: 'bg-red-50 dark:bg-red-950/30',
        textAccent: 'text-red-600 dark:text-red-400',
        borderAccent: 'border-red-200 dark:border-red-800',
        avatarBg: 'bg-red-100 dark:bg-red-900/50',
        actionColor: 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg',
    },
    NEW_PARTICIPANT: {
        icon: Users, gradient: 'from-purple-500 to-fuchsia-500',
        bgAccent: 'bg-purple-50 dark:bg-purple-950/30',
        textAccent: 'text-purple-600 dark:text-purple-400',
        borderAccent: 'border-purple-200 dark:border-purple-800',
        avatarBg: 'bg-purple-100 dark:bg-purple-900/50',
        actionColor: 'bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white shadow-lg',
    },
    SYSTEM: {
        icon: Bell, gradient: 'from-slate-500 to-gray-500',
        bgAccent: 'bg-slate-50 dark:bg-slate-800/50',
        textAccent: 'text-slate-600 dark:text-slate-400',
        borderAccent: 'border-slate-200 dark:border-slate-700',
        avatarBg: 'bg-slate-100 dark:bg-slate-800',
        actionColor: 'bg-gradient-to-r from-slate-500 to-gray-500 hover:from-slate-600 hover:to-gray-600 text-white shadow-lg',
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

const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return {
        text: date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' }),
        isExpired: date < new Date(),
    };
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
    if (m < 60) return `${m} phút trước`;
    if (h < 24) return `${h} giờ trước`;
    if (d < 7)  return `${d} ngày trước`;
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' });
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/* ─── Component ─── */
const NotificationDetailModal = ({ notification, onClose, onMarkRead, onDelete }) => {
    const navigate = useNavigate();
    const [showExtendForm, setShowExtendForm] = useState(false);
    const [extendDate, setExtendDate]         = useState('');
    const [extending, setExtending]           = useState(false);
    const [extendError, setExtendError]       = useState('');
    const [extendSuccess, setExtendSuccess]   = useState(false);

    if (!notification) return null;

    const config  = getConfig(notification.type);
    const { icon: Icon } = config;
    const data    = notification.data || {};
    const type    = normalizeType(notification.type);

    /* derived values — data đã được normalize trong Context */
    const surveyTitle  = data.surveyTitle || null;
    const personName   = data.inviterName || data.responderName || data.participantName || null;
    const roleLabel    = data.roleLabel || (() => {
        const map = { editor: 'Biên tập viên', viewer: 'Người xem', respondent: 'Người trả lời' };
        return map[data.role] || data.role || null;
    })();
    const endDateInfo  = formatDate(data.surveyEndAt);
    const timeAgo      = formatTime(notification.createdAt);
    const displayTitle = getDisplayTitle(notification);

    const getMinDate = () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    };

    const handleExtendDeadline = async () => {
        if (!extendDate) { setExtendError('Vui lòng chọn ngày gia hạn'); return; }
        setExtending(true);
        setExtendError('');
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_URL}/api/v1/survey/${data.surveyId}/extend`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ new_end_at: new Date(extendDate).toISOString() }),
            });
            const result = await res.json();
            if (!res.ok) {
                setExtendError(result.message || 'Gia hạn thất bại');
            } else {
                setExtendSuccess(true);
                setTimeout(() => {
                    setShowExtendForm(false);
                    setExtendSuccess(false);
                    onClose();
                    navigate(`/user/my-surveys/${data.surveyId}`);
                }, 1500);
            }
        } catch {
            setExtendError('Đã xảy ra lỗi khi gia hạn');
        } finally {
            setExtending(false);
        }
    };

    const handleAction     = () => { onMarkRead(notification.id); onClose(); if (data.surveyId) navigate(`/user/survey/${data.surveyId}`); };
    const handleViewDetail = () => { onMarkRead(notification.id); onClose(); if (data.surveyId) navigate(`/user/my-surveys/${data.surveyId}`); };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className={`px-6 py-5 ${!notification.read ? config.bgAccent : ''} border-b border-slate-100/80 dark:border-slate-800/80`}>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                                <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-900 dark:text-white text-base leading-tight">{displayTitle}</h2>
                                {timeAgo && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                                        <Clock className="w-3 h-3" />{timeAgo}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-xl transition-colors flex-shrink-0">
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4 max-h-[50vh] overflow-y-auto">

                    {/* Survey card */}
                    {surveyTitle && (
                        <div className={`rounded-xl border p-4 ${config.borderAccent} ${config.bgAccent}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
                                    <FileText className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">Khảo sát</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{surveyTitle}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Person card */}
                    {personName && ['SURVEY_INVITATION', 'SURVEY_RESPONSE', 'NEW_PARTICIPANT'].includes(type) && (
                        <div className={`rounded-xl border p-4 ${config.borderAccent} ${config.bgAccent}`}>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                                {type === 'SURVEY_INVITATION' ? 'Người mời' : type === 'SURVEY_RESPONSE' ? 'Người phản hồi' : 'Người tham gia'}
                            </p>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
                                    <span className="text-sm font-bold text-white">{getAvatarInitials(personName)}</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{personName}</p>
                                    {roleLabel && <p className={`text-xs font-medium ${config.textAccent}`}>{roleLabel}</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Detail card */}
                    {(endDateInfo || data.responseCount != null || data.surveyDescription) && (
                        <div className={`rounded-xl border p-4 ${config.borderAccent} ${config.bgAccent}`}>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Chi tiết</p>
                            <div className="space-y-2.5">
                                {endDateInfo && (
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-7 h-7 rounded-lg ${config.bgAccent} flex items-center justify-center`}>
                                            <Calendar className={`w-3.5 h-3.5 ${config.textAccent}`} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Thời hạn</p>
                                            <p className={`text-sm font-semibold ${endDateInfo.isExpired ? 'text-red-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                                                {endDateInfo.text}{endDateInfo.isExpired && ' (Đã hết hạn)'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {data.responseCount != null && (
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-7 h-7 rounded-lg ${config.bgAccent} flex items-center justify-center`}>
                                            <Award className={`w-3.5 h-3.5 ${config.textAccent}`} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Số câu trả lời</p>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{data.responseCount} câu trả lời</p>
                                        </div>
                                    </div>
                                )}
                                {data.surveyDescription && (
                                    <div className="flex items-start gap-2.5">
                                        <div className={`w-7 h-7 rounded-lg ${config.bgAccent} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                            <FileText className={`w-3.5 h-3.5 ${config.textAccent}`} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Mô tả</p>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">{data.surveyDescription}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Message fallback */}
                    {notification.message && !surveyTitle && (
                        <div className={`rounded-xl border p-4 ${config.borderAccent} ${config.bgAccent}`}>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{notification.message}</p>
                        </div>
                    )}

                    {/* Extend form */}
                    {showExtendForm && ['SURVEY_EXPIRED', 'SURVEY_TIMEOUT'].includes(type) && (
                        <div className={`rounded-xl border p-4 ${config.borderAccent} ${config.bgAccent}`}>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Gia hạn thời hạn</p>
                            <div className="space-y-3">
                                <input
                                    type="date"
                                    min={getMinDate()}
                                    value={extendDate}
                                    onChange={(e) => { setExtendDate(e.target.value); setExtendError(''); }}
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                                {extendError   && <p className="text-xs text-red-500">{extendError}</p>}
                                {extendSuccess && (
                                    <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Gia hạn thành công! Đang chuyển hướng...
                                    </p>
                                )}
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleExtendDeadline}
                                        disabled={extending || extendSuccess}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all shadow-md ${extending || extendSuccess ? 'opacity-60 cursor-not-allowed' : config.actionColor}`}
                                    >
                                        {extending    ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang gia hạn...</>
                                        : extendSuccess ? <><Check className="w-4 h-4" /> Thành công!</>
                                        : <><Edit3 className="w-4 h-4" /> Xác nhận gia hạn</>}
                                    </button>
                                    <button
                                        onClick={() => { setShowExtendForm(false); setExtendError(''); setExtendDate(''); }}
                                        className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                    >
                                        Huỷ
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer actions */}
                <div className="px-6 py-4 border-t border-slate-100/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/50 flex flex-wrap gap-2">
                    {data.surveyId && type === 'SURVEY_INVITATION' && (
                        <button onClick={handleAction} className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${config.actionColor}`}>
                            Làm khảo sát
                        </button>
                    )}
                    {data.surveyId && ['SURVEY_RESPONSE', 'NEW_PARTICIPANT', 'SURVEY_PUBLISHED', 'SURVEY_CLOSED'].includes(type) && (
                        <button onClick={handleViewDetail} className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${config.actionColor}`}>
                            <ExternalLink className="w-4 h-4" />Xem chi tiết
                        </button>
                    )}
                    {data.surveyId && ['SURVEY_EXPIRED', 'SURVEY_TIMEOUT'].includes(type) && (
                        <>
                            <button onClick={() => setShowExtendForm(!showExtendForm)} className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${config.actionColor}`}>
                                <Edit3 className="w-4 h-4" />{showExtendForm ? 'Ẩn form' : 'Gia hạn'}
                            </button>
                            <button onClick={handleViewDetail} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl bg-slate-700 hover:bg-slate-800 text-white transition-all shadow-lg">
                                <ExternalLink className="w-4 h-4" />Xem chi tiết
                            </button>
                        </>
                    )}
                    <div className="flex-1" />
                    <button
                        onClick={() => { onDelete(notification.id); onClose(); }}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                    >
                        <X className="w-4 h-4" />Xoá
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationDetailModal;