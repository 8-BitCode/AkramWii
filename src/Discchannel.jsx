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

/* ---------- Camera-aperture transition (Graphics channel only) ----------
   A distinct, photography-themed alternative to the disc-swoosh wipe used
   everywhere else: an iris closes down to black like a camera shutter,
   "clicks" with a flash, then reopens onto the gallery. Same three-stage
   contract as WiiWipeTransition (active / onCovered / onDone) so it drops
   straight into the existing show->covered->hold->out->done flow. */
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
  const [graphicsPageVisible, setGraphicsPageVisible] = React.useState(false);
  const [showGraphicsWipe, setShowGraphicsWipe] = React.useState(false);
  const graphicsTransitionStartedRef = React.useRef(false);
  const [showHomeMenu, setShowHomeMenu] = React.useState(false);
  const videoRef = React.useRef(null);

  const isMobilePortrait = isMobilePortraitProp ?? React.useMemo(
    () => window.matchMedia('(max-width: 600px) and (orientation: portrait)').matches,
    []
  );

  // Check which tile is being viewed
  const isPortfolio = tileIndex === 0;
  const isAboutMe = isMobilePortrait ? tileIndex === 1 : tileIndex === 3;
  const isGraphics = isMobilePortrait ? tileIndex === 2 : tileIndex === 6;
  const isAkram = isMobilePortrait ? tileIndex === 3 : tileIndex === 10;
  const isSpecialTile = isPortfolio || isAboutMe || isGraphics || isAkram;

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

  // ESC key handler
  React.useEffect(() => {
    const onSubPage = (isAkram && akramPageVisible) || (isGraphics && graphicsPageVisible);
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
  }, [isAkram, akramPageVisible, isGraphics, graphicsPageVisible, closing]);

  // Reset HOME Menu when closing
  React.useEffect(() => {
    if (closing || (!akramPageVisible && !graphicsPageVisible)) setShowHomeMenu(false);
  }, [closing, akramPageVisible, graphicsPageVisible]);

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

  // Reset states when closing
  React.useEffect(() => {
    if (closing) {
      setShowStartVideo(false);
      setHasPlayedStart(false);
      setVideoLoaded(false);
      setGraphicsPageVisible(false);
      setShowGraphicsWipe(false);
      graphicsTransitionStartedRef.current = false;
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [closing]);

  // Reset states when tile changes
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
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [tileIndex, isAkram, isGraphics]);

  // Reset akram animation on mount
  React.useEffect(() => {
    if (isAkram) {
      setAkramPlayTrigger(0);
      setAkramAnimationPlayed(false);
      setAkramPageVisible(false);
      setShowWipe(false);
    }
  }, [isAkram]);

  // Reset graphics page on mount
  React.useEffect(() => {
    if (isGraphics) {
      setGraphicsPageVisible(false);
      setShowGraphicsWipe(false);
      graphicsTransitionStartedRef.current = false;
    }
  }, [isGraphics]);

  // Handle graphics video ending -> show wipe
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
    if (isMountedRef.current) setGraphicsPageVisible(true);
  }, []);

  const handleGraphicsWipeDone = React.useCallback(() => {
    if (isMountedRef.current) setShowGraphicsWipe(false);
  }, []);

  // Play video when loaded
  React.useEffect(() => {
    if (showStartVideo && videoRef.current && videoLoaded) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(err => {
        console.warn('Video autoplay failed:', err);
      });
    }
  }, [showStartVideo, videoLoaded]);

  // Preload video
  React.useEffect(() => {
    if (isSpecialTile && videoRef.current) {
      videoRef.current.preload = 'auto';
      videoRef.current.load();
    }
  }, [isSpecialTile]);

  // Monitor video time for other tiles (not graphics)
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !showStartVideo || !videoLoaded || isGraphics) return;

    const handleTimeUpdate = () => {
      if (video.ended || (video.duration > 0 && video.currentTime >= video.duration - 0.1)) {
        video.currentTime = Math.max(0, video.duration - 0.05);
        video.pause();
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [showStartVideo, videoLoaded, isGraphics]);

  // Check video state for other tiles
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !showStartVideo || !videoLoaded || isGraphics) return;
    if (video.ended) {
      const duration = video.duration || 0;
      video.currentTime = Math.max(0, duration - 0.05);
      video.pause();
    }
  }, [showStartVideo, videoLoaded, isGraphics]);

  // Akram animation completion
  React.useEffect(() => {
    if (akramPlayTrigger > 0) {
      const animationDuration = 6 * 350 + 600;
      const timer = setTimeout(() => {
        setAkramAnimationPlayed(true);
      }, animationDuration);
      return () => clearTimeout(timer);
    }
  }, [akramPlayTrigger]);

  // Akram wipe trigger
  React.useEffect(() => {
    if (!akramAnimationPlayed) return;
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

  // Closing animation
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

  const handleStartClick = () => {
    if (closing || !isSpecialTile) return;
    if (isAkram) {
      if (!akramAnimationPlayed) {
        setAkramPlayTrigger((t) => t + 1);
      }
      return;
    }
    if (hasPlayedStart) return;
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
    if (videoRef.current && !isGraphics) {
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

  const renderContent = () => {
    if (isPortfolio || isAboutMe) {
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
      // Graphics - shows the preview video, then transitions to the gallery
      return (
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          {/* Preview content (visible before wipe) */}
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

          {/* Graphics Page (visible after wipe) */}
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

          {/* Graphics transition - triggered when video ends. Distinct from
              the disc-swoosh wipe used elsewhere: a camera-shutter iris,
              in keeping with the photo-gallery destination. */}
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

          {/* Akram wipe transition */}
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
            (isAkram && akramPageVisible) || (isGraphics && graphicsPageVisible) ? "disc-channel-bottombar--hidden" : ""
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