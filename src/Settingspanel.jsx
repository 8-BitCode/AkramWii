/* SettingsPanel.jsx */
import React from "react";
import "./Mailpopup.css";
import "./Settingspanel.css";
import sound from "./Soundmanager";

const DURATION = 560;
const EASE = "cubic-bezier(0.22, 1.12, 0.3, 1)";
const ORIGIN_RADIUS = "50%";

function Toggle({ label, checked, onChange }) {
  return (
    <div className="settings-row">
      <span className="settings-label">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`settings-toggle ${checked ? "on" : "off"}`}
        onClick={() => {
          sound.play('select');
          onChange(!checked);
        }}
      >
        <span className="settings-toggle-knob" />
      </button>
    </div>
  );
}

function Slider({ label, value, onChange, disabled }) {
  return (
    <div className={`settings-row ${disabled ? "disabled" : ""}`}>
      <span className="settings-label">{label}</span>
      <div className="settings-slider-wrap">
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="settings-slider"
          aria-label={label}
          style={{ cursor: 'none !important' }}
        />
        <span className="settings-slider-value">{value}</span>
      </div>
    </div>
  );
}

function Segmented({ label, options, value, onChange }) {
  return (
    <div className="settings-row">
      <span className="settings-label">{label}</span>
      <div className="settings-segmented" role="group" aria-label={label}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`settings-segment ${value === opt.value ? "active" : ""}`}
            onClick={() => {
              if (value !== opt.value) sound.play('select');
              onChange(opt.value);
            }}
            aria-pressed={value === opt.value}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPanel({
  originRect,
  closing,
  settings,
  onSettingChange,
  onReset,
  onRequestClose,
  onClosed,
}) {
  const frameRef = React.useRef(null);
  const backdropRef = React.useRef(null);
  const ringRef = React.useRef(null);
  const timeoutRef = React.useRef(null);
  const rafRef = React.useRef(null);
  const isMountedRef = React.useRef(true);
  const [resetting, setResetting] = React.useState(false);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Opening animation: morph from the cog orb into the square frame
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

  const handleReset = () => {
    if (resetting) return;
    sound.play('select');
    setResetting(true);
    onReset?.();
    window.setTimeout(() => setResetting(false), 500);
  };

  return (
    <>
      <div className="mail-popup-ring settings-ring" ref={ringRef} aria-hidden="true" />
      <div
        className="mail-popup-backdrop"
        ref={backdropRef}
        onClick={() => !closing && onRequestClose?.()}
      />
      <div
        className="settings-frame"
        ref={frameRef}
        role="dialog"
        aria-label="Settings"
      >
        <button
          className={`settings-reset ${resetting ? "spinning" : ""}`}
          type="button"
          aria-label="Reset settings to default"
          onClick={handleReset}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 11A8 8 0 1 0 18.5 15.5" />
            <polyline points="20,4 20,11 13,11" />
          </svg>
        </button>

        <div className="settings-header">
          <span className="settings-title">Settings</span>
        </div>

        <div className="settings-body">
          <Toggle
            label="Music"
            checked={settings.musicOn}
            onChange={(v) => onSettingChange("musicOn", v)}
          />
          <Slider
            label="Music Volume"
            value={settings.musicVolume}
            disabled={!settings.musicOn}
            onChange={(v) => onSettingChange("musicVolume", v)}
          />
          <Toggle
            label="Sound Effects"
            checked={settings.sfxOn}
            onChange={(v) => onSettingChange("sfxOn", v)}
          />
          <Slider
            label="SFX Volume"
            value={settings.sfxVolume}
            disabled={!settings.sfxOn}
            onChange={(v) => onSettingChange("sfxVolume", v)}
          />
          <Slider
            label="Screen Brightness"
            value={settings.brightness}
            onChange={(v) => onSettingChange("brightness", v)}
          />
          <Segmented
            label="Clock Format"
            value={settings.clockFormat}
            onChange={(v) => onSettingChange("clockFormat", v)}
            options={[
              { value: "24", label: "24h" },
              { value: "12", label: "12h" },
            ]}
          />
        </div>

        <div className="settings-bottombar">
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
          <span className="mail-popup-wii">Having fun setting up?</span>
          <span className="settings-bottombar-spacer" aria-hidden="true" />
        </div>
      </div>
    </>
  );
}