import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
    X, Mail, Clock, AlertCircle, FileText, Users, Bell,
    Calendar, Award, ExternalLink, Edit3, Loader2, Check, Sparkles, Eye
} from 'lucide-react';

/* ─── Helpers ─── */
const normalizeType = (t) => (t || '').toUpperCase();

const TYPE_CONFIG = {
    SURVEY_INVITATION: {
        icon: Mail, gradient: 'from-[#F59E0B] to-[#D97706]',
        bgAccent: 'bg-[rgba(245,158,11,0.08)]',
        textAccent: 'text-[#F59E0B]',
        borderAccent: 'border-[rgba(245,158,11,0.2)]',
        avatarBg: 'bg-[rgba(245,158,11,0.12)]',
        actionColor: 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#F59E0B] text-black shadow-lg',
    },
    SURVEY_RESPONSE: {
        icon: FileText, gradient: 'from-[#10B981] to-[#059669]',
        bgAccent: 'bg-[rgba(16,185,129,0.08)]',
        textAccent: 'text-[#10B981]',
        borderAccent: 'border-[rgba(16,185,129,0.2)]',
        avatarBg: 'bg-[rgba(16,185,129,0.12)]',
        actionColor: 'bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#10B981] text-white shadow-lg',
    },
    SURVEY_EXPIRED: {
        icon: AlertCircle, gradient: 'from-[#F59E0B] to-[#D97706]',
        bgAccent: 'bg-[rgba(245,158,11,0.08)]',
        textAccent: 'text-[#F59E0B]',
        borderAccent: 'border-[rgba(245,158,11,0.2)]',
        avatarBg: 'bg-[rgba(245,158,11,0.12)]',
        actionColor: 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#F59E0B] text-black shadow-lg',
    },
    SURVEY_TIMEOUT: {
        icon: AlertCircle, gradient: 'from-[#F59E0B] to-[#D97706]',
        bgAccent: 'bg-[rgba(245,158,11,0.08)]',
        textAccent: 'text-[#F59E0B]',
        borderAccent: 'border-[rgba(245,158,11,0.2)]',
        avatarBg: 'bg-[rgba(245,158,11,0.12)]',
        actionColor: 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#F59E0B] text-black shadow-lg',
    },
    SURVEY_PUBLISHED: {
        icon: Sparkles, gradient: 'from-[#6366F1] to-[#8B5CF6]',
        bgAccent: 'bg-[rgba(99,102,241,0.08)]',
        textAccent: 'text-[#6366F1]',
        borderAccent: 'border-[rgba(99,102,241,0.2)]',
        avatarBg: 'bg-[rgba(99,102,241,0.12)]',
        actionColor: 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#8B5CF6] hover:to-[#6366F1] text-white shadow-lg',
    },
    SURVEY_CLOSED: {
        icon: AlertCircle, gradient: 'from-[#EF4444] to-[#DC2626]',
        bgAccent: 'bg-[rgba(239,68,68,0.08)]',
        textAccent: 'text-[#EF4444]',
        borderAccent: 'border-[rgba(239,68,68,0.2)]',
        avatarBg: 'bg-[rgba(239,68,68,0.12)]',
        actionColor: 'bg-gradient-to-r from-[#EF4444] to-[#DC2626] hover:from-[#DC2626] hover:to-[#EF4444] text-white shadow-lg',
    },
    NEW_PARTICIPANT: {
        icon: Users, gradient: 'from-[#8B5CF6] to-[#7C3AED]',
        bgAccent: 'bg-[rgba(139,92,246,0.08)]',
        textAccent: 'text-[#8B5CF6]',
        borderAccent: 'border-[rgba(139,92,246,0.2)]',
        avatarBg: 'bg-[rgba(139,92,246,0.12)]',
        actionColor: 'bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#8B5CF6] text-white shadow-lg',
    },
    SYSTEM: {
        icon: Bell, gradient: 'from-[#9CA3AF] to-[#6B7280]',
        bgAccent: 'bg-[rgba(156,163,175,0.08)]',
        textAccent: 'text-[#9CA3AF]',
        borderAccent: 'border-[rgba(156,163,175,0.2)]',
        avatarBg: 'bg-[rgba(156,163,175,0.12)]',
        actionColor: 'bg-gradient-to-r from-[#9CA3AF] to-[#6B7280] hover:from-[#6B7280] hover:to-[#9CA3AF] text-white shadow-lg',
    },
    SURVEY_INVITATION_SENT: {
        icon: Mail, gradient: 'from-[#F59E0B] to-[#D97706]',
        bgAccent: 'bg-[rgba(245,158,11,0.08)]',
        textAccent: 'text-[#F59E0B]',
        borderAccent: 'border-[rgba(245,158,11,0.2)]',
        avatarBg: 'bg-[rgba(245,158,11,0.12)]',
        lightGradient: 'bg-gradient-to-br from-[rgba(245,158,11,0.05)] to-[rgba(245,158,11,0.02)]',
        actionColor: 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#F59E0B] text-black shadow-lg',
        label: 'Đã gửi lời mời',
    },
};

const getConfig  = (type) => TYPE_CONFIG[normalizeType(type)] || TYPE_CONFIG.SYSTEM;

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

    const role = data.role;

    const getInviteTarget = () => {
        if (!data.surveyId) return null;
        if (role === 'editor') return `/user/my-surveys/${data.surveyId}/studio`;
        return `/user/survey/${data.surveyId}/invited`;
    };

    const getInviteActionLabel = () => {
        if (role === 'editor') return { text: 'Mở trang chỉnh sửa', icon: Edit3 };
        if (role === 'viewer') return { text: 'Xem câu hỏi', icon: Eye };
        return { text: 'Làm khảo sát', icon: FileText };
    };

    /* ─── Modal content ─── */
    const modalContent = (
        /* ✅ Overlay dùng style inline để tránh bị Tailwind purge hoặc bị override */
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
            }}
        >
            {/* Backdrop */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.75)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                }}
                onClick={onClose}
            />

            {/* Card */}
            <div
                className="relative w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                style={{
                    background: 'var(--admin-surface)',
                    border: '1px solid var(--admin-border)',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                    borderRadius: 24,
                    /* đảm bảo card không bị đẩy ra ngoài viewport trên mobile */
                    maxHeight: 'calc(100vh - 32px)',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Header */}
                <div
                    className={`px-6 py-5 flex-shrink-0 ${!notification.read ? config.bgAccent : ''}`}
                    style={{ borderBottom: '1px solid var(--admin-border)' }}
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                                <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="font-bold text-base leading-tight" style={{ color: 'var(--admin-text)' }}>
                                    {displayTitle}
                                </h2>
                                {timeAgo && (
                                    <p className="text-xs mt-1 flex items-center gap-1.5" style={{ color: 'var(--admin-text-dim)' }}>
                                        <Clock className="w-3 h-3" />{timeAgo}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl transition-colors flex-shrink-0"
                            style={{ color: 'var(--admin-text-dim)' }}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body — scrollable */}
                <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">

                    {/* Survey card */}
                    {surveyTitle && (
                        <div className={`rounded-xl border p-4 ${config.borderAccent} ${config.bgAccent}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
                                    <FileText className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--admin-text-dim)' }}>Khảo sát</p>
                                    <p className="text-sm font-bold truncate" style={{ color: 'var(--admin-text)' }}>{surveyTitle}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Person card */}
                    {personName && ['SURVEY_INVITATION', 'SURVEY_RESPONSE', 'NEW_PARTICIPANT'].includes(type) && (
                        <div className={`rounded-xl border p-4 ${config.borderAccent} ${config.bgAccent}`}>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-text-dim)] mb-3">
                                {type === 'SURVEY_INVITATION' ? 'Người mời' : type === 'SURVEY_RESPONSE' ? 'Người phản hồi' : 'Người tham gia'}
                            </p>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
                                    <span className="text-sm font-bold text-white">{getAvatarInitials(personName)}</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-[var(--admin-text)]">{personName}</p>
                                    {roleLabel && <p className={`text-xs font-medium ${config.textAccent}`}>{roleLabel}</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Detail card */}
                    {(endDateInfo || data.responseCount != null || data.surveyDescription) && (
                        <div className={`rounded-xl border p-4 ${config.borderAccent} ${config.bgAccent}`}>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-text-dim)] mb-3">Chi tiết</p>
                            <div className="space-y-2.5">
                                {endDateInfo && (
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-7 h-7 rounded-lg ${config.bgAccent} flex items-center justify-center`}>
                                            <Calendar className={`w-3.5 h-3.5 ${config.textAccent}`} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-[var(--admin-text-dim)]">Thời hạn</p>
                                            <p className={`text-sm font-semibold ${endDateInfo.isExpired ? 'text-red-500 line-through' : 'text-[var(--admin-text)]'}`}>
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
                                            <p className="text-[11px] text-[var(--admin-text-dim)]">Số câu trả lời</p>
                                            <p className="text-sm font-semibold text-[var(--admin-text)]">{data.responseCount} câu trả lời</p>
                                        </div>
                                    </div>
                                )}
                                {data.surveyDescription && (
                                    <div className="flex items-start gap-2.5">
                                        <div className={`w-7 h-7 rounded-lg ${config.bgAccent} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                            <FileText className={`w-3.5 h-3.5 ${config.textAccent}`} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-[var(--admin-text-dim)]">Mô tả</p>
                                            <p className="text-sm text-[var(--admin-text-sub)] line-clamp-2">{data.surveyDescription}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Message fallback */}
                    {notification.message && !surveyTitle && (
                        <div className={`rounded-xl border p-4 ${config.borderAccent} ${config.bgAccent}`}>
                            <p className="text-sm text-[var(--admin-text-sub)]">{notification.message}</p>
                        </div>
                    )}

                    {/* Extend form */}
                    {showExtendForm && ['SURVEY_EXPIRED', 'SURVEY_TIMEOUT'].includes(type) && (
                        <div className={`rounded-xl border p-4 ${config.borderAccent} ${config.bgAccent}`}>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-text-dim)] mb-3">Gia hạn thời hạn</p>
                            <div className="space-y-3">
                                <input
                                    type="date"
                                    min={getMinDate()}
                                    value={extendDate}
                                    onChange={(e) => { setExtendDate(e.target.value); setExtendError(''); }}
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-hover)] text-[var(--admin-text)] focus:ring-[var(--admin-primary)] focus:border-[var(--admin-primary)] outline-none"
                                />
                                {extendError && <p className="text-xs text-red-500">{extendError}</p>}
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
                                        {extending      ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang gia hạn...</>
                                        : extendSuccess ? <><Check className="w-4 h-4" /> Thành công!</>
                                        :                 <><Edit3 className="w-4 h-4" /> Xác nhận gia hạn</>}
                                    </button>
                                    <button
                                        onClick={() => { setShowExtendForm(false); setExtendError(''); setExtendDate(''); }}
                                        className="px-4 py-2.5 text-sm font-medium text-[var(--admin-text-sub)] hover:bg-[var(--admin-surface-hover)] rounded-xl transition-colors"
                                    >
                                        Huỷ
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 flex-shrink-0 border-t border-[var(--admin-border)] bg-[var(--admin-bg-secondary)] flex flex-wrap gap-2">
                    {data.surveyId && type === 'SURVEY_INVITATION' && (() => {
                        const { text, icon: ActionIcon } = getInviteActionLabel();
                        return (
                            <button
                                onClick={() => { onMarkRead(notification.id); onClose(); navigate(getInviteTarget()); }}
                                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${config.actionColor}`}
                            >
                                <ActionIcon className="w-4 h-4" />{text}
                            </button>
                        );
                    })()}
                    {data.surveyId && ['SURVEY_RESPONSE', 'NEW_PARTICIPANT', 'SURVEY_PUBLISHED', 'SURVEY_CLOSED'].includes(type) && (
                        <button
                            onClick={() => { onMarkRead(notification.id); onClose(); navigate(`/user/my-surveys/${data.surveyId}`); }}
                            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${config.actionColor}`}
                        >
                            <ExternalLink className="w-4 h-4" />Xem chi tiết
                        </button>
                    )}
                    {data.surveyId && ['SURVEY_EXPIRED', 'SURVEY_TIMEOUT'].includes(type) && (
                        <>
                            <button
                                onClick={() => setShowExtendForm(!showExtendForm)}
                                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${config.actionColor}`}
                            >
                                <Edit3 className="w-4 h-4" />{showExtendForm ? 'Ẩn form' : 'Gia hạn'}
                            </button>
                            <button
                                onClick={() => { onMarkRead(notification.id); onClose(); navigate(`/user/my-surveys/${data.surveyId}`); }}
                                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl bg-[var(--admin-surface-hover)] text-white transition-all shadow-lg"
                            >
                                <ExternalLink className="w-4 h-4" />Xem chi tiết
                            </button>
                        </>
                    )}
                    <div className="flex-1" />
                    <button
                        onClick={() => { onDelete(notification.id); onClose(); }}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-[rgba(239,68,68,0.08)] rounded-xl transition-colors"
                    >
                        <X className="w-4 h-4" />Xoá
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default NotificationDetailModal;