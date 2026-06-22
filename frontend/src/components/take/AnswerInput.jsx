import { useState } from "react";
import { Minus, Plus } from "lucide-react";

const TAKE_INPUT_CSS = `
.take-text-input, .take-text-input:focus {
  padding: 4px 0 !important;
  border: none !important;
  border-bottom: 1px solid #DADCE0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  font-size: 14px !important;
  outline: none !important;
}
.take-number-input, .take-number-input:focus {
  padding: 0 !important;
  border: none !important;
  border-radius: 0 !important;
  background: transparent !important;
  font-size: 14px !important;
  outline: none !important;
}
`;

const ACCENT = "#3B82F6";
const BORDER = "#DADCE0";

const inputBase = {
  width: "60%",
  padding: "4px 0",
  border: "none",
  borderBottom: `1px solid ${BORDER}`,
  fontSize: 14,
  color: "#202124",
  outline: "none",
  fontFamily: "'Google Sans', Roboto, system-ui, sans-serif",
  background: "transparent",
  transition: "border-color .15s",
  boxSizing: "border-box",
  fontWeight: 400,
};

function focus(e) { e.target.style.borderBottomColor = ACCENT; e.target.style.borderBottomWidth = "2px"; }
function blur(e) { e.target.style.borderBottomColor = BORDER; e.target.style.borderBottomWidth = "1px"; }

export function TextAnswer({ value, onChange, placeholder, maxLength, type = "text" }) {
  return (
    <>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        style={inputBase}
        onFocus={focus}
        onBlur={blur}
        className="take-text-input"
      />
      <style>{TAKE_INPUT_CSS}</style>
    </>
  );
}

export function ParagraphAnswer({ value, onChange, placeholder, maxLength }) {
  return (
    <>
      <textarea
        rows={4}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        style={{ ...inputBase, width: "100%", resize: "none", minHeight: 100 }}
        onFocus={focus}
        onBlur={blur}
        className="take-text-input"
      />
      <style>{TAKE_INPUT_CSS}</style>
    </>
  );
}

export function DateAnswer({ value, onChange, minDate, maxDate }) {
  return (
    <div>
      <input
        type="date"
        value={value ?? ""}
        min={minDate}
        max={maxDate}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputBase, maxWidth: 220 }}
        onFocus={focus}
        onBlur={blur}
        className="take-text-input"
      />
      <style>{TAKE_INPUT_CSS}</style>
      {(minDate || maxDate) && (
        <p style={{ fontSize: 12, color: "#80868b", marginTop: 6, fontWeight: 400 }}>
          {minDate && `Từ: ${minDate}`}{minDate && maxDate && " — "}{maxDate && `Đến: ${maxDate}`}
        </p>
      )}
    </div>
  );
}

const numStyles = {
  display: "flex", alignItems: "center", gap: 0,
  borderBottom: `1px solid ${BORDER}`,
  transition: "border-color .15s",
  padding: "2px 0",
};
const btnStyles = {
  background: "none", border: "none", cursor: "pointer",
  padding: "6px 8px", borderRadius: 4, lineHeight: 0,
  color: "#5f6368", transition: "all .12s",
};
const numValue = {
  flex: 1, textAlign: "center", fontSize: 14, fontWeight: 400,
  color: "#202124", fontFamily: "'Google Sans', Roboto, system-ui, sans-serif",
  border: "none", outline: "none", background: "transparent",
  padding: 0, width: 60,
};

export function NumberAnswer({ value, onChange, min, max, placeholder }) {
  const num = value != null ? Number(value) : null;
  const atMin = min != null && num != null && num <= min;
  const atMax = max != null && num != null && num >= max;
  const [focused, setFocused] = useState(false);

  const dec = () => {
    const next = num != null ? num - 1 : 0;
    if (min == null || next >= min) onChange(next);
  };
  const inc = () => {
    const next = num != null ? num + 1 : 0;
    if (max == null || next <= max) onChange(next);
  };

  return (
    <div style={{ ...numStyles, borderBottomColor: focused ? ACCENT : BORDER, borderBottomWidth: focused ? 2 : 1 }}>
      <button onClick={dec} disabled={atMin} style={{ ...btnStyles, opacity: atMin ? 0.3 : 1, cursor: atMin ? "not-allowed" : "pointer" }}>
        <Minus size={18} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value ?? ""}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "" || /^\d+$/.test(raw)) onChange(raw);
        }}
        placeholder={placeholder ?? "0"}
        style={numValue}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="take-number-input"
      />
      <button onClick={inc} disabled={atMax} style={{ ...btnStyles, opacity: atMax ? 0.3 : 1, cursor: atMax ? "not-allowed" : "pointer" }}>
        <Plus size={18} />
      </button>
      <style>{TAKE_INPUT_CSS}</style>
    </div>
  );
}

export function TimeAnswer({ value, onChange, placeholder }) {
  return (
    <>
      <input
        type="time"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...inputBase, maxWidth: 160 }}
        onFocus={focus}
        onBlur={blur}
        className="take-text-input"
      />
      <style>{TAKE_INPUT_CSS}</style>
    </>
  );
}
