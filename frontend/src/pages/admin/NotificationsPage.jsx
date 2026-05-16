import { useState } from "react";
import { useNotification } from "@/contexts/NotificationContext";
import NotificationDetailModal from "@/components/common/Notification/NotificationDetailModal";
import { Bell, CheckCheck, Trash2, Clock, Filter, Loader2 } from "lucide-react";

const TYPE_LABELS = {
    SURVEY_INVITATION: "Lời mời",
    SURVEY_RESPONSE: "Phản hồi",
    SURVEY_EXPIRED: "Hết hạn",
    SURVEY_PUBLISHED: "Đã công khai",
    SURVEY_CLOSED: "Đã đóng",
    NEW_PARTICIPANT: "Người tham gia",
    SURVEY_INVITATION_SENT: "Đã gửi lời mời",
    SYSTEM: "Hệ thống",
};

const TYPE_COLORS = {
    SURVEY_INVITATION: "bg-indigo-100 text-indigo-700",
    SURVEY_RESPONSE: "bg-emerald-100 text-emerald-700",
    SURVEY_EXPIRED: "bg-orange-100 text-orange-700",
    SURVEY_PUBLISHED: "bg-teal-100 text-teal-700",
    SURVEY_CLOSED: "bg-red-100 text-red-700",
    NEW_PARTICIPANT: "bg-purple-100 text-purple-700",
    SURVEY_INVITATION_SENT: "bg-indigo-100 text-indigo-700",
    SYSTEM: "bg-slate-100 text-slate-700",
};

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
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Thông báo</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : "Tất cả thông báo đã được đọc"}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => refreshNotifications()}
                        className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                    >
                        Làm mới
                    </button>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            <CheckCheck size={16} />
                            Đánh dấu đã đọc
                        </button>
                    )}
                    <button
                        onClick={handleDeleteRead}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <Trash2 size={16} />
                        Xóa đã đọc
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 mb-4">
                <Filter size={16} className="text-slate-400" />
                {["all", "unread", "read"].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            filter === f
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
                        }`}
                    >
                        {f === "all" ? "Tất cả" : f === "unread" ? "Chưa đọc" : "Đã đọc"}
                    </button>
                ))}
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
                {filteredNotifications.length === 0 ? (
                    <div className="bg-slate-800/50 rounded-2xl p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/50 flex items-center justify-center">
                            <Bell size={32} className="text-slate-500" />
                        </div>
                        <p className="text-lg font-medium text-slate-400">Không có thông báo nào</p>
                        <p className="text-sm text-slate-500 mt-1">Các thông báo sẽ xuất hiện khi có hoạt động mới</p>
                    </div>
                ) : (
                    filteredNotifications.map((notification) => (
                        <div
                            key={notification.id}
                            onClick={() => setSelectedNotification(notification)}
                            className={`bg-slate-800/50 rounded-xl p-4 cursor-pointer transition-all hover:bg-slate-800/70 border border-transparent hover:border-slate-700 ${
                                !notification.read ? "border-l-4 border-l-indigo-500" : ""
                            }`}
                        >
                            <div className="flex items-start gap-4">
                                {!notification.read && (
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span
                                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                                TYPE_COLORS[notification.type] || TYPE_COLORS.SYSTEM
                                            }`}
                                        >
                                            {TYPE_LABELS[notification.type] || "Thông báo"}
                                        </span>
                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                            <Clock size={12} />
                                            {formatTime(notification.createdAt)}
                                        </span>
                                    </div>
                                    <h3 className={`font-medium ${notification.read ? "text-slate-300" : "text-white"}`}>
                                        {notification.title}
                                    </h3>
                                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">{notification.message}</p>
                                    {notification.data?.surveyTitle && (
                                        <p className="text-xs text-slate-500 mt-2">
                                            Khảo sát: {notification.data.surveyTitle}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
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
