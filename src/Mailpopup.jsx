/* MailPopup.jsx */
import React from "react";
import "./Mailpopup.css";
import sound from "./Soundmanager";
import { getEmail, getMailtoHref } from "./Contact";
import { isFirefox } from "./Env";

const FIREFOX = isFirefox();

const DURATION = 560;
const EASE = "cubic-bezier(0.22, 1.12, 0.3, 1)";
const ORIGIN_RADIUS = "50%";

// Built at render time via getEmail() rather than written out here, so the
// address never sits in the source/bundle as a plain, scrapable string.
const CONTACT_LINES = [
  "Akram Munir Awel",
  "London",
  getEmail(),
  "linkedin.com/in/akrammunirawel/",
];

// Fixed, never derived from user input — so every submission that comes
// through always carries this exact subject line, making it trivial to
// filter/whitelist in a mail client.
const FORM_SUBJECT = "AkramWii - New Message";

export default function MailPopup({ originRect, closing, onRequestClose, onClosed }) {
  const frameRef = React.useRef(null);
  const backdropRef = React.useRef(null);
  const ringRef = React.useRef(null);
  const timeoutRef = React.useRef(null);
  const rafRef = React.useRef(null);
  const isMountedRef = React.useRef(true);
  const [shaking, setShaking] = React.useState(false);

  const [formValues, setFormValues] = React.useState({
    name: "",
    email: "",
    message: "",
    honey: "",
  });
  const [formStatus, setFormStatus] = React.useState("idle"); // idle | sending | sent | error

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
      // Firefox handles animated border-radius (esp. alongside box-shadow)
      // noticeably worse than transform/opacity, which stay compositor-only.
      // On Firefox we skip it from the transition list entirely below, so
      // clearing el.style.borderRadius still lands on the frame's real
      // 10px radius (from Mailpopup.css) — it just snaps there instantly
      // on frame 1 instead of morphing smoothly over the full duration.
      const radiusTransition = FIREFOX ? "" : `, border-radius ${DURATION}ms ease`;
      el.style.transition = `transform ${DURATION}ms ${EASE}${radiusTransition}, opacity ${Math.round(DURATION * 0.6)}ms ease`;
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

      el.style.transition = FIREFOX
        ? `transform ${closeDuration}ms ease, opacity ${closeDuration}ms ease`
        : `transform ${closeDuration}ms ease, border-radius ${closeDuration}ms ease, opacity ${closeDuration}ms ease`;
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
    sound.play('select');
    window.location.href = getMailtoHref();
  };

  const handleTrashClick = () => {
    if (closing || shaking) return;
    sound.play('select');
    setShaking(true);
    window.setTimeout(() => setShaking(false), 420);
  };

  const handleFieldChange = (field) => (e) => {
    setFormValues((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (formStatus === "sending") return;

    // Honeypot: real users never see or fill this field (hidden via CSS).
    // Bots that blindly fill every input trip it, and we silently drop
    // the submission without hitting FormSubmit or showing an error.
    if (formValues.honey) {
      setFormStatus("sent");
      return;
    }

    if (!formValues.name.trim() || !formValues.email.trim() || !formValues.message.trim()) {
      setFormStatus("error");
      return;
    }

    setFormStatus("sending");
    sound.play('select');

    try {
      const res = await fetch(`https://formsubmit.co/ajax/${getEmail()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: formValues.name,
          email: formValues.email,
          message: formValues.message,
          _subject: FORM_SUBJECT,
          _template: "table",
          _captcha: "false",
        }),
      });

      if (!res.ok) throw new Error("Request failed");

      setFormStatus("sent");
      setFormValues({ name: "", email: "", message: "", honey: "" });
    } catch {
      setFormStatus("error");
    }
  };

  // Helper to detect LinkedIn line
  const isLinkedInLine = (text) => text.includes("linkedin.com");

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

        <div className="mail-popup-body mail-popup-body--scroll">
          {CONTACT_LINES.map((line, i) => (
            <div className="mail-popup-line" key={i}>
              {isLinkedInLine(line) ? (
                <a
                  href={`https://${line}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mail-popup-link"
                >
                  {line}
                </a>
              ) : (
                <span className="mail-popup-text">{line}</span>
              )}
            </div>
          ))}

          <div className="mail-popup-divider">
            <span>or drop me a note directly</span>
          </div>

          <p className="mail-popup-invite">
            Want to give me a job? ( please please please ), or just want to say hi?
            Whatever it is, feel free to reach out!! ↓.
          </p>

          {formStatus === "sent" ? (
            <div className="mail-popup-form-status mail-popup-form-status--sent">
              Message sent! I'll get back to you soon. 🎉
            </div>
          ) : (
            <form className="mail-popup-form" onSubmit={handleFormSubmit}>
              <input
                type="text"
                name="_honey"
                value={formValues.honey}
                onChange={handleFieldChange("honey")}
                className="mail-popup-honey"
                tabIndex="-1"
                autoComplete="off"
                aria-hidden="true"
              />

              <label className="mail-popup-field">
                <span className="mail-popup-field-label">Name</span>
                <input
                  type="text"
                  required
                  value={formValues.name}
                  onChange={handleFieldChange("name")}
                  className="mail-popup-input"
                  placeholder="Your name"
                />
              </label>

              <label className="mail-popup-field">
                <span className="mail-popup-field-label">Email</span>
                <input
                  type="email"
                  required
                  value={formValues.email}
                  onChange={handleFieldChange("email")}
                  className="mail-popup-input"
                  placeholder="you@example.com"
                />
              </label>

              <label className="mail-popup-field">
                <span className="mail-popup-field-label">Message</span>
                <textarea
                  required
                  value={formValues.message}
                  onChange={handleFieldChange("message")}
                  className="mail-popup-textarea"
                  placeholder="What's on your mind?"
                  rows={4}
                />
              </label>

              {formStatus === "error" && (
                <div className="mail-popup-form-status mail-popup-form-status--error">
                  Something went wrong — mind trying again, or emailing me directly below?
                </div>
              )}

              <button
                type="submit"
                className="mail-popup-send-btn"
                disabled={formStatus === "sending"}
              >
                {formStatus === "sending" ? "Sending…" : "Send message"}
              </button>
            </form>
          )}
        </div>

        <div className="mail-popup-bottombar">
          <button
            className="mail-popup-btn mail-popup-btn--back"
            type="button"
            onClick={() => {
              if (closing) return;
              sound.play('back');
              onRequestClose?.();
            }}
            disabled={closing}
          >
            Back
          </button>
          <span className="mail-popup-wii">HII, person reading this</span>
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