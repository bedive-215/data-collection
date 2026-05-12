import React from "react";

/**
 * Nền hoạt ảnh dùng chung (Home + SurveysLayout).
 * fixed z-index:0, pointer-events:none — đặt nội dung trang ở z-index:1.
 */
function OrbitSvgDecor() {
  return (
    <>
      <div style={{
        position:"absolute", top:"-6%", right:"-4%", width:"min(480px, 88vw)", height:"min(480px, 88vw)",
        animation:"asvOrbitSpin 80s linear infinite", opacity:0.48,
      }}>
        <svg width="100%" height="100%" viewBox="0 0 420 420" style={{ display:"block" }}>
          <defs>
            <linearGradient id="asvOrbTop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8"/>
              <stop offset="50%" stopColor="#c084fc" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.55"/>
            </linearGradient>
          </defs>
          <ellipse cx="210" cy="210" rx="168" ry="72" fill="none" stroke="url(#asvOrbTop)" strokeWidth="1.4" transform="rotate(-18 210 210)" opacity="0.95"/>
          <ellipse cx="210" cy="210" rx="118" ry="148" fill="none" stroke="url(#asvOrbTop)" strokeWidth="0.9" transform="rotate(52 210 210)" opacity="0.5"/>
          <circle cx="210" cy="210" r="6" fill="rgba(255,255,255,0.85)" opacity="0.55"/>
        </svg>
      </div>
      <div style={{
        position:"absolute", bottom:"-12%", left:"-8%", width:"min(400px, 75vw)", height:"min(400px, 75vw)",
        animation:"asvOrbitSpin 110s linear infinite reverse", opacity:0.38,
      }}>
        <svg width="100%" height="100%" viewBox="0 0 400 400" style={{ display:"block" }}>
          <defs>
            <linearGradient id="asvOrbBot" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f472b6" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.3"/>
            </linearGradient>
          </defs>
          <ellipse cx="200" cy="200" rx="150" ry="58" fill="none" stroke="url(#asvOrbBot)" strokeWidth="1.2" transform="rotate(12 200 200)"/>
          <ellipse cx="200" cy="200" rx="92" ry="132" fill="none" stroke="url(#asvOrbBot)" strokeWidth="0.7" transform="rotate(-38 200 200)" opacity="0.58"/>
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
          position:"fixed", inset:0, zIndex:0, pointerEvents:"none", overflow:"hidden",
        }}
      >
        <div style={{
          position:"absolute", inset:0,
          background:"radial-gradient(ellipse 55% 48% at 50% 42%, rgba(248,250,252,0.35) 0%, transparent 55%), radial-gradient(ellipse 120% 90% at 50% 120%, rgba(15,23,42,0.08) 0%, transparent 45%)",
        }}/>
        <div style={{
          position:"absolute", inset:0,
          background:"radial-gradient(ellipse 100% 70% at 8% -8%, rgba(129,140,248,0.42), transparent 52%), radial-gradient(ellipse 85% 58% at 98% 12%, rgba(244,114,182,0.3), transparent 50%), radial-gradient(ellipse 75% 62% at 48% 108%, rgba(56,189,248,0.28), transparent 52%), linear-gradient(168deg, #e8ecff 0%, #f8fafc 48%, #e0f7fa 100%)",
        }}/>
        <div style={{
          position:"absolute", inset:"-25%",
          background:"radial-gradient(ellipse 70% 45% at 25% 25%, rgba(167,139,250,0.48), transparent 55%), radial-gradient(ellipse 55% 40% at 85% 75%, rgba(45,212,191,0.28), transparent 50%), radial-gradient(ellipse 50% 35% at 55% 95%, rgba(96,165,250,0.4), transparent 55%)",
          animation:"asvAuroraShift 22s ease-in-out infinite alternate",
          willChange:"transform, opacity",
        }}/>
        <div style={{
          position:"absolute", inset:0, opacity:0.48, mixBlendMode:"multiply",
          animation:"asvRotateGradient 28s linear infinite",
          background:"conic-gradient(from 180deg at 55% 40%, rgba(99,102,241,0.45), rgba(236,72,182,0.28), rgba(34,211,238,0.34), rgba(251,191,36,0.22), rgba(99,102,241,0.45))",
        }}/>
        <div style={{
          position:"absolute", width:"min(92vw, 560px)", height:"min(92vw, 560px)", borderRadius:"50%",
          background:"radial-gradient(circle, rgba(129,140,248,0.55) 0%, transparent 66%)",
          top:"-16%", right:"-10%", filter:"blur(56px)",
          animation:"asvFloatBlob 20s ease-in-out infinite",
        }}/>
        <div style={{
          position:"absolute", width:"min(85vw, 480px)", height:"min(85vw, 480px)", borderRadius:"50%",
          background:"radial-gradient(circle, rgba(244,114,182,0.45) 0%, transparent 66%)",
          bottom:"-8%", left:"-14%", filter:"blur(52px)",
          animation:"asvFloatBlob 26s ease-in-out infinite reverse",
        }}/>
        <div style={{
          position:"absolute", inset:0, opacity:0.38,
          backgroundImage:"radial-gradient(1.2px 1.2px at 20% 30%, rgba(255,255,255,0.95), transparent), radial-gradient(1px 1px at 78% 22%, rgba(255,255,255,0.8), transparent), radial-gradient(1.1px 1.1px at 40% 80%, rgba(255,255,255,0.7), transparent)",
          backgroundSize:"120px 120px, 180px 180px, 140px 140px",
          animation:"asvTwinkle 7s ease-in-out infinite",
          maskImage:"radial-gradient(ellipse 72% 62% at 50% 38%, black 15%, transparent 72%)",
          WebkitMaskImage:"radial-gradient(ellipse 72% 62% at 50% 38%, black 15%, transparent 72%)",
        }}/>
        <div style={{
          position:"absolute", inset:0, opacity:0.26,
          backgroundImage:"linear-gradient(rgba(99,102,241,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.12) 1px, transparent 1px)",
          backgroundSize:"52px 52px",
          animation:"asvGridDrift 95s linear infinite",
          maskImage:"radial-gradient(ellipse 78% 68% at 50% 36%, black 18%, transparent 76%)",
          WebkitMaskImage:"radial-gradient(ellipse 78% 68% at 50% 36%, black 18%, transparent 76%)",
        }}/>
        <OrbitSvgDecor />
      </div>
      <style>{`
        @keyframes asvRotateGradient{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}
        @keyframes asvFloatBlob{0%,100%{transform:translate(0,0) scale(1);}33%{transform:translate(22px,-16px) scale(1.05);}66%{transform:translate(-18px,14px) scale(0.97);}}
        @keyframes asvGridDrift{0%{background-position:0 0;}100%{background-position:560px 560px;}}
        @keyframes asvAuroraShift{0%{transform:scale(1) translate(0,0);opacity:0.85;}50%{transform:scale(1.06) translate(-1.5%,1.2%);opacity:1;}100%{transform:scale(1.03) translate(1%,-0.8%);opacity:0.88;}}
        @keyframes asvTwinkle{0%,100%{opacity:0.22;}50%{opacity:0.42;}}
        @keyframes asvOrbitSpin{to{transform:rotate(360deg);}}
      `}</style>
    </>
  );
}
