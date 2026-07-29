/* AkramArt.jsx
   Original artwork inspired by the classic Wii channel "box art" layout:
   a bright screen, a receding perspective floor, a bold wordmark, side
   nav arrows, and a pill-shaped button bar. Rebranded as
   "The Akram Experience" — no Nintendo assets, characters, or wordmarks
   are reproduced here.

   The centerpiece is a small node-based "skill tree", styled like the
   app's own Wii-style orb buttons (soft radial-gradient spheres with a
   teal ring), that unlocks one node at a time as Start is pressed.
*/
import React from "react";

const TEAL = "#35c3db";
const GREEN = "#3fb64e";
const GREEN_DARK = "#276b30";
const LOCKED_STROKE = "#b7b8bc";
const LOCKED_FILL = "#d9dbe0";

/* Skill tree layout, in abstract "units" relative to the root node.
   Multiplied by a per-context scale so the same layout works for the
   small tile thumbnail and the big expanded view. */
const NODES = [
  { label: "Core", dx: 0, dy: 0 },
  { label: "Design", dx: -1, dy: -1 },
  { label: "Code", dx: 1, dy: -1 },
  { label: "Creativity", dx: -1, dy: -2.3 },
  { label: "Speed", dx: 1, dy: -2.3 },
  { label: "Mastery", dx: 0, dy: -3.3 },
];

const EDGES = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 4],
  [3, 5],
  [4, 5],
];

/* ---------- shared perspective floor grid ---------- */
function FloorGrid({ id, width, height, horizonY, lineCount = 7 }) {
  const lines = [];
  for (let i = 1; i <= lineCount; i++) {
    const t = i / lineCount;
    const y = horizonY + (height - horizonY) * (t * t);
    const spread = 0.5 + t * 0.5;
    const x1 = width / 2 - (width / 2) * spread;
    const x2 = width / 2 + (width / 2) * spread;
    lines.push(
      <line
        key={`h-${i}`}
        x1={x1}
        y1={y}
        x2={x2}
        y2={y}
        stroke={TEAL}
        strokeOpacity={0.16 + t * 0.14}
        strokeWidth={1}
      />
    );
  }
  const verticalCount = 8;
  for (let i = 0; i <= verticalCount; i++) {
    const t = i / verticalCount;
    const topX = width * (0.32 + t * 0.36);
    const bottomX = width * (t - 0.15) * 1.3;
    lines.push(
      <line
        key={`v-${i}`}
        x1={topX}
        y1={horizonY}
        x2={bottomX}
        y2={height}
        stroke={TEAL}
        strokeOpacity={0.14}
        strokeWidth={1}
      />
    );
  }
  return (
    <g clipPath={`url(#${id}-clip)`}>
      <clipPath id={`${id}-clip`}>
        <rect x={0} y={horizonY} width={width} height={height - horizonY} />
      </clipPath>
      <rect
        x={0}
        y={horizonY}
        width={width}
        height={height - horizonY}
        fill={`url(#${id}-floorFade)`}
      />
      {lines}
    </g>
  );
}

function Sparkle({ x, y, delay = 0, size = 10 }) {
  const s = size;
  const d = `M0,-${s} L${s * 0.28},-${s * 0.28} L${s},0 L${s * 0.28},${s * 0.28} L0,${s} L-${s * 0.28},${s * 0.28} L-${s},0 L-${s * 0.28},-${s * 0.28} Z`;
  return (
    <path
      className="akram-sparkle"
      d={d}
      fill="#b6e88c"
      transform={`translate(${x} ${y})`}
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

const SPARKLE_RING = [
  { angle: -60, dist: 1.6, delay: 40, size: 8 },
  { angle: -10, dist: 1.9, delay: 120, size: 10 },
  { angle: 40, dist: 1.6, delay: 80, size: 7 },
  { angle: 110, dist: 1.8, delay: 160, size: 8 },
  { angle: 200, dist: 1.7, delay: 60, size: 6 },
];

const TREE_STYLE = `
  .akram-node-pop {
    transform-box: fill-box;
    transform-origin: center;
    animation: akram-node-pop-fx 400ms cubic-bezier(.34,1.56,.64,1) both;
  }
  @keyframes akram-node-pop-fx {
    0%   { transform: scale(0.25); opacity: 0; }
    60%  { transform: scale(1.18); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
  .akram-edge-draw {
    animation: akram-edge-draw-fx 350ms ease-out both;
  }
  @keyframes akram-edge-draw-fx {
    from { stroke-dashoffset: 100; opacity: 0.35; }
    to   { stroke-dashoffset: 0; opacity: 1; }
  }
  .akram-shockwave {
    transform-box: fill-box;
    transform-origin: center;
    animation: akram-shockwave-fx 600ms ease-out both;
  }
  @keyframes akram-shockwave-fx {
    0%   { transform: scale(0.2); opacity: 0.8; }
    100% { transform: scale(2.6); opacity: 0; }
  }
  .akram-sparkle {
    opacity: 0;
    transform-box: fill-box;
    transform-origin: center;
    animation: akram-sparkle-fx 450ms ease-out both;
  }
  @keyframes akram-sparkle-fx {
    0%   { opacity: 0; transform: scale(0.2) rotate(0deg); }
    35%  { opacity: 1; transform: scale(1.1) rotate(30deg); }
    100% { opacity: 0; transform: scale(0.5) rotate(60deg); }
  }
  /* Experience bounce animation */
  .akram-experience-bounce {
    display: inline-block;
    transform-origin: center;
    animation: akram-experience-bounce-fx 2.5s ease-in-out infinite;
  }
  @keyframes akram-experience-bounce-fx {
    0%, 100% { 
      transform: translateY(0px) scale(1);
    }
    15% {
      transform: translateY(-8px) scale(1.02);
    }
    30% {
      transform: translateY(0px) scale(1);
    }
    45% {
      transform: translateY(-5px) scale(1.01);
    }
    60% {
      transform: translateY(0px) scale(1);
    }
    80% {
      transform: translateY(-2px) scale(1);
    }
  }
`;

/* ---------- the skill tree itself ----------
   unlockedCount: how many nodes (starting from the root) are unlocked.
   newIndex: the index that just became unlocked this render (for the
   pop-in / edge-draw animation) — pass null for a static, non-animated
   render (used by the small tile thumbnail). */
function SkillTree({ x, y, unit, unlockedCount, newIndex = null, showLabels = false }) {
  const pt = (n) => ({ x: x + n.dx * unit, y: y + n.dy * unit });
  const nodeR = unit * 0.34;
  const lockedR = unit * 0.3;

  return (
    <g>
      {EDGES.map(([a, b], i) => {
        const pa = pt(NODES[a]);
        const pb = pt(NODES[b]);
        const bothUnlocked = a < unlockedCount && b < unlockedCount;
        const isNewEdge = newIndex !== null && b === newIndex && a < unlockedCount;
        return (
          <line
            key={i}
            x1={pa.x}
            y1={pa.y}
            x2={pb.x}
            y2={pb.y}
            stroke={bothUnlocked ? GREEN : "#c9ccd2"}
            strokeWidth={bothUnlocked ? unit * 0.075 : unit * 0.05}
            strokeLinecap="round"
            opacity={bothUnlocked ? 0.9 : 0.5}
            pathLength={isNewEdge ? 100 : undefined}
            strokeDasharray={
              isNewEdge ? 100 : bothUnlocked ? "none" : `${unit * 0.06} ${unit * 0.09}`
            }
            className={isNewEdge ? "akram-edge-draw" : ""}
          />
        );
      })}

      {NODES.map((n, i) => {
        const p = pt(n);
        const unlocked = i < unlockedCount;
        const isNew = i === newIndex;
        const r = unlocked ? nodeR : lockedR;
        return (
          <g key={i}>
            {isNew && (
              <circle
                className="akram-shockwave"
                cx={p.x}
                cy={p.y}
                r={r}
                fill="none"
                stroke={GREEN}
                strokeWidth={unit * 0.05}
              />
            )}
            <g className={isNew ? "akram-node-pop" : ""}>
              {unlocked && (
                <circle cx={p.x} cy={p.y} r={r * 1.7} fill={GREEN} opacity="0.14" />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={r}
                fill={unlocked ? "url(#akramNodeGrad)" : LOCKED_FILL}
                stroke={unlocked ? GREEN_DARK : LOCKED_STROKE}
                strokeWidth={unit * 0.045}
              />
              {!unlocked && (
                <text
                  x={p.x}
                  y={p.y + r * 0.34}
                  textAnchor="middle"
                  fontFamily="'WiiBold','Segoe UI',sans-serif"
                  fontWeight="700"
                  fontSize={r * 1.1}
                  fill="#9a9ba1"
                >
                  ?
                </text>
              )}
            </g>
            {showLabels && (
              <text
                x={p.x}
                y={p.y + r + unit * 0.32}
                textAnchor="middle"
                fontFamily="'WiiMedium','Segoe UI',sans-serif"
                fontSize={unit * 0.24}
                fill={unlocked ? "#3a3b3f" : "#a9aab0"}
              >
                {n.label}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

/* ---------- compact version, used as the wii-tile thumbnail ---------- */
export function AkramTileArt() {
  const W = 400;
  const H = 300;
  const horizon = H * 0.5;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="akramTileBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#f2f4f6" />
          <stop offset="100%" stopColor="#e6e9ec" />
        </linearGradient>
        <linearGradient id="akramTile-floorFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d8f3f8" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#eef7f9" stopOpacity="0.15" />
        </linearGradient>
        <radialGradient id="akramNodeGrad" cx="35%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#dcf3df" />
          <stop offset="100%" stopColor="#a9dcae" />
        </radialGradient>
      </defs>

      <rect width={W} height={H} fill="url(#akramTileBg)" />
      <FloorGrid id="akramTile" width={W} height={H} horizonY={horizon} lineCount={6} />

      <text
        x="16"
        y="26"
        fontFamily="'WiiBold','Segoe UI',sans-serif"
        fontWeight="700"
        fontSize="15"
        fill="#4c4d51"
        letterSpacing="0.3"
      >
        The Akram Experience
      </text>

      <g transform={`translate(${W - 30}, 22)`}>
        <circle r="13" fill="#ffffff" stroke={TEAL} strokeWidth="2" />
        <text
          x="0"
          y="5"
          textAnchor="middle"
          fontFamily="'WiiBold','Segoe UI',sans-serif"
          fontWeight="700"
          fontSize="13"
          fill={TEAL}
        >
          A
        </text>
      </g>

      <g transform={`translate(18, ${H * 0.52})`} fill={TEAL} opacity="0.85">
        <polygon points="17,3 17,21 5,12" />
      </g>
      <g transform={`translate(${W - 34}, ${H * 0.52})`} fill={TEAL} opacity="0.85">
        <polygon points="7,3 7,21 19,12" />
      </g>

      <SkillTree x={W / 2} y={H * 0.9} unit={26} unlockedCount={3} newIndex={null} />

      <rect x="0" y={H - 46} width={W} height="46" fill="rgba(0,0,0,0.03)" />
      <rect
        x={W / 2 - 116}
        y={H - 34}
        width="104"
        height="22"
        rx="11"
        fill="#ffffff"
        stroke={TEAL}
        strokeWidth="2"
      />
      <text
        x={W / 2 - 64}
        y={H - 19}
        textAnchor="middle"
        fontFamily="'WiiBold','Segoe UI',sans-serif"
        fontWeight="700"
        fontSize="11"
        fill="#3a3b3f"
      >
        Wii Menu
      </text>
      <rect
        x={W / 2 + 12}
        y={H - 34}
        width="104"
        height="22"
        rx="11"
        fill="#e4e5e8"
      />
      <text
        x={W / 2 + 64}
        y={H - 19}
        textAnchor="middle"
        fontFamily="'WiiBold','Segoe UI',sans-serif"
        fontWeight="700"
        fontSize="11"
        fill="#b7b8bc"
      >
        Start
      </text>
    </svg>
  );
}

/* ---------- larger version, used when the tile is opened ----------
   `playTrigger` is a counter passed down from DiscChannel: every time
   the person presses Start it increments, unlocking the next node in
   the skill tree (or, once the tree is fully unlocked, replaying a
   "fully mastered" celebration). */
export function AkramExpandedArt({ playTrigger = 0 }) {
  const W = 900;
  const H = 620;
  const horizon = H * 0.46;
  const treeX = W / 2;
  const treeY = H * 0.75;
  const unit = 68;

  // Check if we're on mobile. Previously this called matchMedia() fresh
  // on every render (allocating a new MediaQueryList each time) and never
  // updated on resize/rotation; now it's tracked with a real listener.
  const [isMobile, setIsMobile] = React.useState(
    () => window.matchMedia('(max-width: 600px)').matches
  );
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 600px)');
    const handleChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  // Track the current unlock step in the animation sequence
  const [step, setStep] = React.useState(0);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const timeoutRef = React.useRef(null);

  // When playTrigger changes, start the sequential animation
  React.useEffect(() => {
    if (playTrigger > 0 && !isAnimating) {
      // Reset and start the sequence from the beginning
      setStep(0);
      setIsAnimating(true);
    }
  }, [playTrigger]);

  // Run the animation sequence
  React.useEffect(() => {
    if (!isAnimating) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const totalNodes = NODES.length;
    const delayPerStep = 450; // ms between each node unlock

    const runStep = () => {
      setStep((prevStep) => {
        const nextStep = prevStep + 1;
        if (nextStep >= totalNodes) {
          // Animation complete - all nodes unlocked
          setIsAnimating(false);
          return totalNodes - 1; // Stay at max
        }
        // Schedule next step
        timeoutRef.current = setTimeout(runStep, delayPerStep);
        return nextStep;
      });
    };

    // Start the sequence with a small delay
    timeoutRef.current = setTimeout(runStep, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isAnimating]);

  // Reset when component unmounts or playTrigger goes back to 0
  React.useEffect(() => {
    if (playTrigger === 0) {
      setStep(0);
      setIsAnimating(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [playTrigger]);

  // unlockedCount: Core is always unlocked (index 0), plus step additional nodes
  const unlockedCount = Math.min(step + 1, NODES.length);
  // The node that just got unlocked (only show animation for the current step)
  const justUnlockedIndex = step > 0 && step < NODES.length ? step : null;
  const fullyMastered = step >= NODES.length - 1 && isAnimating === false;

  const pt = (n) => ({ x: treeX + n.dx * unit, y: treeY + n.dy * unit });
  const fxNode = justUnlockedIndex !== null ? pt(NODES[justUnlockedIndex]) : pt(NODES[NODES.length - 1]);

  // Keep titles at safe position, adjust tree and unit size for more space
  const titleY = isMobile ? H * 0.24 : H * 0.30; // Safe position
  const subtitleOffset = isMobile ? 0 : 145;
  const subtitleY = isMobile ? titleY + 38 : titleY + 44;
  const subtitleFontSize = isMobile ? 32 : 44;
  const titleFontSize = isMobile ? 40 : 60;

  // Reduced unit size and adjusted tree position for more space
  const treeUnit = unit * 0.92; // Slightly smaller tree
  const treeYAdjusted = (isMobile ? treeY * 0.90 : treeY * 0.94); // Moved up slightly

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="akramExpBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#f3f5f7" />
          <stop offset="100%" stopColor="#e4e7ea" />
        </linearGradient>
        <linearGradient id="akramExp-floorFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d8f3f8" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#eef7f9" stopOpacity="0.15" />
        </linearGradient>
        <radialGradient id="akramNodeGrad" cx="35%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#dcf3df" />
          <stop offset="100%" stopColor="#a9dcae" />
        </radialGradient>
      </defs>

      <style>{TREE_STYLE}</style>

      <rect width={W} height={H} fill="url(#akramExpBg)" />
      <FloorGrid id="akramExp" width={W} height={H} horizonY={horizon} lineCount={9} />

      <text
        x="34"
        y="46"
        fontFamily="'WiiMedium','Segoe UI',sans-serif"
        fontSize="20"
        fill="#6f7175"
        letterSpacing="0.4"
      >
        The Akram Experience
      </text>

      <text
        x={W / 2}
        y={titleY}
        textAnchor="middle"
        fontFamily="'WiiBold','Segoe UI',sans-serif"
        fontWeight="700"
        fontSize={titleFontSize}
        fill="#3a3b3f"
        letterSpacing="1"
      >
        The Akram
      </text>
      
      <text
        x={W / 2 + subtitleOffset}
        y={subtitleY}
        textAnchor="middle"
        fontFamily="'WiiLight','Segoe UI',sans-serif"
        fontStyle="italic"
        fontWeight="300"
        fontSize={subtitleFontSize}
        fill={TEAL}
        className="akram-experience-bounce"
      >
        Experience
      </text>

      <SkillTree
        x={treeX}
        y={treeYAdjusted}
        unit={treeUnit}
        unlockedCount={unlockedCount}
        newIndex={justUnlockedIndex}
        showLabels
      />

      {playTrigger > 0 && (
        <g key={`fx-${playTrigger}-${step}`}>
          {fullyMastered && (
            <circle
              className="akram-shockwave"
              cx={treeX}
              cy={treeYAdjusted + NODES[NODES.length - 1].dy * treeUnit * 0.4}
              r={treeUnit * 2.4}
              fill="none"
              stroke={GREEN}
              strokeWidth="5"
            />
          )}
          {justUnlockedIndex !== null && !fullyMastered && SPARKLE_RING.map((s, i) => {
            const rad = (s.angle * Math.PI) / 180;
            const sx = fxNode.x + Math.cos(rad) * treeUnit * s.dist * 0.6;
            const sy = fxNode.y + Math.sin(rad) * treeUnit * s.dist * 0.6;
            return <Sparkle key={i} x={sx} y={sy} delay={s.delay} size={s.size} />;
          })}
          {fullyMastered && SPARKLE_RING.map((s, i) => {
            const rad = (s.angle * Math.PI) / 180;
            const sx = fxNode.x + Math.cos(rad) * treeUnit * s.dist * 0.6;
            const sy = fxNode.y + Math.sin(rad) * treeUnit * s.dist * 0.6;
            return <Sparkle key={i} x={sx} y={sy} delay={s.delay} size={s.size} />;
          })}
        </g>
      )}
    </svg>
  );
}