import { Link } from "react-router-dom";
import { ShieldOff, ArrowLeft } from "lucide-react";

export default function Forbidden() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--admin-bg)" }}>
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <ShieldOff size={36} style={{ color: "var(--admin-error)" }} />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--admin-text)" }}>Truy cập bị từ chối</h1>
        <p className="text-sm mb-8" style={{ color: "var(--admin-text-sub)" }}>
          Bạn không có quyền truy cập vào trang này.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => window.history.back()} className="btn-admin-ghost">
            <ArrowLeft size={15} /> Quay lại
          </button>
          <Link to="/login" className="btn-admin-primary">
            Trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
