import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useNotificationStore } from "@/stores/notificationStore";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "react-toastify";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const NOTIF_TOAST_CONFIG = {
  STAR_EARNED: (n) => {
    const { amount, multiplier, balance_after } = n.data || {};
    const msg = `+${amount} sao${multiplier > 1 ? ` (x${multiplier})` : ""}${n.message ? ` — ${n.message}` : ""}`;
    toast.success(msg, { autoClose: 5000 });
  },
  STREAK_MILESTONE: (n) => {
    const { streak_count, multiplier } = n.data || {};
    toast.success(`Streak ${streak_count} ngày!${multiplier ? ` (x${multiplier})` : ""}`, { autoClose: 5000 });
  },
  ACHIEVEMENT_UNLOCKED: (n) => {
    const name = n.data?.achievement_name || "Huy hiệu mới";
    toast.success(`Mở khóa: ${name}!`, { autoClose: 5000 });
  },
  RANK_UP: (n) => {
    const name = n.data?.rank_name || "";
    toast.success(`Thăng rank: ${name}!`, { autoClose: 5000 });
  },
};

export function useSocketNotifications() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user || !accessToken) return;

    const socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {});
    socket.on("notification", (notification) => {
      addNotification(notification);
      const type = (notification.type || "").toUpperCase();
      const handler = NOTIF_TOAST_CONFIG[type];
      if (handler) handler(notification);
      else if (notification.message) toast.info(notification.message);
    });

    socketRef.current = socket;
    fetchNotifications();

    return () => {
      socket.disconnect();
    };
  }, [user?.user_id, accessToken]);

  return socketRef.current;
}
