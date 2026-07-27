/* App.jsx */
import React from "react";
import "./App.css";
import DiscChannel from "./Discchannel";

export default () => {
  const [now, setNow] = React.useState(new Date());
  const [cursorRotation, setCursorRotation] = React.useState(0);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [middlePressed, setMiddlePressed] = React.useState(false);
  const [channelOpen, setChannelOpen] = React.useState(false);
  const [channelClosing, setChannelClosing] = React.useState(false);
  const [originRect, setOriginRect] = React.useState(null);
  const [tilesEnabled, setTilesEnabled] = React.useState(true);
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

  // Track mouse position for custom cursor
  React.useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + 'px';
        cursorRef.current.style.top = e.clientY + 'px';
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

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;

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

  return (
    <div className="wii-screen">
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
            <div className="tile-watermark" />
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
            aria-label="Open Wii menu"
          >
            <span className="wii-orb-label">Wii</span>
          </button>

          <div className="clock-time">{timeStr}</div>
          <div className="clock-date">{dateStr}</div>

          <button 
            className="wii-orb wii-orb--right" 
            type="button" 
            aria-label="Open messages"
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
    </div>
  );
};