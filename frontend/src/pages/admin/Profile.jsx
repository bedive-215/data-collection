import { useState, useEffect } from "react";
import { useUser } from "@/providers/UserProvider";
import { toast } from "react-toastify";
import { User, Mail, Phone, Calendar, MapPin, Camera, Save, Loader2 } from "lucide-react";

export default function AdminProfile() {
  const { user, loading, fetchMyInfo, updateMyInfo } = useUser();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    date_of_birth: "",
    address: ""});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
        date_of_birth: user.date_of_birth?.split("T")[0] || "",
        address: user.address || ""});
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMyInfo(form);
    } catch (err) {
      // error already handled in provider
    } finally {
      setSaving(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin" size={40} style={{ color: "#F59E0B" }} />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div className="mb-8">
        <h2
          className="text-3xl font-extrabold mb-1"
          style={{ color: "var(--admin-text)", letterSpacing: "-0.02em" }}
        >
          Hồ sơ cá nhân
        </h2>
        <p className="text-sm" style={{ color: "var(--admin-text-sub)" }}>
          Quản lý thông tin cá nhân và cài đặt tài khoản
        </p>
      </div>

      <div
        className="max-w-2xl rounded-2xl overflow-hidden"
        style={{
          background: "var(--admin-surface)",
          border: "1px solid var(--admin-border)"}}
      >
        {/* Avatar section */}
        <div
          className="flex flex-col items-center py-10"
          style={{ borderBottom: "1px solid var(--admin-border)" }}
        >
          <div className="relative">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={form.full_name}
                className="w-28 h-28 rounded-2xl object-cover"
                style={{ border: "3px solid var(--admin-border)" }}
              />
            ) : (
              <div
                className="w-28 h-28 rounded-2xl flex items-center justify-center text-3xl font-bold"
                style={{
                  background: "linear-gradient(135deg, #F59E0B, #D97706)",
                  border: "3px solid rgba(245,158,11,0.3)",
                  color: "#000"}}
              >
                {form.full_name?.charAt(0)?.toUpperCase() || "A"}
              </div>
            )}
            <button
              className="absolute bottom-1 right-1 p-2.5 rounded-xl text-white transition-all"
              style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
            >
              <Camera size={16} />
            </button>
          </div>
          <p
            className="mt-4 text-xl font-bold"
            style={{ color: "var(--admin-text)" }}
          >
            {form.full_name || "Admin"}
          </p>
          <span
            className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
            style={{
              background: "rgba(245,158,11,0.1)",
              color: "#F59E0B",
              border: "1px solid rgba(245,158,11,0.2)"}}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#F59E0B" }}
            />
            {user?.role || "Administrator"}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full name */}
            <div>
              <label
                className="flex items-center gap-2 text-sm font-semibold mb-2"
                style={{ color: "var(--admin-text-sub)" }}
              >
                <User size={14} />
                Họ và tên
              </label>
              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{
                  background: "var(--admin-bg-secondary)",
                  border: "1px solid var(--admin-border)",
                  color: "var(--admin-text)"}}
                placeholder="Nhập họ và tên"
              />
            </div>

            {/* Email */}
            <div>
              <label
                className="flex items-center gap-2 text-sm font-semibold mb-2"
                style={{ color: "var(--admin-text-sub)" }}
              >
                <Mail size={14} />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{
                  background: "var(--admin-bg-secondary)",
                  border: "1px solid var(--admin-border)",
                  color: "var(--admin-text)"}}
                placeholder="email@example.com"
              />
            </div>

            {/* Phone */}
            <div>
              <label
                className="flex items-center gap-2 text-sm font-semibold mb-2"
                style={{ color: "var(--admin-text-sub)" }}
              >
                <Phone size={14} />
                Số điện thoại
              </label>
              <input
                type="tel"
                name="phone_number"
                value={form.phone_number}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{
                  background: "var(--admin-bg-secondary)",
                  border: "1px solid var(--admin-border)",
                  color: "var(--admin-text)"}}
                placeholder="0xxx xxx xxx"
              />
            </div>

            {/* Birthday */}
            <div>
              <label
                className="flex items-center gap-2 text-sm font-semibold mb-2"
                style={{ color: "var(--admin-text-sub)" }}
              >
                <Calendar size={14} />
                Ngày sinh
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={form.date_of_birth}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{
                  background: "var(--admin-bg-secondary)",
                  border: "1px solid var(--admin-border)",
                  color: "var(--admin-text)"}}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label
              className="flex items-center gap-2 text-sm font-semibold mb-2"
              style={{ color: "var(--admin-text-sub)" }}
            >
              <MapPin size={14} />
              Địa chỉ
            </label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{
                background: "var(--admin-bg-secondary)",
                border: "1px solid var(--admin-border)",
                color: "var(--admin-text)"}}
              placeholder="Nhập địa chỉ"
            />
          </div>

          <div className="flex justify-end pt-4" style={{ borderTop: "1px solid var(--admin-border)" }}>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-black rounded-xl transition-all disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #F59E0B, #D97706)"}}
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
