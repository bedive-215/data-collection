import React from "react";

/**
 * Soft animated backdrop matching the Premium Card reference aesthetic.
 * The background uses the same sophisticated mesh gradient palette:
 * mint green, blush pink, warm yellow, sky blue, lavender.
 * Fixed z-index:0, pointer-events:none.
 */
function SoftOrbitDecor() {
  return (
    <>
      {/* Top-right soft orbit */}
      <div style={{
        position: "absolute",
        top: "-8%",
        right: "-6%",
        width: "min(440px, 85vw)",
        height: "min(440px, 85vw)",
        animation: "asvOrbitSpin 90s linear infinite",
        opacity: 0.38,
      }}>
        <svg width="100%" height="100%" viewBox="0 0 440 440" style={{ display: "block" }}>
          <defs>
            <linearGradient id="meshOrbTop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.7"/>
              <stop offset="50%" stopColor="#c4b5fd" stopOpacity="0.35"/>
              <stop offset="100%" stopColor="#fde68a" stopOpacity="0.5"/>
            </linearGradient>
          </defs>
          <ellipse cx="220" cy="220" rx="175" ry="75" fill="none" stroke="url(#meshOrbTop)" strokeWidth="1.2" transform="rotate(-18 220 220)"/>
          <ellipse cx="220" cy="220" rx="125" ry="155" fill="none" stroke="url(#meshOrbTop)" strokeWidth="0.8" transform="rotate(52 220 220)" opacity="0.5"/>
          <circle cx="220" cy="220" r="5" fill="rgba(255,255,255,0.75)" opacity="0.5"/>
        </svg>
      </div>
      {/* Bottom-left soft orbit */}
      <div style={{
        position: "absolute",
        bottom: "-14%",
        left: "-10%",
        width: "min(380px, 72vw)",
        height: "min(380px, 72vw)",
        animation: "asvOrbitSpin 120s linear infinite reverse",
        opacity: 0.3,
      }}>
        <svg width="100%" height="100%" viewBox="0 0 400 400" style={{ display: "block" }}>
          <defs>
            <linearGradient id="meshOrbBot" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fce7f3" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.3"/>
            </linearGradient>
          </defs>
          <ellipse cx="200" cy="200" rx="155" ry="60" fill="none" stroke="url(#meshOrbBot)" strokeWidth="1" transform="rotate(12 200 200)"/>
          <ellipse cx="200" cy="200" rx="95" ry="138" fill="none" stroke="url(#meshOrbBot)" strokeWidth="0.6" transform="rotate(-38 200 200)" opacity="0.5"/>
        </svg>
      </div>
    </>
  );
}

export default function AnimatedSurveyBackdrop() {
  return (
    <>
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {/* Layer 1: Base white */}
        <div style={{ position: "absolute", inset: 0, background: "#F8FAFC" }} />

        {/* Layer 2: Sophisticated mesh gradient — matches Premium Card reference palette */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: [
            "radial-gradient(at 0% 0%, hsla(168, 64%, 85%, 0.55) 0px, transparent 50%)",
            "radial-gradient(at 100% 0%, hsla(335, 76%, 92%, 0.5) 0px, transparent 50%)",
            "radial-gradient(at 100% 100%, hsla(45, 89%, 90%, 0.45) 0px, transparent 50%)",
            "radial-gradient(at 0% 100%, hsla(196, 81%, 90%, 0.5) 0px, transparent 50%)",
            "radial-gradient(at 50% 50%, hsla(271, 72%, 93%, 0.45) 0px, transparent 50%)",
          ].join(", "),
        }} />

        {/* Layer 3: Soft rotating aurora */}
        <div style={{
          position: "absolute",
          inset: "-20%",
          opacity: 0.22,
          mixBlendMode: "multiply",
          animation: "asvRotateGradient 30s linear infinite",
          background: "conic-gradient(from 180deg at 55% 40%, hsla(168,64%,80%,0.6), hsla(335,76%,85%,0.5), hsla(196,81%,85%,0.5), hsla(45,89%,88%,0.4), hsla(168,64%,80%,0.6))",
        }} />

        {/* Layer 4: Soft mint blob top-right */}
        <div style={{
          position: "absolute",
          width: "min(70vw, 420px)",
          height: "min(70vw, 420px)",
          borderRadius: "50%",
          background: "radial-gradient(circle, hsla(168, 64%, 85%, 0.65) 0%, transparent 70%)",
          top: "-18%",
          right: "-8%",
          filter: "blur(48px)",
          animation: "asvFloatBlob 22s ease-in-out infinite",
        }} />

        {/* Layer 5: Soft pink blob bottom-left */}
        <div style={{
          position: "absolute",
          width: "min(65vw, 380px)",
          height: "min(65vw, 380px)",
          borderRadius: "50%",
          background: "radial-gradient(circle, hsla(335, 76%, 88%, 0.55) 0%, transparent 70%)",
          bottom: "-12%",
          left: "-12%",
          filter: "blur(44px)",
          animation: "asvFloatBlob 28s ease-in-out infinite reverse",
        }} />

        {/* Layer 6: Subtle star twinkle */}
        <div style={{
          position: "absolute",
          inset: 0,
          opacity: 0.3,
          backgroundImage: [
            "radial-gradient(1.2px 1.2px at 20% 28%, rgba(255,255,255,0.95), transparent)",
            "radial-gradient(1px 1px at 78% 18%, rgba(255,255,255,0.85), transparent)",
            "radial-gradient(1px 1px at 42% 75%, rgba(255,255,255,0.75), transparent)",
            "radial-gradient(1px 1px at 65% 55%, rgba(255,255,255,0.7), transparent)",
          ].join(", "),
          backgroundSize: "140px 140px, 190px 190px, 160px 160px, 200px 200px",
          animation: "asvTwinkle 8s ease-in-out infinite",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 10%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 10%, transparent 75%)",
        }} />

        {/* Layer 7: Very subtle grid */}
        <div style={{
          position: "absolute",
          inset: 0,
          opacity: 0.1,
          backgroundImage: [
            "linear-gradient(rgba(99,102,241,0.18) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(99,102,241,0.18) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "56px 56px",
          animation: "asvGridDrift 120s linear infinite",
          maskImage: "radial-gradient(ellipse 85% 75% at 50% 40%, black 15%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 85% 75% at 50% 40%, black 15%, transparent 80%)",
        }} />

        <SoftOrbitDecor />
      </div>

      <style>{`
        @keyframes asvRotateGradient {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes asvFloatBlob {
          0%,100% { transform: translate(0, 0) scale(1); }
          33%      { transform: translate(18px, -14px) scale(1.04); }
          66%      { transform: translate(-14px, 12px) scale(0.97); }
        }
        @keyframes asvGridDrift {
          0%   { background-position: 0 0; }
          100% { background-position: 560px 560px; }
        }
        @keyframes asvTwinkle {
          0%,100% { opacity: 0.25; }
          50%      { opacity: 0.45; }
        }
        @keyframes asvOrbitSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
