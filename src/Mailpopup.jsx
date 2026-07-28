/* MailPopup.jsx */
import React from "react";
import "./Mailpopup.css";

const DURATION = 560;
const EASE = "cubic-bezier(0.22, 1.12, 0.3, 1)";
const ORIGIN_RADIUS = "50%";

const CONTACT_LINES = [
  "Akram Munir Awel",
  "London",
  "akrammunirawel@gmail.com",
  "linkedin.com/in/akrammunirawel/",
];

export default function MailPopup({ originRect, closing, onRequestClose, onClosed }) {
  const frameRef = React.useRef(null);
  const backdropRef = React.useRef(null);
  const ringRef = React.useRef(null);
  const timeoutRef = React.useRef(null);
  const rafRef = React.useRef(null);
  const isMountedRef = React.useRef(true);
  const [shaking, setShaking] = React.useState(false);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Opening animation: morph from the mail orb into the square frame
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
      el.style.transform = `translate(-50%, -50%) translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
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
      el.style.transform = "translate(-50%, -50%) scale(0.7)";
      el.style.opacity = "0";
    }

    if (backdrop) {
      backdrop.style.transition = "none";
      backdrop.style.opacity = "0";
    }

    void el.getBoundingClientRect();

    rafRef.current = requestAnimationFrame(() => {
      if (!isMountedRef.current) return;
      el.style.transition = `transform ${DURATION}ms ${EASE}, border-radius ${DURATION}ms ease, opacity ${Math.round(DURATION * 0.6)}ms ease`;
      el.style.transform = "translate(-50%, -50%) scale(1, 1)";
      el.style.borderRadius = "";
      el.style.opacity = "1";

      if (backdrop) {
        backdrop.style.transition = `opacity ${DURATION}ms ease`;
        backdrop.style.opacity = "1";
      }

      if (ring && originRect) {
        ring.style.transition = `width ${DURATION}ms ${EASE}, height ${DURATION}ms ${EASE}, opacity ${DURATION}ms ease`;
        ring.style.width = "220px";
        ring.style.height = "220px";
        ring.style.opacity = "0.55";
        window.setTimeout(() => {
          if (ring) ring.style.opacity = "0";
        }, DURATION * 0.4);
      }
    });
  }, [originRect]);

  // Closing animation
  React.useEffect(() => {
    const el = frameRef.current;
    const backdrop = backdropRef.current;
    if (!closing || !el) return;

    el.style.pointerEvents = "none";
    if (backdrop) backdrop.style.pointerEvents = "none";

    const closeDuration = 380;

    if (originRect) {
      const restRect = el.getBoundingClientRect();
      const scaleX = originRect.width / restRect.width;
      const scaleY = originRect.height / restRect.height;
      const translateX = originRect.left + originRect.width / 2 - (restRect.left + restRect.width / 2);
      const translateY = originRect.top + originRect.height / 2 - (restRect.top + restRect.height / 2);

      el.style.transition = `transform ${closeDuration}ms ease, border-radius ${closeDuration}ms ease, opacity ${closeDuration}ms ease`;
      el.style.transform = `translate(-50%, -50%) translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
      el.style.borderRadius = ORIGIN_RADIUS;
      el.style.opacity = "0";
    } else {
      el.style.transition = `transform ${closeDuration}ms ease, opacity ${closeDuration}ms ease`;
      el.style.transform = "translate(-50%, -50%) scale(0.7)";
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

  const handleReply = () => {
    window.location.href = "mailto:akrammunirawel@gmail.com";
  };

  const handleTrashClick = () => {
    if (closing || shaking) return;
    setShaking(true);
    window.setTimeout(() => setShaking(false), 420);
  };

  return (
    <>
      <div
        className="mail-popup-ring"
        ref={ringRef}
        aria-hidden="true"
      />
      <div
        className="mail-popup-backdrop"
        ref={backdropRef}
        onClick={() => !closing && onRequestClose?.()}
      />
      <div
        className="mail-popup-frame"
        ref={frameRef}
        role="dialog"
        aria-label="Message from Akram"
      >
        <button
          className={`mail-popup-trash ${shaking ? "shaking" : ""}`}
          type="button"
          aria-label="Delete message (not allowed)"
          onClick={handleTrashClick}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h16" />
            <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
          </svg>
        </button>

        <div className="mail-popup-header">
          <span className="mail-popup-title">Akram</span>
        </div>

        <div className="mail-popup-body">
          {CONTACT_LINES.map((line, i) => (
            <div className="mail-popup-line" key={i}>
              <span className="mail-popup-text">{line}</span>
            </div>
          ))}
          <div className="mail-popup-line mail-popup-line--empty" />
        </div>

        <div className="mail-popup-bottombar">
          <button
            className="mail-popup-btn mail-popup-btn--back"
            type="button"
            onClick={() => !closing && onRequestClose?.()}
            disabled={closing}
          >
            Back
          </button>
          <span className="mail-popup-wii">Wii</span>
          <button
            className="mail-popup-btn mail-popup-btn--reply"
            type="button"
            onClick={handleReply}
            disabled={closing}
          >
            Reply
          </button>
        </div>
      </div>
    </>
  );
}