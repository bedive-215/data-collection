import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import userService from "@/services/userService";
import { useAdminStats } from "@/providers/AdminStatsProvider";
import { toast } from "react-toastify";
import {
  Loader2,
  Trash2,
  RotateCcw,
  User,
  Users,
  Shield,
  Mail,
  Phone,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ShieldAlert,
  ShieldCheck,
  UserCog,
  XCircle,
  CheckCircle,
  Eye,
  X,
  Star,
  Trophy,
  Flame,
  Clock,
  Filter} from "lucide-react";

/* ================================
   Shared Helpers
=============================== */
function formatDate(d) {
  return d ? new Date(d).toLocaleDateString("vi-VN") : "—";
}

/* ================================
   RoleBadge
=============================== */
function RoleBadge({ role }) {
  const isAdmin = role === "admin";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border"
      style={{
        background: isAdmin ? "rgba(245,158,11,0.1)" : "rgba(59,130,246,0.1)",
        color: isAdmin ? "#3B82F6" : "#3B82F6",
        borderColor: isAdmin ? "rgba(245,158,11,0.2)" : "rgba(59,130,246,0.2)"}}
    >
      {isAdmin ? <Shield size={11} /> : <User size={11} />}
      {role}
    </span>
  );
}

/* ================================
   StatusBadge
=============================== */
function StatusBadge({ isActive }) {
  return isActive ? (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border"
      style={{
        background: "rgba(16,185,129,0.1)",
        color: "#10B981",
        borderColor: "rgba(16,185,129,0.2)"}}
    >
      <CheckCircle size={11} />
      Hoạt động
    </span>
  ) : (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border"
      style={{
        background: "rgba(239,68,68,0.1)",
        color: "#EF4444",
        borderColor: "rgba(239,68,68,0.2)"}}
    >
      <XCircle size={11} />
      Bị khóa
    </span>
  );
}

/* ================================
   ConfirmModal
=============================== */
function ConfirmModal({ open, onClose, onConfirm, title, message, confirmText, confirmBgClass, loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      <div
        className="relative p-6 w-full max-w-md rounded-2xl animate-slide-up"
        style={{
          background: "var(--admin-surface)",
          border: "1px solid var(--admin-border)"}}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(239,68,68,0.1)" }}
          >
            <ShieldAlert size={20} style={{ color: "#EF4444" }} />
          </div>
          <h3 className="text-lg font-bold" style={{ color: "var(--admin-text)" }}>
            {title}
          </h3>
        </div>
        <p className="text-sm mb-6" style={{ color: "var(--admin-text-sub)", lineHeight: 1.6 }}>
          {message}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "var(--admin-bg-secondary)",
              border: "1px solid var(--admin-border)",
              color: "var(--admin-text-sub)"}}
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: confirmBgClass || "#EF4444" }}
          >
            {loading ? <Loader2 size={15} className="animate-spin mx-auto" /> : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================
   RoleChangeModal
=============================== */
function RoleChangeModal({ open, onClose, onConfirm, user, loading }) {
  const [newRole, setNewRole] = useState("");

  useEffect(() => {
    if (user) setNewRole(user.role === "admin" ? "user" : "admin");
  }, [user]);

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      <div
        className="relative p-6 w-full max-w-md rounded-2xl animate-slide-up"
        style={{
          background: "var(--admin-surface)",
          border: "1px solid var(--admin-border)"}}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold" style={{ color: "var(--admin-text)" }}>
            Thay đổi vai trò
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--admin-text-dim)" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* User info */}
        <div
          className="flex items-center gap-3 mb-5 p-3 rounded-xl"
          style={{ background: "var(--admin-bg-secondary)", border: "1px solid var(--admin-border)" }}
        >
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.full_name}
              className="w-10 h-10 rounded-xl object-cover"
              style={{ border: "1px solid var(--admin-border)" }}
            />
          ) : (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #3B82F6, #2563EB)" }}
            >
              <User size={18} style={{ color: "#000" }} />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--admin-text)" }}>
              {user.full_name}
            </p>
            <p className="text-xs" style={{ color: "var(--admin-text-dim)" }}>
              {user.email}
            </p>
          </div>
        </div>

        {/* Role options */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setNewRole("admin")}
            className="flex-1 p-4 rounded-xl border transition-all flex flex-col items-center gap-2"
            style={
              newRole === "admin"
                ? { background: "rgba(245,158,11,0.1)", border: "2px solid rgba(245,158,11,0.4)", color: "var(--admin-text)" }
                : { background: "var(--admin-bg-secondary)", border: "1px solid var(--admin-border)", color: "var(--admin-text-sub)" }
            }
          >
            <Shield size={22} style={{ color: newRole === "admin" ? "#3B82F6" : "var(--admin-text-dim)" }} />
            <span className="text-xs font-bold">Admin</span>
          </button>
          <button
            onClick={() => setNewRole("user")}
            className="flex-1 p-4 rounded-xl border transition-all flex flex-col items-center gap-2"
            style={
              newRole === "user"
                ? { background: "rgba(59,130,246,0.1)", border: "2px solid rgba(59,130,246,0.4)", color: "var(--admin-text)" }
                : { background: "var(--admin-bg-secondary)", border: "1px solid var(--admin-border)", color: "var(--admin-text-sub)" }
            }
          >
            <User size={22} style={{ color: newRole === "user" ? "#3B82F6" : "var(--admin-text-dim)" }} />
            <span className="text-xs font-bold">User</span>
          </button>
        </div>

        {newRole !== user.role && (
          <div
            className="mb-4 p-3 rounded-xl text-sm"
            style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", color: "#3B82F6" }}
          >
            {newRole === "admin"
              ? "Người dùng này sẽ có quyền truy cập bảng quản trị."
              : "Người dùng này sẽ mất quyền truy cập bảng quản trị."}
          </div>
        )}

        <div className="flex gap-3 justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "var(--admin-bg-secondary)",
              border: "1px solid var(--admin-border)",
              color: "var(--admin-text-sub)"}}
          >
            Hủy
          </button>
          <button
            onClick={() => onConfirm(newRole)}
            disabled={loading || newRole === user.role}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "#3B82F6" }}
          >
            {loading ? <Loader2 size={15} className="animate-spin mx-auto" /> : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================
   BlockReasonModal
=============================== */
function BlockReasonModal({ open, onClose, onConfirm, loading, user }) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      <div
        className="relative p-6 w-full max-w-md rounded-2xl animate-slide-up"
        style={{
          background: "var(--admin-surface)",
          border: "1px solid var(--admin-border)"}}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold" style={{ color: "var(--admin-text)" }}>
            Khóa tài khoản
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--admin-text-dim)" }}
          >
            <X size={18} />
          </button>
        </div>

        <div
          className="flex items-center gap-3 mb-4 p-3 rounded-xl"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(239,68,68,0.1)" }}
          >
            <ShieldAlert size={18} style={{ color: "#EF4444" }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--admin-text)" }}>
              {user.full_name}
            </p>
            <p className="text-xs" style={{ color: "var(--admin-text-dim)" }}>
              {user.email}
            </p>
          </div>
        </div>

        <p className="text-sm mb-4" style={{ color: "var(--admin-text-sub)", lineHeight: 1.6 }}>
          Người dùng sẽ bị đăng xuất ngay lập tức và không thể đăng nhập cho đến khi được mở khóa.
        </p>

        <div className="mb-5">
          <label
            className="block text-xs font-bold uppercase tracking-wider mb-2"
            style={{ color: "var(--admin-text-dim)" }}
          >
            Lý do khóa (tùy chọn)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: Vi phạm điều khoản sử dụng..."
            maxLength={500}
            rows={3}
            className="w-full rounded-xl py-3 px-4 text-sm resize-none transition-colors"
            style={{
              background: "var(--admin-bg-secondary)",
              border: "1px solid var(--admin-border)",
              color: "var(--admin-text)"}}
          />
          <p className="text-[10px] text-right mt-1" style={{ color: "var(--admin-text-dim)" }}>
            {reason.length}/500
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "var(--admin-bg-secondary)",
              border: "1px solid var(--admin-border)",
              color: "var(--admin-text-sub)"}}
          >
            Hủy
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "#EF4444" }}
          >
            {loading ? <Loader2 size={15} className="animate-spin mx-auto" /> : "Khóa tài khoản"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================
   UserDetailModal
=============================== */
function UserDetailModal({ open, onClose, user }) {
  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      <div
        className="relative p-6 w-full max-w-lg rounded-2xl animate-slide-up overflow-y-auto max-h-[85vh]"
        style={{
          background: "var(--admin-surface)",
          border: "1px solid var(--admin-border)"}}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold" style={{ color: "var(--admin-text)" }}>
            Chi tiết người dùng
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--admin-text-dim)" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Avatar + Name */}
        <div className="flex items-center gap-4 mb-5">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.full_name}
              className="w-16 h-16 rounded-2xl object-cover"
              style={{ border: "1px solid var(--admin-border)" }}
            />
          ) : (
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #3B82F6, #2563EB)" }}
            >
              <User size={28} style={{ color: "#000" }} />
            </div>
          )}
          <div>
            <p className="text-lg font-bold" style={{ color: "var(--admin-text)" }}>
              {user.full_name}
            </p>
            <p className="text-xs font-mono" style={{ color: "var(--admin-text-dim)" }}>
              ID: {user.id}
            </p>
            <div className="flex gap-2 mt-2">
              <RoleBadge role={user.role} />
              <StatusBadge isActive={user.is_active} />
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: "Email", value: user.email, icon: <Mail size={13} /> },
            { label: "Số điện thoại", value: user.phone_number || "—", icon: <Phone size={13} /> },
            {
              label: "Giới tính",
              value: user.gender === "MALE" ? "Nam" : user.gender === "FEMALE" ? "Nữ" : "Khác",
              icon: <User size={13} />},
            { label: "Ngày sinh", value: formatDate(user.date_of_birth), icon: <Calendar size={13} /> },
            { label: "Ngày tạo", value: formatDate(user.created_at), icon: <Clock size={13} /> },
            {
              label: "Xác thực email",
              value: user.email_verified ? "Đã xác thực" : "Chưa xác thực",
              icon: user.email_verified
                ? <CheckCircle size={13} style={{ color: "#10B981" }} />
                : <XCircle size={13} style={{ color: "#EF4444" }} />},
          ].map(({ label, value, icon }) => (
            <div
              key={label}
              className="p-3 rounded-xl"
              style={{ background: "var(--admin-bg-secondary)", border: "1px solid var(--admin-border)" }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1"
                style={{ color: "var(--admin-text-dim)" }}
              >
                {icon}
                {label}
              </p>
              <p className="text-sm font-medium truncate" style={{ color: "var(--admin-text)" }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Block Info */}
        {!user.is_active && (
          <div
            className="mb-4 p-4 rounded-xl"
            style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
          >
            <p
              className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"
              style={{ color: "#EF4444" }}
            >
              <ShieldAlert size={13} />
              Thông tin khóa tài khoản
            </p>
            <p className="text-xs mb-1" style={{ color: "var(--admin-text-sub)" }}>
              <span className="font-semibold" style={{ color: "var(--admin-text)" }}>
                Bị khóa lúc:
              </span>{" "}
              {user.blocked_at
                ? new Date(user.blocked_at).toLocaleString("vi-VN")
                : "—"}
            </p>
            {user.block_reason && (
              <p className="text-xs" style={{ color: "var(--admin-text-sub)" }}>
                <span className="font-semibold" style={{ color: "var(--admin-text)" }}>
                  Lý do:
                </span>{" "}
                {user.block_reason}
              </p>
            )}
          </div>
        )}

        {/* Gamification */}
        <div
          className="p-4 rounded-xl"
          style={{ background: "var(--admin-bg-secondary)", border: "1px solid var(--admin-border)" }}
        >
          <p
            className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5"
            style={{ color: "var(--admin-text-dim)" }}
          >
            <Trophy size={13} />
            Thông tin gamification
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Star size={16} style={{ color: "#F59E0B" }} />, value: user.star_balance ?? 0, label: "Sao", bg: "rgba(245,158,11,0.08)" },
              { icon: <Trophy size={16} style={{ color: "#60A5FA" }} />, value: user.current_rank ?? "BRONZE", label: "Hạng", bg: "rgba(96,165,250,0.08)" },
              { icon: <Flame size={16} style={{ color: "#EF4444" }} />, value: user.streak_count ?? 0, label: "Chuỗi", bg: "rgba(239,68,68,0.08)" },
            ].map(({ icon, value, label, bg }) => (
              <div
                key={label}
                className="text-center p-3 rounded-xl"
                style={{ background: bg }}
              >
                <div className="mb-1">{icon}</div>
                <p className="text-sm font-bold" style={{ color: "var(--admin-text)" }}>
                  {value}
                </p>
                <p className="text-[9px] uppercase tracking-wider" style={{ color: "var(--admin-text-dim)" }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================
   UserRow
=============================== */
function UserRow({ u, onView, onRoleChange, onBlock, onUnblock, onDelete }) {
  return (
    <tr
      style={{ borderBottom: "1px solid var(--admin-border)" }}
      className="group transition-colors"
    >
      {/* User */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {u.avatar ? (
            <img
              src={u.avatar}
              alt={u.full_name}
              className="w-10 h-10 rounded-xl object-cover"
              style={{ border: "1px solid var(--admin-border)" }}
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #3B82F6, #2563EB)" }}
            >
              <User size={18} style={{ color: "#000" }} />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--admin-text)" }}>
              {u.full_name}
            </p>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: "var(--admin-text-dim)" }}>
              #{u.id}
            </p>
          </div>
        </div>
      </td>

      {/* Email */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--admin-text-sub)" }}>
          <Mail size={13} style={{ color: "var(--admin-text-dim)", flexShrink: 0 }} />
          <span className="truncate max-w-[180px]">{u.email}</span>
        </div>
        {u.phone_number && (
          <div className="flex items-center gap-1.5 text-xs mt-1" style={{ color: "var(--admin-text-dim)" }}>
            <Phone size={12} style={{ color: "var(--admin-text-dim)", flexShrink: 0 }} />
            {u.phone_number}
          </div>
        )}
      </td>

      {/* Role */}
      <td className="px-5 py-4">
        <RoleBadge role={u.role} />
      </td>

      {/* Status */}
      <td className="px-5 py-4">
        <StatusBadge isActive={u.is_active} />
      </td>

      {/* Date */}
      <td className="px-5 py-4 text-sm" style={{ color: "var(--admin-text-sub)" }}>
        {formatDate(u.created_at)}
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onView(u)}
            className="p-2 rounded-lg border border-transparent transition-all"
            title="Xem chi tiết"
            style={{ color: "var(--admin-text-dim)" }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "var(--admin-surface-hover)";
              e.currentTarget.style.color = "var(--admin-text)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--admin-text-dim)";
            }}
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => onRoleChange(u)}
            className="p-2 rounded-lg border border-transparent transition-all"
            title="Đổi vai trò"
            style={{ color: "var(--admin-text-dim)" }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "var(--admin-surface-hover)";
              e.currentTarget.style.color = "var(--admin-text)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--admin-text-dim)";
            }}
          >
            <UserCog size={15} />
          </button>
          {!u.is_active ? (
            <button
              onClick={() => onUnblock(u)}
              className="p-2 rounded-lg border border-transparent transition-all"
              title="Mở khóa"
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(16,185,129,0.1)";
                e.currentTarget.style.color = "#10B981";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--admin-text-dim)";
              }}
              style={{ color: "var(--admin-text-dim)" }}
            >
              <ShieldCheck size={15} />
            </button>
          ) : (
            <button
              onClick={() => onBlock(u)}
              className="p-2 rounded-lg border border-transparent transition-all"
              title="Khóa tài khoản"
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(59,130,246,0.1)";
                e.currentTarget.style.color = "#3B82F6";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--admin-text-dim)";
              }}
              style={{ color: "var(--admin-text-dim)" }}
            >
              <ShieldAlert size={15} />
            </button>
          )}
          <button
            onClick={() => onDelete(u)}
            className="p-2 rounded-lg border border-transparent transition-all"
            title="Xóa"
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(239,68,68,0.1)";
              e.currentTarget.style.color = "#EF4444";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--admin-text-dim)";
            }}
            style={{ color: "var(--admin-text-dim)" }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ================================
   Main UserManagement Page
=============================== */
export default function UserManagement() {
  const { token } = useAuth();

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const limit = 10;

  /* ── Modals ── */
  const [viewUser, setViewUser] = useState(null);
  const [roleUser, setRoleUser] = useState(null);
  const [blockUser, setBlockUser] = useState(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  /* ── AdminStats ── */
  const {
    overview,
    loading: loadingStats,
    fetchOverview} = useAdminStats();

  /* ── Fetch list ── */
  const fetchListUsers = async () => {
    setLoadingUsers(true);
    try {
      const params = { page, limit };
      if (search) params.search = search;
      if (statusFilter === "active") params.isActive = true;
      else if (statusFilter === "blocked") params.isActive = false;

      const res = await userService.getListOfUser(params, token);
      const list = res?.data?.data || [];
      setUsers(Array.isArray(list) ? list : []);
      setTotal(res?.data?.total || 0);
      setTotalPages(res?.data?.totalPages || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || "Lấy danh sách thất bại");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => { fetchListUsers(); }, [page, statusFilter]);

  useEffect(() => {
    fetchOverview();
  }, []);

  /* ── Pagination helper ── */
  const getVisiblePages = () => {
    if (totalPages <= 5) return [...Array(totalPages).keys()].map((x) => x + 1);
    let start = Math.max(page - 2, 1);
    let end = Math.min(start + 4, totalPages);
    if (end - start < 4) start = Math.max(end - 4, 1);
    return [...Array(end - start + 1).keys()].map((x) => start + x);
  };

  /* ── Search debounce ── */
  useEffect(() => {
    const t = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchListUsers();
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  /* ── Actions ── */
  const handleRefresh = () => {
    setPage(1);
    fetchListUsers();
    fetchOverview();
  };

  const handleRoleChange = async (newRole) => {
    if (!roleUser) return;
    setModalLoading(true);
    try {
      await userService.updateUserRole(roleUser.id, newRole, token);
      toast.success(`Đã đổi vai trò thành ${newRole === "admin" ? "Admin" : "User"}`);
      setRoleUser(null);
      fetchListUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Đổi vai trò thất bại");
    } finally {
      setModalLoading(false);
    }
  };

  const handleBlock = async (reason) => {
    if (!blockUser) return;
    setModalLoading(true);
    try {
      await userService.blockUser(blockUser.id, reason, token);
      toast.success(`Đã khóa tài khoản "${blockUser.full_name}"`);
      setBlockUser(null);
      fetchListUsers();
      fetchOverview();
    } catch (err) {
      toast.error(err.response?.data?.message || "Khóa tài khoản thất bại");
    } finally {
      setModalLoading(false);
    }
  };

  const handleUnblock = async (user) => {
    setModalLoading(true);
    try {
      await userService.unblockUser(user.id, token);
      toast.success(`Đã mở khóa tài khoản "${user.full_name}"`);
      fetchListUsers();
      fetchOverview();
    } catch (err) {
      toast.error(err.response?.data?.message || "Mở khóa thất bại");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = (user) => {
    setDeleteUserTarget(user);
  };

  const confirmDelete = async () => {
    if (!deleteUserTarget) return;
    setModalLoading(true);
    try {
      await userService.deleteUser(deleteUserTarget.id, token);
      toast.success(`Đã xóa người dùng "${deleteUserTarget.full_name}"`);
      setDeleteUserTarget(null);
      fetchListUsers();
      fetchOverview();
    } catch (err) {
      toast.error(err.response?.data?.message || "Xóa thất bại");
    } finally {
      setModalLoading(false);
    }
  };

  const isLoading = loadingUsers || loadingStats;

  /* ── Stat cards data ── */
  const STAT_CARDS = [
    {
      label: "Tổng người dùng",
      value: overview?.totalUsers ?? total,
      icon: <Users size={20} style={{ color: "#3B82F6" }} />,
      bg: "rgba(59,130,246,0.1)",
      color: "#3B82F6"},
    {
      label: "Đang hoạt động",
      value: overview?.totalActiveUsers ?? "—",
      icon: <ShieldCheck size={20} style={{ color: "#10B981" }} />,
      bg: "rgba(16,185,129,0.1)",
      color: "#10B981"},
    {
      label: "Bị khóa",
      value: overview?.totalBlockedUsers ?? "—",
      icon: <ShieldAlert size={20} style={{ color: "#EF4444" }} />,
      bg: "rgba(239,68,68,0.1)",
      color: "#EF4444"},
    {
      label: "Tổng khảo sát",
      value: overview?.totalSurveys ?? "—",
      icon: <ClipboardList size={20} style={{ color: "#3B82F6" }} />,
      bg: "rgba(59,130,246,0.1)",
      color: "#3B82F6"},
  ];

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2
            className="text-3xl font-extrabold mb-1"
            style={{ color: "var(--admin-text)", letterSpacing: "-0.02em" }}
          >
            Quản lý Người dùng
          </h2>
          <p className="text-sm" style={{ color: "var(--admin-text-sub)" }}>
            Phân quyền, khóa/mở khóa và quản lý tài khoản thành viên
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: "var(--admin-surface)",
            border: "1px solid var(--admin-border)",
            color: "var(--admin-text-sub)"}}
        >
          <RotateCcw size={14} className={isLoading ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STAT_CARDS.map(({ label, value, icon, bg, color }) => (
          <div
            key={label}
            className="p-5 rounded-2xl relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: "var(--admin-surface)",
              border: "1px solid var(--admin-border)"}}
          >
            <div
              className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-15"
              style={{ background: color }}
            />
            <div className="flex items-start justify-between mb-3">
              <p
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--admin-text-dim)" }}
              >
                {label}
              </p>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                {icon}
              </div>
            </div>
            {isLoading ? (
              <div className="h-8 w-20 rounded-lg animate-pulse" style={{ background: "var(--admin-surface-hover)" }} />
            ) : (
              <p
                className="text-2xl font-extrabold"
                style={{ color: "var(--admin-text)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {typeof value === "number" ? value.toLocaleString() : value}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── Table Card ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "var(--admin-surface)",
          border: "1px solid var(--admin-border)"}}
      >
        {/* Table header */}
        <div
          className="px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
          style={{ borderBottom: "1px solid var(--admin-border)" }}
        >
          <h3 className="text-base font-bold" style={{ color: "var(--admin-text)" }}>
            Danh sách thành viên
          </h3>
          <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: "var(--admin-border)" }}>
            {[
              { value: "all", label: "Tất cả" },
              { value: "active", label: "Hoạt động" },
              { value: "blocked", label: "Bị khóa" },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => { setStatusFilter(value); setPage(1); }}
                className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all"
                style={
                  statusFilter === value
                    ? { background: "#3B82F6", color: "#FFF" }
                    : { background: "var(--admin-bg-secondary)", color: "var(--admin-text-dim)" }
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div
          className="px-6 py-3"
          style={{ borderBottom: "1px solid var(--admin-border)", background: "var(--admin-bg-secondary)" }}
        >
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--admin-text-dim)" }}
            />
            <input
              type="text"
              placeholder="Tìm kiếm người dùng theo tên, email, số điện thoại..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
              style={{
                background: "var(--admin-bg-secondary)",
                border: "1px solid var(--admin-border)",
                color: "var(--admin-text)"}}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loadingUsers ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 size={40} style={{ color: "#3B82F6" }} className="animate-spin" />
              <p className="text-sm font-medium" style={{ color: "var(--admin-text-dim)" }}>
                Đang tải dữ liệu...
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ background: "var(--admin-bg-secondary)" }}>
                  {[
                    { label: "Người dùng", cls: "px-6 text-left" },
                    { label: "Liên hệ", cls: "px-5 text-left" },
                    { label: "Vai trò", cls: "px-5 text-left" },
                    { label: "Trạng thái", cls: "px-5 text-left" },
                    { label: "Ngày tạo", cls: "px-5 text-left" },
                    { label: "Thao tác", cls: "px-6 text-right" },
                  ].map(({ label, cls }) => (
                    <th
                      key={label}
                      className={`${cls} py-3 text-[10px] font-bold uppercase tracking-widest`}
                      style={{ color: "var(--admin-text-dim)" }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Users size={48} style={{ color: "var(--admin-text-dim)" }} />
                        <p className="text-sm font-medium" style={{ color: "var(--admin-text-dim)" }}>
                          Không có người dùng nào
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <UserRow
                      key={u.id}
                      u={u}
                      onView={setViewUser}
                      onRoleChange={setRoleUser}
                      onBlock={setBlockUser}
                      onUnblock={handleUnblock}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div
          className="px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3"
          style={{ borderTop: "1px solid var(--admin-border)" }}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--admin-text-dim)" }}>
            {search ? `${users.length} kết quả` : `Hiển thị ${users.length} / ${total} thành viên`}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="p-2 rounded-lg border border-transparent transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ color: "var(--admin-text-dim)" }}
            >
              <ChevronLeft size={17} />
            </button>
            {getVisiblePages().map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all"
                style={
                  p === page
                    ? { background: "#3B82F6", color: "#FFF" }
                    : { color: "var(--admin-text-dim)" }
                }
                onMouseEnter={e => {
                  if (p !== page) {
                    e.currentTarget.style.background = "var(--admin-surface-hover)";
                    e.currentTarget.style.color = "var(--admin-text)";
                  }
                }}
                onMouseLeave={e => {
                  if (p !== page) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--admin-text-dim)";
                  }
                }}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages || totalPages === 0}
              className="p-2 rounded-lg border border-transparent transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ color: "var(--admin-text-dim)" }}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      <UserDetailModal open={!!viewUser} onClose={() => setViewUser(null)} user={viewUser} />

      <RoleChangeModal
        open={!!roleUser}
        onClose={() => setRoleUser(null)}
        onConfirm={handleRoleChange}
        user={roleUser}
        loading={modalLoading}
      />

      <BlockReasonModal
        open={!!blockUser}
        onClose={() => setBlockUser(null)}
        onConfirm={handleBlock}
        user={blockUser}
        loading={modalLoading}
      />

      <ConfirmModal
        open={!!deleteUserTarget}
        onClose={() => setDeleteUserTarget(null)}
        onConfirm={confirmDelete}
        title="Xóa người dùng"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản "${deleteUserTarget?.full_name}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa vĩnh viễn"
        confirmBgClass="#EF4444"
        loading={modalLoading}
      />
    </div>
  );
}
