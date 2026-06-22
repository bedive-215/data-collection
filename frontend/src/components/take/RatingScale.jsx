import { useState } from "react";
import { Star } from "lucide-react";

const ACCENT = "#3B82F6";

export function RatingInput({ settings, value, onChange }) {
  const min = settings?.min ?? 1;
  const max = settings?.max ?? 5;
  const [hovered, setHovered] = useState(null);
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {steps.map((star) => {
          const active = hovered !== null ? star <= hovered : star <= (value ?? 0);
          return (
            <button
              key={star}
              onClick={() => onChange(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: 4, transition: "transform .12s",
                transform: active ? "scale(1.1)" : "scale(1)",
              }}
            >
              <Star
                size={28}
                fill={active ? "#f59e0b" : "transparent"}
                color={active ? "#f59e0b" : "#dadce0"}
                strokeWidth={1.5}
              />
            </button>
          );
        })}
      </div>
      {value != null && (
        <p style={{ fontSize: 12, color: "#5f6368", margin: "6px 0 0", fontWeight: 400 }}>
          Bạn chọn: <span style={{ color: "#d97706" }}>{value} / {max}</span>
        </p>
      )}
    </div>
  );
}

export function ScaleInput({ settings, value, onChange }) {
  const min = settings?.min ?? 1;
  const max = settings?.max ?? 5;
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {(settings.min_label || settings.max_label) && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#5f6368", fontWeight: 400 }}>
          <span>{settings.min_label || min}</span>
          <span>{settings.max_label || max}</span>
        </div>
      )}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {steps.map((v) => {
          const sel = value === v;
          return (
            <button
              key={v}
              onClick={() => onChange(v)}
              style={{
                minWidth: 40, padding: "8px 6px",
                border: `1px solid ${sel ? ACCENT : "#dadce0"}`,
                background: sel ? "#f3edff" : "#fff",
                color: sel ? ACCENT : "#202124",
                fontWeight: 400,
                fontSize: 14, cursor: "pointer",
                borderRadius: 4, transition: "all .1s",
                fontFamily: "'Google Sans', Roboto, system-ui, sans-serif",
              }}
            >
              {v}
            </button>
          );
        })}
      </div>
    </div>
  );
}
