import React, { forwardRef, useEffect, useRef } from "react";

const GodotGame = forwardRef(({ isActive, innerRef, isMobile }, ref) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (ref) {
      if (typeof ref === 'function') ref(iframeRef.current);
      else ref.current = iframeRef.current;
    }
    if (innerRef) {
      if (typeof innerRef === 'function') innerRef(iframeRef.current);
      else innerRef.current = iframeRef.current;
    }
  }, [ref, innerRef]);

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.style.pointerEvents = isActive ? 'auto' : 'none';
    }
  }, [isActive]);

  const size = isMobile ? '88vw' : '35vw';

  return (
    <iframe
      ref={iframeRef}
      src="/portfolio.html"
      title="Godot Game"
      style={{
        width: size,
        height: size,
        border: 'none',
        backgroundColor: 'transparent',
        pointerEvents: isActive ? 'auto' : 'none',
        display: 'block',
      }}
      allow="fullscreen"
    />
  );
});

export default GodotGame;