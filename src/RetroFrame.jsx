import React from 'react';

// ── Palette ──
// #28B860  → gold accent (now used as the bevel highlight & pulsing light)
// #507870  → dark teal shell
// #303030  → void / deep shadow
// #10F868  → neon green (used only for the glowing halo on the pulse LED)
// ── Derived for readability ──
const LIGHT_MINT = '#e4f2e9';         // body text

const VOID        = '#303030';
const STONE       = '#507870';
const STONE_LIGHT = '#28B860';        // gold highlight (replaces neon for 3D edges)
const STONE_DARK  = '#303030';        // same as VOID
const GOLD        = '#28B860';
const NEON_GREEN  = '#10F868';

const Bolt = ({ style }) => (
  <span
    aria-hidden="true"
    style={{
      position: 'absolute',
      width: 11,
      height: 11,
      background: `conic-gradient(${STONE_LIGHT} 0deg 90deg, ${STONE} 90deg 180deg, ${STONE_DARK} 180deg 270deg, ${STONE} 270deg 360deg)`,
      boxShadow: `0 0 0 2px ${VOID}`,
      ...style,
    }}
  />
);

const RetroFrame = ({ children, thin }) => {
  const shellPad = thin ? '30px 12px 20px' : '44px 22px 28px';
  const boltInset = thin ? 8 : 12;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div
        style={{
          position: 'relative',
          padding: shellPad,
          background: STONE,
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 4px), repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 3px)',
          boxShadow: `
            inset 16px 16px 0 ${VOID},
            inset 24px 24px 55px 6px rgba(0,0,0,0.9),
            inset -8px -8px 0 ${STONE_LIGHT},   /* now gold highlight */
            inset 0 0 0 8px ${STONE_DARK},
            inset 0 0 0 11px ${VOID},
            0 10px 24px rgba(0,0,0,0.55)
          `,
        }}
      >
        <Bolt style={{ top: boltInset, left: boltInset }} />
        <Bolt style={{ top: boltInset, right: boltInset }} />
        <Bolt style={{ bottom: boltInset, left: boltInset }} />
        <Bolt style={{ bottom: boltInset, right: boltInset }} />

        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            background: VOID,
            borderStyle: 'solid',
            borderWidth: '3px',
            borderColor: `${VOID} ${STONE_LIGHT} ${STONE_LIGHT} ${VOID}`, /* gold right & bottom */
            boxShadow: `inset 0 0 0 5px ${STONE_DARK}, inset 0 0 30px rgba(0,0,0,0.8)`,
          }}
        >
          {children}

          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              backgroundImage:
                'repeating-linear-gradient(to bottom, rgba(0,0,0,0.24) 0px, rgba(0,0,0,0.24) 1px, transparent 1px, transparent 3px)',
              mixBlendMode: 'multiply',
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              boxShadow: 'inset 0 0 40px 10px rgba(0,0,0,0.55)',
            }}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            left: thin ? 12 : 20,
            right: thin ? 12 : 20,
            bottom: thin ? 6 : 9,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontFamily: "'Press Start 2P', 'Earthbound', monospace",
              fontSize: thin ? 6 : 7,
              letterSpacing: '0.5px',
              color: `rgba(228,242,233,0.6)`,   /* light mint, very readable */
            }}
          >
            {thin ? 'P1' : 'PLAYER 1'}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 7,
                height: 7,
                background: GOLD,
                boxShadow: `0 0 0 2px ${VOID}, 0 0 8px 3px rgba(16,248,104,0.85)`, /* neon green glow */
                animation: 'retroFramePulse 1.4s steps(2) infinite',
              }}
            />
            {!thin && (
              <span
                style={{
                  fontFamily: "'Press Start 2P', 'Earthbound', monospace",
                  fontSize: 6,
                  color: `rgba(228,242,233,0.6)`,
                }}
              >
                ON
              </span>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes retroFramePulse { 0%, 60% { opacity: 1; } 61%, 100% { opacity: 0.25; } }
      `}</style>
    </div>
  );
};

export default RetroFrame;