import { FileText } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t" style={{ borderColor: "var(--admin-border)", background: "var(--admin-bg)" }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FileText size={18} style={{ color: "var(--admin-primary)" }} />
            <span className="text-sm font-bold" style={{ color: "var(--admin-text)" }}>EchoForm</span>
          </div>
          <p className="text-xs" style={{ color: "var(--admin-text-dim)" }}>
            &copy; {new Date().getFullYear()} EchoForm. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
