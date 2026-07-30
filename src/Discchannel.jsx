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

const DURATION = 620;
const EASE = "cubic-bezier(0.45, 0, 0.15, 1)";
const TILE_RADIUS = "12% / 16%";

/* ---------- Wii-style disc-swoosh wipe, played between the Akram
   Experience's skill-tree animation and the actual page. A big
   diagonal swoosh - same curve/gradient language as the Disc Channel
   header - sweeps across the screen, fully covers it for a beat with
   a soft flash and a scatter of sparks, then sweeps on off to reveal
   the page underneath, like a channel loading into its content. ---------- */
const WIPE_IN_MS = 460;
const WIPE_HOLD_MS = 180;
const WIPE_OUT_MS = 460;

function WiiWipeTransition({ active, onCovered, onDone }) {
  const [stage, setStage] = React.useState("idle"); // idle -> in -> hold -> out
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
    <div className={`wii-wipe wii-wipe--${stage}`} aria-hidden="true">
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

function HomeMenuOverlay({ onClose, onGoToMenu }) {
  // Handle ESC key to close the overlay - works in all browsers
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Escape key using multiple properties for cross-browser support
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
    
    // Use capture phase to ensure we catch the event
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
          Wii Menu
        </button>
      </div>

      <div className="wii-home-bar wii-home-bar--bottom" />
    </div>
  );
}

export default function DiscChannel({ originRect, closing, tileIndex, isMobilePortrait: isMobilePortraitProp, onRequestClose, onClosed }) {
  const frameRef = React.useRef(null);
  const backdropRef = React.useRef(null);
  const animationFrameRef = React.useRef(null);
  const isClosingRef = React.useRef(false);
  const isMountedRef = React.useRef(true);
  const [showStartVideo, setShowStartVideo] = React.useState(false);
  const [hasPlayedStart, setHasPlayedStart] = React.useState(false);
  const [videoLoaded, setVideoLoaded] = React.useState(false);
  const [akramPlayTrigger, setAkramPlayTrigger] = React.useState(0);
  const [akramAnimationPlayed, setAkramAnimationPlayed] = React.useState(false);
  const [akramPageVisible, setAkramPageVisible] = React.useState(false);
  const [showWipe, setShowWipe] = React.useState(false);
  const [showHomeMenu, setShowHomeMenu] = React.useState(false);
  const videoRef = React.useRef(null);

  // Prefer the value App already tracks (and updates on resize). Only
  // compute it ourselves - once, not on every render - if it wasn't passed.
  const isMobilePortrait = isMobilePortraitProp ?? React.useMemo(
    () => window.matchMedia('(max-width: 600px) and (orientation: portrait)').matches,
    []
  );

  // Check which tile is being viewed - handle both desktop and mobile indices
  const isPortfolio = tileIndex === 0; // Same on both desktop and mobile
  // About Me: index 1 on mobile, index 3 on desktop
  const isAboutMe = isMobilePortrait ? tileIndex === 1 : tileIndex === 3;
  // Graphics: index 2 on mobile, index 6 on desktop
  const isGraphics = isMobilePortrait ? tileIndex === 2 : tileIndex === 6;
  // The Akram Experience: index 3 on mobile, index 10 on desktop
  const isAkram = isMobilePortrait ? tileIndex === 3 : tileIndex === 10;
  const isSpecialTile = isPortfolio || isAboutMe || isGraphics || isAkram;

  // Get the appropriate preview GIF and start video based on tile
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

  // Cleanup on unmount
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

  // ESC key handler for the Akram page - opens HOME Menu overlay
  // FIXED: Only show the HOME Menu, don't close the channel
  React.useEffect(() => {
    if (!isAkram || !akramPageVisible || closing) return undefined;
    
    const handleKeyDown = (e) => {
      // Check for Escape key using multiple properties for cross-browser support
      const isEscape = 
        e.key === 'Escape' || 
        e.keyCode === 27 || 
        e.code === 'Escape';
      
      if (isEscape) {
        e.preventDefault();
        e.stopPropagation();
        // Toggle the HOME Menu overlay
        setShowHomeMenu((prev) => !prev);
      }
    };
    
    // Use capture phase to ensure we catch the event
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isAkram, akramPageVisible, closing]);

  // Reset if the overlay happens to still be open when this tile/dialog
  // closes, or when we're no longer actually on the Akram page.
  React.useEffect(() => {
    if (closing || !akramPageVisible) setShowHomeMenu(false);
  }, [closing, akramPageVisible]);

  // Handle ESC from the AkramPage component
  const handleAkramEscape = React.useCallback(() => {
    if (!closing && akramPageVisible) {
      setShowHomeMenu((prev) => !prev);
    }
  }, [closing, akramPageVisible]);

  // Reset states when closing
  React.useEffect(() => {
    if (closing) {
      setShowStartVideo(false);
      setHasPlayedStart(false);
      setVideoLoaded(false);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [closing]);

  // Reset video when reopening (when tileIndex changes)
  React.useEffect(() => {
    if (isSpecialTile) {
      setShowStartVideo(false);
      setHasPlayedStart(false);
      setVideoLoaded(false);
      // Reset akram states when switching to a different tile
      // but only if we're not already on the akram tile
      if (isAkram) {
        // Keep the animation state when reopening the same tile
      } else {
        setAkramPlayTrigger(0);
        setAkramAnimationPlayed(false);
        setAkramPageVisible(false);
        setShowWipe(false);
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [tileIndex, isAkram]);

  // Reset akram animation when the component mounts for the first time
  React.useEffect(() => {
    if (isAkram) {
      setAkramPlayTrigger(0);
      setAkramAnimationPlayed(false);
      setAkramPageVisible(false);
      setShowWipe(false);
    }
  }, [isAkram]);

  // Play video when it becomes visible and loaded
  React.useEffect(() => {
    if (showStartVideo && videoRef.current && videoLoaded) {
      // Reset to beginning before playing
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(err => {
        console.warn('Video autoplay failed:', err);
      });
    }
  }, [showStartVideo, videoLoaded]);

  // Preload video when component mounts
  React.useEffect(() => {
    if (isSpecialTile && videoRef.current) {
      videoRef.current.preload = 'auto';
      videoRef.current.load();
    }
  }, [isSpecialTile]);

  // Monitor video time to keep it at the end
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !showStartVideo || !videoLoaded) return;

    const handleTimeUpdate = () => {
      // If video has ended or is near the end, keep it at the end
      if (video.ended || (video.duration > 0 && video.currentTime >= video.duration - 0.1)) {
        video.currentTime = Math.max(0, video.duration - 0.05);
        video.pause();
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [showStartVideo, videoLoaded]);

  // Check when video state changes
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !showStartVideo || !videoLoaded) return;

    // Check if video is already ended when it becomes visible
    if (video.ended) {
      const duration = video.duration || 0;
      video.currentTime = Math.max(0, duration - 0.05);
      video.pause();
    }
  }, [showStartVideo, videoLoaded]);

  // Listen for when the Akram animation completes
  React.useEffect(() => {
    if (akramPlayTrigger > 0) {
      // 6 nodes * 350ms delay + 600ms for final celebration = ~2.7 seconds
      const animationDuration = 6 * 350 + 600;
      const timer = setTimeout(() => {
        setAkramAnimationPlayed(true);
      }, animationDuration);
      return () => clearTimeout(timer);
    }
  }, [akramPlayTrigger]);

  // Once the skill tree finishes, kick off the Wii swoosh wipe. The page
  // itself gets swapped in underneath once the wipe fully covers the
  // screen (see handleWipeCovered), so the switch is hidden by the wipe
  // rather than a plain crossfade.
  React.useEffect(() => {
    if (!akramAnimationPlayed) return;
    // 200ms delay for a smooth transition
    const timer = setTimeout(() => {
      if (isMountedRef.current) setShowWipe(true);
    }, 200);
    return () => clearTimeout(timer);
  }, [akramAnimationPlayed]);

  const handleWipeCovered = React.useCallback(() => {
    if (isMountedRef.current) setAkramPageVisible(true);
  }, []);

  const handleWipeDone = React.useCallback(() => {
    if (isMountedRef.current) setShowWipe(false);
  }, []);

  // Opening animation
  React.useLayoutEffect(() => {
    const el = frameRef.current;
    const backdrop = backdropRef.current;
    if (!el || !originRect || !isMountedRef.current) return;

    isClosingRef.current = false;

    // Reset styles and measure
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

    // Force reflow
    void el.getBoundingClientRect();

    // Animate in
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

  // Handle closing
  React.useEffect(() => {
    const el = frameRef.current;
    const backdrop = backdropRef.current;
    
    if (!closing || !el || !originRect || isClosingRef.current || !isMountedRef.current) {
      return;
    }

    isClosingRef.current = true;

    // Clean up any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Disable pointer events immediately
    el.style.pointerEvents = "none";
    if (backdrop) {
      backdrop.style.pointerEvents = "none";
    }

    // Force a reflow to ensure we measure correctly
    void el.getBoundingClientRect();

    // Get current position
    const restRect = el.getBoundingClientRect();

    const scaleX = originRect.width / restRect.width;
    const scaleY = originRect.height / restRect.height;
    const translateX = originRect.left + originRect.width / 2 - (restRect.left + restRect.width / 2);
    const translateY = originRect.top + originRect.height / 2 - (restRect.top + restRect.height / 2);

    // Force another reflow
    void el.getBoundingClientRect();

    // Animate out
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

    // Call onClosed after animation completes
    const timeoutId = setTimeout(() => {
      if (!isMountedRef.current) return;
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Hide everything immediately before unmounting
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

  const handleStartClick = () => {
    if (closing || !isSpecialTile) return;
    if (isAkram) {
      // Only increment if animation hasn't been played yet
      if (!akramAnimationPlayed) {
        setAkramPlayTrigger((t) => t + 1);
        // The animation will start and set akramAnimationPlayed after it completes
      }
      return;
    }
    if (hasPlayedStart) return;
    setShowStartVideo(true);
    setHasPlayedStart(true);
  };

  const handleVideoLoaded = () => {
    setVideoLoaded(true);
    // Reset to beginning and play immediately when loaded
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(err => {
        console.warn('Video play failed:', err);
      });
    }
  };

  const handleVideoEnded = () => {
    // Keep the video at the end frame
    if (videoRef.current) {
      const duration = videoRef.current.duration || 0;
      videoRef.current.currentTime = Math.max(0, duration - 0.05);
      videoRef.current.pause();
    }
  };

  const previewGif = getPreviewGif();
  const startVideo = getStartVideo();
  const tileLabel = getTileLabel();
  const objectFit = getObjectFit();
  const isGraphicsTile = isGraphics;

  // Determine if Start button should be disabled
  const isStartDisabled = () => {
    if (closing) return true;
    if (!isSpecialTile) return true;
    if (isAkram) {
      return akramAnimationPlayed || akramPlayTrigger > 0;
    }
    return hasPlayedStart;
  };

  // Check if Start button should be enabled
  const isStartEnabled = isSpecialTile && !isStartDisabled();

  // Render content based on tile type
  const renderContent = () => {
    if (isPortfolio || isAboutMe) {
      // Portfolio and About Me - no frame, just the image/video
      return (
        <div 
          style={{ 
            position: 'absolute',
            top: 0,
            bottom: 'clamp(64px, 13%, 104px)',
            left: 0,
            right: 0,
            overflow: 'hidden',
            background: '#000',
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
      );
    } else if (isGraphics) {
      // Graphics - with yellow background and black grid lines.
      // All the decorative layers below used to be inline `style={{...}}`
      // objects rebuilt from scratch on every render (a lot of gradient
      // parsing work for content that never changes). They're now static
      // CSS classes defined in DiscChannel.css, computed once by the
      // browser instead of re-created by React every render.
      return (
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
              // The swap is hidden under the Wii wipe once it's active, so
              // this only needs to be quick fallback, not the main effect.
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
        onClick={() => !closing && onRequestClose?.()}
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
          // Regular Disc Channel content
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
              <span className="disc-channel-title">Disc Channel</span>
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
            isAkram && akramPageVisible ? "disc-channel-bottombar--hidden" : ""
          }`}
        >
          <button
            className="disc-channel-btn disc-channel-btn--menu"
            type="button"
            onClick={() => !closing && onRequestClose?.()}
            disabled={closing}
          >
            {isSpecialTile ? "Back" : "Wii Menu"}
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

        {/* Covers the whole frame - including the bottom bar - so the bar
            can disappear underneath it as we swap from the menu card to
            the actual page, the same way the Wii Menu bar drops away once
            a channel/game actually loads in. */}
        {isAkram && (
          <WiiWipeTransition
            active={showWipe}
            onCovered={handleWipeCovered}
            onDone={handleWipeDone}
          />
        )}
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