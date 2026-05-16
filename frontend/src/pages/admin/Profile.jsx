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
    address: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
        date_of_birth: user.date_of_birth?.split("T")[0] || "",
        address: user.address || "",
      });
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
        <Loader2 className="animate-spin text-indigo-500" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Hồ sơ cá nhân</h1>

      <div className="bg-slate-800/50 rounded-2xl p-6">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={form.full_name}
                className="w-24 h-24 rounded-full object-cover border-4 border-slate-700"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-3xl font-bold text-white border-4 border-slate-700">
                {form.full_name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
            <button className="absolute bottom-0 right-0 p-2 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white transition-colors">
              <Camera size={16} />
            </button>
          </div>
          <p className="mt-3 text-lg font-semibold text-white">{form.full_name || "Admin"}</p>
          <p className="text-slate-400 text-sm">{user?.role || "Administrator"}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                <User size={14} />
                Họ và tên
              </label>
              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="Nhập họ và tên"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                <Mail size={14} />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                <Phone size={14} />
                Số điện thoại
              </label>
              <input
                type="tel"
                name="phone_number"
                value={form.phone_number}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="0xxx xxx xxx"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                <Calendar size={14} />
                Ngày sinh
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={form.date_of_birth}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
              <MapPin size={14} />
              Địa chỉ
            </label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="Nhập địa chỉ"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold rounded-xl transition-colors"
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
