import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorState({ message = "Đã xảy ra lỗi", onRetry, fullPage = false }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 text-center" style={{ padding: fullPage ? "80px 24px" : "40px 24px" }}>
      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
        <AlertTriangle size={22} style={{ color: "var(--admin-error)" }} />
      </div>
      <p className="text-sm font-semibold" style={{ color: "var(--admin-text-sub)" }}>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-admin-ghost" style={{ padding: "8px 16px", fontSize: 12 }}>
          <RefreshCw size={13} /> Thử lại
        </button>
      )}
    </div>
  );

  if (fullPage) {
    return <div className="min-h-screen" style={{ background: "var(--admin-bg)" }}>{content}</div>;
  }
  return content;
}
