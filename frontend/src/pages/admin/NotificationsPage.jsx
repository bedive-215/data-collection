import { useState } from "react";
import { useNotification } from "@/contexts/NotificationContext";
import NotificationDetailModal from "@/components/common/Notification/NotificationDetailModal";
import { Bell, CheckCheck, Trash2, Clock, Loader2, RefreshCw } from "lucide-react";

const TYPE_LABELS = {
    SURVEY_INVITATION: "Lời mời",
    SURVEY_RESPONSE: "Phản hồi",
    SURVEY_EXPIRED: "Hết hạn",
    SURVEY_PUBLISHED: "Đã công khai",
    SURVEY_CLOSED: "Đã đóng",
    NEW_PARTICIPANT: "Người tham gia",
    SURVEY_INVITATION_SENT: "Đã gửi lời mời",
    SYSTEM: "Hệ thống"};

const TYPE_COLORS = {
    SURVEY_INVITATION: { bg: "rgba(59,130,246,0.1)", color: "#3B82F6", border: "rgba(59,130,246,0.2)" },
    SURVEY_RESPONSE:    { bg: "rgba(16,185,129,0.1)", color: "#10B981", border: "rgba(16,185,129,0.2)" },
    SURVEY_EXPIRED:    { bg: "rgba(59,130,246,0.1)", color: "#3B82F6", border: "rgba(59,130,246,0.2)" },
    SURVEY_PUBLISHED:  { bg: "rgba(59,130,246,0.1)", color: "#3B82F6", border: "rgba(59,130,246,0.2)" },
    SURVEY_CLOSED:     { bg: "rgba(239,68,68,0.1)", color: "#EF4444", border: "rgba(239,68,68,0.2)" },
    NEW_PARTICIPANT:   { bg: "rgba(96,165,250,0.1)", color: "#60A5FA", border: "rgba(96,165,250,0.2)" },
    SURVEY_INVITATION_SENT: { bg: "rgba(59,130,246,0.1)", color: "#3B82F6", border: "rgba(59,130,246,0.2)" },
    SYSTEM:            { bg: "rgba(156,163,175,0.1)", color: "#9CA3AF", border: "rgba(156,163,175,0.2)" }};

const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const diff = Date.now() - date.getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 1) return "Vừa xong";
    if (m < 60) return `${m} phút trước`;
    if (h < 24) return `${h} giờ trước`;
    if (d < 7) return `${d} ngày trước`;
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric" });
};

export default function AdminNotificationsPage() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, refreshNotifications } = useNotification();
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(false);

    const filteredNotifications = notifications.filter((n) => {
        if (filter === "unread") return !n.read;
        if (filter === "read") return n.read;
        return true;
    });

    const handleMarkAllRead = async () => {
        setLoading(true);
        await markAllAsRead();
        setLoading(false);
    };

    const handleDeleteRead = async () => {
        setLoading(true);
        const readIds = notifications.filter((n) => n.read).map((n) => n.id);
        for (const id of readIds) {
            await deleteNotification(id);
        }
        setLoading(false);
    };

    return (
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {/* ── Header ── */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h2
                        className="text-3xl font-extrabold mb-1"
                        style={{ color: "var(--admin-text)", letterSpacing: "-0.02em" }}
                    >
                        Thông báo
                    </h2>
                    <p className="text-sm" style={{ color: "var(--admin-text-sub)" }}>
                        {unreadCount > 0
                            ? `${unreadCount} thông báo chưa đọc`
                            : "Tất cả thông báo đã được đọc"}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => refreshNotifications()}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                        style={{
                            background: "var(--admin-surface)",
                            border: "1px solid var(--admin-border)",
                            color: "var(--admin-text-sub)"}}
                    >
                        <RefreshCw size={14} />
                        Làm mới
                    </button>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                            style={{
                                background: "rgba(59,130,246,0.1)",
                                color: "#3B82F6",
                                border: "1px solid rgba(59,130,246,0.2)"}}
                        >
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
                            Đánh dấu đã đọc
                        </button>
                    )}
                    <button
                        onClick={handleDeleteRead}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                        style={{
                            background: "rgba(239,68,68,0.08)",
                            color: "#EF4444",
                            border: "1px solid rgba(239,68,68,0.15)"}}
                    >
                        <Trash2 size={14} />
                        Xóa đã đọc
                    </button>
                </div>
            </div>

            {/* ── Filters ── */}
            <div
                className="flex items-center gap-2 mb-6 p-1.5 rounded-xl inline-flex w-fit"
                style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}
            >
                {[
                    { value: "all", label: "Tất cả", color: "#111827" },
                    { value: "unread", label: "Chưa đọc", color: "#3B82F6" },
                    { value: "read", label: "Đã đọc", color: "#9CA3AF" },
                ].map(({ value, label, color }) => (
                    <button
                        key={value}
                        onClick={() => setFilter(value)}
                        className="px-4 py-2 text-sm font-semibold rounded-lg transition-all"
                        style={
                            filter === value
                                ? { background: "#3B82F6", color: "#FFF" }
                                : { background: "transparent", color: "var(--admin-text-sub)" }
                        }
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Notifications List ── */}
            <div className="space-y-3">
                {filteredNotifications.length === 0 ? (
                    <div
                        className="rounded-2xl p-16 text-center"
                        style={{
                            background: "var(--admin-surface)",
                            border: "1px solid var(--admin-border)"}}
                    >
                        <div
                            className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                            style={{ background: "var(--admin-bg-secondary)" }}
                        >
                            <Bell size={32} style={{ color: "var(--admin-text-dim)" }} />
                        </div>
                        <p className="text-base font-semibold mb-1" style={{ color: "var(--admin-text)" }}>
                            Không có thông báo nào
                        </p>
                        <p className="text-sm" style={{ color: "var(--admin-text-dim)" }}>
                            Các thông báo sẽ xuất hiện khi có hoạt động mới
                        </p>
                    </div>
                ) : (
                    filteredNotifications.map((notification) => {
                        const tc = TYPE_COLORS[notification.type] || TYPE_COLORS.SYSTEM;
                        return (
                            <div
                                key={notification.id}
                                onClick={() => setSelectedNotification(notification)}
                                className="rounded-2xl p-4 cursor-pointer transition-all group"
                                style={{
                                    background: "var(--admin-surface)",
                                    border: `1px solid ${notification.read ? "var(--admin-border)" : "rgba(245,158,11,0.2)"}`,
                                    borderLeft: notification.read ? "1px solid var(--admin-border)" : `3px solid ${tc.color}`}}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = "var(--admin-surface-hover)";
                                    e.currentTarget.style.borderColor = "var(--admin-border-hover)";
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = "var(--admin-surface)";
                                    e.currentTarget.style.borderColor = notification.read ? "var(--admin-border)" : `${tc.color}30`;
                                }}
                            >
                                <div className="flex items-start gap-4">
                                    {!notification.read && (
                                        <div
                                            className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                                            style={{ background: tc.color }}
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span
                                                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                                                style={{ background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}
                                            >
                                                {TYPE_LABELS[notification.type] || "Thông báo"}
                                            </span>
                                            <span
                                                className="text-xs flex items-center gap-1"
                                                style={{ color: "var(--admin-text-dim)" }}
                                            >
                                                <Clock size={11} />
                                                {formatTime(notification.createdAt)}
                                            </span>
                                        </div>
                                        <h3
                                            className="text-sm font-semibold mb-1"
                                            style={{ color: notification.read ? "var(--admin-text-sub)" : "var(--admin-text)" }}
                                        >
                                            {notification.title}
                                        </h3>
                                        <p
                                            className="text-sm line-clamp-2"
                                            style={{ color: "var(--admin-text-dim)", lineHeight: 1.5 }}
                                        >
                                            {notification.message}
                                        </p>
                                        {notification.data?.surveyTitle && (
                                            <p className="text-xs mt-2" style={{ color: "var(--admin-text-dim)" }}>
                                                Khảo sát: {notification.data.surveyTitle}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
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
        </div>
    );
}
