/* DiscChannel.jsx */
import React from "react";
import "./DiscChannel.css";
import aboutMeGif from "./Assets/Aboutmepreview.gif";
import aboutMeStartMp4 from "./Assets/Aboutmestart.mp4";
import graphicsGif from "./Assets/Graphicspreview.gif";
import graphicsStartMp4 from "./Assets/Graphicspreviewstart.mp4";
import portfolioGif from "./Assets/Portfoliopreview.gif";
import portfolioStartMp4 from "./Assets/Portfoliopreviewstart.mp4";
import { AkramExpandedArt } from "./Akramart";
import AkramPage from "./Akrampage";
import GraphicsPage from "./Graphicspage";
import AboutMePage from "./Aboutmepage";
import GamePage from "./Gamepage";
import miiImg from "./Assets/Mii1.png";
import sound from "./Soundmanager";

const DURATION = 620;
const EASE = "cubic-bezier(0.45, 0, 0.15, 1)";
const TILE_RADIUS = "12% / 16%";

/* ---------- Wii-style disc-swoosh wipe ---------- */
const WIPE_IN_MS = 460;
const WIPE_HOLD_MS = 180;
const WIPE_OUT_MS = 460;

function WiiWipeTransition({ active, variant, onCovered, onDone }) {
  const [stage, setStage] = React.useState("idle");
  const timeoutsRef = React.useRef([]);
  const firedRef = React.useRef(false);

  const sparks = React.useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({
        id: i,
        top: `${6 + Math.random() * 88}%`,
        size: 5 + Math.random() * 8,
        delay: Math.random() * 300,
      })),
    []
  );

  React.useEffect(() => {
    if (!active || firedRef.current) return undefined;
    firedRef.current = true;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      onCovered?.();
      onDone?.();
      firedRef.current = false;
      return undefined;
    }

    setStage("in");
    timeoutsRef.current.push(
      setTimeout(() => {
        setStage("hold");
        onCovered?.();
      }, WIPE_IN_MS),
      setTimeout(() => setStage("out"), WIPE_IN_MS + WIPE_HOLD_MS),
      setTimeout(() => {
        setStage("idle");
        firedRef.current = false;
        onDone?.();
      }, WIPE_IN_MS + WIPE_HOLD_MS + WIPE_OUT_MS)
    );

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, [active]);

  if (stage === "idle") return null;

  return (
    <div
      className={`wii-wipe wii-wipe--${stage} ${variant ? `wii-wipe--${variant}` : ""}`}
      aria-hidden="true"
    >
      <div className="wii-wipe-bar">
        <span className="wii-wipe-shine" />
        {stage !== "out" &&
          sparks.map((s) => (
            <span
              key={s.id}
              className="wii-wipe-spark"
              style={{ "--top": s.top, "--size": `${s.size}px`, "--delay": `${s.delay}ms` }}
            />
          ))}
      </div>
      <div className="wii-wipe-flash" />
    </div>
  );
}

/* ---------- Camera-aperture transition (Graphics channel only) ---------- */
const IRIS_IN_MS = 460;
const IRIS_HOLD_MS = 200;
const IRIS_OUT_MS = 460;

function CameraApertureTransition({ active, onCovered, onDone }) {
  const [stage, setStage] = React.useState("idle");
  const timeoutsRef = React.useRef([]);
  const firedRef = React.useRef(false);
  const idBase = React.useId ? React.useId() : "camera-iris";

  React.useEffect(() => {
    if (!active || firedRef.current) return undefined;
    firedRef.current = true;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      onCovered?.();
      onDone?.();
      firedRef.current = false;
      return undefined;
    }

    setStage("in");
    timeoutsRef.current.push(
      setTimeout(() => {
        setStage("hold");
        onCovered?.();
      }, IRIS_IN_MS),
      setTimeout(() => setStage("out"), IRIS_IN_MS + IRIS_HOLD_MS),
      setTimeout(() => {
        setStage("idle");
        firedRef.current = false;
        onDone?.();
      }, IRIS_IN_MS + IRIS_HOLD_MS + IRIS_OUT_MS)
    );

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, [active]);

  if (stage === "idle") return null;

  const maskId = `${idBase}-mask`;
  const fillId = `${idBase}-fill`;

  return (
    <div className={`camera-iris camera-iris--${stage}`} aria-hidden="true">
      <svg className="camera-iris-svg">
        <defs>
          <radialGradient id={fillId} cx="50%" cy="50%" r="75%">
            <stop offset="0%" stopColor="#1c232b" />
            <stop offset="55%" stopColor="#12161c" />
            <stop offset="100%" stopColor="#05070a" />
          </radialGradient>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
            <rect x="0" y="0" width="100%" height="100%" fill="#ffffff" />
            <circle className="camera-iris-hole" cx="50%" cy="50%" r="75%" fill="#000000" />
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill={`url(#${fillId})`} mask={`url(#${maskId})`} />
        <circle
          className="camera-iris-hole camera-iris-ring"
          cx="50%"
          cy="50%"
          r="75%"
          fill="none"
          stroke="#35c3db"
          strokeWidth="2.5"
        />
      </svg>
      <div className="camera-iris-blades" />
      <div className="camera-iris-flash" />
      <span className="camera-iris-corner camera-iris-corner--tl" />
      <span className="camera-iris-corner camera-iris-corner--tr" />
      <span className="camera-iris-corner camera-iris-corner--bl" />
      <span className="camera-iris-corner camera-iris-corner--br" />
    </div>
  );
}

/* ---------- Mii-scatter transition (About Me channel only) ---------- */
// Perf note: this used to be a fixed 30x30 (900-node) grid on every device,
// including phones - which are exactly the devices least able to afford
// 900 individually-animated <img> elements. Desktop gets the full 16x13
// (208-node) density; mobile gets a lighter 9x8 (72-node) grid instead,
// sized up via CSS (see .mii-pop--compact in DiscChannel.css) to still
// fully cover a phone screen. The per-node stagger step is derived from
// the count so the overall in/out duration - and therefore the visual
// timing/feel - stays about the same on both.
const MII_POP_TARGET_SPREAD_MS = 890; // matches the original 900-node timing
const MII_POP_DURATION_IN = 260;
const MII_POP_DURATION_OUT = 220;
const MII_POP_HOLD_MS = 1000;

const getMiiPopConfig = (isMobile) => {
  const cols = isMobile ? 9 : 16;
  const rows = isMobile ? 8 : 13;
  const count = cols * rows;
  const stepIn = MII_POP_TARGET_SPREAD_MS / (count - 1);
  const stepOut = stepIn;
  return {
    cols,
    rows,
    count,
    stepIn,
    stepOut,
    inMs: (count - 1) * stepIn + MII_POP_DURATION_IN + 40,
    outMs: (count - 1) * stepOut + MII_POP_DURATION_OUT + 40,
  };
};

function MiiPopulateTransition({ active, isMobile, onCovered, onDone }) {
  const [stage, setStage] = React.useState("idle");
  const timeoutsRef = React.useRef([]);
  const firedRef = React.useRef(false);

  const cfg = React.useMemo(() => getMiiPopConfig(isMobile), [isMobile]);

  const miis = React.useMemo(() => {
    const { cols, rows, count, stepIn, stepOut } = cfg;
    const indices = Array.from({ length: count }, (_, i) => i);
    for (let i = count - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    return Array.from({ length: count }).map((_, i) => {
      const orderIndex = indices.indexOf(i);
      const col = i % cols;
      const row = Math.floor(i / cols);

      const baseX = (col / (cols - 1)) * 118 - 9; 
      const baseY = (row / (rows - 1)) * 118 - 9; 

      const jitterX = (Math.random() - 0.5) * 5;
      const jitterY = (Math.random() - 0.5) * 5;

      return {
        id: i,
        x: baseX + jitterX,
        y: baseY + jitterY,
        rot: Math.round(Math.random() * 80 - 40),
        scale: 1.1 + Math.random() * 0.7,
        delayIn: orderIndex * stepIn,
        delayOut: Math.round(orderIndex * stepOut + Math.random() * 3),
        bobDelay: Math.round(Math.random() * 900),
        zIndex: orderIndex, 
      };
    }).sort((a, b) => a.zIndex - b.zIndex); 
  }, [cfg]);

  React.useEffect(() => {
    if (!active || firedRef.current) return undefined;
    firedRef.current = true;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      onCovered?.();
      onDone?.();
      firedRef.current = false;
      return undefined;
    }

    setStage("in");
    timeoutsRef.current.push(
      setTimeout(() => {
        setStage("hold");
        onCovered?.();
      }, cfg.inMs),
      setTimeout(() => setStage("out"), cfg.inMs + MII_POP_HOLD_MS),
      setTimeout(() => {
        setStage("idle");
        firedRef.current = false;
        onDone?.();
      }, cfg.inMs + MII_POP_HOLD_MS + cfg.outMs)
    );

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, [active, cfg]);

  if (stage === "idle") return null;

  const activeModifierClass = stage === "out" ? "mii-pop--out" : "mii-pop--in";

  return (
    <div className={`mii-pop ${activeModifierClass} ${isMobile ? "mii-pop--compact" : ""}`} aria-hidden="true">
      <div className="mii-pop-backdrop" />
      <div className="mii-pop-field">
        {miis.map((m) => (
          <img
            key={m.id}
            src={miiImg}
            alt=""
            draggable={false}
            className="mii-pop-mii"
            style={{
              left: `${m.x}%`,
              top: `${m.y}%`,
              zIndex: m.zIndex,
              "--rot": `${m.rot}deg`,
              "--end-scale": m.scale,
              "--delay-in": `${m.delayIn}ms`,
              "--delay-out": `${m.delayOut}ms`,
              "--bob-delay": `${m.bobDelay}ms`,
              "--pop-duration-in": `${MII_POP_DURATION_IN}ms`,
              "--pop-duration-out": `${MII_POP_DURATION_OUT}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   SMOOTH SYMMETRICAL WAVE PIXEL-DISSOLVE (Portfolio channel)
   ============================================================ */
// Perf note: this used to be a 50x28 (1400-node) grid, with each cell
// running its own `filter: brightness()` keyframe animation. `filter` can't
// be cheaply composited the way `transform`/`opacity` can - the browser has
// to rasterize every single one of those 1400 elements as its own paint
// layer, every time the Portfolio channel opened or closed. That was the
// single most expensive thing happening anywhere in the app. Dropping to
// 24x14 (336 nodes, a ~4x reduction) plus removing the per-cell `filter`
// animation (see DiscChannel.css) keeps the same 8-bit dissolve look at a
// fraction of the cost. Timing is unaffected since delays are based on each
// cell's normalized distance from center, not the total cell count.
const PIXEL_COLS = 24;
const PIXEL_ROWS = 14;
const WAVE_DURATION_MS = 800;
const CELL_ANIM_MS = 200;
const HOLD_MS = 250;          // minimum hold once fully covered
const MAX_HOLD_MS = 4500;     // safety cap so we never wait forever on `ready`

const PIXEL_PALETTE = [
  "#10f868", "#ff0056", "#8861fc", "#a61751",
  "#f7f79a", "#4b8c88", "#36262f",
];

// `ready` (default true) lets a caller hold the fully-covered "hold" stage
// open past the minimum HOLD_MS until whatever is being revealed underneath
// (e.g. a slow-loading game iframe) is actually ready - so the wipe's own
// "out" dissolve is what reveals it, instead of the content popping in on
// its own schedule sometime after the wipe has already finished.
function PixelWipeTransition({ active, ready = true, onCovered, onDone }) {
  const [stage, setStage] = React.useState("idle");
  const firedRef = React.useRef(false);
  const holdStartRef = React.useRef(0);
  const holdAdvancedRef = React.useRef(false);

  const cells = React.useMemo(() => {
    const list = [];
    const centerX = (PIXEL_COLS - 1) / 2;
    const centerY = (PIXEL_ROWS - 1) / 2;
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

    for (let row = 0; row < PIXEL_ROWS; row++) {
      for (let col = 0; col < PIXEL_COLS; col++) {
        const dx = col - centerX;
        const dy = row - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy) / maxDist;

        const jitter = (Math.random() - 0.5) * 0.04;
        const distClamped = Math.min(1, Math.max(0, distance + jitter));

        const delayIn = distClamped * WAVE_DURATION_MS;
        const delayOut = (1 - distClamped) * WAVE_DURATION_MS;

        const color = PIXEL_PALETTE[(row + col) % PIXEL_PALETTE.length];

        list.push({
          id: `${row}-${col}`,
          color,
          delayIn: `${delayIn}ms`,
          delayOut: `${delayOut}ms`,
        });
      }
    }
    return list;
  }, []);

  // Kick off the wipe when `active` flips true.
  React.useEffect(() => {
    if (!active || firedRef.current) return undefined;
    firedRef.current = true;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      onCovered?.();
      onDone?.();
      firedRef.current = false;
      return undefined;
    }

    setStage("in");
    return undefined;
  }, [active]);

  // in -> hold: fixed duration, screen becomes fully covered.
  React.useEffect(() => {
    if (stage !== "in") return undefined;
    const t = setTimeout(() => {
      setStage("hold");
      onCovered?.();
    }, WAVE_DURATION_MS + CELL_ANIM_MS);
    return () => clearTimeout(t);
  }, [stage]);

  // hold -> out: waits for `ready` (bounded by HOLD_MS..MAX_HOLD_MS) so the
  // dissolve-out only starts once whatever's underneath actually has
  // something to show - anchored to when hold began so `ready` flipping
  // mid-wait doesn't restart the clock.
  React.useEffect(() => {
    if (stage !== "hold") return undefined;
    holdStartRef.current = Date.now();
    holdAdvancedRef.current = false;

    const maxTimer = setTimeout(() => {
      if (!holdAdvancedRef.current) {
        holdAdvancedRef.current = true;
        setStage("out");
      }
    }, MAX_HOLD_MS);

    return () => clearTimeout(maxTimer);
  }, [stage]);

  React.useEffect(() => {
    if (stage !== "hold" || holdAdvancedRef.current || !ready) return undefined;
    const elapsed = Date.now() - holdStartRef.current;
    const remaining = Math.max(0, HOLD_MS - elapsed);
    const t = setTimeout(() => {
      if (!holdAdvancedRef.current) {
        holdAdvancedRef.current = true;
        setStage("out");
      }
    }, remaining);
    return () => clearTimeout(t);
  }, [stage, ready]);

  // out -> idle: fixed duration, mirrors the "in" dissolve.
  React.useEffect(() => {
    if (stage !== "out") return undefined;
    const t = setTimeout(() => {
      setStage("idle");
      firedRef.current = false;
      onDone?.();
    }, WAVE_DURATION_MS + CELL_ANIM_MS);
    return () => clearTimeout(t);
  }, [stage]);

  if (stage === "idle") return null;

  return (
    <div className={`pixel-wipe pixel-wipe--${stage}`} aria-hidden="true">
      <div className="pixel-wipe-grid">
        {cells.map((c) => (
          <div
            key={c.id}
            className="pixel-cell"
            style={{
              backgroundColor: c.color,
              "--delay-in": c.delayIn,
              "--delay-out": c.delayOut,
            }}
          />
        ))}
      </div>
      <div className="pixel-wipe-scanbar" />
      <div className="pixel-wipe-scanlines" />
      <div className="pixel-wipe-vignette" />
    </div>
  );
}

/* ---------- HOME Menu overlay ---------- */
function HomeMenuOverlay({ onClose, onGoToMenu }) {
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      const isEscape = 
        e.key === 'Escape' || 
        e.keyCode === 27 || 
        e.code === 'Escape';
      
      if (isEscape) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  return (
    <div className="wii-home-overlay" role="dialog" aria-modal="true" aria-label="HOME Menu">
      <div className="wii-home-bar wii-home-bar--top">
        <span className="wii-home-title">HOME Menu</span>
        <button type="button" className="wii-home-close-btn" onClick={onClose}>
          <span className="wii-home-close-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3.5 3.5 10.5V20.5H9.5V14.5H14.5V20.5H20.5V10.5Z" />
            </svg>
          </span>
          Close
        </button>
      </div>

      <div className="wii-home-center">
        <button type="button" className="wii-home-menu-btn" onClick={onGoToMenu}>
          Menu
        </button>
      </div>

      <div className="wii-home-bar wii-home-bar--bottom" />
    </div>
  );
}

/* ---------- Main DiscChannel component ---------- */
export default function DiscChannel({ originRect, closing, tileIndex, isMobilePortrait: isMobilePortraitProp, onRequestClose, onClosed }) {
  const frameRef = React.useRef(null);
  const backdropRef = React.useRef(null);
  const animationFrameRef = React.useRef(null);
  const isClosingRef = React.useRef(false);
  const isMountedRef = React.useRef(true);
  const gamePageRef = React.useRef(null);

  const [showStartVideo, setShowStartVideo] = React.useState(false);
  const [hasPlayedStart, setHasPlayedStart] = React.useState(false);
  const [videoLoaded, setVideoLoaded] = React.useState(false);
  const [akramPlayTrigger, setAkramPlayTrigger] = React.useState(0);
  const [akramAnimationPlayed, setAkramAnimationPlayed] = React.useState(false);
  const [akramPageVisible, setAkramPageVisible] = React.useState(false);
  const [showWipe, setShowWipe] = React.useState(false);
  const [graphicsPageVisible, setGraphicsPageVisible] = React.useState(false);
  const [showGraphicsWipe, setShowGraphicsWipe] = React.useState(false);
  const graphicsTransitionStartedRef = React.useRef(false);
  const [aboutMePageVisible, setAboutMePageVisible] = React.useState(false);
  const [showAboutMeWipe, setShowAboutMeWipe] = React.useState(false);
  const aboutMeTransitionStartedRef = React.useRef(false);
  const [gamePageVisible, setGamePageVisible] = React.useState(false);
  const [showGameWipe, setShowGameWipe] = React.useState(false);
  const gameTransitionStartedRef = React.useRef(false);
  const [previewHidden, setPreviewHidden] = React.useState(false);
  const [gamePageRevealed, setGamePageRevealed] = React.useState(false);
  const [showHomeMenu, setShowHomeMenu] = React.useState(false);
  const videoRef = React.useRef(null);

  // ---- NEW STATE: controls when GamePage component mounts ----
  const [gamePageLoaded, setGamePageLoaded] = React.useState(false);
  // Set once the Godot iframe reports it has actually loaded - lets the
  // pixel wipe hold its "fully covered" stage until there's really
  // something ready to reveal, instead of revealing on a fixed timer.
  const [gameIframeReady, setGameIframeReady] = React.useState(false);
  const handleGameIframeReady = React.useCallback(() => setGameIframeReady(true), []);

  const isMobilePortrait = isMobilePortraitProp ?? React.useMemo(
    () => window.matchMedia('(max-width: 600px) and (orientation: portrait)').matches,
    []
  );

  const isPortfolio = tileIndex === 0;
  const isAboutMe = isMobilePortrait ? tileIndex === 1 : tileIndex === 3;
  const isGraphics = isMobilePortrait ? tileIndex === 2 : tileIndex === 6;
  const isAkram = isMobilePortrait ? tileIndex === 3 : tileIndex === 10;
  const isSpecialTile = isPortfolio || isAboutMe || isGraphics || isAkram;

  React.useEffect(() => {
    if (!isSpecialTile) sound.play('noDisc');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('gamePageActive', { detail: { active: !!(isPortfolio && gamePageVisible) } })
    );
  }, [isPortfolio, gamePageVisible]);

  React.useEffect(() => {
    return () => {
      window.dispatchEvent(new CustomEvent('gamePageActive', { detail: { active: false } }));
    };
  }, []);

  const getPreviewGif = () => {
    if (isPortfolio) return portfolioGif;
    if (isAboutMe) return aboutMeGif;
    if (isGraphics) return graphicsGif;
    return null;
  };

  const getStartVideo = () => {
    if (isPortfolio) return portfolioStartMp4;
    if (isAboutMe) return aboutMeStartMp4;
    if (isGraphics) return graphicsStartMp4;
    return null;
  };

  const getTileLabel = () => {
    if (isPortfolio) return "Portfolio";
    if (isAboutMe) return "About Me";
    if (isGraphics) return "Graphics";
    if (isAkram) return "The Akram Experience";
    return "Disc Channel";
  };

  const getObjectFit = () => {
    if (isPortfolio) return 'cover';
    if (isAboutMe) return 'cover';
    if (isGraphics) return 'contain';
    return 'cover';
  };

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        videoRef.current.src = "";
      }
    };
  }, []);

  React.useEffect(() => {
    const onSubPage = (isAkram && akramPageVisible) || (isGraphics && graphicsPageVisible) || (isAboutMe && aboutMePageVisible) || (isPortfolio && gamePageVisible);
    if (!onSubPage || closing) return undefined;
    
    const handleKeyDown = (e) => {
      const isEscape = 
        e.key === 'Escape' || 
        e.keyCode === 27 || 
        e.code === 'Escape';
      
      if (isEscape) {
        e.preventDefault();
        e.stopPropagation();
        setShowHomeMenu((prev) => !prev);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isAkram, akramPageVisible, isGraphics, graphicsPageVisible, isAboutMe, aboutMePageVisible, isPortfolio, gamePageVisible, closing]);

  React.useEffect(() => {
    if (closing || (!akramPageVisible && !graphicsPageVisible && !aboutMePageVisible && !gamePageVisible)) setShowHomeMenu(false);
  }, [closing, akramPageVisible, graphicsPageVisible, aboutMePageVisible, gamePageVisible]);

  // ---- Sound loops unchanged ----
  const anyWipeActive = showWipe || showGraphicsWipe || showAboutMeWipe || showGameWipe;
  React.useEffect(() => {
    if (anyWipeActive) sound.playLoop('loading');
    else sound.stopLoop('loading');
    return () => sound.stopLoop('loading');
  }, [anyWipeActive]);

  const prevShowHomeMenuRef = React.useRef(false);
  React.useEffect(() => {
    if (showHomeMenu && !prevShowHomeMenuRef.current) sound.play('homeMenuOpen');
    else if (!showHomeMenu && prevShowHomeMenuRef.current) sound.play('homeMenuClose');
    prevShowHomeMenuRef.current = showHomeMenu;
  }, [showHomeMenu]);

  const handleAkramEscape = React.useCallback(() => {
    if (!closing && akramPageVisible) {
      setShowHomeMenu((prev) => !prev);
    }
  }, [closing, akramPageVisible]);

  const handleGraphicsEscape = React.useCallback(() => {
    if (!closing && graphicsPageVisible) {
      setShowHomeMenu((prev) => !prev);
    }
  }, [closing, graphicsPageVisible]);

  const handleAboutMeEscape = React.useCallback(() => {
    if (!closing && aboutMePageVisible) {
      setShowHomeMenu((prev) => !prev);
    }
  }, [closing, aboutMePageVisible]);

  const handleGameEscape = React.useCallback(() => {
    if (!closing && gamePageVisible) {
      setShowHomeMenu((prev) => !prev);
    }
  }, [closing, gamePageVisible]);

  // ---- Closing reset: also reset gamePageLoaded ----
  React.useEffect(() => {
    if (closing) {
      setShowStartVideo(false);
      setHasPlayedStart(false);
      setVideoLoaded(false);
      setGraphicsPageVisible(false);
      setShowGraphicsWipe(false);
      graphicsTransitionStartedRef.current = false;
      setAboutMePageVisible(false);
      setShowAboutMeWipe(false);
      aboutMeTransitionStartedRef.current = false;
      setGamePageVisible(false);
      setShowGameWipe(false);
      gameTransitionStartedRef.current = false;
      setPreviewHidden(false);
      setGamePageRevealed(false);
      setGamePageLoaded(false);           // ★
      setGameIframeReady(false);
      if (gamePageRef.current) {
        gamePageRef.current.style.pointerEvents = 'none';
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [closing]);

  // ---- Tile switch reset: also reset gamePageLoaded ----
  React.useEffect(() => {
    if (isSpecialTile) {
      setShowStartVideo(false);
      setHasPlayedStart(false);
      setVideoLoaded(false);
      if (!isAkram) {
        setAkramPlayTrigger(0);
        setAkramAnimationPlayed(false);
        setAkramPageVisible(false);
        setShowWipe(false);
      }
      if (!isGraphics) {
        setGraphicsPageVisible(false);
        setShowGraphicsWipe(false);
        graphicsTransitionStartedRef.current = false;
      }
      if (!isAboutMe) {
        setAboutMePageVisible(false);
        setShowAboutMeWipe(false);
        aboutMeTransitionStartedRef.current = false;
      }
      if (!isPortfolio) {
        setGamePageVisible(false);
        setShowGameWipe(false);
        gameTransitionStartedRef.current = false;
        setPreviewHidden(false);
        setGamePageRevealed(false);
        setGamePageLoaded(false);         // ★
        setGameIframeReady(false);
        if (gamePageRef.current) {
          gamePageRef.current.style.pointerEvents = 'none';
        }
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [tileIndex, isAkram, isGraphics, isAboutMe, isPortfolio]);

  React.useEffect(() => {
    if (isAkram) {
      setAkramPlayTrigger(0);
      setAkramAnimationPlayed(false);
      setAkramPageVisible(false);
      setShowWipe(false);
    }
  }, [isAkram]);

  React.useEffect(() => {
    if (isGraphics) {
      setGraphicsPageVisible(false);
      setShowGraphicsWipe(false);
      graphicsTransitionStartedRef.current = false;
    }
  }, [isGraphics]);

  React.useEffect(() => {
    if (isAboutMe) {
      setAboutMePageVisible(false);
      setShowAboutMeWipe(false);
      aboutMeTransitionStartedRef.current = false;
    }
  }, [isAboutMe]);

  React.useEffect(() => {
    if (isPortfolio) {
      setGamePageVisible(false);
      setShowGameWipe(false);
      gameTransitionStartedRef.current = false;
      setPreviewHidden(false);
      setGamePageRevealed(false);
      setGamePageLoaded(false);          // ★
      if (gamePageRef.current) {
        gamePageRef.current.style.pointerEvents = 'none';
      }
    }
  }, [isPortfolio]);

  /* --- Portfolio (Game) transition --- */
  React.useEffect(() => {
    if (!isPortfolio || gameTransitionStartedRef.current) return undefined;
    if (!showStartVideo || !videoLoaded) return undefined;
    const video = videoRef.current;
    if (!video) return undefined;

    const handleEnded = () => {
      if (gameTransitionStartedRef.current) return;
      gameTransitionStartedRef.current = true;
      // ★ Start the wipe and allow GamePage to mount
      setShowGameWipe(true);
      setGamePageLoaded(true);
    };

    video.addEventListener('ended', handleEnded);
    return () => video.removeEventListener('ended', handleEnded);
  }, [isPortfolio, showStartVideo, videoLoaded]);

  const handleGameWipeCovered = React.useCallback(() => {
    sound.stopLoop('loading');
    setPreviewHidden(true);
    setGamePageRevealed(true);
    setGamePageVisible(true);
  }, []);

  const handleGameWipeDone = React.useCallback(() => {
    setShowGameWipe(false);
    if (gamePageRef.current) {
      gamePageRef.current.style.pointerEvents = 'auto';
    }
  }, []);

  /* --- Graphics transition --- */
  React.useEffect(() => {
    if (!isGraphics || graphicsTransitionStartedRef.current) return undefined;
    if (!showStartVideo || !videoLoaded) return undefined;
    const video = videoRef.current;
    if (!video) return undefined;

    const handleEnded = () => {
      if (graphicsTransitionStartedRef.current) return;
      graphicsTransitionStartedRef.current = true;
      const timer = setTimeout(() => {
        if (isMountedRef.current) setShowGraphicsWipe(true);
      }, 260);
      return () => clearTimeout(timer);
    };

    video.addEventListener('ended', handleEnded);
    return () => video.removeEventListener('ended', handleEnded);
  }, [isGraphics, showStartVideo, videoLoaded]);

  const handleGraphicsWipeCovered = React.useCallback(() => {
    sound.stopLoop('loading');
    if (isMountedRef.current) setGraphicsPageVisible(true);
  }, []);

  const handleGraphicsWipeDone = React.useCallback(() => {
    if (isMountedRef.current) setShowGraphicsWipe(false);
  }, []);

  /* --- AboutMe transition --- */
  React.useEffect(() => {
    if (!isAboutMe || aboutMeTransitionStartedRef.current) return undefined;
    if (!showStartVideo || !videoLoaded) return undefined;
    const video = videoRef.current;
    if (!video) return undefined;

    const handleEnded = () => {
      if (aboutMeTransitionStartedRef.current) return;
      aboutMeTransitionStartedRef.current = true;
      const timer = setTimeout(() => {
        if (isMountedRef.current) setShowAboutMeWipe(true);
      }, 260);
      return () => clearTimeout(timer);
    };

    video.addEventListener('ended', handleEnded);
    return () => video.removeEventListener('ended', handleEnded);
  }, [isAboutMe, showStartVideo, videoLoaded]);

  const handleAboutMeWipeCovered = React.useCallback(() => {
    sound.stopLoop('loading');
    if (isMountedRef.current) setAboutMePageVisible(true);
  }, []);

  const handleAboutMeWipeDone = React.useCallback(() => {
    if (isMountedRef.current) setShowAboutMeWipe(false);
  }, []);

  /* --- Akram transition --- */
  React.useEffect(() => {
    if (akramPlayTrigger > 0) {
      const animationDuration = 6 * 350 + 600;
      const timer = setTimeout(() => {
        setAkramAnimationPlayed(true);
      }, animationDuration);
      return () => clearTimeout(timer);
    }
  }, [akramPlayTrigger]);

  React.useEffect(() => {
    if (!akramAnimationPlayed) return;
    const timer = setTimeout(() => {
      if (isMountedRef.current) setShowWipe(true);
    }, 200);
    return () => clearTimeout(timer);
  }, [akramAnimationPlayed]);

  const handleWipeCovered = React.useCallback(() => {
    sound.stopLoop('loading');
    if (isMountedRef.current) setAkramPageVisible(true);
  }, []);

  const handleWipeDone = React.useCallback(() => {
    if (isMountedRef.current) setShowWipe(false);
  }, []);

  /* --- Video autoplay & loop --- */
  React.useEffect(() => {
    if (showStartVideo && videoRef.current && videoLoaded) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(err => {
        console.warn('Video autoplay failed:', err);
      });
    }
  }, [showStartVideo, videoLoaded]);

  React.useEffect(() => {
    if (isSpecialTile && videoRef.current) {
      videoRef.current.preload = 'auto';
      videoRef.current.load();
    }
  }, [isSpecialTile]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !showStartVideo || !videoLoaded || isGraphics || isAboutMe || isPortfolio) return;

    const handleTimeUpdate = () => {
      if (video.ended || (video.duration > 0 && video.currentTime >= video.duration - 0.1)) {
        video.currentTime = Math.max(0, video.duration - 0.05);
        video.pause();
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [showStartVideo, videoLoaded, isGraphics, isAboutMe, isPortfolio]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !showStartVideo || !videoLoaded || isGraphics || isAboutMe || isPortfolio) return;
    if (video.ended) {
      const duration = video.duration || 0;
      video.currentTime = Math.max(0, duration - 0.05);
      video.pause();
    }
  }, [showStartVideo, videoLoaded, isGraphics, isAboutMe, isPortfolio]);

  /* --- Open/close animations --- */
  React.useLayoutEffect(() => {
    const el = frameRef.current;
    const backdrop = backdropRef.current;
    if (!el || !originRect || !isMountedRef.current) return;

    isClosingRef.current = false;

    el.style.transition = "none";
    el.style.transform = "none";
    el.style.opacity = "1";
    el.style.display = "block";
    el.style.pointerEvents = "auto";
    
    const restRect = el.getBoundingClientRect();

    const scaleX = originRect.width / restRect.width;
    const scaleY = originRect.height / restRect.height;
    const translateX = originRect.left + originRect.width / 2 - (restRect.left + restRect.width / 2);
    const translateY = originRect.top + originRect.height / 2 - (restRect.top + restRect.height / 2);

    el.style.transformOrigin = "center";
    el.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
    el.style.borderRadius = TILE_RADIUS;
    el.style.opacity = "0.65";

    if (backdrop) {
      backdrop.style.transition = "none";
      backdrop.style.opacity = "0";
      backdrop.style.display = "block";
      backdrop.style.pointerEvents = "auto";
    }

    void el.getBoundingClientRect();

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      if (!isMountedRef.current) return;
      
      el.style.transition = `transform ${DURATION}ms ${EASE}, border-radius ${DURATION}ms ${EASE}, opacity ${Math.round(DURATION * 0.6)}ms ease`;
      el.style.transform = "translate(0px, 0px) scale(1, 1)";
      el.style.borderRadius = "";
      el.style.opacity = "1";

      if (backdrop) {
        backdrop.style.transition = `opacity ${DURATION}ms ease`;
        backdrop.style.opacity = "1";
      }
    });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [originRect]);

  React.useEffect(() => {
    const el = frameRef.current;
    const backdrop = backdropRef.current;
    
    if (!closing || !el || !originRect || isClosingRef.current || !isMountedRef.current) {
      return;
    }

    isClosingRef.current = true;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    el.style.pointerEvents = "none";
    if (backdrop) {
      backdrop.style.pointerEvents = "none";
    }

    void el.getBoundingClientRect();

    const restRect = el.getBoundingClientRect();

    const scaleX = originRect.width / restRect.width;
    const scaleY = originRect.height / restRect.height;
    const translateX = originRect.left + originRect.width / 2 - (restRect.left + restRect.width / 2);
    const translateY = originRect.top + originRect.height / 2 - (restRect.top + restRect.height / 2);

    void el.getBoundingClientRect();

    animationFrameRef.current = requestAnimationFrame(() => {
      if (!isMountedRef.current) return;
      
      el.style.transition = `transform ${DURATION}ms ${EASE}, border-radius ${DURATION}ms ${EASE}, opacity ${DURATION}ms ease`;
      el.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
      el.style.borderRadius = TILE_RADIUS;
      el.style.opacity = "0";

      if (backdrop) {
        backdrop.style.transition = `opacity ${DURATION}ms ease`;
        backdrop.style.opacity = "0";
      }
    });

    const timeoutId = setTimeout(() => {
      if (!isMountedRef.current) return;
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      if (el) {
        el.style.display = "none";
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
      }
      if (backdrop) {
        backdrop.style.display = "none";
        backdrop.style.opacity = "0";
        backdrop.style.pointerEvents = "none";
      }
      
      onClosed?.();
    }, DURATION + 50);

    return () => {
      clearTimeout(timeoutId);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [closing, originRect, onClosed]);

  /* --- Start button logic --- */
  const handleStartClick = () => {
    if (closing || !isSpecialTile) return;
    if (isAkram) {
      if (!akramAnimationPlayed) {
        sound.play('start');
        setAkramPlayTrigger((t) => t + 1);
      }
      return;
    }
    if (hasPlayedStart) return;
    sound.play('start');
    setShowStartVideo(true);
    setHasPlayedStart(true);
  };

  const handleVideoLoaded = () => {
    setVideoLoaded(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(err => {
        console.warn('Video play failed:', err);
      });
    }
  };

  const handleVideoEnded = () => {
    if (videoRef.current && !isGraphics && !isAboutMe && !isPortfolio) {
      const duration = videoRef.current.duration || 0;
      videoRef.current.currentTime = Math.max(0, duration - 0.05);
      videoRef.current.pause();
    }
  };

  const previewGif = getPreviewGif();
  const startVideo = getStartVideo();
  const tileLabel = getTileLabel();
  const objectFit = getObjectFit();

  const isStartDisabled = () => {
    if (closing) return true;
    if (!isSpecialTile) return true;
    if (isAkram) {
      return akramAnimationPlayed || akramPlayTrigger > 0;
    }
    return hasPlayedStart;
  };

  const isStartEnabled = isSpecialTile && !isStartDisabled();

  /* --- Render content --- */
  const renderContent = () => {
    if (isPortfolio) {
      return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 'clamp(64px, 13%, 104px)',
              left: 0,
              right: 0,
              overflow: 'hidden',
              background: '#000',
              opacity: previewHidden ? 0 : 1,
              pointerEvents: 'none',
              transition: showGameWipe ? 'none' : 'opacity 350ms ease',
            }}
          >
            <img
              src={previewGif}
              alt={tileLabel}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: objectFit,
                display: 'block',
                opacity: showStartVideo && videoLoaded ? 0 : 1,
                transition: 'opacity 0.5s ease',
                zIndex: 1,
              }}
            />
            <video
              ref={videoRef}
              src={startVideo}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: objectFit,
                display: 'block',
                opacity: showStartVideo && videoLoaded ? 1 : 0,
                transition: 'opacity 0.5s ease',
                zIndex: 2,
              }}
              playsInline
              muted={false}
              controls={false}
              loop={false}
              autoPlay={false}
              onLoadedData={handleVideoLoaded}
              onEnded={handleVideoEnded}
              preload="auto"
            />
          </div>

          {/* GamePage – only mounts after gamePageLoaded is true */}
          <div
            ref={gamePageRef}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: gamePageRevealed ? 1 : 0,
              pointerEvents: 'none',
              transition: showGameWipe ? 'none' : 'opacity 350ms ease',
              zIndex: 1,
            }}
          >
            {gamePageLoaded && (
              <GamePage onGoBack={onRequestClose} onEscape={handleGameEscape} onGameReady={handleGameIframeReady} />
            )}
          </div>

          <PixelWipeTransition
            active={showGameWipe}
            ready={gameIframeReady}
            onCovered={handleGameWipeCovered}
            onDone={handleGameWipeDone}
          />
        </div>
      );
    } else if (isAboutMe) {
      return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 'clamp(64px, 13%, 104px)',
              left: 0,
              right: 0,
              overflow: 'hidden',
              background: '#000',
              opacity: aboutMePageVisible ? 0 : 1,
              pointerEvents: aboutMePageVisible ? 'none' : 'auto',
              transition: showAboutMeWipe ? 'none' : 'opacity 350ms ease',
            }}
          >
            <img
              src={previewGif}
              alt={tileLabel}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: objectFit,
                display: 'block',
                opacity: showStartVideo && videoLoaded ? 0 : 1,
                transition: 'opacity 0.5s ease',
                zIndex: 1,
              }}
            />
            <video
              ref={videoRef}
              src={startVideo}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: objectFit,
                display: 'block',
                opacity: showStartVideo && videoLoaded ? 1 : 0,
                transition: 'opacity 0.5s ease',
                zIndex: 2,
              }}
              playsInline
              muted={false}
              controls={false}
              loop={false}
              autoPlay={false}
              onLoadedData={handleVideoLoaded}
              onEnded={handleVideoEnded}
              preload="auto"
            />
          </div>

          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: aboutMePageVisible ? 1 : 0,
              pointerEvents: aboutMePageVisible ? 'auto' : 'none',
              transition: showAboutMeWipe ? 'none' : 'opacity 350ms ease',
            }}
          >
            {aboutMePageVisible && (
              <AboutMePage onGoBack={onRequestClose} onEscape={handleAboutMeEscape} />
            )}
          </div>

          <MiiPopulateTransition
            active={showAboutMeWipe}
            isMobile={isMobilePortrait}
            onCovered={handleAboutMeWipeCovered}
            onDone={handleAboutMeWipeDone}
          />
        </div>
      );
    } else if (isGraphics) {
      return (
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: graphicsPageVisible ? 0 : 1,
              pointerEvents: graphicsPageVisible ? "none" : "auto",
              transition: showGraphicsWipe ? "none" : "opacity 350ms ease",
            }}
          >
            <div className="graphics-view">
              <div className="graphics-grid-bg" />

              <div className="graphics-frame-outer">
                <div className="graphics-frame-inner">
                  <div className="graphics-frame-border-ring" />
                  <div className="graphics-frame-inner-shadow" />
                  <div className="graphics-frame-corner graphics-frame-corner--tl" />
                  <div className="graphics-frame-corner graphics-frame-corner--tr" />
                  <div className="graphics-frame-corner graphics-frame-corner--bl" />
                  <div className="graphics-frame-corner graphics-frame-corner--br" />
                  <div className="graphics-frame-glow" />

                  <div className="graphics-content">
                    <div className="graphics-content-glow" />

                    <img
                      src={previewGif}
                      alt={tileLabel}
                      className="graphics-content-media"
                      style={{
                        objectFit: objectFit,
                        opacity: showStartVideo && videoLoaded ? 0 : 1,
                      }}
                    />
                    <video
                      ref={videoRef}
                      src={startVideo}
                      className="graphics-content-media graphics-content-video"
                      style={{
                        objectFit: objectFit,
                        opacity: showStartVideo && videoLoaded ? 1 : 0,
                      }}
                      playsInline
                      muted={false}
                      controls={false}
                      loop={false}
                      autoPlay={false}
                      onLoadedData={handleVideoLoaded}
                      onEnded={handleVideoEnded}
                      preload="auto"
                    />
                  </div>

                  <div className="graphics-frame-outer-glow" />
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: graphicsPageVisible ? 1 : 0,
              pointerEvents: graphicsPageVisible ? "auto" : "none",
              transition: showGraphicsWipe ? "none" : "opacity 350ms ease",
            }}
          >
            {graphicsPageVisible && (
              <GraphicsPage onGoBack={onRequestClose} onEscape={handleGraphicsEscape} />
            )}
          </div>

          <CameraApertureTransition
            active={showGraphicsWipe}
            onCovered={handleGraphicsWipeCovered}
            onDone={handleGraphicsWipeDone}
          />
        </div>
      );
    } else if (isAkram) {
      return (
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: akramPageVisible ? 0 : 'clamp(64px, 13%, 104px)',
            left: 0,
            right: 0,
            overflow: 'hidden',
            background: '#eef0f2',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: akramPageVisible ? 0 : 1,
              pointerEvents: akramPageVisible ? 'none' : 'auto',
              transition: showWipe ? 'none' : 'opacity 350ms ease',
            }}
          >
            <AkramExpandedArt playTrigger={akramPlayTrigger} />
          </div>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: akramPageVisible ? 1 : 0,
              pointerEvents: akramPageVisible ? 'auto' : 'none',
              transition: showWipe ? 'none' : 'opacity 350ms ease',
            }}
          >
            {akramPageVisible && (
              <AkramPage 
                onGoBack={onRequestClose} 
                onEscape={handleAkramEscape} 
              />
            )}
          </div>

          <WiiWipeTransition
            active={showWipe}
            onCovered={handleWipeCovered}
            onDone={handleWipeDone}
          />
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div 
        className="disc-channel-backdrop" 
        ref={backdropRef}
        onClick={() => {
          if (closing) return;
          sound.play('back');
          onRequestClose?.();
        }}
      />
      <div 
        className="disc-channel-frame" 
        ref={frameRef}
        role="dialog" 
        aria-label={tileLabel}
      >
        <div className="disc-channel-scanlines" />
        <div className="disc-channel-vignette" />

        {isSpecialTile ? (
          renderContent()
        ) : (
          <>
            <div className="disc-channel-header">
              <svg
                className="disc-channel-swoosh"
                viewBox="0 0 1000 160"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="discHeaderGrad" x1="0" y1="0" x2="0.7" y2="1">
                    <stop offset="0%" stopColor="#a7e8f2" />
                    <stop offset="45%" stopColor="#4fc7de" />
                    <stop offset="100%" stopColor="#2bb3cf" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,0 L1000,0 L1000,64 C760,64 730,160 500,160 L0,160 Z"
                  fill="url(#discHeaderGrad)"
                />
              </svg>
              <span className="disc-channel-title"></span>
            </div>

            <button 
              className="disc-channel-arrow disc-channel-arrow--left" 
              type="button" 
              aria-label="Previous disc"
              disabled={closing}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <polygon points="17,3 17,21 5,12" />
              </svg>
            </button>
            <button 
              className="disc-channel-arrow disc-channel-arrow--right" 
              type="button" 
              aria-label="Next disc"
              disabled={closing}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <polygon points="7,3 7,21 19,12" />
              </svg>
            </button>

            <div className="disc-channel-body">
              <div className="disc-channel-slot" aria-hidden="true" />
              <p className="disc-channel-message">Please insert a disc.</p>
            </div>
          </>
        )}

        <div
          className={`disc-channel-bottombar ${
            (isAkram && akramPageVisible) || (isGraphics && graphicsPageVisible) || (isAboutMe && aboutMePageVisible) || (isPortfolio && gamePageVisible) ? "disc-channel-bottombar--hidden" : ""
          }`}
        >
          <button
            className="disc-channel-btn disc-channel-btn--menu"
            type="button"
            onClick={() => {
              if (closing) return;
              sound.play('back');
              onRequestClose?.();
            }}
            disabled={closing}
          >
            {isSpecialTile ? "Back" : "Menu"}
          </button>
          <button 
            className="disc-channel-btn disc-channel-btn--start" 
            type="button" 
            disabled={isStartDisabled()}
            onClick={handleStartClick}
            style={isStartEnabled ? {
              background: '#35c3db',
              color: '#ffffff',
              boxShadow: '0 0 0 3px #35c3db, 0 4px 10px rgba(53, 195, 219, 0.3)'
            } : isSpecialTile ? {
              background: '#8a8c92',
              color: '#ffffff',
              boxShadow: '0 0 0 3px #8a8c92, 0 4px 10px rgba(138, 140, 146, 0.3)'
            } : {}}
          >
            Start
          </button>
        </div>
      </div>

      {showHomeMenu && (
        <HomeMenuOverlay
          onClose={() => setShowHomeMenu(false)}
          onGoToMenu={() => {
            setShowHomeMenu(false);
            onRequestClose?.();
          }}
        />
      )}
    </>
  );
}