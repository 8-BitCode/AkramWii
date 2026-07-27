/* Root.jsx */
import React from "react";
import WarningScreen from "./Warningscreen";
import App from "./App";
import "./Root.css";

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const lerp = (a, b, t) => a + (b - a) * t;

// Tile "shards" that burst outward from the reveal point, echoing the
// channel grid on the main menu. Each has its own angle/distance/spin
// so the burst reads as organic rather than a uniform ring.
const SHARDS = [
  { angle: -100, dist: 1.35, size: 46, rot: -80, delay: 0.0 },
  { angle: -62, dist: 1.6, size: 34, rot: 60, delay: 0.05 },
  { angle: -24, dist: 1.15, size: 52, rot: -35, delay: 0.02 },
  { angle: 16, dist: 1.7, size: 30, rot: 90, delay: 0.08 },
  { angle: 55, dist: 1.3, size: 44, rot: -50, delay: 0.01 },
  { angle: 98, dist: 1.55, size: 36, rot: 30, delay: 0.06 },
  { angle: 140, dist: 1.1, size: 48, rot: -65, delay: 0.03 },
  { angle: -140, dist: 1.45, size: 32, rot: 40, delay: 0.07 },
];

export default function Root() {
  const [done, setDone] = React.useState(false);

  const mainLayerRef = React.useRef(null);
  const warningRef = React.useRef(null);
  const ring1Ref = React.useRef(null);
  const ring2Ref = React.useRef(null);
  const discRef = React.useRef(null);
  const flashRef = React.useRef(null);
  const shardRefs = React.useRef([]);

  const progressRef = React.useRef(0);
  const targetRef = React.useRef(0);
  const rafRef = React.useRef(null);
  const settleTimerRef = React.useRef(null);
  const doneRef = React.useRef(false);

  const applyFrame = React.useCallback((p) => {
    const originX = 50;
    const originY = 90;

    if (mainLayerRef.current) {
      const radius = p * 165;
      const brightness = lerp(0.32, 1, Math.min(1, p * 1.35));
      const scale = lerp(1.09, 1, p);
      mainLayerRef.current.style.clipPath = `circle(${radius}% at ${originX}% ${originY}%)`;
      mainLayerRef.current.style.filter = `brightness(${brightness})`;
      mainLayerRef.current.style.transform = `scale(${scale})`;
    }

    if (warningRef.current) {
      const opacity = clamp(1 - p * 1.35, 0, 1);
      const blur = p * 16;
      const scale = 1 + p * 0.22;
      const translate = -p * 46;
      warningRef.current.style.opacity = String(opacity);
      warningRef.current.style.filter = `blur(${blur}px)`;
      warningRef.current.style.transform = `translateY(${translate}px) scale(${scale})`;
    }

    if (ring1Ref.current) {
      const size = p * 260;
      ring1Ref.current.style.width = `${size}vmax`;
      ring1Ref.current.style.height = `${size}vmax`;
      ring1Ref.current.style.opacity = p < 0.04 ? "0" : String(clamp(1 - Math.max(0, p - 0.75) / 0.25, 0, 1));
    }
    if (ring2Ref.current) {
      const local = clamp((p - 0.08) / 0.92, 0, 1);
      const size = local * 260;
      ring2Ref.current.style.width = `${size}vmax`;
      ring2Ref.current.style.height = `${size}vmax`;
      ring2Ref.current.style.opacity = local < 0.04 ? "0" : String(clamp(1 - Math.max(0, local - 0.7) / 0.3, 0, 1));
    }

    if (discRef.current) {
      const rotate = p * 900;
      const scale = clamp(1 - p * 0.55, 0.2, 1);
      const opacity = p < 0.02 ? 0 : clamp(1 - Math.max(0, p - 0.55) / 0.35, 0, 1);
      discRef.current.style.transform = `translate(-50%, -50%) rotate(${rotate}deg) scale(${scale})`;
      discRef.current.style.opacity = String(opacity);
    }

    shardRefs.current.forEach((el, i) => {
      if (!el) return;
      const s = SHARDS[i];
      const local = clamp((p - s.delay) / (1 - s.delay), 0, 1);
      const dist = local * s.dist * 62;
      const rot = local * s.rot;
      const rad = (s.angle * Math.PI) / 180;
      const x = Math.cos(rad) * dist;
      const y = Math.sin(rad) * dist;
      const opacity = clamp(local * 6, 0, 1) * clamp(1 - Math.max(0, local - 0.65) / 0.35, 0, 1);
      el.style.transform = `translate(-50%, -50%) translate(${x}vmax, ${y}vmax) rotate(${rot}deg)`;
      el.style.opacity = String(opacity);
    });

    if (flashRef.current) {
      const flashOpacity = clamp((p - 0.9) / 0.1, 0, 1) * 0.85;
      flashRef.current.style.opacity = String(flashOpacity);
    }
  }, []);

  const loop = React.useCallback(() => {
    progressRef.current = lerp(progressRef.current, targetRef.current, 0.16);
    if (Math.abs(progressRef.current - targetRef.current) < 0.0008) {
      progressRef.current = targetRef.current;
    }
    applyFrame(progressRef.current);

    if (progressRef.current >= 0.999 && targetRef.current >= 0.999) {
      if (!settleTimerRef.current && !doneRef.current) {
        settleTimerRef.current = window.setTimeout(() => {
          doneRef.current = true;
          setDone(true);
        }, 240);
      }
    } else if (settleTimerRef.current) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }

    if (!doneRef.current) {
      rafRef.current = requestAnimationFrame(loop);
    }
  }, [applyFrame]);

  React.useEffect(() => {
    applyFrame(0);
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
    };
  }, [applyFrame, loop]);

  React.useEffect(() => {
    if (done) return undefined;

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const SCROLL_SENSITIVITY = 0.0016;
    const TOUCH_SENSITIVITY = 0.0028;

    const skipToEnd = () => {
      doneRef.current = true;
      setDone(true);
    };

    const handleWheel = (e) => {
      e.preventDefault();
      if (prefersReducedMotion) {
        if (e.deltaY > 0) skipToEnd();
        return;
      }
      targetRef.current = clamp(targetRef.current + e.deltaY * SCROLL_SENSITIVITY, 0, 1);
    };

    let touchStartY = null;
    const handleTouchStart = (e) => {
      touchStartY = e.touches[0]?.clientY ?? null;
    };
    const handleTouchMove = (e) => {
      e.preventDefault();
      if (touchStartY === null) return;
      const y = e.touches[0]?.clientY ?? touchStartY;
      const dy = touchStartY - y;
      touchStartY = y;
      if (prefersReducedMotion) {
        if (dy > 0) skipToEnd();
        return;
      }
      targetRef.current = clamp(targetRef.current + dy * TOUCH_SENSITIVITY, 0, 1);
    };

    const handleKeyDown = (e) => {
      if (["ArrowDown", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        if (prefersReducedMotion) {
          skipToEnd();
          return;
        }
        targetRef.current = clamp(targetRef.current + 0.16, 0, 1);
      } else if (["ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        targetRef.current = clamp(targetRef.current - 0.16, 0, 1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        targetRef.current = 1;
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [done]);

  React.useEffect(() => {
    if (done && mainLayerRef.current) {
      mainLayerRef.current.style.clipPath = "none";
      mainLayerRef.current.style.filter = "";
      mainLayerRef.current.style.transform = "";
    }
  }, [done]);

  return (
    <div className="root-stage">
      <div className="main-layer" ref={mainLayerRef}>
        <App />
      </div>

      {!done && (
        <>
          <div className="reveal-disc" ref={discRef}>
            <svg viewBox="0 0 120 120" width="100%" height="100%">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#35c3db" strokeWidth="3" strokeDasharray="10 8" />
              <circle cx="60" cy="60" r="34" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.7" />
              <circle cx="60" cy="60" r="6" fill="#35c3db" />
            </svg>
          </div>

          {SHARDS.map((s, i) => (
            <div
              key={i}
              className="reveal-shard"
              ref={(el) => {
                shardRefs.current[i] = el;
              }}
              style={{ width: s.size, height: s.size }}
            />
          ))}

          <div className="reveal-ring" ref={ring1Ref} />
          <div className="reveal-ring reveal-ring--secondary" ref={ring2Ref} />

          <div className="warning-layer" ref={warningRef}>
            <WarningScreen />
          </div>

          <div className="reveal-flash" ref={flashRef} />
        </>
      )}
    </div>
  );
}