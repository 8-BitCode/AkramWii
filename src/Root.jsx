/* Root.jsx */
import React from "react";
import WarningScreen from "./Warningscreen";
import App from "./App";
import "./Root.css";
import sound from "./Soundmanager";
import { isFirefox } from "./Env";

// Computed once — Firefox is significantly more expensive at animating
// `filter` (blur) and `border-radius`, so a couple of components below
// take a cheaper path when this is true.
const FIREFOX = isFirefox();

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
  const darkenRef = React.useRef(null);
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

  // Tracks whether the warning layer is currently hidden (display:none).
  // Used to add hysteresis around the opacity-reaches-0 threshold so tiny
  // scroll/touch jitter near that point can't rapidly flip display on/off.
  const warningHiddenRef = React.useRef(false);

  const applyFrame = React.useCallback((p) => {
    const originX = 50;
    const originY = 90;

    if (mainLayerRef.current) {
      const radius = p * 165;
      const scale = lerp(1.09, 1, p);
      mainLayerRef.current.style.clipPath = `circle(${radius}% at ${originX}% ${originY}%)`;
      mainLayerRef.current.style.transform = `scale(${scale})`;
    }

    if (darkenRef.current) {
      // Same "starts darker, brightens later" curve the old filter:brightness()
      // used, just expressed as a plain black overlay's opacity instead.
      // Perf: filter forces the browser to fully repaint the entire App
      // subtree underneath (12 tiles, their box-shadows/gradients, the
      // pulsing tile-0 glow) on every single frame the value changes - on
      // top of the clip-path reveal already happening that frame. Opacity
      // on a flat, empty div is compositor-only: no repaint of anything
      // beneath it, just a GPU blend. Same visual "dark to bright" feel,
      // a fraction of the cost.
      const brightness = lerp(0.25, 1, Math.min(1, Math.pow(p, 1.4) * 1.5));
      darkenRef.current.style.opacity = String(clamp(1 - brightness, 0, 1));
    }

    if (warningRef.current) {
      const opacity = clamp(1 - p * 1.3, 0, 1);

      // Hysteresis band around the point where opacity hits 0 (~p=0.769).
      // Without this, a single hard "opacity <= 0" threshold means that on
      // a slow scroll — where p can tremor back and forth by a fraction of
      // a percent frame to frame due to touch-coordinate noise — the layer
      // rapidly toggles display:none on and off, reading as a flicker even
      // though the underlying transform/opacity values are smooth. Requiring
      // p to cross a real gap (HIDE_AT vs SHOW_AT) before flipping state
      // again means jitter smaller than that gap can't retrigger it.
      const HIDE_AT = 0.79;
      const SHOW_AT = 0.75;
      if (!warningHiddenRef.current && p > HIDE_AT) {
        warningHiddenRef.current = true;
      } else if (warningHiddenRef.current && p < SHOW_AT) {
        warningHiddenRef.current = false;
      }
      const invisible = warningHiddenRef.current;

      // Blurring the whole warning screen every frame is one of the more
      // expensive parts of this transition (filter repaints, unlike
      // opacity/transform which the compositor handles for free). Two
      // cheap wins: cap the max blur (8px reads as "gone" just as well as
      // 16px once combined with opacity/scale), and stop touching the
      // element entirely once it's fully transparent instead of
      // continuing to recompute a growing blur nobody can see.
      warningRef.current.style.opacity = String(opacity);
      if (!invisible) {
        const scale = 1 + p * 0.22;
        const translate = -p * 46;
        if (FIREFOX) {
          // Animating `filter: blur()` every frame forces Firefox to fully
          // re-rasterize the warning screen's text/SVG each tick — one of
          // the most expensive things you can animate there. Opacity fading
          // to 0 while it scales/moves away still reads as "dissolving",
          // just without paying the blur repaint cost every frame.
          warningRef.current.style.filter = "";
        } else {
          const blur = p * 8;
          warningRef.current.style.filter = `blur(${blur}px)`;
        }
        warningRef.current.style.transform = `translateY(${translate}px) scale(${scale})`;
        warningRef.current.style.display = "";
      } else if (warningRef.current.style.display !== "none") {
        warningRef.current.style.display = "none";
      }
    }

    if (ring1Ref.current) {
      // Ring element is now a fixed 260vmax circle in CSS; scale (0-1)
      // stands in for the old 0-260vmax width/height growth.
      const scale = p;
      ring1Ref.current.style.transform = `translate(-50%, -50%) scale(${scale})`;
      ring1Ref.current.style.opacity = p < 0.04 ? "0" : String(clamp(1 - Math.max(0, p - 0.75) / 0.25, 0, 1) * 0.7);
    }
    if (ring2Ref.current) {
      const local = clamp((p - 0.08) / 0.92, 0, 1);
      ring2Ref.current.style.transform = `translate(-50%, -50%) scale(${local})`;
      ring2Ref.current.style.opacity = local < 0.04 ? "0" : String(clamp(1 - Math.max(0, local - 0.7) / 0.3, 0, 1) * 0.5);
    }

    if (discRef.current) {
      const rotate = p * 900;
      const scale = clamp(1 - p * 0.55, 0.2, 1);
      const opacity = p < 0.02 ? 0 : clamp(1 - Math.max(0, p - 0.55) / 0.35, 0, 1) * 0.8;
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
      const opacity = clamp(local * 6, 0, 1) * clamp(1 - Math.max(0, local - 0.65) / 0.35, 0, 1) * 0.7;
      el.style.transform = `translate(-50%, -50%) translate(${x}vmax, ${y}vmax) rotate(${rot}deg)`;
      el.style.opacity = String(opacity);
    });

    if (flashRef.current) {
      // Reduced flash intensity - lower peak and shorter duration
      const flashPeak = 0.35;
      const flashStart = 0.82;
      const flashEnd = 0.98;
      let flashOpacity = 0;
      if (p > flashStart && p < flashEnd) {
        const flashProgress = (p - flashStart) / (flashEnd - flashStart);
        flashOpacity = Math.sin(flashProgress * Math.PI) * flashPeak;
      }
      flashRef.current.style.opacity = String(flashOpacity);
    }
  }, []);

  const lastAppliedRef = React.useRef(-1);

  const loop = React.useCallback(() => {
    progressRef.current = lerp(progressRef.current, targetRef.current, 0.16);
    if (Math.abs(progressRef.current - targetRef.current) < 0.0008) {
      progressRef.current = targetRef.current;
    }
    // Once the eased value has basically stopped moving (e.g. holding
    // still between scroll inputs), skip re-writing ~15 style properties
    // across 12+ elements for a change too small to see. Still runs the
    // finish-detection below every frame, just without the paint work.
    if (Math.abs(progressRef.current - lastAppliedRef.current) > 0.0004) {
      applyFrame(progressRef.current);
      lastAppliedRef.current = progressRef.current;
    }

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

  // Console "power on" chime, then a loading loop for the rest of the
  // scroll-driven boot sequence - stopped the moment the Wii menu reveals.
  React.useEffect(() => {
    sound.play('bootup');
    sound.playLoop('loading');
    return () => sound.stopLoop('loading');
  }, []);

  React.useEffect(() => {
    if (done) {
      sound.stopLoop('loading');
      sound.playMusic('wiiMenu');
    }
  }, [done]);

  React.useEffect(() => {
    if (done) return undefined;

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const SCROLL_SENSITIVITY = 0.0016;
    const TOUCH_SENSITIVITY = 0.0048;
    // Ignore sub-pixel finger jitter on touchmove so it doesn't get
    // translated into tiny back-and-forth deltas that make `targetRef`
    // (and everything downstream of it) tremor near thresholds.
    const TOUCH_DEADZONE = 1.5; // px

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
      if (Math.abs(dy) < TOUCH_DEADZONE) return;
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
        {!done && <div className="reveal-darken" ref={darkenRef} aria-hidden="true" />}
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