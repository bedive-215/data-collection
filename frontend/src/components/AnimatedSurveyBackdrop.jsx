import React, { useEffect, useState, useRef } from "react";

/**
 * Performance-optimized backdrop.
 *
 * Key fixes vs original:
 * - willChange chỉ đặt khi element thực sự sắp animate (dùng CSS class, không inline)
 * - Bỏ hoàn toàn mixBlendMode trên animated element
 * - Conic-gradient aurora được thay bằng 2 radial-gradient tĩnh – cùng hiệu ứng,
 *   không cần composite layer riêng
 * - Orbit SVG delay 800ms sau khi paint xong (requestIdleCallback / setTimeout fallback)
 * - contain: "strict" giữ nguyên để cô lập layout/paint khỏi phần còn lại của app
 * - Giảm số lượng willChange layer từ 6 → 2 (chỉ blob 4 và 5)
 * - transform: translate3d(0,0,0) chỉ giữ ở 1 blob thay vì mọi element
 */

const STYLES = `
  @keyframes asvFloatBlob {
    0%,100% { transform: translate3d(0, 0, 0) scale(1); }
    33%      { transform: translate3d(12px, -8px, 0) scale(1.018); }
    66%      { transform: translate3d(-8px, 6px, 0) scale(0.982); }
  }
  @keyframes asvGridDrift {
    to { transform: translate3d(56px, 56px, 0); }
  }
  @keyframes asvTwinkle {
    0%,100% { opacity: 0.22; }
    50%      { opacity: 0.42; }
  }
  @keyframes asvOrbitSpin {
    to { transform: rotate(360deg); }
  }
  .asv-blob {
    will-change: transform;
  }
`;

const SoftOrbitDecor = React.memo(() => (
  <>
    <div style={{
      position: "absolute",
      top: "-8%", right: "-6%",
      width: "min(440px, 85vw)",
      height: "min(440px, 85vw)",
      animation: "asvOrbitSpin 90s linear infinite",
      opacity: 0.35,
    }}>
      <svg width="100%" height="100%" viewBox="0 0 440 440" aria-hidden="true">
        <defs>
          <linearGradient id="meshOrbTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#a7f3d0" stopOpacity="0.7"/>
            <stop offset="50%"  stopColor="#c4b5fd" stopOpacity="0.35"/>
            <stop offset="100%" stopColor="#fde68a" stopOpacity="0.5"/>
          </linearGradient>
        </defs>
        <ellipse cx="220" cy="220" rx="175" ry="75"
          fill="none" stroke="url(#meshOrbTop)" strokeWidth="1.2"
          transform="rotate(-18 220 220)"/>
        <ellipse cx="220" cy="220" rx="125" ry="155"
          fill="none" stroke="url(#meshOrbTop)" strokeWidth="0.8"
          transform="rotate(52 220 220)" opacity="0.5"/>
        <circle cx="220" cy="220" r="5" fill="rgba(255,255,255,0.75)" opacity="0.5"/>
      </svg>
    </div>

    <div style={{
      position: "absolute",
      bottom: "-14%", left: "-10%",
      width: "min(380px, 72vw)",
      height: "min(380px, 72vw)",
      animation: "asvOrbitSpin 120s linear infinite reverse",
      opacity: 0.28,
    }}>
      <svg width="100%" height="100%" viewBox="0 0 400 400" aria-hidden="true">
        <defs>
          <linearGradient id="meshOrbBot" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#fce7f3" stopOpacity="0.6"/>
            <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.3"/>
          </linearGradient>
        </defs>
        <ellipse cx="200" cy="200" rx="155" ry="60"
          fill="none" stroke="url(#meshOrbBot)" strokeWidth="1"
          transform="rotate(12 200 200)"/>
        <ellipse cx="200" cy="200" rx="95" ry="138"
          fill="none" stroke="url(#meshOrbBot)" strokeWidth="0.6"
          transform="rotate(-38 200 200)" opacity="0.5"/>
      </svg>
    </div>
  </>
));

SoftOrbitDecor.displayName = "SoftOrbitDecor";

const AnimatedSurveyBackdrop = React.memo(() => {
  const [showOrbits, setShowOrbits] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    // Trì hoãn orbit đến sau khi trang paint xong → không tranh GPU lúc FCP
    const schedule = window.requestIdleCallback
      ? (cb) => window.requestIdleCallback(cb, { timeout: 1200 })
      : (cb) => setTimeout(cb, 800);

    timerRef.current = schedule(() => setShowOrbits(true));

    return () => {
      if (window.cancelIdleCallback && typeof timerRef.current === "number") {
        window.cancelIdleCallback(timerRef.current);
      } else {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          overflow: "hidden",
          contain: "strict",
        }}
      >
        {/* Layer 1: Base */}
        <div style={{ position: "absolute", inset: 0, background: "#F8FAFC" }} />

        {/* Layer 2: Mesh gradient (tĩnh – zero cost) */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: [
            "radial-gradient(at 0% 0%,   hsla(168,64%,85%,0.55) 0px, transparent 50%)",
            "radial-gradient(at 100% 0%,  hsla(335,76%,92%,0.5)  0px, transparent 50%)",
            "radial-gradient(at 100% 100%,hsla(45,89%,90%,0.45)  0px, transparent 50%)",
            "radial-gradient(at 0% 100%,  hsla(196,81%,90%,0.5)  0px, transparent 50%)",
            "radial-gradient(at 50% 50%,  hsla(271,72%,93%,0.45) 0px, transparent 50%)",
          ].join(", "),
        }} />

        {/*
          Layer 3: Aurora tĩnh (thay thế conic-gradient animated).
          2 radial-gradient lớn chồng lên nhau tạo hiệu ứng aurora
          mà không cần animation → tiết kiệm 1 composite layer.
        */}
        <div style={{
          position: "absolute",
          inset: 0,
          opacity: 0.12,
          background: [
            "radial-gradient(ellipse 80% 55% at 55% 35%, hsla(168,64%,75%,0.7), transparent 70%)",
            "radial-gradient(ellipse 65% 50% at 30% 70%, hsla(335,76%,80%,0.6), transparent 70%)",
          ].join(", "),
        }} />

        {/* Layer 4: Mint blob – chỉ blob này + blob 5 dùng will-change */}
        <div className="asv-blob" style={{
          position: "absolute",
          width: "min(70vw, 420px)",
          height: "min(70vw, 420px)",
          borderRadius: "50%",
          background: "radial-gradient(circle, hsla(168,64%,85%,0.6) 0%, hsla(168,64%,85%,0.18) 42%, transparent 70%)",
          top: "-18%", right: "-8%",
          animation: "asvFloatBlob 22s ease-in-out infinite",
        }} />

        {/* Layer 5: Pink blob */}
        <div className="asv-blob" style={{
          position: "absolute",
          width: "min(65vw, 380px)",
          height: "min(65vw, 380px)",
          borderRadius: "50%",
          background: "radial-gradient(circle, hsla(335,76%,88%,0.5) 0%, hsla(335,76%,88%,0.12) 42%, transparent 70%)",
          bottom: "-12%", left: "-12%",
          animation: "asvFloatBlob 28s ease-in-out infinite reverse",
        }} />

        {/* Layer 6: Twinkle (opacity-only animation – rẻ nhất) */}
        <div style={{
          position: "absolute",
          inset: 0,
          opacity: 0.28,
          backgroundImage: [
            "radial-gradient(1.2px 1.2px at 20% 28%, rgba(255,255,255,0.95), transparent)",
            "radial-gradient(1px 1px at 78% 18%, rgba(255,255,255,0.85), transparent)",
            "radial-gradient(1px 1px at 42% 75%, rgba(255,255,255,0.75), transparent)",
            "radial-gradient(1px 1px at 65% 55%, rgba(255,255,255,0.7),  transparent)",
          ].join(", "),
          backgroundSize: "140px 140px, 190px 190px, 160px 160px, 200px 200px",
          animation: "asvTwinkle 8s ease-in-out infinite",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 10%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 10%, transparent 75%)",
        }} />

        {/* Layer 7: Grid (transform animation – chỉ thêm sau idle) */}
        {showOrbits && (
          <div style={{
            position: "absolute",
            inset: 0,
            opacity: 0.09,
            backgroundImage: [
              "linear-gradient(rgba(99,102,241,0.18) 1px, transparent 1px)",
              "linear-gradient(90deg, rgba(99,102,241,0.18) 1px, transparent 1px)",
            ].join(", "),
            backgroundSize: "56px 56px",
            animation: "asvGridDrift 120s linear infinite",
            maskImage: "radial-gradient(ellipse 85% 75% at 50% 40%, black 15%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse 85% 75% at 50% 40%, black 15%, transparent 80%)",
            willChange: "transform",
          }} />
        )}

        {/* Orbit SVG – defer đến sau idle */}
        {showOrbits && <SoftOrbitDecor />}
      </div>

      <style>{STYLES}</style>
    </>
  );
});

AnimatedSurveyBackdrop.displayName = "AnimatedSurveyBackdrop";

export default AnimatedSurveyBackdrop;