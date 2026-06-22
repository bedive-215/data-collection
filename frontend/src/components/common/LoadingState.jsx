import { Loader2 } from "lucide-react";

export default function LoadingState({ fullPage = false, size = 32 }) {
  const content = (
    <div className="flex items-center justify-center" style={{ padding: fullPage ? "80px 24px" : "40px 24px" }}>
      <Loader2 size={size} className="animate-spin" style={{ color: "var(--admin-primary)" }} />
    </div>
  );

  if (fullPage) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--admin-bg)" }}>{content}</div>;
  }
  return content;
}
