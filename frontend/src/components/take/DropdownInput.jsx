import { ChevronDown } from "lucide-react";

const ACCENT = "#3B82F6";
const BORDER = "#DADCE0";

export function DropdownInput({ options, value, onChange }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        style={{
          width: "100%", padding: "10px 32px 10px 0",
          border: "none",
          borderBottom: `1px solid ${BORDER}`,
          fontSize: 14, color: "#202124",
          fontFamily: "'Google Sans', Roboto, system-ui, sans-serif",
          cursor: "pointer",
          background: "transparent", outline: "none",
          appearance: "none", WebkitAppearance: "none",
          transition: "border-color .15s",
          fontWeight: 400,
        }}
        onFocus={(e) => (e.target.style.borderBottomColor = ACCENT, e.target.style.borderBottomWidth = "2px")}
        onBlur={(e) => (e.target.style.borderBottomColor = BORDER, e.target.style.borderBottomWidth = "1px")}
      >
        <option value="" disabled style={{ color: "#80868b" }}>Chọn một lựa chọn...</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id} style={{ color: "#202124" }}>
            {opt.content}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        color="#5f6368"
        style={{
          position: "absolute", right: 0, top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
