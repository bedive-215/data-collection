import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import userService from "@/services/userService";
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
  Edit2,
  Search,
  Filter,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ── Shared glass card (giống Dashboard) ───────────────────────────────────────
function GlassCard({ children, className = "" }) {
  return (
    <div className={`bg-white/[0.04] backdrop-blur-md border border-white/5 ${className}`}>
      {children}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ glowClass, barClass, iconWrapClass, icon, label, value }) {
  return (
    <GlassCard className="p-6 rounded-2xl relative overflow-hidden group">
      {/* glow blob - giống Dashboard */}
      <div
        className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-70 group-hover:scale-150 transition-transform duration-500 ${glowClass}`}
      />
      {/* left accent bar */}
      <div className={`absolute left-0 top-0 w-1 h-full rounded-r-sm ${barClass}`} />

      <div className="flex justify-between items-start">
        <div className="pl-3">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">
            {label}
          </p>
          <p className="font-['Manrope',sans-serif] text-3xl font-bold text-white">{value}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconWrapClass}`}>
          {icon}
        </div>
      </div>
    </GlassCard>
  );
}

// ── Icon Button ───────────────────────────────────────────────────────────────
function IconBtn({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="p-1.5 rounded-lg border border-transparent text-slate-500
        hover:text-slate-300 hover:bg-white/5 hover:border-white/10 transition-all"
    >
      {children}
    </button>
  );
}

// ── Pagination Button ─────────────────────────────────────────────────────────
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

// ── User Row ──────────────────────────────────────────────────────────────────
function UserRow({ u, onDelete, formatDate }) {
  const isAdmin = u.role === "admin";

  return (
    <tr className="border-t border-white/[0.04] hover:bg-blue-600/[0.04] transition-colors group">

      {/* Avatar + Name */}
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
              {u.id ? `USR-${String(u.id).padStart(4, "0")}` : "—"}
            </p>
          </div>
        </div>
      </td>

      {/* Contact */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-1.5 text-sm text-slate-300">
          <Mail size={13} className="text-slate-600 flex-shrink-0" />
          {u.email}
        </div>
        {u.phone_number && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
            <Phone size={12} className="text-slate-600 flex-shrink-0" />
            {u.phone_number}
          </div>
        )}
      </td>

      {/* DOB */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-1.5 text-sm text-slate-400">
          <Calendar size={13} className="text-slate-600 flex-shrink-0" />
          {formatDate(u.date_of_birth)}
        </div>
      </td>

      {/* Role badge */}
      <td className="px-5 py-4">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border
            ${isAdmin
              ? "bg-violet-500/10 text-violet-300 border-violet-500/20"
              : "bg-blue-600/10 text-blue-300 border-blue-600/20"
            }`}
        >
          {isAdmin ? <Shield size={11} /> : <User size={11} />}
          {u.role}
        </span>
      </td>

      {/* Created at */}
      <td className="px-5 py-4 text-sm text-slate-400">
        {new Date(u.created_at).toLocaleDateString("vi-VN")}
      </td>

      {/* Actions - ẩn, hiện khi hover row */}
      <td className="px-7 py-4">
        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1.5 rounded-md text-slate-500 hover:text-blue-300 hover:bg-blue-600/10 transition-all">
            <Edit2 size={15} />
          </button>
          <button
            onClick={() => onDelete(u.id)}
            className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function UserManagement() {
  const { token } = useAuth();
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState("");
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const limit = 10;

  const fetchListUsers = async () => {
    setLoading(true);
    try {
      const res  = await userService.getListOfUser({ page, limit }, token);
      const list = res?.data?.data || [];
      setUsers(Array.isArray(list) ? list : []);
      setTotal(res?.data?.total || 0);
      setTotalPages(res?.data?.totalPages || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || "Lấy danh sách thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchListUsers(); }, [page]);

  const removeUser = async (userId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) return;
    setLoading(true);
    try {
      await userService.deleteUser(userId, token);
      toast.success("Xóa người dùng thành công");
      fetchListUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Xóa thất bại");
    } finally {
      setLoading(false);
    }
  };

  const getVisiblePages = () => {
    if (totalPages <= 5) return [...Array(totalPages).keys()].map((x) => x + 1);
    let start = Math.max(page - 2, 1);
    let end   = Math.min(start + 4, totalPages);
    if (end - start < 4) start = Math.max(end - 4, 1);
    return [...Array(end - start + 1).keys()].map((x) => start + x);
  };

  const formatDate    = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "-");
  const adminCount    = users.filter((u) => u.role === "admin").length;
  const userCount     = users.filter((u) => u.role === "user").length;
  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone_number?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#0f121a] text-white p-10 font-['Inter',sans-serif]">

      {/* ── Header ── */}
      <header className="mb-10 flex justify-between items-start">
        <div>
          <h2 className="font-['Manrope',sans-serif] text-4xl font-bold text-white mb-2 tracking-tight">
            Quản lý Người dùng
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Quản lý và phân quyền thành viên hệ thống
          </p>
        </div>

        <button
          onClick={fetchListUsers}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white
            bg-white/[0.06] hover:bg-white/10 border border-white/10
            disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <RotateCcw size={15} className={`text-blue-400 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </header>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <StatCard
          glowClass="bg-blue-600/10"
          barClass="bg-blue-600"
          iconWrapClass="bg-blue-600/10 border border-blue-600/20"
          icon={<Users size={20} className="text-blue-400" />}
          label="Tổng người dùng"
          value={total}
        />
        <StatCard
          glowClass="bg-violet-600/10"
          barClass="bg-violet-500"
          iconWrapClass="bg-violet-500/10 border border-violet-500/20"
          icon={<Shield size={20} className="text-violet-400" />}
          label="Quản trị viên"
          value={adminCount}
        />
        <StatCard
          glowClass="bg-indigo-600/10"
          barClass="bg-indigo-500"
          iconWrapClass="bg-indigo-500/10 border border-indigo-500/20"
          icon={<User size={20} className="text-indigo-400" />}
          label="Người dùng thường"
          value={userCount}
        />
      </div>

      {/* ── Table Card ── */}
      <GlassCard className="rounded-2xl overflow-hidden">

        {/* Toolbar */}
        <div className="px-7 py-5 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
          <h3 className="font-['Manrope',sans-serif] text-lg font-bold text-white">
            Danh sách thành viên
          </h3>
          <div className="flex gap-1">
            <IconBtn><Filter size={16} /></IconBtn>
            <IconBtn><MoreVertical size={16} /></IconBtn>
          </div>
        </div>

        {/* Search */}
        <div className="px-7 py-3 border-b border-white/5 bg-[#0f121a]/50">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              type="text"
              placeholder="Tìm kiếm người dùng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/[0.08] focus:border-blue-600/50
                rounded-lg py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-600
                outline-none transition-colors"
            />
          </div>
        </div>

        {/* Table / Loader */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 size={40} className="text-blue-400 animate-spin" />
              <p className="text-slate-400 text-sm font-medium">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-white/[0.03]">
                  {[
                    { label: "Người dùng", cls: "px-7 text-left"  },
                    { label: "Liên hệ",    cls: "px-5 text-left"  },
                    { label: "Ngày sinh",  cls: "px-5 text-left"  },
                    { label: "Vai trò",    cls: "px-5 text-left"  },
                    { label: "Ngày tạo",   cls: "px-5 text-left"  },
                    { label: "Thao tác",   cls: "px-7 text-right" },
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
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Users size={48} className="text-slate-700" />
                        <p className="text-slate-500 font-medium">Không có người dùng nào</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <UserRow key={u.id} u={u} onDelete={removeUser} formatDate={formatDate} />
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination footer */}
        <div className="px-7 py-4 border-t border-white/5 bg-white/[0.02] flex justify-between items-center">
          <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
            {search
              ? `${filteredUsers.length} kết quả`
              : `Hiển thị 1 – ${users.length} của ${total} thành viên`}
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
    </div>
  );
}