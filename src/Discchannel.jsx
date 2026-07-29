/* DiscChannel.jsx */
import React from "react";
import "./DiscChannel.css";
import aboutMeGif from "./Assets/Aboutmepreview.gif";
import aboutMeStartMp4 from "./Assets/Aboutmestart.mp4";
import graphicsGif from "./Assets/Graphicspreview.gif";
import graphicsStartMp4 from "./Assets/Graphicspreviewstart.mp4";
import portfolioGif from "./Assets/Portfoliopreview.gif";
import portfolioStartMp4 from "./Assets/Portfoliopreviewstart.mp4";
import { AkramExpandedArt } from "./AkramArt";

const DURATION = 620;
const EASE = "cubic-bezier(0.45, 0, 0.15, 1)";
const TILE_RADIUS = "12% / 16%";

export default function DiscChannel({ originRect, closing, tileIndex, onRequestClose, onClosed }) {
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
  const videoRef = React.useRef(null);

  // Check if we're on mobile portrait
  const isMobilePortrait = window.matchMedia('(max-width: 600px) and (orientation: portrait)').matches;

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

  // Reset states when closing
  React.useEffect(() => {
    if (closing) {
      setShowStartVideo(false);
      setHasPlayedStart(false);
      setVideoLoaded(false);
      // Don't reset akramPlayTrigger or akramAnimationPlayed here
      // We want to keep the tree state when reopening
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
    }
  }, [isAkram]);

  // Play video when it becomes visible and loaded
  React.useEffect(() => {
    if (showStartVideo && videoRef.current && videoLoaded) {
      // Reset to beginning before playing
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(err => {
        console.log('Video autoplay failed:', err);
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
    // This will be called when akramPlayTrigger changes
    // We need to detect when the animation has finished playing
    // The animation takes about 4.8 seconds (6 nodes * 800ms)
    if (akramPlayTrigger > 0) {
      // Set a timeout to mark the animation as played after it completes
      const animationDuration = 6 * 800 + 1000; // 6 nodes * 800ms + extra for final celebration
      const timer = setTimeout(() => {
        setAkramAnimationPlayed(true);
      }, animationDuration);
      return () => clearTimeout(timer);
    }
  }, [akramPlayTrigger]);

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
        console.log('Video play failed:', err);
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
      // Graphics - with yellow background and black grid lines
      return (
        <div 
          style={{ 
            position: 'absolute',
            top: 0,
            bottom: 'clamp(64px, 13%, 104px)',
            left: 0,
            right: 0,
            overflow: 'hidden',
            background: '#f5d742',
          }}
        >
          {/* Yellow background with black grid pattern */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `
                /* Horizontal grid lines - black */
                repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 39px,
                  rgba(0, 0, 0, 0.3) 39px,
                  rgba(0, 0, 0, 0.3) 40px
                ),
                /* Vertical grid lines - black */
                repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 39px,
                  rgba(0, 0, 0, 0.3) 39px,
                  rgba(0, 0, 0, 0.3) 40px
                ),
                /* Diagonal grid lines for depth - black */
                repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 80px,
                  rgba(0, 0, 0, 0.08) 80px,
                  rgba(0, 0, 0, 0.08) 81px
                ),
                repeating-linear-gradient(
                  -45deg,
                  transparent,
                  transparent 80px,
                  rgba(0, 0, 0, 0.08) 80px,
                  rgba(0, 0, 0, 0.08) 81px
                ),
                /* Grid intersection dots - black */
                radial-gradient(circle at 20px 20px, rgba(0, 0, 0, 0.25) 2px, transparent 2px),
                radial-gradient(circle at 60px 20px, rgba(0, 0, 0, 0.25) 2px, transparent 2px),
                radial-gradient(circle at 100px 20px, rgba(0, 0, 0, 0.25) 2px, transparent 2px),
                radial-gradient(circle at 140px 20px, rgba(0, 0, 0, 0.25) 2px, transparent 2px),
                radial-gradient(circle at 180px 20px, rgba(0, 0, 0, 0.25) 2px, transparent 2px),
                radial-gradient(circle at 20px 60px, rgba(0, 0, 0, 0.25) 2px, transparent 2px),
                radial-gradient(circle at 60px 60px, rgba(0, 0, 0, 0.25) 2px, transparent 2px),
                radial-gradient(circle at 100px 60px, rgba(0, 0, 0, 0.25) 2px, transparent 2px),
                radial-gradient(circle at 140px 60px, rgba(0, 0, 0, 0.25) 2px, transparent 2px),
                radial-gradient(circle at 180px 60px, rgba(0, 0, 0, 0.25) 2px, transparent 2px)
              `,
              backgroundSize: `
                100% 100%,
                100% 100%,
                160px 160px,
                160px 160px,
                200px 200px,
                200px 200px,
                200px 200px,
                200px 200px,
                200px 200px,
                200px 200px,
                200px 200px,
                200px 200px,
                200px 200px,
                200px 200px,
                200px 200px,
                200px 200px
              `,
              backgroundPosition: 'center center',
              backgroundRepeat: 'repeat, repeat, repeat, repeat, repeat, repeat, repeat, repeat, repeat, repeat, repeat, repeat, repeat, repeat, repeat, repeat',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'clamp(20px, 4vh, 60px)',
              zIndex: 1,
            }}
          >
            {/* Main frame container with depth */}
            <div
              style={{
                position: 'relative',
                width: 'auto',
                height: 'auto',
                maxWidth: '100%',
                maxHeight: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'clamp(14px, 2.5vh, 32px)',
                background: 'linear-gradient(160deg, #f8f9fb 0%, #e2e4e8 40%, #d0d3d8 100%)',
                borderRadius: '16px',
                boxShadow: `
                  0 2px 4px rgba(0, 0, 0, 0.06),
                  0 8px 24px rgba(0, 0, 0, 0.15),
                  0 16px 48px rgba(0, 0, 0, 0.12),
                  inset 0 1px 0 rgba(255, 255, 255, 0.7)
                `,
              }}
            >
              {/* Outer border ring */}
              <div
                style={{
                  position: 'absolute',
                  inset: '3px',
                  borderRadius: '13px',
                  pointerEvents: 'none',
                  zIndex: 3,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 50%, rgba(0,0,0,0.05) 100%)',
                  border: '1px solid rgba(255,255,255,0.3)',
                }}
              />

              {/* Inner shadow overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: '6px',
                  borderRadius: '10px',
                  pointerEvents: 'none',
                  zIndex: 4,
                  background: 'radial-gradient(ellipse at 50% 30%, transparent 50%, rgba(0,0,0,0.04) 100%)',
                  boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.06)',
                }}
              />
              {/* Wii-style decorative corners */}
              <div
                style={{
                  position: 'absolute',
                  top: '6px',
                  left: '6px',
                  width: 'clamp(16px, 2.5vh, 32px)',
                  height: 'clamp(16px, 2.5vh, 32px)',
                  borderTop: '3px solid #35c3db',
                  borderLeft: '3px solid #35c3db',
                  borderRadius: '6px 0 0 0',
                  pointerEvents: 'none',
                  zIndex: 6,
                  opacity: 0.7,
                  boxShadow: '0 0 8px rgba(53, 195, 219, 0.2)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: 'clamp(16px, 2.5vh, 32px)',
                  height: 'clamp(16px, 2.5vh, 32px)',
                  borderTop: '3px solid #35c3db',
                  borderRight: '3px solid #35c3db',
                  borderRadius: '0 6px 0 0',
                  pointerEvents: 'none',
                  zIndex: 6,
                  opacity: 0.7,
                  boxShadow: '0 0 8px rgba(53, 195, 219, 0.2)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '6px',
                  left: '6px',
                  width: 'clamp(16px, 2.5vh, 32px)',
                  height: 'clamp(16px, 2.5vh, 32px)',
                  borderBottom: '3px solid #35c3db',
                  borderLeft: '3px solid #35c3db',
                  borderRadius: '0 0 0 6px',
                  pointerEvents: 'none',
                  zIndex: 6,
                  opacity: 0.7,
                  boxShadow: '0 0 8px rgba(53, 195, 219, 0.2)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '6px',
                  right: '6px',
                  width: 'clamp(16px, 2.5vh, 32px)',
                  height: 'clamp(16px, 2.5vh, 32px)',
                  borderBottom: '3px solid #35c3db',
                  borderRight: '3px solid #35c3db',
                  borderRadius: '0 0 6px 0',
                  pointerEvents: 'none',
                  zIndex: 6,
                  opacity: 0.7,
                  boxShadow: '0 0 8px rgba(53, 195, 219, 0.2)',
                }}
              />

              {/* Subtle blue glow behind the corners */}
              <div
                style={{
                  position: 'absolute',
                  inset: '8px',
                  borderRadius: '8px',
                  pointerEvents: 'none',
                  zIndex: 1,
                  background: 'radial-gradient(ellipse at 20% 20%, rgba(53,195,219,0.04) 0%, transparent 60%)',
                }}
              />

              {/* The actual image/video content */}
              <div
                style={{
                  position: 'relative',
                  width: 'auto',
                  height: 'auto',
                  maxWidth: 'min(70vw, 600px)',
                  maxHeight: 'min(60vh, 500px)',
                  overflow: 'hidden',
                  borderRadius: '8px',
                  background: '#e4e5d5',
                  boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.08)',
                  zIndex: 2,
                }}
              >
                {/* Content inner glow */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    zIndex: 3,
                    background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.03) 100%)',
                  }}
                />
                
                <img 
                  src={previewGif} 
                  alt={tileLabel} 
                  style={{
                    display: 'block',
                    maxWidth: 'min(70vw, 600px)',
                    maxHeight: 'min(60vh, 500px)',
                    width: 'auto',
                    height: 'auto',
                    objectFit: objectFit,
                    opacity: showStartVideo && videoLoaded ? 0 : 1,
                    transition: 'opacity 0.5s ease',
                    zIndex: 1,
                    background: '#e4e5d5',
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
                    background: '#e4e5d5',
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

              {/* Subtle outer glow */}
              <div
                style={{
                  position: 'absolute',
                  inset: '-4px',
                  borderRadius: '20px',
                  pointerEvents: 'none',
                  zIndex: 0,
                  background: 'radial-gradient(ellipse at center, rgba(53,195,219,0.06) 0%, transparent 70%)',
                  filter: 'blur(8px)',
                }}
              />
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
            bottom: 'clamp(64px, 13%, 104px)',
            left: 0,
            right: 0,
            overflow: 'hidden',
            background: '#eef0f2',
          }}
        >
          <AkramExpandedArt playTrigger={akramPlayTrigger} />
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

        <div className="disc-channel-bottombar">
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
    </>
  );
}