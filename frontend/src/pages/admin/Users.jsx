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
  Filter,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  UserCog,
  XCircle,
  CheckCircle,
  Eye,
  X,
  AlertTriangle,
  Star,
  Trophy,
  Flame,
  Clock,
} from "lucide-react";

/* ================================
   GlassCard
=============================== */
function GlassCard({ children, className = "" }) {
  return (
    <div className={`bg-white/[0.04] backdrop-blur-md border border-white/5 ${className}`}>
      {children}
    </div>
  );
}

/* ================================
   StatCard
=============================== */
function StatCard({ glowClass, barClass, iconWrapClass, icon, label, value, loading }) {
  return (
    <GlassCard className="p-5 rounded-2xl relative overflow-hidden group">
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-70 group-hover:scale-150 transition-transform duration-500 ${glowClass}`} />
      <div className={`absolute left-0 top-0 w-1 h-full rounded-r-sm ${barClass}`} />
      <div className="flex justify-between items-start">
        <div className="pl-3">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
            {label}
          </p>
          {loading ? (
            <div className="h-8 w-16 bg-white/10 rounded-lg animate-pulse" />
          ) : (
            <p className="font-['Manrope',sans-serif] text-2xl font-bold text-white">
              {typeof value === "number" ? value.toLocaleString() : value ?? "—"}
            </p>
          )}
        </div>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconWrapClass}`}>
          {icon}
        </div>
      </div>
    </GlassCard>
  );
}

/* ================================
   IconBtn
=============================== */
function IconBtn({ children, onClick, title, className = "" }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg border border-transparent text-slate-500
        hover:text-slate-300 hover:bg-white/5 hover:border-white/10 transition-all ${className}`}
    >
      {children}
    </button>
  );
}

/* ================================
   PaginationBtn
=============================== */
function PaginationBtn({ children, disabled, onClick }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="p-1.5 rounded-lg border border-transparent text-slate-500
        hover:bg-white/5 hover:border-white/10
        disabled:opacity-30 disabled:cursor-default transition-all"
    >
      {children}
    </button>
  );
}

/* ================================
   RoleBadge
=============================== */
function RoleBadge({ role }) {
  const isAdmin = role === "admin";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border
        ${isAdmin
          ? "bg-violet-500/10 text-violet-300 border-violet-500/20"
          : "bg-blue-600/10 text-blue-300 border-blue-600/20"
        }`}
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
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-emerald-500/10 text-emerald-300 border-emerald-500/20">
      <CheckCircle size={11} />
      Hoạt động
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-red-500/10 text-red-300 border-red-500/20">
      <XCircle size={11} />
      Bị khóa
    </span>
  );
}

/* ================================
   ConfirmModal
=============================== */
function ConfirmModal({ open, onClose, onConfirm, title, message, confirmText, confirmClass, loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1f2e] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-400 mb-5 leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400
              bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition-all
              disabled:opacity-50 disabled:cursor-not-allowed ${confirmClass}`}
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

  const isPromoting = newRole === "admin";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1f2e] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">Thay đổi vai trò</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-white/[0.03] border border-white/5">
          {user.avatar ? (
            <img src={user.avatar} alt={user.full_name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center">
              <User size={18} className="text-white" />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-white">{user.full_name}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        </div>

        <div className="flex gap-3 mb-5">
          <button
            onClick={() => setNewRole("admin")}
            className={`flex-1 p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${
              newRole === "admin"
                ? "bg-violet-500/10 border-violet-500/30 text-white"
                : "bg-white/[0.03] border-white/10 text-slate-400 hover:border-white/20"
            }`}
          >
            <Shield size={20} className={newRole === "admin" ? "text-violet-400" : ""} />
            <span className="text-xs font-bold">Admin</span>
          </button>
          <button
            onClick={() => setNewRole("user")}
            className={`flex-1 p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${
              newRole === "user"
                ? "bg-blue-600/10 border-blue-600/30 text-white"
                : "bg-white/[0.03] border-white/10 text-slate-400 hover:border-white/20"
            }`}
          >
            <User size={20} className={newRole === "user" ? "text-blue-400" : ""} />
            <span className="text-xs font-bold">User</span>
          </button>
        </div>

        {newRole !== user.role && (
          <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs text-amber-300">
              {isPromoting
                ? "Người dùng này sẽ có quyền truy cập bảng quản trị."
                : "Người dùng này sẽ mất quyền truy cập bảng quản trị."}
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400
              bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            Hủy
          </button>
          <button
            onClick={() => onConfirm(newRole)}
            disabled={loading || newRole === user.role}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white
              disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1f2e] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">Khóa tài khoản</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <ShieldAlert size={18} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{user.full_name}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        </div>

        <p className="text-sm text-slate-400 mb-3">
          Người dùng sẽ bị đăng xuất ngay lập tức và không thể đăng nhập cho đến khi được mở khóa.
        </p>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Lý do khóa (tùy chọn)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: Vi phạm điều khoản sử dụng..."
            maxLength={500}
            rows={3}
            className="w-full bg-white/5 border border-white/[0.08] focus:border-red-500/50
              rounded-xl py-2.5 px-3 text-sm text-white placeholder:text-slate-600
              outline-none transition-colors resize-none"
          />
          <p className="text-[10px] text-slate-600 mt-1 text-right">{reason.length}/500</p>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400
              bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            Hủy
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-500 text-white
              disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");
  const formatDateTime = (d) => (d ? new Date(d).toLocaleString("vi-VN") : "—");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1f2e] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">Chi tiết người dùng</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Avatar + Name */}
        <div className="flex items-center gap-4 mb-6">
          {user.avatar ? (
            <img src={user.avatar} alt={user.full_name} className="w-16 h-16 rounded-2xl object-cover border border-white/10" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center">
              <User size={28} className="text-white" />
            </div>
          )}
          <div>
            <p className="text-lg font-bold text-white">{user.full_name}</p>
            <p className="text-xs text-slate-500 font-mono">ID: {user.id}</p>
            <div className="flex gap-2 mt-2">
              <RoleBadge role={user.role} />
              <StatusBadge isActive={user.is_active} />
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { label: "Email", value: user.email, icon: <Mail size={14} /> },
            { label: "Số điện thoại", value: user.phone_number || "—", icon: <Phone size={14} /> },
            { label: "Giới tính", value: user.gender === "MALE" ? "Nam" : user.gender === "FEMALE" ? "Nữ" : "Khác", icon: <User size={14} /> },
            { label: "Ngày sinh", value: formatDate(user.date_of_birth), icon: <Calendar size={14} /> },
            { label: "Ngày tạo", value: formatDate(user.created_at), icon: <Clock size={14} /> },
            { label: "Xác thực email", value: user.email_verified ? "Đã xác thực" : "Chưa xác thực", icon: user.email_verified ? <CheckCircle size={14} className="text-emerald-400" /> : <XCircle size={14} className="text-red-400" /> },
          ].map(({ label, value, icon }) => (
            <div key={label} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                {icon} {label}
              </p>
              <p className="text-sm font-medium text-white truncate">{value}</p>
            </div>
          ))}
        </div>

        {/* Block Info */}
        {!user.is_active && (
          <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <ShieldAlert size={13} /> Thông tin khóa tài khoản
            </p>
            <p className="text-xs text-slate-400 mb-1">
              <span className="font-semibold text-slate-300">Bị khóa lúc:</span> {formatDateTime(user.blocked_at)}
            </p>
            {user.block_reason && (
              <p className="text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Lý do:</span> {user.block_reason}
              </p>
            )}
          </div>
        )}

        {/* Gamification */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-1">
            <Trophy size={13} /> Thông tin gamification
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 rounded-lg bg-white/[0.03]">
              <Star size={16} className="text-amber-400 mx-auto mb-1" />
              <p className="text-sm font-bold text-white">{user.star_balance ?? 0}</p>
              <p className="text-[9px] text-slate-600 uppercase">Sao</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-white/[0.03]">
              <Trophy size={16} className="text-violet-400 mx-auto mb-1" />
              <p className="text-sm font-bold text-white">{user.current_rank ?? "BRONZE"}</p>
              <p className="text-[9px] text-slate-600 uppercase">Hạng</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-white/[0.03]">
              <Flame size={16} className="text-orange-400 mx-auto mb-1" />
              <p className="text-sm font-bold text-white">{user.streak_count ?? 0}</p>
              <p className="text-[9px] text-slate-600 uppercase">Chuỗi</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================
   UserRow
=============================== */
function UserRow({ u, onView, onRoleChange, onBlock, onUnblock, onDelete, formatDate }) {
  const isBlocked = !u.is_active;
  const isAdmin = u.role === "admin";

  return (
    <tr className={`border-t border-white/[0.04] transition-colors group ${isBlocked ? "opacity-60" : "hover:bg-blue-600/[0.03]"}`}>
      <td className="px-7 py-4">
        <div className="flex items-center gap-3">
          {u.avatar ? (
            <img
              src={u.avatar}
              alt={u.full_name}
              className="w-10 h-10 rounded-full object-cover border border-white/10 flex-shrink-0"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center flex-shrink-0">
              <User size={18} className="text-white" />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-white">{u.full_name}</p>
            <p className="text-[11px] text-slate-600 font-medium mt-0.5">
              {u.id ? `USR-${String(u.id).split("-")[0].toUpperCase()}` : "—"}
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-1.5 text-sm text-slate-300">
          <Mail size={13} className="text-slate-600 flex-shrink-0" />
          <span className="truncate max-w-[180px]">{u.email}</span>
        </div>
        {u.phone_number && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
            <Phone size={12} className="text-slate-600 flex-shrink-0" />
            {u.phone_number}
          </div>
        )}
      </td>
      <td className="px-5 py-4">
        <RoleBadge role={u.role} />
      </td>
      <td className="px-5 py-4">
        <StatusBadge isActive={u.is_active} />
      </td>
      <td className="px-5 py-4 text-sm text-slate-400">
        {formatDate(u.created_at)}
      </td>
      <td className="px-7 py-4">
        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <IconBtn title="Xem chi tiết" onClick={() => onView(u)}>
            <Eye size={15} />
          </IconBtn>
          <IconBtn title="Đổi vai trò" onClick={() => onRoleChange(u)}>
            <UserCog size={15} />
          </IconBtn>
          {!isBlocked ? (
            <IconBtn title="Khóa tài khoản" onClick={() => onBlock(u)} className="hover:!text-amber-400">
              <ShieldAlert size={15} />
            </IconBtn>
          ) : (
            <IconBtn title="Mở khóa tài khoản" onClick={() => onUnblock(u)} className="hover:!text-emerald-400">
              <ShieldCheck size={15} />
            </IconBtn>
          )}
          <IconBtn title="Xóa người dùng" onClick={() => onDelete(u)} className="hover:!text-red-400">
            <Trash2 size={15} />
          </IconBtn>
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

  /* ── State ── */
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | blocked
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
    fetchOverview,
    fetchTotalUsersAnswered,
  } = useAdminStats();

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
    fetchTotalUsersAnswered();
  }, []);

  /* ── Helpers ── */
  const getVisiblePages = () => {
    if (totalPages <= 5) return [...Array(totalPages).keys()].map((x) => x + 1);
    let start = Math.max(page - 2, 1);
    let end = Math.min(start + 4, totalPages);
    if (end - start < 4) start = Math.max(end - 4, 1);
    return [...Array(end - start + 1).keys()].map((x) => start + x);
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "-");

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
    fetchTotalUsersAnswered();
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

  const handleDelete = async (user) => {
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
      fetchTotalUsersAnswered();
    } catch (err) {
      toast.error(err.response?.data?.message || "Xóa thất bại");
    } finally {
      setModalLoading(false);
    }
  };

  /* ── Counts ── */
  const activeCount = users.filter((u) => u.is_active).length;
  const blockedCount = total - (overview?.totalActiveUsers ?? activeCount);

  const isLoading = loadingUsers || loadingStats;

  return (
    <div className="min-h-screen bg-[#0f121a] text-white p-8 font-['Inter',sans-serif]">

      {/* Header */}
      <header className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="font-['Manrope',sans-serif] text-3xl font-bold text-white mb-1 tracking-tight">
            Quản lý Người dùng
          </h2>
          <p className="text-slate-400 text-sm">
            Phân quyền, khóa/mở khóa và quản lý tài khoản thành viên
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white
            bg-white/[0.06] hover:bg-white/10 border border-white/10
            disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <RotateCcw size={15} className={`text-blue-400 ${isLoading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          glowClass="bg-blue-600/10"
          barClass="bg-blue-600"
          iconWrapClass="bg-blue-600/10 border border-blue-600/20"
          icon={<Users size={18} className="text-blue-400" />}
          label="Tổng người dùng"
          value={overview?.totalUsers ?? total}
          loading={loadingStats}
        />
        <StatCard
          glowClass="bg-emerald-600/10"
          barClass="bg-emerald-500"
          iconWrapClass="bg-emerald-500/10 border border-emerald-500/20"
          icon={<ShieldCheck size={18} className="text-emerald-400" />}
          label="Đang hoạt động"
          value={overview?.totalActiveUsers ?? "—"}
          loading={loadingStats}
        />
        <StatCard
          glowClass="bg-red-600/10"
          barClass="bg-red-500"
          iconWrapClass="bg-red-500/10 border border-red-500/20"
          icon={<ShieldAlert size={18} className="text-red-400" />}
          label="Bị khóa"
          value={overview?.totalBlockedUsers ?? "—"}
          loading={loadingStats}
        />
        <StatCard
          glowClass="bg-indigo-600/10"
          barClass="bg-indigo-500"
          iconWrapClass="bg-indigo-500/10 border border-indigo-500/20"
          icon={<ClipboardList size={18} className="text-indigo-400" />}
          label="Tổng khảo sát"
          value={overview?.totalSurveys ?? "—"}
          loading={loadingStats}
        />
      </div>

      {/* Table Card */}
      <GlassCard className="rounded-2xl overflow-hidden">
        {/* Table Header */}
        <div className="px-7 py-4 border-b border-white/5 bg-white/[0.02] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="font-['Manrope',sans-serif] text-base font-bold text-white">
            Danh sách thành viên
          </h3>
          <div className="flex gap-2 items-center">
            {/* Status Filter */}
            <div className="flex rounded-lg border border-white/10 bg-white/[0.03] overflow-hidden">
              {[
                { value: "all", label: "Tất cả" },
                { value: "active", label: "Hoạt động" },
                { value: "blocked", label: "Bị khóa" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => { setStatusFilter(value); setPage(1); }}
                  className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                    statusFilter === value
                      ? "bg-blue-600 text-white"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-7 py-3 border-b border-white/5 bg-[#0f121a]/50">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              type="text"
              placeholder="Tìm kiếm người dùng theo tên, email, số điện thoại..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/[0.08] focus:border-blue-600/50
                rounded-lg py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-600
                outline-none transition-colors"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loadingUsers ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 size={40} className="text-blue-400 animate-spin" />
              <p className="text-slate-400 text-sm font-medium">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-white/[0.03]">
                  {[
                    { label: "Người dùng", cls: "px-7 text-left" },
                    { label: "Liên hệ", cls: "px-5 text-left" },
                    { label: "Vai trò", cls: "px-5 text-left" },
                    { label: "Trạng thái", cls: "px-5 text-left" },
                    { label: "Ngày tạo", cls: "px-5 text-left" },
                    { label: "Thao tác", cls: "px-7 text-right" },
                  ].map(({ label, cls }) => (
                    <th
                      key={label}
                      className={`${cls} py-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest`}
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
                        <Users size={48} className="text-slate-700" />
                        <p className="text-slate-500 font-medium">Không có người dùng nào</p>
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
                      formatDate={formatDate}
                    />
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="px-7 py-4 border-t border-white/5 bg-white/[0.02] flex flex-col sm:flex-row justify-between items-center gap-3">
          <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
            {search
              ? `${users.length} kết quả`
              : `Hiển thị ${users.length} / ${total} thành viên`}
          </span>
          <div className="flex items-center gap-1">
            <PaginationBtn disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft size={17} />
            </PaginationBtn>
            {getVisiblePages().map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all
                  ${p === page
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                  }`}
              >
                {p}
              </button>
            ))}
            <PaginationBtn
              disabled={page === totalPages || totalPages === 0}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight size={17} />
            </PaginationBtn>
          </div>
        </div>
      </GlassCard>

      {/* Modals */}
      <UserDetailModal
        open={!!viewUser}
        onClose={() => setViewUser(null)}
        user={viewUser}
      />

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
        confirmClass="bg-red-600 hover:bg-red-500"
        loading={modalLoading}
      />
    </div>
  );
}
