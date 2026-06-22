const ACCENT = "#3B82F6";
const BORDER = "#5f6368";

export function RadioInput({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {options.map((opt) => {
        const sel = opt.id === value;
        return (
          <label
            key={opt.id}
            onClick={() => onChange(opt.id)}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 0",
              cursor: "pointer", userSelect: "none",
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: "50%",
              border: `2px solid ${sel ? ACCENT : BORDER}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "all .12s",
            }}>
              {sel && <div style={{ width: 10, height: 10, borderRadius: "50%", background: ACCENT }} />}
            </div>
            {opt.image_url && (
              <img src={opt.image_url} alt="" style={{ width: 28, height: 28, objectFit: "cover", borderRadius: 4, border: "1px solid #dadce0", flexShrink: 0 }} />
            )}
            <span style={{ fontSize: 14, color: "#202124", lineHeight: 1.4, fontWeight: 400 }}>{opt.content}</span>
          </label>
        );
      })}
    </div>
  );
}

export function CheckboxInput({ options, value, onChange }) {
  const toggle = (optId) => {
    const current = value instanceof Set ? new Set(value) : new Set();
    if (current.has(optId)) current.delete(optId); else current.add(optId);
    onChange(current);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {options.map((opt) => {
        const sel = value instanceof Set ? value.has(opt.id) : false;
        return (
          <label
            key={opt.id}
            onClick={() => toggle(opt.id)}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 0",
              cursor: "pointer", userSelect: "none",
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: 3,
              border: `2px solid ${sel ? ACCENT : BORDER}`,
              background: sel ? ACCENT : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "all .12s",
            }}>
              {sel && (
                <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                  <path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            {opt.image_url && (
              <img src={opt.image_url} alt="" style={{ width: 28, height: 28, objectFit: "cover", borderRadius: 4, border: "1px solid #dadce0", flexShrink: 0 }} />
            )}
            <span style={{ fontSize: 14, color: "#202124", lineHeight: 1.4, fontWeight: 400 }}>{opt.content}</span>
          </label>
        );
      })}
    </div>
  );
}
