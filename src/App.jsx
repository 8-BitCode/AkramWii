/* App.jsx */
import React from "react";
import "./App.css";
import DiscChannel from "./Discchannel";
import MailPopup from "./Mailpopup";
import SettingsPanel from "./Settingspanel";
import aboutMeGif from "./Assets/Aboutmepreview.gif";
import graphicsGif from "./Assets/Graphicspreviewtile.gif";
import portfolioGif from "./Assets/Portfoliopreview.gif";
import experiencePreview from "./Assets/Experiencepreview.gif";
import { AkramTileArt } from "./Akramart";
import sound from "./SoundManager";

// Resolved once at module load - no need to recompute this on every render.
let experiencePreviewMobile = experiencePreview;
try {
  experiencePreviewMobile = new URL('./Assets/Experiencepreviewmobile.png', import.meta.url).href;
} catch (e) {
  // fall back silently to the desktop asset
}

const DEFAULT_SETTINGS = {
  musicOn: true,
  musicVolume: 70,
  sfxOn: true,
  sfxVolume: 80,
  brightness: 100,
  clockFormat: "24",
};

const INTERACTIVE_SELECTOR =
  'button:not(:disabled), a, input[type="range"], [role="switch"], [role="button"], .wii-tile, .wii-orb, .disc-channel-arrow, .disc-channel-btn, .mail-popup-btn, .settings-toggle, .settings-segment, .settings-reset, .mail-popup-trash';
const HIT_AREA_EXPANSION = 35;

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* ---------------------------------------------------------------------
   Clock lives in its own component with its own 1s ticker.
   Previously the ticker lived in App itself, so every tick re-rendered
   the whole screen (12 tiles, bar, everything) just to update two
   strings. Isolating it means only this small subtree re-renders.
--------------------------------------------------------------------- */
const Clock = React.memo(function Clock({ clockFormat }) {
  const [now, setNow] = React.useState(() => new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const rawHours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  let timeStr;
  if (clockFormat === '12') {
    const period = rawHours >= 12 ? 'PM' : 'AM';
    const hours12 = rawHours % 12 === 0 ? 12 : rawHours % 12;
    timeStr = `${hours12}:${minutes} ${period}`;
  } else {
    timeStr = `${String(rawHours).padStart(2, '0')}:${minutes}`;
  }

  const dateStr = `${DAYS[now.getDay()]} ${now.getDate()}/${String(now.getMonth() + 1).padStart(2, '0')}`;

  const is12Hour = clockFormat === '12';
  const clockFontSize = is12Hour ? 'clamp(22px, 5.5vmin, 52px)' : 'clamp(30px, 8vmin, 76px)';
  const clockLetterSpacing = is12Hour ? 'clamp(2px, 1.5vmin, 12px)' : 'clamp(4px, 2.2vmin, 20px)';

  return (
    <>
      <div
        className="clock-time"
        style={{ fontSize: clockFontSize, letterSpacing: clockLetterSpacing }}
      >
        {timeStr}
      </div>
      <div className="clock-date">{dateStr}</div>
    </>
  );
});

/* A single tile, memoized so toggling `tilesEnabled` (or any unrelated
   App state change) doesn't force React to re-diff all 12 tiles'
   subtrees when their own props haven't changed. */
const Tile = React.memo(function Tile({ index, tilesEnabled, label, mediaSrc, graphicsBg, onClick, tileRef }) {
  return (
    <button
      ref={tileRef}
      className={`wii-tile ${tilesEnabled ? 'enabled' : 'disabled'}`}
      type="button"
      aria-label={label}
      onClick={onClick}
      data-index={index}
      disabled={!tilesEnabled}
    >
      {mediaSrc ? (
        <img
          src={mediaSrc}
          alt={label}
          className={`tile-media${graphicsBg ? ' tile-media--graphics' : ''}`}
        />
      ) : (
        <div className="tile-watermark">Akram</div>
      )}
      <div className="tile-gloss" />
    </button>
  );
});

export default () => {
  const [cursorVisible, setCursorVisible] = React.useState(false);
  const [channelOpen, setChannelOpen] = React.useState(false);
  const [channelClosing, setChannelClosing] = React.useState(false);
  const [originRect, setOriginRect] = React.useState(null);
  const [selectedTileIndex, setSelectedTileIndex] = React.useState(null);
  const [tilesEnabled, setTilesEnabled] = React.useState(true);
  const [mailOpen, setMailOpen] = React.useState(false);
  const [mailClosing, setMailClosing] = React.useState(false);
  const [mailOriginRect, setMailOriginRect] = React.useState(null);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [settingsClosing, setSettingsClosing] = React.useState(false);
  const [settingsOriginRect, setSettingsOriginRect] = React.useState(null);
  const [settings, setSettings] = React.useState(DEFAULT_SETTINGS);
  const cursorRef = React.useRef(null);
  const shiftPressedRef = React.useRef(false);
  const middlePressedRef = React.useRef(false);
  const cursorRotationRef = React.useRef(0);
  const tileRefs = React.useRef([]);
  const isMountedRef = React.useRef(true);
  const [isMobilePortrait, setIsMobilePortrait] = React.useState(
    window.matchMedia('(max-width: 600px) and (orientation: portrait)').matches
  );

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Keep the sound engine in sync with the Settings panel - everything
  // that calls sound.play()/playLoop() elsewhere in the app reads these
  // two values through the singleton, not through props/context.
  React.useEffect(() => {
    sound.setSfxEnabled(settings.sfxOn);
  }, [settings.sfxOn]);

  React.useEffect(() => {
    sound.setSfxVolume(settings.sfxVolume);
  }, [settings.sfxVolume]);

  React.useEffect(() => {
    sound.setMusicEnabled(settings.musicOn);
  }, [settings.musicOn]);

  React.useEffect(() => {
    sound.setMusicVolume(settings.musicVolume);
  }, [settings.musicVolume]);

  // Check for mobile portrait on resize
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 600px) and (orientation: portrait)');
    const handleChange = (e) => {
      setIsMobilePortrait(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // ---------------------------------------------------------------------
  // Custom cursor: position/rotation/hover-state are all applied directly
  // via refs (imperative DOM writes), never via React state. That keeps
  // mouse tracking and wheel-rotation from re-rendering the component
  // tree on every event - only the actual visual state was ever changed
  // via refs anyway, so the old React state mirroring it was pure
  // wasted re-render work.
  // ---------------------------------------------------------------------
  React.useEffect(() => {
    let rafPending = false;
    let lastClientX = 0;
    let lastClientY = 0;
    let lastTarget = null;
    let cachedInteractive = null;
    let cacheFrame = -1;
    let frame = 0;

    const isPointInInteractiveArea = (x, y) => {
      // Recompute the interactive element list + rects at most once per
      // animation frame rather than on every mousemove callback.
      if (cacheFrame !== frame) {
        cachedInteractive = document.querySelectorAll(INTERACTIVE_SELECTOR);
        cacheFrame = frame;
      }
      for (const el of cachedInteractive) {
        const rect = el.getBoundingClientRect();
        if (
          x >= rect.left - HIT_AREA_EXPANSION &&
          x <= rect.right + HIT_AREA_EXPANSION &&
          y >= rect.top - HIT_AREA_EXPANSION &&
          y <= rect.bottom + HIT_AREA_EXPANSION
        ) {
          return true;
        }
      }
      return false;
    };

    const applyFrame = () => {
      rafPending = false;
      frame++;
      if (!cursorRef.current) return;

      cursorRef.current.style.left = lastClientX + 'px';
      cursorRef.current.style.top = lastClientY + 'px';

      // GamePage owns its own regular cursor while it's on screen; everywhere
      // else (the Wii menu, DiscChannel, the HOME/pause overlay, etc.) uses
      // this custom cursor. Checking the actual element under the pointer
      // each frame is immune to DiscChannel's open/close/reveal transitions -
      // there's nothing to keep in sync, it's just "what's under the mouse".
      const overGamePage = !!lastTarget?.closest?.('.game-page');
      cursorRef.current.style.display = overGamePage ? 'none' : '';

      let isInteractive = !!lastTarget?.closest?.(INTERACTIVE_SELECTOR);
      if (!isInteractive) {
        isInteractive = isPointInInteractiveArea(lastClientX, lastClientY);
      }
      cursorRef.current.classList.toggle('grabbing', isInteractive);
    };

    const handleMouseMove = (e) => {
      lastClientX = e.clientX;
      lastClientY = e.clientY;
      lastTarget = e.target;

      if (!cursorVisible) setCursorVisible(true);

      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(applyFrame);
      }
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => document.removeEventListener('mousemove', handleMouseMove);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reveal the cursor's CSS class once, imperatively, the first time we
  // know its position (kept separate from the effect above so we don't
  // need `cursorVisible` in that effect's dependency array).
  React.useEffect(() => {
    if (cursorVisible && cursorRef.current) {
      cursorRef.current.classList.add('visible');
    }
  }, [cursorVisible]);

  // Track Shift key with ref for real-time access
  React.useEffect(() => {
    const updateRotatingClass = () => {
      if (!cursorRef.current) return;
      cursorRef.current.classList.toggle(
        'rotating',
        shiftPressedRef.current || middlePressedRef.current
      );
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Shift') {
        shiftPressedRef.current = true;
        updateRotatingClass();
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Shift') {
        shiftPressedRef.current = false;
        updateRotatingClass();
      }
    };

    const handleBlur = () => {
      shiftPressedRef.current = false;
      middlePressedRef.current = false;
      updateRotatingClass();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Middle click tracking
  React.useEffect(() => {
    const handleMouseDown = (e) => {
      if (e.button === 1) {
        e.preventDefault();
        e.stopPropagation();
        middlePressedRef.current = true;
        if (cursorRef.current) cursorRef.current.classList.add('rotating');
        document.body.style.userSelect = 'none';
      }
    };

    const handleMouseUp = (e) => {
      if (e.button === 1) {
        e.preventDefault();
        e.stopPropagation();
        middlePressedRef.current = false;
        if (!shiftPressedRef.current && cursorRef.current) {
          cursorRef.current.classList.remove('rotating');
        }
        document.body.style.userSelect = '';
      }
    };

    const handleContextMenu = (e) => {
      if (e.button === 1) {
        e.preventDefault();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Wheel scroll rotation - mutates a ref + the DOM directly, no re-render.
  React.useEffect(() => {
    const handleWheel = (e) => {
      const isShiftPressed = e.shiftKey || shiftPressedRef.current;
      if (!(isShiftPressed || middlePressedRef.current)) return;

      e.preventDefault();
      e.stopPropagation();

      const delta = e.deltaY > 0 ? 15 : -15;
      const newRotation = (cursorRotationRef.current + delta + 360) % 360;
      cursorRotationRef.current = newRotation;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(-50%, -50%) rotate(${newRotation}deg)`;
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    return () => {
      window.removeEventListener('wheel', handleWheel, { capture: true });
    };
  }, []);

  const tileCount = 12;

  const handleTileClick = React.useCallback((e, index) => {
    if (channelOpen || channelClosing) {
      e.preventDefault();
      return;
    }
    sound.play('select');
    const rect = e.currentTarget.getBoundingClientRect();
    setOriginRect(rect);
    setSelectedTileIndex(index);
    setChannelOpen(true);
    setChannelClosing(false);
    setTilesEnabled(false);
  }, [channelOpen, channelClosing]);

  const handleMailOpen = React.useCallback((e) => {
    if (mailOpen || mailClosing) return;
    sound.play('select');
    const rect = e.currentTarget.getBoundingClientRect();
    setMailOriginRect(rect);
    setMailOpen(true);
    setMailClosing(false);
  }, [mailOpen, mailClosing]);

  const handleMailClosed = React.useCallback(() => {
    if (!isMountedRef.current) return;
    setMailOpen(false);
    setMailClosing(false);
    setMailOriginRect(null);
  }, []);

  const handleSettingsOpen = React.useCallback((e) => {
    if (settingsOpen || settingsClosing) return;
    sound.play('select');
    const rect = e.currentTarget.getBoundingClientRect();
    setSettingsOriginRect(rect);
    setSettingsOpen(true);
    setSettingsClosing(false);
  }, [settingsOpen, settingsClosing]);

  const handleSettingsClosed = React.useCallback(() => {
    if (!isMountedRef.current) return;
    setSettingsOpen(false);
    setSettingsClosing(false);
    setSettingsOriginRect(null);
  }, []);

  const handleSettingChange = React.useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSettingsReset = React.useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const handleChannelClosed = React.useCallback(() => {
    if (!isMountedRef.current) return;
    setChannelOpen(false);
    setChannelClosing(false);
    setOriginRect(null);
    setSelectedTileIndex(null);
    setTilesEnabled(true);
    document.body.style.pointerEvents = '';
    document.body.style.userSelect = '';
  }, []);

  // Get the appropriate tile index for special tiles based on device
  const getSpecialTileIndex = React.useCallback((type) => {
    if (isMobilePortrait) {
      if (type === 'portfolio') return 0;
      if (type === 'aboutme') return 1;
      if (type === 'graphics') return 2;
      if (type === 'akram') return 3;
    }
    if (type === 'portfolio') return 0;
    if (type === 'aboutme') return 3;
    if (type === 'graphics') return 6;
    if (type === 'akram') return 10;
    return -1;
  }, [isMobilePortrait]);

  const portfolioIndex = getSpecialTileIndex('portfolio');
  const aboutMeIndex = getSpecialTileIndex('aboutme');
  const graphicsIndex = getSpecialTileIndex('graphics');
  const akramIndex = getSpecialTileIndex('akram');
  const akramImage = isMobilePortrait ? experiencePreviewMobile : experiencePreview;

  // Precompute each tile's label/media once per render instead of
  // branching inline inside the JSX map (same result, easier to read
  // and keeps the Tile component's props stable for memoization).
  const tiles = React.useMemo(() => {
    return Array.from({ length: tileCount }, (_, i) => {
      if (i === portfolioIndex) return { label: 'Portfolio', mediaSrc: portfolioGif };
      if (i === aboutMeIndex) return { label: 'About Me', mediaSrc: aboutMeGif };
      if (i === graphicsIndex) return { label: 'Graphics', mediaSrc: graphicsGif, graphicsBg: true };
      if (i === akramIndex) return { label: 'The Akram Experience', mediaSrc: akramImage };
      return { label: 'Empty channel slot', mediaSrc: null };
    });
  }, [portfolioIndex, aboutMeIndex, graphicsIndex, akramIndex, akramImage]);

  return (
    <div className="wii-screen" style={{ filter: `brightness(${settings.brightness}%)` }}>
      <div
        ref={cursorRef}
        className="custom-cursor"
        style={{ width: '48px', height: '48px', pointerEvents: 'none' }}
      />

      <div className="wii-grid">
        {tiles.map((t, i) => (
          <Tile
            key={i}
            index={i}
            tileRef={(el) => { tileRefs.current[i] = el; }}
            tilesEnabled={tilesEnabled}
            label={t.label}
            mediaSrc={t.mediaSrc}
            graphicsBg={t.graphicsBg}
            onClick={(e) => handleTileClick(e, i)}
          />
        ))}
      </div>

      <div className="bar-wrap">
        <svg
          className="bar-svg"
          viewBox="0 0 1000 220"
          preserveAspectRatio="none"
          role="img"
          aria-label="Decorative bar"
        >
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d3d3db"/>
              <stop offset="100%" stopColor="#d3d3db"/>
            </linearGradient>
            <linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2fc6dd"/>
              <stop offset="50%" stopColor="#3ecfe4"/>
              <stop offset="100%" stopColor="#2fc6dd"/>
            </linearGradient>
          </defs>
          <path
            d="M0,46 L200,46
               C280,46 300,140 380,140
               L620,140
               C700,140 720,46 800,46
               L1000,46
               L1000,220
               L0,220 Z"
            fill="url(#barGrad)"
          />
          <path
            className="bar-path-shadow"
            d="M0,46 L200,46
               C280,46 300,140 380,140
               L620,140
               C700,140 720,46 800,46
               L1000,46"
            fill="none"
            stroke="url(#edgeGrad)"
            strokeWidth="3.4"
            strokeLinecap="round"
          />
        </svg>

        <div className="bar-content">
          <button
            className="wii-orb wii-orb--left"
            type="button"
            aria-label="Open settings"
            onClick={handleSettingsOpen}
          >
            <svg className="settings-cog-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="3.2" />
              <path d="M19.4 13a7.4 7.4 0 0 0 0-2l1.9-1.5-2-3.4-2.3.9a7.5 7.5 0 0 0-1.7-1L14.9 3h-3.8l-.4 2.4a7.5 7.5 0 0 0-1.7 1l-2.3-.9-2 3.4L6.6 11a7.4 7.4 0 0 0 0 2l-1.9 1.5 2 3.4 2.3-.9c.5.4 1.1.8 1.7 1l.4 2.4h3.8l.4-2.4c.6-.2 1.2-.6 1.7-1l2.3.9 2-3.4z" />
            </svg>
          </button>

          <Clock clockFormat={settings.clockFormat} />

          <button
            className="wii-orb wii-orb--right"
            type="button"
            aria-label="Open messages"
            onClick={handleMailOpen}
          >
            <svg className="mail-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="2" y="5" width="20" height="14" rx="2.2" />
              <polyline points="2.5,6.5 12,14 21.5,6.5" />
            </svg>
          </button>
        </div>
      </div>

      {channelOpen && (
        <DiscChannel
          originRect={originRect}
          closing={channelClosing}
          tileIndex={selectedTileIndex}
          isMobilePortrait={isMobilePortrait}
          onRequestClose={() => setChannelClosing(true)}
          onClosed={handleChannelClosed}
        />
      )}

      {mailOpen && (
        <MailPopup
          originRect={mailOriginRect}
          closing={mailClosing}
          onRequestClose={() => setMailClosing(true)}
          onClosed={handleMailClosed}
        />
      )}

      {settingsOpen && (
        <SettingsPanel
          originRect={settingsOriginRect}
          closing={settingsClosing}
          settings={settings}
          onSettingChange={handleSettingChange}
          onReset={handleSettingsReset}
          onRequestClose={() => setSettingsClosing(true)}
          onClosed={handleSettingsClosed}
        />
      )}
    </div>
  );
};