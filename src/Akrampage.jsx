/* AkramPage.jsx
   The "next page" that follows the mini skill-tree unlock animation in
   The Akram Experience. It's a second, bigger node tree of its own:
   you start at the root at the very bottom and scroll UP through it,
   each node popping in with the same "unlocked" language (green glow,
   pop-in, connecting line filling in) as the small tree that led here.
   The final node at the top is a locked "Employment Status" node that
   builds up with a shake + burst before landing on its punchline.
*/
import React from "react";
import ReactDOM from "react-dom";
import "./Akrampage.css";
import sound from "./SoundManager";

/* ---------- small lock glyph shown on any node before it's tapped ---------- */
function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="akram-lock-icon" aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" fill="none" />
    </svg>
  );
}

/* ---------- a single achievement node + its detail card ----------
   Starts locked (dim, tappable). Tapping it reveals the node's real
   icon/colour and pops its card in, same "unlocked" pop language used
   everywhere else in the tree. */
function TreeNode({ id, revealed, unlockable, onReveal, onCenter, icon, tone = "green", title, meta, pill, text, mutedText, chips }) {
  const handleClick = () => {
    if (!revealed && unlockable) {
      sound.play("homeMenuClose");
      onReveal(id);
      onCenter?.(id);
    }
  };
  const stateClass = revealed
    ? "is-in akram-tree-node--pop-in"
    : unlockable
    ? "akram-tree-node--locked"
    : "akram-tree-node--inert";
  const cardStateClass = revealed ? "is-in" : unlockable ? "akram-tree-card--locked" : "akram-tree-card--inert";
  return (
    <div className="akram-tree-item" data-node-id={id}>
      <button
        type="button"
        className={`akram-tree-node akram-tree-node--${tone} ${stateClass}`}
        onClick={handleClick}
        disabled={!unlockable}
        aria-label={revealed ? title : unlockable ? "Press node to unlock" : "Locked"}
      >
        {!revealed && unlockable && (
          <span className="akram-tap-hint" aria-hidden="true">
            <span className="akram-tap-hint-label">Click</span>
            <svg viewBox="0 0 24 24" className="akram-tap-hint-arrow">
              <path
                d="M12 4v13M12 17l-5-5M12 17l5-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )}
        <span className="akram-tree-node-icon" aria-hidden="true">
          {revealed ? icon : <LockIcon />}
        </span>
      </button>
      <div className={`akram-tree-card ${cardStateClass}`}>
        {revealed ? (
          <>
            <h2>{title}</h2>
            {pill && <span className="akram-card-pill">{pill}</span>}
            {meta && <span className="akram-card-meta">{meta}</span>}
            {text && <p className="akram-card-text">{text}</p>}
            {mutedText && <p className="akram-card-text akram-card-text--muted">{mutedText}</p>}
            {chips && chips.length > 0 && (
              <div className="akram-card-chips">
                {chips.map((c) => (
                  <span className="akram-chip" key={c}>{c}</span>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="akram-card-text akram-card-text--muted">
            {unlockable ? "Press node to unlock." : "Locked."}
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------- the root node, at the very bottom of the tree ----------
   Already unlocked when the page loads - it's the start of the story. */
function RootNode({ revealed }) {
  return (
    <div className="akram-tree-item akram-tree-item--root">
      <div className={`akram-tree-node akram-tree-node--root ${revealed ? "is-in akram-tree-node--pop-in" : ""}`}>
        <span className="akram-tree-node-icon" aria-hidden="true">★</span>
      </div>
      <div className={`akram-tree-card ${revealed ? "is-in" : ""}`}>
        <h2>Akram Munir Awel</h2>
        <p className="akram-card-text akram-card-text--muted">
          First-year Computer Science, University of Manchester
        </p>
      </div>
    </div>
  );
}

/* ---------- the special node at the top: click to build up + reveal ---------- */
const SHAKE_MS = 5600;
const BURST_MS = 600;
const CHARGE_MESSAGES = [
  "Warming up…",
  "Charging…",
  "Building up…",
  "Getting stronger…",
  "Almost there…",
  "Here it comes…",
  "3… 2… 1…",
];

function EmploymentNode({ unlockable, onShakeStart, onShakeEnd, onCenter }) {
  const [stage, setStage] = React.useState("locked"); // locked -> shaking -> burst -> revealed
  const stageRef = React.useRef(stage);
  React.useEffect(() => {
    stageRef.current = stage;
  }, [stage]);
  const [chargeIndex, setChargeIndex] = React.useState(0);
  const [origin, setOrigin] = React.useState({ x: 0, y: 0 });
  const buttonRef = React.useRef(null);
  const timeoutsRef = React.useRef([]);
  const intervalRef = React.useRef(null);

  React.useEffect(
    () => () => {
      timeoutsRef.current.forEach(clearTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (stageRef.current === "shaking") {
        sound.unduckMusic();
        onShakeEnd?.();
      }
    },
    []
  );

  // Cycle the build-up copy while it's shaking, Wii-chime style anticipation.
  React.useEffect(() => {
    if (stage !== "shaking") return undefined;
    setChargeIndex(0);
    intervalRef.current = setInterval(() => {
      setChargeIndex((i) => Math.min(i + 1, CHARGE_MESSAGES.length - 1));
    }, SHAKE_MS / CHARGE_MESSAGES.length);
    return () => clearInterval(intervalRef.current);
  }, [stage]);

  // A wide field of blue sparks that fly off across the whole screen while
  // the node charges, plus a much bigger burst wave at the pop. These live
  // in a fixed, screen-wide layer (rendered via portal) so they aren't
  // boxed in by the node or the scroll container.
  const chargeSparks = React.useMemo(
    () =>
      Array.from({ length: 26 }).map((_, i) => {
        const angle = (Math.PI * 2 * i) / 26 + (Math.random() - 0.5) * 0.6;
        const distance = 140 + Math.random() * 480;
        return {
          id: `charge-${i}`,
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance,
          delay: Math.random() * (SHAKE_MS - 900),
          size: 8 + Math.random() * 8,
        };
      }),
    []
  );

  const burstSparks = React.useMemo(
    () =>
      Array.from({ length: 34 }).map((_, i) => {
        const angle = (Math.PI * 2 * i) / 34 + (Math.random() - 0.5) * 0.35;
        const distance = 240 + Math.random() * 700;
        return {
          id: `burst-${i}`,
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance,
          delay: Math.random() * 150,
          size: 10 + Math.random() * 10,
        };
      }),
    []
  );

  const handleClick = () => {
    if (stage !== "locked" || !unlockable) return;
    sound.play("homeMenuClose");
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    }
    setStage("shaking");
    sound.duckMusic(0.12);
    sound.playMusicOneShot('buildup');
    onShakeStart?.();
    onCenter?.("employment");
    timeoutsRef.current.push(
      setTimeout(() => {
        setStage("burst");
        sound.unduckMusic();
        onShakeEnd?.();
      }, SHAKE_MS),
      setTimeout(() => setStage("revealed"), SHAKE_MS + BURST_MS)
    );
  };

  const sparkVars = (s) => ({
    "--x": `${origin.x}px`,
    "--y": `${origin.y}px`,
    "--dx": `${s.dx}px`,
    "--dy": `${s.dy}px`,
    "--delay": `${s.delay}ms`,
    "--size": `${s.size}px`,
  });

  return (
    <div className="akram-tree-item" data-node-id="employment">
      <button
        type="button"
        ref={buttonRef}
        className={`akram-tree-node akram-tree-node--employment akram-tree-node--${stage} ${
          stage === "locked" && !unlockable ? "akram-tree-node--inert" : ""
        } ${stage === "locked" && unlockable ? "akram-tree-node--attention" : ""} ${stage !== "locked" ? "is-in" : ""}`}
        onClick={handleClick}
        disabled={!unlockable}
        aria-label={unlockable ? "Press node to unlock employment status" : "Locked"}
      >
        {stage === "locked" && unlockable && (
          <span className="akram-employment-callout" aria-hidden="true">
            🔓 Tap to Reveal Employment Status
          </span>
        )}
        {stage === "burst" || stage === "revealed" ? (
          <span className="akram-tree-node-burst" aria-hidden="true" />
        ) : (
          <svg viewBox="0 0 24 24" className="akram-lock-icon" aria-hidden="true">
            <rect x="5" y="10.5" width="14" height="9.5" rx="2.2" />
            <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" fill="none" />
          </svg>
        )}
      </button>

      {typeof document !== "undefined" &&
        (stage === "shaking" || stage === "burst") &&
        ReactDOM.createPortal(
          <div className="akram-spark-layer" aria-hidden="true">
            {stage === "shaking" &&
              chargeSparks.map((s) => (
                <span key={s.id} className="akram-spark" style={sparkVars(s)} />
              ))}
            {stage === "burst" &&
              burstSparks.map((s) => (
                <span key={s.id} className="akram-spark akram-spark--burst" style={sparkVars(s)} />
              ))}
          </div>,
          document.body
        )}

      <div
        className={`akram-tree-card akram-tree-card--employment ${
          stage === "revealed"
            ? "is-in"
            : stage !== "locked" || unlockable
            ? "akram-tree-card--locked"
            : "akram-tree-card--inert"
        }`}
      >
        {stage !== "revealed" ? (
          <>
            <h2>Employment Status</h2>
            <p className="akram-card-text akram-card-text--muted">
              {stage === "locked" ? (unlockable ? "Press node to unlock." : "Locked.") : CHARGE_MESSAGES[chargeIndex]}
            </p>
          </>
        ) : (
          <>
            <h2 className="akram-employment-title">Employment Status</h2>
            <p className="akram-employment-result">Unemployed</p>
            <p className="akram-card-text akram-card-text--muted">
              Currently open to opportunities. Bribes considered.
            </p>
            <a
              className="akram-page-link"
              href="https://www.linkedin.com/in/akrammunirawel/"
              target="_blank"
              rel="noreferrer"
            >
              Connect on LinkedIn
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default function AkramPage({ onGoBack, onEscape }) {
  const scrollRef = React.useRef(null);
  const gridRef = React.useRef(null);
  const [revealedIds, setRevealedIds] = React.useState(() => new Set(["core"]));
  const [screenShaking, setScreenShaking] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(
    () => window.matchMedia('(max-width: 600px)').matches
  );
  const scrollAnimRef = React.useRef(null);

  // Custom eased scroll animation - gives us a slower, more deliberate glide
  // than the browser's native "smooth" (and lets us cancel/replace it if the
  // person taps another node mid-flight).
  const smoothScrollTo = React.useCallback((targetTop, duration = 1000) => {
    const el = scrollRef.current;
    if (!el) return;
    if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current);

    const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
    const clampedTarget = Math.max(0, Math.min(maxScroll, targetTop));
    const startTop = el.scrollTop;
    const distance = clampedTarget - startTop;
    const startTime = performance.now();
    const prevBehavior = el.style.scrollBehavior;
    el.style.scrollBehavior = "auto"; // avoid double-animating against CSS scroll-behavior: smooth

    const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const step = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      el.scrollTop = startTop + distance * easeInOutCubic(t);
      if (t < 1) {
        scrollAnimRef.current = requestAnimationFrame(step);
      } else {
        scrollAnimRef.current = null;
        el.style.scrollBehavior = prevBehavior;
      }
    };
    scrollAnimRef.current = requestAnimationFrame(step);
  }, []);

  // Center a just-tapped node's text card in the viewport. We wait a beat
  // so the reveal/pop-in state has actually landed in the DOM (the card
  // grows in height when it unlocks), otherwise we'd centre the old,
  // collapsed layout instead of the final one.
  const scrollToNode = React.useCallback(
    (id) => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          const el = scrollRef.current;
          const target = el?.querySelector(`[data-node-id="${id}"]`);
          if (!el || !target) return;
          const elRect = el.getBoundingClientRect();
          const targetRect = target.getBoundingClientRect();
          const targetTopWithinScroll = targetRect.top - elRect.top + el.scrollTop;
          const targetCenter = targetTopWithinScroll + targetRect.height / 2;
          const desiredScrollTop = targetCenter - el.clientHeight / 2;
          smoothScrollTo(desiredScrollTop);
        }, 80);
      });
    },
    [smoothScrollTo]
  );

  React.useEffect(
    () => () => {
      if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current);
    },
    []
  );

  // Detect mobile
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 600px)');
    const handleChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  // Background music for this page - swaps in on mount, hands back to
  // whatever was playing before (the Wii menu loop) on the way out.
  React.useEffect(() => {
    sound.playMusic('akramExperience');
    return () => sound.playMusic('wiiMenu');
  }, []);

  // Reveal a node on tap - each node is tapped individually now, instead
  // of auto-unlocking as it scrolls into view.
  const handleReveal = (id) => {
    setRevealedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  // A field of small blue "Wii Channel" bubbles that drift upward the
  // whole time, regenerated once so their timing/spacing stays stable.
  const bubbles = React.useMemo(
    () =>
      Array.from({ length: 16 }).map((_, i) => ({
        id: i,
        x: `${(i * 37 + Math.random() * 20) % 100}%`,
        size: 6 + Math.random() * 16,
        dur: 11 + Math.random() * 10,
        delay: -Math.random() * 20,
        drift: (Math.random() - 0.5) * 70,
        op: 0.25 + Math.random() * 0.3,
      })),
    []
  );

  // Nudge the circuit grid as the person scrolls, so it feels like the
  // whole backdrop is a technical layer being scrolled through, not a
  // static image.
  const handleScroll = () => {
    const el = scrollRef.current;
    if (el && gridRef.current) {
      gridRef.current.style.transform = `translateY(${el.scrollTop * 0.12}px)`;
    }
  };

  // Start scrolled to the bottom - the root of the tree - and let the
  // person scroll up through it, same as climbing a real skill tree.
  React.useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  // Nodes unlock strictly in order, bottom to top - each one becomes
  // tappable only once the node before it has been revealed. "core"
  // (the root, bottom-most node) starts revealed already.
  const ORDER = ["core", "hackathon", "pass", "graphics", "employment"];
  const isUnlockable = (id) => {
    const idx = ORDER.indexOf(id);
    if (idx <= 0) return true;
    return revealedIds.has(ORDER[idx - 1]);
  };
  const revealedCount = ORDER.filter((id) => revealedIds.has(id)).length;
  const progressPct = Math.max(0, ((revealedCount - 1) / (ORDER.length - 1)) * 100);

  // Handle go back - call the prop if provided
  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    }
  };

  // Handle ESC key - call onEscape prop if provided
  const handleEscape = () => {
    if (onEscape) {
      onEscape();
    }
  };

  return (
    <div 
      className={`akram-page ${screenShaking ? "akram-page--shaking" : ""}`} 
      style={{ "--akram-progress": progressPct / 100 }}
    >
      {/* ESC indicator - top right corner - ONLY on desktop (non-mobile) */}
      {!isMobile && (
        <button 
          className="akram-esc-indicator"
          onClick={handleEscape}
          aria-label="Press ESC to open HOME Menu"
        >
          <span className="akram-esc-key">⎋ ESC</span>
          <span className="akram-esc-label">HOME Menu</span>
          <span className="akram-esc-arrow">⌂</span>
        </button>
      )}

      {/* Mobile back button - top left corner - ONLY on mobile */}
      {isMobile && (
        <button 
          className="akram-back-fab"
          onClick={handleEscape}
          aria-label="Open HOME Menu"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="19 12 5 12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Menu</span>
        </button>
      )}

      <div className="akram-circuit-bg" aria-hidden="true">
        <div className="akram-circuit-grid" ref={gridRef} />
        <div className="akram-circuit-nodes" />
        {bubbles.map((b) => (
          <span
            key={b.id}
            className="akram-bubble"
            style={{
              "--x": b.x,
              "--size": `${b.size}px`,
              "--dur": `${b.dur}s`,
              "--delay": `${b.delay}s`,
              "--drift": `${b.drift}px`,
              "--op": b.op,
            }}
          />
        ))}
      </div>

      <div
        className={`akram-tree-scroll ${screenShaking ? "akram-page--shaking" : ""}`}
        ref={scrollRef}
        onScroll={handleScroll}
      >
        <div className="akram-tree-inner">
          <div className="akram-tree-track-wrap" aria-hidden="true">
            <div className="akram-tree-track" />
            <div className="akram-tree-progress" style={{ height: `${progressPct}%` }} />
            <span className="akram-track-pulse" style={{ "--pulse-delay": "0s" }} />
            <span className="akram-track-pulse" style={{ "--pulse-delay": "0.9s" }} />
            <span className="akram-track-pulse" style={{ "--pulse-delay": "1.8s" }} />
          </div>

          <div className="akram-tree-list">
            <EmploymentNode
              unlockable={isUnlockable("employment")}
              onShakeStart={() => setScreenShaking(true)}
              onShakeEnd={() => setScreenShaking(false)}
              onCenter={scrollToNode}
            />

            <div className="akram-tree-gap" />

            <TreeNode
              id="graphics"
              revealed={revealedIds.has("graphics")}
              unlockable={isUnlockable("graphics")}
              onReveal={handleReveal}
              onCenter={scrollToNode}
              icon="🖌️"
              tone="green"
              title="Graphics Lead, UNICS"
              meta="Computer Science Society, University of Manchester"
              text="Handles visual design for UNICS - event graphics and the overall look carried across its hackathons and socials."
            />

            <div className="akram-tree-gap" />

            <TreeNode
              id="pass"
              revealed={revealedIds.has("pass")}
              unlockable={isUnlockable("pass")}
              onReveal={handleReveal}
              onCenter={scrollToNode}
              icon="🎓"
              tone="green"
              title="PASS Leader, Peer Support"
              meta="University of Manchester · Sep 2025 – Jul 2026 · Hybrid"
              text="Mentors around 15 first-year Computer Science students through weekly sessions, running collaborative activities and helping them settle into university life."
              chips={["Mentoring", "Academic Advising"]}
            />

            <div className="akram-tree-gap" />

            <TreeNode
              id="hackathon"
              revealed={revealedIds.has("hackathon")}
              unlockable={isUnlockable("hackathon")}
              onReveal={handleReveal}
              onCenter={scrollToNode}
              icon="🎮"
              tone="green"
              title="StudentHack2025 — Desktopia"
              pill="🥉 3rd Place, Main Challenge"
              text="At his first hackathon, Akram teamed up with three friends to build a satirical surveillance-state game with two endings, built in a single sleep-deprived weekend."
              mutedText="Led the brutalist front-end design that gave the game its tone."
              chips={["React + Flask", "Brutalist UI"]}
            />

            <div className="akram-tree-gap" />

            <RootNode revealed={revealedIds.has("core")} />
          </div>
        </div>
      </div>
    </div>
  );
}