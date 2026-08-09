/* GamePage.jsx — Portfolio/Game channel, SNES-style pixel HUD themed */
import React, { useState, useEffect, useRef } from "react";
import "./Gamepage.css";
import GodotGame from "./GodotGame";
import RetroFrame from "./RetroFrame";
import BottomBar from "./BottomBar";
import AutoFitScale from "./Autofitscale";
import sound from "./SoundManager"; // <-- Import sound manager

const TOTAL_SECRETS = 4;

const HudPlaque = ({ icon, title, children }) => (
  <div className="game-page-tile">
    <div className="game-page-tile-body">
      <div className="game-page-tile-title-row">
        <span className="game-page-tile-icon" aria-hidden="true">{icon}</span>
        <span className="game-page-tile-title">{title}</span>
      </div>
      {children}
    </div>
  </div>
);

export default function GamePage({ onGoBack, onEscape, onGameReady }) {
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia('(max-width: 600px)').matches
  );
  const [isGameFocused, setIsGameFocused] = useState(true);
  const [isGameActive, setIsGameActive] = useState(true);
  const [foundItems, setFoundItems] = useState(new Set());
  const gameContainerRef = useRef(null);
  const gameInnerRef = useRef(null);

  // --- Stop Wii menu music while this page is displayed; restore on exit ---
  useEffect(() => {
    sound.stopMusic();                 // Stop the Wii menu loop
    return () => {
      sound.playMusic('wiiMenu');      // Resume Wii menu when leaving
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 600px)');
    const handleChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (gameContainerRef.current && !gameContainerRef.current.contains(e.target))
        setIsGameFocused(false);
    };
    const handleClickOnGame = (e) => {
      if (gameContainerRef.current && gameContainerRef.current.contains(e.target)) {
        setIsGameFocused(true);
        setIsGameActive(true);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('mousedown', handleClickOnGame);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('mousedown', handleClickOnGame);
    };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail && typeof e.detail.isGameActive !== 'undefined')
        setIsGameActive(e.detail.isGameActive);
    };
    window.addEventListener('gameActivityChange', handler);
    return () => window.removeEventListener('gameActivityChange', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const { item } = e.detail;
      setFoundItems(prev => {
        if (prev.has(item)) return prev;
        const next = new Set(prev);
        next.add(item);
        return next;
      });
    };
    window.addEventListener('secretFound', handler);
    return () => window.removeEventListener('secretFound', handler);
  }, []);

  const showOverlay = !isGameFocused || !isGameActive;
  const secretsFound = foundItems.size;

  const GameContent = (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {showOverlay && (
        <div className="game-page-stage-overlay">
          <div className="game-page-stage-overlay-text">Click twice to activate</div>
        </div>
      )}
      <GodotGame isActive={isGameFocused && isGameActive} innerRef={gameInnerRef} isMobile={isMobile} onReady={onGameReady} />
    </div>
  );

  const GameBlock = (
    <AutoFitScale maxScale={isMobile ? 1.3 : 1} boost={isMobile ? 1.12 : 1}>
      <div ref={gameContainerRef} style={{ display: 'inline-block', position: 'relative' }}>
        <RetroFrame thin={isMobile}>{GameContent}</RetroFrame>
      </div>
    </AutoFitScale>
  );

  return (
    <div className="game-page">
      <div className="game-page-bg">
        <div className="game-page-vignette" />
      </div>

      <button
        className="game-page-esc game-page-esc-floating"
        type="button"
        onClick={onEscape}
        aria-label={isMobile ? "Open Menu" : "Press ESC to Pause"}
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
            <span className="game-page-esc-key">MENU</span>
          </>
        )}
      </button>

      <div className="game-page-body">
        {isMobile ? (
          <div className="game-page-mobile">
            <div className="game-page-mobile-stage">
              {GameBlock}
            </div>
            <div className="game-page-mobile-dialogue">
              <BottomBar isMobile={true} theme="earthbound" />
            </div>
            <p className="game-page-mobile-note">Intended experience on desktop</p>
          </div>
        ) : (
          <div className="game-page-content">
            <div className="game-page-sidebar game-page-sidebar-left">
              <HudPlaque icon="🧑‍💻" title="About This Site">
                <p>This portfolio is a playable experience.</p>
                <p>Built with React, Godot Engine and heart!</p>
                <p>Explore, interact, and discover more about me.</p>
              </HudPlaque>

              <HudPlaque icon="🎮" title="Controls">
                <table className="game-page-controls-table">
                  <tbody>
                    {[['↑ ↓ ← →', 'Move'], ['E', 'Interact'], ['Shift', 'Run']].map(([key, action]) => (
                      <tr key={key}>
                        <td className="game-page-controls-key">{key}</td>
                        <td>{action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </HudPlaque>
            </div>

            <div className="game-page-stage">
              {GameBlock}
            </div>

            <div className="game-page-sidebar game-page-sidebar-right">
              <HudPlaque icon="🔗" title="Quick Connect">
                <div className="game-page-link-list">
                  {[
                    { icon: '🐙', label: 'GitHub', href: 'https://github.com/8-BitCode' },
                    { icon: '💼', label: 'LinkedIn', href: 'https://www.linkedin.com/in/akrammunirawel/' },
                    { icon: '✉️', label: 'Email Me', href: 'mailto:akrammunirawel@gmail.com' },
                    { icon: '📄', label: 'Download CV', href: '/cv.pdf', download: true },
                  ].map(({ icon, label, href, download }) => (
                    <a
                      key={label}
                      href={href}
                      target={download ? undefined : '_blank'}
                      rel="noopener noreferrer"
                      download={download || undefined}
                      className="game-page-link-row"
                    >
                      <span className="game-page-link-icon">{icon}</span>
                      <span className="game-page-link-label">{label}</span>
                    </a>
                  ))}
                </div>
              </HudPlaque>

              <HudPlaque icon="⭐" title="Current Quest">
                <p className="game-page-quest-text">Explore the world and learn more about me!</p>
                <div className="game-page-quest-progress">
                  <div className="game-page-quest-stars">
                    {Array.from({ length: TOTAL_SECRETS }).map((_, i) => (
                      <span
                        key={i}
                        className={`game-page-quest-star ${i < secretsFound ? 'is-found' : ''}`}
                      >⭐</span>
                    ))}
                  </div>
                  <span className="game-page-quest-count">{secretsFound} / {TOTAL_SECRETS}</span>
                  <p className="game-page-quest-label">Secrets Found</p>

                  <div className="game-page-quest-list">
                    {[
                      { key: 'mail', label: '✉️  Mail' },
                      { key: 'phone', label: '📞  Phone' },
                      { key: 'sign', label: '🪧  Sign' },
                      { key: 'companion', label: '🐾  Project' },
                    ].map(({ key, label }) => (
                      <div
                        key={key}
                        className={`game-page-quest-item ${foundItems.has(key) ? 'is-found' : ''}`}
                      >
                        <span className="game-page-quest-check">{foundItems.has(key) ? '✓' : '·'}</span>
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              </HudPlaque>
            </div>
          </div>
        )}
      </div>

      {!isMobile && (
        <div className="game-page-dialogue">
          <BottomBar isMobile={false} theme="earthbound" />
        </div>
      )}
    </div>
  );
}