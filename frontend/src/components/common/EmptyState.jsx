import { Inbox } from "lucide-react";

export default function EmptyState({
  icon: Icon = Inbox,
  title = "Không có dữ liệu",
  description,
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 text-center" style={{ padding: "60px 24px" }}>
      <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(148,163,184,0.08)", border: "1px solid rgba(148,163,184,0.15)" }}>
        <Icon size={24} style={{ color: "var(--admin-text-dim)" }} />
      </div>
      <p className="text-sm font-semibold" style={{ color: "var(--admin-text-sub)" }}>{title}</p>
      {description && <p className="text-xs" style={{ color: "var(--admin-text-dim)", maxWidth: 300 }}>{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
