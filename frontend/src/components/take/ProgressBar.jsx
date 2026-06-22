export function ProgressBar({ current, total }) {
  const pct = current > 0 && total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div style={{ height: 4, background: "#E8DEF8", borderRadius: 2, overflow: "hidden", marginBottom: 0 }}>
      <div style={{
        height: "100%", width: `${pct}%`,
        background: "#3B82F6", borderRadius: 2,
        transition: "width .3s ease",
      }} />
    </div>
  );
}
