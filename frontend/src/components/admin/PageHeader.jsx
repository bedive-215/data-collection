import React from "react";

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div
      className="flex items-center justify-between px-6 py-5 rounded-2xl"
      style={{
        background: "var(--admin-surface)",
        border: "1px solid var(--admin-border)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
      }}
    >
      <div>
        <h2
          className="font-bold"
          style={{ color: "var(--admin-text)", fontSize: 20, lineHeight: 1.2 }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className="text-sm mt-1"
            style={{ color: "var(--admin-text-sub)" }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3">{actions}</div>
      )}
    </div>
  );
}
