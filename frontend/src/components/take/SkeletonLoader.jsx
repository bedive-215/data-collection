export function SkeletonLoader() {
  const row = (width) => (
    <div style={{
      height: 12, width: width || "60%",
      background: "#e8eaed", borderRadius: 4,
      animation: "skPulse 1.5s ease-in-out infinite",
    }} />
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "24px 0" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {row("40%")}
        {row("80%")}
      </div>
      <div style={{ height: 1, background: "#e8eaed" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {row("30%")}
        <div style={{
          height: 36, width: "100%",
          background: "#f1f3f4", borderRadius: 4,
          animation: "skPulse 1.5s ease-in-out infinite",
        }} />
      </div>
      <div style={{ height: 1, background: "#e8eaed" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {row("45%")}
        <div style={{
          height: 80, width: "100%",
          background: "#f1f3f4", borderRadius: 4,
          animation: "skPulse 1.5s ease-in-out infinite",
        }} />
      </div>
      <style>{`
        @keyframes skPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
