/* App.jsx */
import React from "react";
import "./App.css";
import DiscChannel from "./Discchannel";
import MailPopup from "./MailPopup";
import SettingsPanel from "./SettingsPanel";

const DEFAULT_SETTINGS = {
  musicOn: true,
  musicVolume: 70,
  sfxOn: true,
  sfxVolume: 80,
  brightness: 100,
  clockFormat: "24",
};

export default () => {
  const [now, setNow] = React.useState(new Date());
  const [cursorRotation, setCursorRotation] = React.useState(0);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [middlePressed, setMiddlePressed] = React.useState(false);
  const [channelOpen, setChannelOpen] = React.useState(false);
  const [channelClosing, setChannelClosing] = React.useState(false);
  const [originRect, setOriginRect] = React.useState(null);
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
  const tileRefs = React.useRef([]);
  const isMountedRef = React.useRef(true);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Track mouse position for custom cursor with expanded grab area
  React.useEffect(() => {
    const INTERACTIVE_SELECTOR =
      'button:not(:disabled), a, input[type="range"], [role="switch"], [role="button"], .wii-tile, .wii-orb, .disc-channel-arrow, .disc-channel-btn, .mail-popup-btn, .settings-toggle, .settings-segment, .settings-reset, .mail-popup-trash';
    
    const HIT_AREA_EXPANSION = 35; // pixels to expand hit area for grab detection

    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + 'px';
        cursorRef.current.style.top = e.clientY + 'px';
        
        // First check direct hover
        const target = e.target;
        let isInteractive = !!target.closest?.(INTERACTIVE_SELECTOR);
        
        // If not directly hovering, check expanded hit area
        if (!isInteractive) {
          const interactiveElements = document.querySelectorAll(INTERACTIVE_SELECTOR);
          for (const el of interactiveElements) {
            const rect = el.getBoundingClientRect();
            const expandedRect = {
              left: rect.left - HIT_AREA_EXPANSION,
              right: rect.right + HIT_AREA_EXPANSION,
              top: rect.top - HIT_AREA_EXPANSION,
              bottom: rect.bottom + HIT_AREA_EXPANSION
            };
            if (e.clientX >= expandedRect.left && e.clientX <= expandedRect.right &&
                e.clientY >= expandedRect.top && e.clientY <= expandedRect.bottom) {
              isInteractive = true;
              break;
            }
          }
        }
        
        cursorRef.current.classList.toggle('grabbing', isInteractive);
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Show cursor after first move
  React.useEffect(() => {
    const handleFirstMove = () => {
      if (cursorRef.current) {
        cursorRef.current.classList.add('visible');
      }
      document.removeEventListener('mousemove', handleFirstMove);
    };
    document.addEventListener('mousemove', handleFirstMove);
    return () => document.removeEventListener('mousemove', handleFirstMove);
  }, []);

  // Track Shift key with ref for real-time access
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Shift') {
        shiftPressedRef.current = true;
        if (cursorRef.current) {
          cursorRef.current.classList.add('rotating');
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Shift') {
        shiftPressedRef.current = false;
        if (!middlePressed && cursorRef.current) {
          cursorRef.current.classList.remove('rotating');
        }
      }
    };

    const handleBlur = () => {
      shiftPressedRef.current = false;
      if (!middlePressed && cursorRef.current) {
        cursorRef.current.classList.remove('rotating');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [middlePressed]);

  // Middle click tracking
  React.useEffect(() => {
    const handleMouseDown = (e) => {
      if (e.button === 1) {
        e.preventDefault();
        e.stopPropagation();
        setMiddlePressed(true);
        if (cursorRef.current) {
          cursorRef.current.classList.add('rotating');
        }
        document.body.style.userSelect = 'none';
      }
    };

    const handleMouseUp = (e) => {
      if (e.button === 1) {
        e.preventDefault();
        e.stopPropagation();
        setMiddlePressed(false);
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

  // Wheel scroll rotation
  React.useEffect(() => {
    const handleWheel = (e) => {
      const isShiftPressed = e.shiftKey || shiftPressedRef.current;
      
      if (!(isShiftPressed || middlePressed)) return;

      e.preventDefault();
      e.stopPropagation();

      const delta = e.deltaY > 0 ? 15 : -15;
      setCursorRotation(prev => {
        const newRotation = (prev + delta + 360) % 360;
        if (cursorRef.current) {
          const transformValue = `translate(-50%, -50%) rotate(${newRotation}deg)`;
          cursorRef.current.style.transform = transformValue;
          cursorRef.current.style.webkitTransform = transformValue;
          cursorRef.current.style.MozTransform = transformValue;
        }
        return newRotation;
      });
    };

    window.addEventListener('wheel', handleWheel, { passive: false, capture: true });

    return () => {
      window.removeEventListener('wheel', handleWheel, { capture: true });
    };
  }, [middlePressed]);

  const rawHours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  let timeStr;
  if (settings.clockFormat === '12') {
    const period = rawHours >= 12 ? 'PM' : 'AM';
    const hours12 = rawHours % 12 === 0 ? 12 : rawHours % 12;
    timeStr = `${hours12}:${minutes} ${period}`;
  } else {
    timeStr = `${String(rawHours).padStart(2, '0')}:${minutes}`;
  }

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayStr = days[now.getDay()];
  const dateStr = `${dayStr} ${now.getDate()}/${String(now.getMonth() + 1).padStart(2, '0')}`;

  const tileCount = 12;

  const handleTileClick = React.useCallback((e, index) => {
    console.log('Tile clicked:', index, 'channelOpen:', channelOpen, 'channelClosing:', channelClosing);
    if (channelOpen || channelClosing) {
      e.preventDefault();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setOriginRect(rect);
    setChannelOpen(true);
    setChannelClosing(false);
    setTilesEnabled(false);
  }, [channelOpen, channelClosing]);

  const handleMailOpen = React.useCallback((e) => {
    if (mailOpen || mailClosing) return;
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
    console.log('Channel closed, re-enabling tiles');
    if (!isMountedRef.current) return;
    setChannelOpen(false);
    setChannelClosing(false);
    setOriginRect(null);
    setTilesEnabled(true);
    // Reset any lingering styles
    document.body.style.pointerEvents = '';
    document.body.style.userSelect = '';
  }, []);

  // Determine if we should use smaller font for 12h format
  const is12Hour = settings.clockFormat === '12';
  const clockFontSize = is12Hour ? 'clamp(22px, 5.5vmin, 52px)' : 'clamp(30px, 8vmin, 76px)';
  const clockLetterSpacing = is12Hour ? 'clamp(2px, 1.5vmin, 12px)' : 'clamp(4px, 2.2vmin, 20px)';

  return (
    <div className="wii-screen" style={{ filter: `brightness(${settings.brightness}%)` }}>
      <div 
        ref={cursorRef}
        className="custom-cursor"
        style={{
          left: mousePos.x + 'px',
          top: mousePos.y + 'px',
          transform: `translate(-50%, -50%) rotate(${cursorRotation}deg)`,
          width: '48px',
          height: '48px',
          pointerEvents: 'none'
        }}
      />

      <div className="wii-grid">
        {Array.from({ length: tileCount }).map((_, i) => (
          <button
            key={i}
            ref={(el) => {
              tileRefs.current[i] = el;
            }}
            className={`wii-tile ${tilesEnabled ? 'enabled' : 'disabled'}`}
            type="button"
            aria-label="Empty channel slot"
            onClick={(e) => handleTileClick(e, i)}
            data-index={i}
            disabled={!tilesEnabled}
          >
            <div className="tile-watermark">Akram</div>
            <div className="tile-gloss" />
          </button>
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

          <div 
            className="clock-time" 
            style={{
              fontSize: clockFontSize,
              letterSpacing: clockLetterSpacing
            }}
          >
            {timeStr}
          </div>
          <div className="clock-date">{dateStr}</div>

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
          onRequestClose={() => {
            console.log('Request close');
            setChannelClosing(true);
          }}
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