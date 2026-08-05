/* AboutMePage.jsx
   The page that follows the About Me start video on the second Disc
   Channel. For now this is just an empty shell with the same header
   chrome as GraphicsPage/AkramPage — content to be filled in later.
*/
import React from "react";
import "./Aboutmepage.css";

export default function AboutMePage({ onGoBack, onEscape }) {
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
    <div className="about-me-page">
      <div className="about-me-page-bg" aria-hidden="true">
        <div className="about-me-page-grid" />
        <div className="about-me-page-scanlines" />
        <div className="about-me-page-vignette" />
      </div>

      <div className="about-me-page-header">
        <div className="about-me-page-header-content">
          <h1 className="about-me-page-title">About Me</h1>
          <p className="about-me-page-subtitle">Coming soon</p>
        </div>
        <button
          className="about-me-page-esc"
          onClick={onEscape}
          aria-label={isMobile ? "Open Menu" : "Press ESC to open HOME Menu"}
        >
          {isMobile ? (
            <>
              <span className="about-me-page-esc-mobile-label">Menu</span>
              <svg
                className="about-me-page-esc-mobile-arrow"
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
              <span className="about-me-page-esc-key">⎋ ESC</span>
              <span className="about-me-page-esc-label">HOME Menu</span>
            </>
          )}
        </button>
      </div>

      <div className="about-me-page-body">
        {/* Intentionally empty for now — content coming later. */}
      </div>
    </div>
  );
}