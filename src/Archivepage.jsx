/* Archivepage.jsx
   "Archive" channel — a Wii Data Management-flavoured screen for older
   projects that don't get their own tile on the main menu. Opens/closes
   with the same origin-rect morph MailPopup/SettingsPanel use, just
   growing to fill the whole screen instead of a small centered square -
   fitting for the thin, long button it grows out of.

   Edit ARCHIVE_PROJECTS below to add/remove/reword entries - nothing
   else in this file needs to change.
*/
import React from "react";
import "./Mailpopup.css";
import "./Archivepage.css";
import sound from "./Soundmanager";
import { isFirefox } from "./Env";
import mismcrIcon from "./Assets/MIS.png";
import blancIcon from "./Assets/Blanc.png";
import algoshowcaseIcon from "./Assets/Showcase.png";
import magnusmapIcon from "./Assets/Magnus.png";
import wordleartIcon from "./Assets/Wordle.png";
import letsgogamblingIcon from "./Assets/LGG.png";
import abstractartistIcon from "./Assets/AA.png";

const FIREFOX = isFirefox();

const DURATION = 650;
const EASE = "cubic-bezier(0.22, 1.12, 0.3, 1)";
const ORIGIN_RADIUS = "999px"; // matches the pill-shaped button it grows from

const ARCHIVE_PROJECTS = [
  {
    id: "mismcr",
    title: "MIS",
    url: "https://mismcr.netlify.app/",
    description: "I made this after being brought on as lead web developer for the Manchester Society, built to their brief and requirements - though I still snuck in plenty of my own creative choices along the way.",
    icon: mismcrIcon,
    accent: "linear-gradient(155deg, #6fb1ff 0%, #3d7bd9 60%, #2a5aa8 100%)",
  },
  {
    id: "blanc",
    title: "Blanc",
    url: "https://coffeeblanc.netlify.app/",
    description: "A client wanted to see some previous work, and my usual style is pretty zany, so I put this together over a weekend - a sleek, professional fake coffee brand site, a different side of me than I usually show.",
    icon: blancIcon,
    accent: "linear-gradient(155deg, #c9a27a 0%, #8a6142 60%, #4a2f1d 100%)",
  },
  {
    id: "algoshowcase",
    title: "Algorithm Showcase",
    url: "https://algorithmshowcase.netlify.app/",
    description: "This started life as my EPQ, where I merged classic algorithm visualisations with research into the look and feel of the early internet - equal parts computer science project and design experiment.",
    icon: algoshowcaseIcon,
    accent: "linear-gradient(155deg, #7ee0c3 0%, #2bb3a0 60%, #157b6f 100%)",
  },
  {
    id: "magnusmap",
    title: "Magnus Map",
    url: "https://magnusmap.netlify.app/",
    description: "I'm a big fan of The Magnus Archives podcast. Its earlier episodes are more of an anthology, but names and places would still resurface from previous ones, so I built this map to connect them all together.",
    icon: magnusmapIcon,
    accent: "linear-gradient(155deg, #f2d98a 0%, #d6a53c 60%, #8a6a1e 100%)",
  },
  {
    id: "wordleart",
    title: "Wordle Art",
    url: "https://wordleart.netlify.app/",
    description: "A little project for my Wordle friend group, turning each day's answer into a piece of generative art. The fun part is working within whatever word you're given - some days you can make something you couldn't the day before.",
    icon: wordleartIcon,
    accent: "linear-gradient(155deg, #8fe38f 0%, #4caf50 60%, #2e7d32 100%)",
  },
  {
    id: "letsgogambling",
    title: "Let's Go Gambling",
    url: "https://letsgogambling.pages.dev/",
    description: "My first proper group project at university - a satirical anti-gambling site where I handled a lot of the web design and the database. A lot of what I'd learned from the Algorithm Showcase went straight into this one.",
    icon: letsgogamblingIcon,
    accent: "linear-gradient(155deg, #ff9a8f 0%, #e5433f 60%, #9c1f1f 100%)",
  },
  {
    id: "abstractartist",
    title: "Abstract Artist",
    url: "https://8-bitcode.github.io/AbstractArtist/",
    description: "An art project that takes any text you give it, turns it into a unique seed, and uses that seed to generate a one-of-a-kind canvas in the style of Piet Mondrian.",
    icon: abstractartistIcon,
    accent: "linear-gradient(155deg, #c99af5 0%, #8a4fd6 60%, #5b2b99 100%)",
  },
];

export default function ArchivePage({ originRect, closing, onRequestClose, onClosed }) {
  const frameRef = React.useRef(null);
  const backdropRef = React.useRef(null);
  const ringRef = React.useRef(null);
  const timeoutRef = React.useRef(null);
  const rafRef = React.useRef(null);
  const isMountedRef = React.useRef(true);
  const [showSwoosh, setShowSwoosh] = React.useState(true);
  const [selectedProject, setSelectedProject] = React.useState(null);
  const [popupClosing, setPopupClosing] = React.useState(false);
  const popupTimeoutRef = React.useRef(null);

  const closePopup = React.useCallback(() => {
    if (popupTimeoutRef.current) return;
    sound.play("back");
    setPopupClosing(true);
    popupTimeoutRef.current = window.setTimeout(() => {
      popupTimeoutRef.current = null;
      if (!isMountedRef.current) return;
      setSelectedProject(null);
      setPopupClosing(false);
    }, 200);
  }, []);

  React.useEffect(() => {
    isMountedRef.current = true;
    const t = window.setTimeout(() => setShowSwoosh(false), DURATION + 200);
    return () => {
      isMountedRef.current = false;
      window.clearTimeout(t);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
    };
  }, []);

  // Close on Escape - this is a full screen, not a small popup, so it's
  // worth the extra affordance.
  React.useEffect(() => {
    if (closing) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (selectedProject && !popupClosing) {
          closePopup();
        } else {
          onRequestClose?.();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closing, onRequestClose, selectedProject, popupClosing, closePopup]);

  // Opening animation: morph from the thin bar into the full-screen frame.
  React.useLayoutEffect(() => {
    const el = frameRef.current;
    const backdrop = backdropRef.current;
    const ring = ringRef.current;
    if (!el || !isMountedRef.current) return;

    el.style.transition = "none";

    if (originRect) {
      const restRect = el.getBoundingClientRect();
      const scaleX = originRect.width / restRect.width;
      const scaleY = originRect.height / restRect.height;
      const translateX = originRect.left + originRect.width / 2 - (restRect.left + restRect.width / 2);
      const translateY = originRect.top + originRect.height / 2 - (restRect.top + restRect.height / 2);

      el.style.transformOrigin = "center";
      el.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
      el.style.borderRadius = ORIGIN_RADIUS;
      el.style.opacity = "0.55";

      if (ring) {
        ring.style.transition = "none";
        ring.style.left = `${originRect.left + originRect.width / 2}px`;
        ring.style.top = `${originRect.top + originRect.height / 2}px`;
        ring.style.width = "0px";
        ring.style.height = "0px";
        ring.style.opacity = "0";
      }
    } else {
      el.style.transform = "scale(0.85)";
      el.style.opacity = "0";
    }

    if (backdrop) {
      backdrop.style.transition = "none";
      backdrop.style.opacity = "0";
    }

    void el.getBoundingClientRect();

    rafRef.current = requestAnimationFrame(() => {
      if (!isMountedRef.current) return;
      const radiusTransition = FIREFOX ? "" : `, border-radius ${DURATION}ms ease`;
      el.style.transition = `transform ${DURATION}ms ${EASE}${radiusTransition}, opacity ${Math.round(DURATION * 0.6)}ms ease`;
      el.style.transform = "translate(0, 0) scale(1, 1)";
      el.style.borderRadius = "";
      el.style.opacity = "1";

      if (backdrop) {
        backdrop.style.transition = `opacity ${DURATION}ms ease`;
        backdrop.style.opacity = "1";
      }

      if (ring && originRect) {
        ring.style.transition = `width ${DURATION}ms ${EASE}, height ${DURATION}ms ${EASE}, opacity ${DURATION}ms ease`;
        ring.style.width = "260px";
        ring.style.height = "260px";
        ring.style.opacity = "0.55";
        window.setTimeout(() => {
          if (ring) ring.style.opacity = "0";
        }, DURATION * 0.4);
      }
    });
  }, [originRect]);

  // Closing animation: shrink back down into the bar.
  React.useEffect(() => {
    const el = frameRef.current;
    const backdrop = backdropRef.current;
    if (!closing || !el) return;

    el.style.pointerEvents = "none";
    if (backdrop) backdrop.style.pointerEvents = "none";

    const closeDuration = 420;

    if (originRect) {
      const restRect = el.getBoundingClientRect();
      const scaleX = originRect.width / restRect.width;
      const scaleY = originRect.height / restRect.height;
      const translateX = originRect.left + originRect.width / 2 - (restRect.left + restRect.width / 2);
      const translateY = originRect.top + originRect.height / 2 - (restRect.top + restRect.height / 2);

      el.style.transition = FIREFOX
        ? `transform ${closeDuration}ms ease, opacity ${closeDuration}ms ease`
        : `transform ${closeDuration}ms ease, border-radius ${closeDuration}ms ease, opacity ${closeDuration}ms ease`;
      el.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
      el.style.borderRadius = ORIGIN_RADIUS;
      el.style.opacity = "0";
    } else {
      el.style.transition = `transform ${closeDuration}ms ease, opacity ${closeDuration}ms ease`;
      el.style.transform = "scale(0.85)";
      el.style.opacity = "0";
    }

    if (backdrop) {
      backdrop.style.transition = `opacity ${closeDuration}ms ease`;
      backdrop.style.opacity = "0";
    }

    timeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      onClosed?.();
    }, closeDuration + 40);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [closing, originRect, onClosed]);

  const handleTileClick = (project) => {
    sound.play("select");
    setSelectedProject(project);
    setPopupClosing(false);
  };

  const handleBack = () => {
    if (closing) return;
    sound.play("back");
    onRequestClose?.();
  };

  return (
    <>
      <div className="mail-popup-ring" ref={ringRef} aria-hidden="true" />
      <div
        className="mail-popup-backdrop"
        ref={backdropRef}
        onClick={() => !closing && onRequestClose?.()}
      />
      <div className="archive-frame" ref={frameRef} role="dialog" aria-label="Archive">
        {showSwoosh && !closing && <div className="archive-swoosh" aria-hidden="true" />}

        <div className="archive-topband">
          <div className="archive-topband-row">
            <div className="archive-brand">
              <svg className="archive-brand-disc" viewBox="0 0 120 120" aria-hidden="true">
                <circle cx="60" cy="60" r="54" fill="none" stroke="#ffffff" strokeWidth="3" strokeDasharray="10 8" opacity="0.8" />
                <circle cx="60" cy="60" r="34" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.6" />
                <circle cx="60" cy="60" r="6" fill="#ffffff" />
              </svg>
              <div>
                <span className="archive-brand-title">Data Management</span>
                <span className="archive-brand-subtitle">Older projects & experiments</span>
              </div>
            </div>
          </div>
          <div className="archive-tabs">
            <span className="archive-tab is-active">Archive</span>
            <span className="archive-tab">More Soon</span>
          </div>
        </div>

        <div className="archive-body">
          <div className="archive-grid">
            {ARCHIVE_PROJECTS.map((p) => (
              <button
                key={p.id}
                type="button"
                className="archive-tile"
                onClick={() => handleTileClick(p)}
              >
                <div className="archive-tile-icon">
                  <div className="archive-tile-icon-glaze" style={{ background: p.accent }}>
                    <img className="archive-tile-icon-img" src={p.icon} alt="" />
                  </div>
                </div>
                <span className="archive-tile-title">{p.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="archive-bottombar">
          <button className="archive-back-btn" type="button" onClick={handleBack} disabled={closing}>
            Back
          </button>
          <span className="archive-bottombar-note">Tap a save file to view its details</span>
          <span className="archive-bottombar-count">{ARCHIVE_PROJECTS.length} projects archived</span>
        </div>

        {selectedProject && (
          <div
            className={`archive-detail-backdrop${popupClosing ? " is-closing" : ""}`}
            onClick={closePopup}
          >
            <div
              className="archive-detail-popup"
              role="dialog"
              aria-label={selectedProject.title}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="archive-detail-header">
                <div className="archive-detail-icon-tile" style={{ background: selectedProject.accent }}>
                  <img className="archive-detail-icon-img" src={selectedProject.icon} alt="" />
                </div>
                <div className="archive-detail-header-text">
                  <h3 className="archive-detail-title">{selectedProject.title}</h3>
                  <p className="archive-detail-desc">{selectedProject.description}</p>
                </div>
              </div>
              <div className="archive-detail-actions">
                <button
                  type="button"
                  className="archive-detail-square archive-detail-back"
                  onClick={closePopup}
                >
                  <span className="archive-detail-square-icon" aria-hidden="true">↩</span>
                  <span className="archive-detail-square-label">Back</span>
                </button>
                <a
                  className="archive-detail-square archive-detail-play"
                  href={selectedProject.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => sound.play("select")}
                >
                  <span className="archive-detail-square-icon" aria-hidden="true">▶</span>
                  <span className="archive-detail-square-label">Play</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}