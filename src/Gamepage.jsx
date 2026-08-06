/* GamePage.jsx — placeholder page for the Portfolio/Game channel */
import React from "react";
import "./Gamepage.css";

export default function GamePage({ onGoBack, onEscape }) {
  const [isMobile, setIsMobile] = React.useState(
    () => window.matchMedia('(max-width: 600px)').matches
  );

  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 600px)');
    const handleChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  return (
    <div className="game-page">
      <div className="game-page-bg">
        <div className="game-page-vignette" />
        <div className="game-page-scanlines" />
      </div>

      <div className="game-page-header">
        <div className="game-page-header-content">
          <h1 className="game-page-title">Portfolio</h1>
          <p className="game-page-subtitle">Coming soon</p>
        </div>

        <button
          className="game-page-esc"
          type="button"
          onClick={onEscape}
          aria-label={isMobile ? "Open Menu" : "Press ESC to open HOME Menu"}
        >
          {isMobile ? (
            <>
              <span className="game-page-esc-mobile-label">Menu</span>
              <svg
                className="game-page-esc-mobile-arrow"
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
              <span className="game-page-esc-key">⎋ ESC</span>
              <span className="game-page-esc-label">HOME Menu</span>
            </>
          )}
        </button>
      </div>

      <div className="game-page-body">
        <div className="game-page-placeholder">
          <svg viewBox="0 0 24 24" className="game-page-placeholder-icon" aria-hidden="true">
            <rect x="3" y="4" width="18" height="14" rx="2" />
            <path d="M3 16l4.5-4.5a2 2 0 0 1 2.8 0L14 15" />
            <circle cx="16.5" cy="9.5" r="1.5" />
          </svg>
          <p className="game-page-placeholder-text">This channel is still under construction.</p>
        </div>
      </div>
    </div>
  );
}