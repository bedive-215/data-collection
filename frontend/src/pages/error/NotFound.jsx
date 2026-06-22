import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--admin-bg)" }}>
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <span className="text-4xl font-bold" style={{ color: "var(--admin-primary)" }}>404</span>
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--admin-text)" }}>Trang không tồn tại</h1>
        <p className="text-sm mb-8" style={{ color: "var(--admin-text-sub)" }}>
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => window.history.back()} className="btn-admin-ghost">
            <ArrowLeft size={15} /> Quay lại
          </button>
          <Link to="/login" className="btn-admin-primary">
            <Home size={15} /> Trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
