/* DiscChannel.jsx */
import React from "react";
import "./DiscChannel.css";

const DURATION = 620;
const EASE = "cubic-bezier(0.45, 0, 0.15, 1)";
const TILE_RADIUS = "12% / 16%";

export default function DiscChannel({ originRect, closing, onRequestClose, onClosed }) {
  const frameRef = React.useRef(null);
  const backdropRef = React.useRef(null);
  const animationFrameRef = React.useRef(null);
  const isClosingRef = React.useRef(false);
  const isMountedRef = React.useRef(true);

  // Cleanup on unmount
  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
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
        aria-label="Disc Channel"
      >
        <div className="disc-channel-scanlines" />
        <div className="disc-channel-vignette" />

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

        <div className="disc-channel-bottombar">
          <button
            className="disc-channel-btn disc-channel-btn--menu"
            type="button"
            onClick={() => !closing && onRequestClose?.()}
            disabled={closing}
          >
            Wii Menu
          </button>
          <button 
            className="disc-channel-btn disc-channel-btn--start" 
            type="button" 
            disabled
          >
            Start
          </button>
        </div>
      </div>
    </>
  );
}