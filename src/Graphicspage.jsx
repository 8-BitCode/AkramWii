/* GraphicsPage.jsx
   Photo Channel — one graphic on screen at a time, framed in a chrome bezel.
   Swipe left/right on the main photo to change it. 
   Spin the bottom 3D wheel with full multi-rotation momentum like a turntable!
*/
import React from "react";
import "./Graphicspage.css";
import sound from "./Soundmanager";

const GRAPHICS_DATA = [
  { id: 1, title: "Unics Game Jam", ext: "jpg" },
  { id: 2, title: "Dev lead Portfolio Website Workshop", ext: "gif" },
  { id: 3, title: "ASCII Computer Hoodie Design", ext: "png", bg: "#000000" },
  { id: 4, title: "Bowling Social", ext: "png" },
  { id: 5, title: "Game Development Workshop", ext: "gif" },
  { id: 6, title: "Joe Wong Live", ext: "gif" },
  { id: 7, title: "Bank of America Insight Day", ext: "png" },
  { id: 8, title: "Halloween Social", ext: "gif" },
  { id: 9, title: "UK IEPC 2025", ext: "png", bg: "#000000" },
  { id: 10, title: "Imago Software Open Positions", ext: "png" },
  { id: 11, title: "Alton Towers Trip", ext: "png" },
  { id: 12, title: "HubSpot Speaker Event", ext: "mp4" },
];

const assetModules = import.meta.glob('/src/Assets/graphic*.{jpg,png,gif,mp4}', { eager: true });
const assetMap = {};
Object.entries(assetModules).forEach(([path, module]) => {
  const filename = path.split('/').pop();
  const match = filename.match(/graphic(\d+)\.(jpg|png|gif|mp4)/i);
  if (match) {
    const id = parseInt(match[1], 10);
    assetMap[id] = module.default || module;
  }
});

function getAssetPath(id, ext) {
  if (assetMap[id]) return assetMap[id];
  return `/src/Assets/graphic${id}.${ext}`;
}

const SWIPE_THRESHOLD = 60;
const DRAG_RESISTANCE = 0.55;

export default function GraphicsPage({ onGoBack, onEscape }) {
  const total = GRAPHICS_DATA.length;
  const theta = 360 / total;

  const [absoluteIndex, setAbsoluteIndex] = React.useState(0);
  const [direction, setDirection] = React.useState('next');
  const [showHint, setShowHint] = React.useState(true);
  const [isMobile, setIsMobile] = React.useState(
    () => window.matchMedia('(max-width: 600px)').matches
  );

  const index = ((absoluteIndex % total) + total) % total;

  // Background music for this channel - swaps in on mount, hands back to
  // whatever was playing before (the Wii menu loop) on the way out.
  React.useEffect(() => {
    sound.playMusic('graphics');
    return () => sound.playMusic('wiiMenu');
  }, []);

// Fires for every navigation method - arrows, keyboard, swipe, and the
  // 3D wheel (drag, momentum-snap, or a direct thumbnail click) - since
  // they all ultimately update absoluteIndex. Skips the initial mount.
  const isFirstRenderRef = React.useRef(true);
  React.useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    // Add the volume option here to make it quieter (e.g., 0.3 for 30% volume)
    sound.play('paperTurn', { volume: 0.3 }); 
  }, [absoluteIndex]);

  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 600px)');
    const handleChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  const dragRef = React.useRef(null);
  const wheelDragRef = React.useRef(null);
  
  const dragState = React.useRef({ 
    dragging: false, 
    hasMoved: false, 
    startX: 0, 
    startY: 0,
    pointerId: null, 
    target: null,
    lastX: 0,
    lastTime: 0,
    velocity: 0
  });

  const animationFrameRef = React.useRef(null);
  const currentAngleRef = React.useRef(0);

  // Helper to extract the live rotation angle from the active DOM transform matrix during mid-animation interruptions
  const getLiveRotationY = (element) => {
    if (!element) return currentAngleRef.current;
    const style = window.getComputedStyle(element);
    const matrix = style.transform || style.webkitTransform;
    if (matrix && matrix !== 'none') {
      const values = matrix.split('(')[1].split(')')[0].split(',');
      if (values.length >= 6) {
        const a = parseFloat(values[0]);
        const b = parseFloat(values[1]);
        const angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
        return angle;
      }
    }
    return currentAngleRef.current;
  };

  // Keep track of current base angle to sync smoothly with absoluteIndex state changes
  React.useEffect(() => {
    if (!dragState.current.dragging) {
      currentAngleRef.current = -absoluteIndex * theta;
      if (wheelDragRef.current) {
        wheelDragRef.current.style.transition = 'transform 400ms cubic-bezier(0.22, 1, 0.36, 1)';
        wheelDragRef.current.style.transform = `
          translateZ(calc(-1 * var(--wheel-radius))) 
          rotateX(8deg) 
          rotateY(${currentAngleRef.current}deg)
        `;
      }
    }
  }, [absoluteIndex, theta]);

  const data = GRAPHICS_DATA[index];
  const assetPath = getAssetPath(data.id, data.ext);
  const isVideo = data.ext === 'mp4';
  const canvasColor = data.bg || '#e7e8e2';

  const goTo = React.useCallback((targetIndex) => {
    let delta = targetIndex - index;
    if (delta > total / 2) delta -= total;
    if (delta < -total / 2) delta += total;
    
    if (delta !== 0) {
      setDirection(delta > 0 ? 'next' : 'prev');
      setAbsoluteIndex(prev => prev + delta);
    }
    setShowHint(false);
  }, [index, total]);

  const goNext = React.useCallback(() => {
    setDirection('next');
    setAbsoluteIndex(prev => prev + 1);
    setShowHint(false);
  }, []);

  const goPrev = React.useCallback(() => {
    setDirection('prev');
    setAbsoluteIndex(prev => prev - 1);
    setShowHint(false);
  }, []);

  React.useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 4200);
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev]);

  const resetMainDrag = (animate) => {
    const mainEl = dragRef.current;
    if (mainEl) {
      mainEl.style.transition = animate ? 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none';
      mainEl.style.transform = 'translateX(0px)';
    }
  };

  const handlePointerDown = (target) => (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    
    // Cancel any ongoing momentum animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // If grabbing the wheel while it's mid-animation, capture its exact live coordinate offset
    if (target === 'wheel' && wheelDragRef.current) {
      currentAngleRef.current = getLiveRotationY(wheelDragRef.current);
      wheelDragRef.current.style.transition = 'none';
    }

    dragState.current = { 
      dragging: true, 
      hasMoved: false, 
      startX: e.clientX, 
      startY: e.clientY,
      pointerId: e.pointerId, 
      target,
      lastX: e.clientX,
      lastTime: performance.now(),
      velocity: 0
    };
    
    if (target === 'main' && dragRef.current) {
      dragRef.current.style.transition = 'none';
    }
    
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    const st = dragState.current;
    if (!st.dragging || st.pointerId !== e.pointerId) return;
    
    const rawDelta = e.clientX - st.startX;
    const deltaY = Math.abs(e.clientY - st.startY);

    if (Math.abs(rawDelta) > 4 || deltaY > 4) {
      st.hasMoved = true;
    }

    // Calculate instantaneous velocity for momentum throwing
    const now = performance.now();
    const dt = now - st.lastTime;
    if (dt > 0) {
      const dx = e.clientX - st.lastX;
      st.velocity = dx / dt; // pixels per millisecond
      st.lastX = e.clientX;
      st.lastTime = now;
    }

    if (st.target === 'main' && dragRef.current) {
      dragRef.current.style.transform = `translateX(${rawDelta * DRAG_RESISTANCE}px)`;
    }
    
    if (st.target === 'wheel' && wheelDragRef.current) {
      const dragAngle = rawDelta * 0.5;
      const trackingAngle = currentAngleRef.current + dragAngle;
      
      wheelDragRef.current.style.transform = `
        translateZ(calc(-1 * var(--wheel-radius))) 
        rotateX(8deg) 
        rotateY(${trackingAngle}deg)
      `;
    }
  };

  const endDrag = (e) => {
    const st = dragState.current;
    if (!st.dragging || st.pointerId !== e.pointerId) return;
    
    const rawDelta = e.clientX - st.startX;
    st.dragging = false;

    if (st.target === 'main') {
      resetMainDrag(true);
      if (rawDelta <= -SWIPE_THRESHOLD) goNext();
      else if (rawDelta >= SWIPE_THRESHOLD) goPrev();
    } 
    else if (st.target === 'wheel') {
      // Update the base angle baseline with the final dragged offset before launching momentum
      currentAngleRef.current += rawDelta * 0.5;

      // Convert pointer velocity to angular momentum velocity (degrees per frame)
      let angularVelocity = st.velocity * 16.67 * 0.6; 
      
      // If user barely moved or clicked without dragging, snap to nearest item
      if (!st.hasMoved || Math.abs(angularVelocity) < 0.5) {
        const nearestAbsIndex = Math.round(-currentAngleRef.current / theta);
        if (nearestAbsIndex !== absoluteIndex) {
          setDirection(nearestAbsIndex > absoluteIndex ? 'next' : 'prev');
          setAbsoluteIndex(nearestAbsIndex);
        } else {
          currentAngleRef.current = -absoluteIndex * theta;
          if (wheelDragRef.current) {
            wheelDragRef.current.style.transition = 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)';
            wheelDragRef.current.style.transform = `
              translateZ(calc(-1 * var(--wheel-radius))) 
              rotateX(8deg) 
              rotateY(${currentAngleRef.current}deg)
            `;
          }
        }
        return;
      }

      // Run Momentum Gliding & Spin Loop
      let lastFrameTime = performance.now();

      const momentumStep = (time) => {
        const dt = time - lastFrameTime;
        lastFrameTime = time;

        // Apply velocity to angle (adds momentum rotation around the track)
        currentAngleRef.current += angularVelocity * (dt / 16.67);

        // Apply friction decay (0.92 allows it to glide a good while before stopping)
        angularVelocity *= Math.pow(0.92, dt / 16.67);

        if (wheelDragRef.current) {
          wheelDragRef.current.style.transform = `
            translateZ(calc(-1 * var(--wheel-radius))) 
            rotateX(8deg) 
            rotateY(${currentAngleRef.current}deg)
          `;
        }

        // Keep spinning until momentum decays completely
        if (Math.abs(angularVelocity) > 0.08) {
          animationFrameRef.current = requestAnimationFrame(momentumStep);
        } else {
          // Once it slows down, gently snap to the nearest card center
          const nearestAbsIndex = Math.round(-currentAngleRef.current / theta);
          
          if (wheelDragRef.current) {
            wheelDragRef.current.style.transition = 'transform 400ms cubic-bezier(0.22, 1, 0.36, 1)';
            wheelDragRef.current.style.transform = `
              translateZ(calc(-1 * var(--wheel-radius))) 
              rotateX(8deg) 
              rotateY(${-nearestAbsIndex * theta}deg)
            `;
          }

          if (nearestAbsIndex !== absoluteIndex) {
            setDirection(nearestAbsIndex > absoluteIndex ? 'next' : 'prev');
            setAbsoluteIndex(nearestAbsIndex);
          }
        }
      };

      animationFrameRef.current = requestAnimationFrame(momentumStep);
    }
  };

  const handlePointerUp = (e) => endDrag(e);
  const handlePointerCancel = (e) => endDrag(e);

  return (
    <div className="graphics-page">
      <div className="graphics-page-bg" aria-hidden="true">
        <div className="graphics-page-grid" />
        <div className="graphics-page-scanlines" />
        <div className="graphics-page-vignette" />
      </div>

      <div className="graphics-page-header">
        <div className="graphics-page-header-content">
          <h1 className="graphics-page-title">Photo Channel</h1>
          <p className="graphics-page-subtitle">Swipe, or use the arrows, to browse</p>
        </div>
        <button
          className="graphics-page-esc"
          onClick={onEscape}
          aria-label={isMobile ? "Open Menu" : "Press ESC to open HOME Menu"}
        >
          {isMobile ? (
            <>
              <span className="graphics-page-esc-mobile-label">Menu</span>
              <svg
                className="graphics-page-esc-mobile-arrow"
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 6 15 12 9 18" />
              </svg>
            </>
          ) : (
            <>
              <span className="graphics-page-esc-key">⎋ ESC</span>
              <span className="graphics-page-esc-label">HOME Menu</span>
            </>
          )}
        </button>
      </div>

      <div className="photo-stage">
        <button
          type="button"
          className="photo-nav-arrow photo-nav-arrow--left"
          onClick={goPrev}
          aria-label="Previous graphic"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="17,3 17,21 5,12" /></svg>
        </button>

        <div
          className="photo-drag-wrap"
          ref={dragRef}
          onPointerDown={handlePointerDown('main')}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          <div key={data.id} className={`photo-frame photo-frame--enter-${direction}`}>
            <span className="photo-frame-corner photo-frame-corner--tl" aria-hidden="true" />
            <span className="photo-frame-corner photo-frame-corner--tr" aria-hidden="true" />
            <span className="photo-frame-corner photo-frame-corner--bl" aria-hidden="true" />
            <span className="photo-frame-corner photo-frame-corner--br" aria-hidden="true" />

            <div className="photo-frame-mat">
              <div className="photo-frame-canvas" style={{ background: canvasColor }}>
                {isVideo ? (
                  <video
                    key={assetPath}
                    src={assetPath}
                    className="photo-frame-media"
                    muted
                    loop
                    autoPlay
                    playsInline
                    draggable={false}
                  />
                ) : (
                  <img
                    key={assetPath}
                    src={assetPath}
                    alt={data.title}
                    className="photo-frame-media"
                    draggable={false}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="photo-nav-arrow photo-nav-arrow--right"
          onClick={goNext}
          aria-label="Next graphic"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="7,3 7,21 19,12" /></svg>
        </button>

        {showHint && (
          <div className="photo-swipe-hint" aria-hidden="true">
            <span>← swipe →</span>
          </div>
        )}
      </div>

      <div className="photo-caption">
        <h2 className="photo-caption-title">{data.title}</h2>
      </div>

      {/* 3D Wheel Container */}
      <div 
        className="photo-wheel-container"
        onPointerDown={handlePointerDown('wheel')}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <div 
          className="photo-wheel-track" 
          ref={wheelDragRef}
          style={{
            transform: `translateZ(calc(-1 * var(--wheel-radius))) rotateX(8deg) rotateY(${-absoluteIndex * theta}deg)`,
            transition: 'transform 400ms cubic-bezier(0.22, 1, 0.36, 1)'
          }}
        >
          {GRAPHICS_DATA.map((d, i) => {
            const thumbPath = getAssetPath(d.id, d.ext);
            const isThumbVideo = d.ext === 'mp4';
            const isActive = i === index;
            const thumbBg = d.bg || '#ffffff';

            return (
              <button
                key={d.id}
                type="button"
                className={`photo-wheel-item ${isActive ? 'is-active' : ''}`}
                style={{
                  transform: `rotateY(${i * theta}deg) translateZ(var(--wheel-radius))`
                }}
                onPointerUp={() => {
                  if (!dragState.current.hasMoved) {
                    goTo(i);
                  }
                }}
                aria-label={`Select ${d.title}`}
              >
                <div className="photo-wheel-item-inner" style={{ background: thumbBg }}>
                  {isThumbVideo ? (
                    <video src={thumbPath} className="photo-wheel-media" muted loop autoPlay playsInline draggable={false} />
                  ) : (
                    <img src={thumbPath} alt={d.title} className="photo-wheel-media" draggable={false} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}