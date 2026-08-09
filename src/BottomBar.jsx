import React, { useState, useEffect, useRef } from "react";
import player from "./player.png";
import mail from "./mail.png";
import phone from "./phone.png";
import sign from "./sign.png";
import project from "./project.png";

const dispatchSecret = (item) => {
  window.dispatchEvent(new CustomEvent('secretFound', { detail: { item } }));
};

const PORTRAITS = {
  default:   player,
  mail:      mail,
  phone:     phone,
  sign:      sign,
  companion: project,
};

const BottomBar = ({ isMobile, theme = 'earthbound' }) => {
  const isWii = theme === 'wii';

  const defaultMessage = isMobile
    ? "Tap the screen to move around."
    : "Use arrow keys or WASD to move around. Hold Shift to run";

  const [message, setMessage] = useState(defaultMessage);
  const [portrait, setPortrait] = useState(PORTRAITS.default);
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isFirefox, setIsFirefox] = useState(false);
  const targetMessageRef = useRef("");
  const typingTimeoutRef = useRef(null);
  const hooked = useRef(false);

  useEffect(() => {
    const isFirefoxBrowser = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    setIsFirefox(isFirefoxBrowser);
    if (isFirefoxBrowser) {
      setMessage("⚠️ This website doesn't work on Firefox. Please try a different web explorer for the best experience.");
      setPortrait(PORTRAITS.default);
    }
  }, []);

  useEffect(() => {
    const font = new FontFace('Earthbound', 'url(/earthbound.otf)');
    font.load().then((f) => document.fonts.add(f)).catch(console.error);
  }, []);

  const typeText = (newText) => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    targetMessageRef.current = newText;
    if (displayText === newText) return;
    setDisplayText("");
    setIsTyping(true);
    let i = 0;
    const tick = () => {
      if (i < targetMessageRef.current.length) {
        setDisplayText(targetMessageRef.current.substring(0, i + 1));
        i++;
        typingTimeoutRef.current = setTimeout(tick, 28);
      } else {
        setIsTyping(false);
      }
    };
    tick();
  };

  useEffect(() => {
    if (isFirefox) return;

    if (typeof message === 'object' && message !== null) {
      setDisplayText(message);
      setIsTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    } else if (typeof message === 'string') {
      typeText(message);
    }
  }, [message, isFirefox]);

  useEffect(() => {
    if (isFirefox) return;

    let retryInterval = null;

    const hookIframe = () => {
      const iframe = document.querySelector('iframe');
      if (!iframe) return false;
      if (hooked.current) return true;

      const tryHook = () => {
        const iframeWindow = iframe.contentWindow;
        if (!iframeWindow || !iframeWindow.console) return;

        hooked.current = true;
        const originalLog = iframeWindow.console.log;

        iframeWindow.console.log = function (...args) {
          originalLog.apply(iframeWindow.console, args);
          const logText = args.join(' ');

          if (logText.includes('INTERACTION:') && logText.includes(':enter')) {
            if (logText.includes('mail')) {
              setMessage(isMobile ? "Tap to read mail" : "Press E/Enter to read mail");
              setPortrait(PORTRAITS.mail);
              dispatchSecret('mail');
            } else if (logText.includes('phone')) {
              setMessage(isMobile ? "Tap to answer phone" : "Press E/Enter to answer phone");
              setPortrait(PORTRAITS.phone);
              dispatchSecret('phone');
            } else if (logText.includes('cv')) {
              setMessage(isMobile ? "Tap to download CV" : "Press E/Enter to download CV");
              setPortrait(PORTRAITS.sign);
              dispatchSecret('sign');
            } else if (logText.includes('companion')) {
              setMessage(isMobile ? "Tap to choose your Project" : "Press E/Enter to choose your Project");
              setPortrait(PORTRAITS.companion);
              dispatchSecret('companion');
            }
          }

          else if (logText.includes('INTERACTION:') && logText.includes(':exit')) {
            setMessage(defaultMessage);
            setPortrait(PORTRAITS.default);
          }

          else if (logText.includes('COMPANION:')) {
            const companion = logText.split(':')[1];
            let url = '';
            if (companion === 'Magnus Map') url = 'https://magnusmap.netlify.app';
            else if (companion === "Let's Go Gambling") url = 'https://letsgogambling.pages.dev';
            else if (companion === 'Abstract Artist') url = 'https://8-bitcode.github.io/AbstractArtist/';
            setMessage(`Redirecting to ${companion}...`);
            setTimeout(() => {
              window.open(url, '_blank');
              setMessage(defaultMessage);
            }, 1000);
          }

          else if (logText.includes('PHONE:email')) {
            const email = logText.substring(logText.indexOf('PHONE:email:') + 12);
            setMessage(<span>Email: <a href={`mailto:${email}`} style={{ color: '#10F868', textDecoration: 'underline' }}>{email}</a></span>);
          } else if (logText.includes('PHONE:github')) {
            const github = logText.substring(logText.indexOf('PHONE:github:') + 13);
            setMessage(<span>GitHub: <a href={github} target="_blank" rel="noopener noreferrer" style={{ color: '#10F868', textDecoration: 'underline' }}>{github}</a></span>);
          } else if (logText.includes('PHONE:linkedin')) {
            const linkedin = logText.substring(logText.indexOf('PHONE:linkedin:') + 15);
            setMessage(<span>LinkedIn: <a href={linkedin} target="_blank" rel="noopener noreferrer" style={{ color: '#10F868', textDecoration: 'underline' }}>{linkedin}</a></span>);
          }

          else if (logText.includes('CV:reading:start')) {
            const link = document.createElement('a');
            link.href = '/cv.pdf';
            link.download = 'Akram_Munir_Awel_CV.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setMessage("Downloading CV...");
            window.dispatchEvent(new CustomEvent('gameActivityChange', { detail: { isGameActive: false } }));
            setTimeout(() => {
              setMessage(defaultMessage);
              window.dispatchEvent(new CustomEvent('gameActivityChange', { detail: { isGameActive: true } }));
            }, 3000);
          }

          else if (logText.includes('MAIL:reading:start') || logText.includes('MAIL:read')) {
            dispatchSecret('mail');
          }
        };
      };

      if (iframe.contentDocument?.readyState === 'complete') {
        tryHook();
        return hooked.current;
      } else {
        iframe.addEventListener('load', tryHook);
        return false;
      }
    };

    if (!hookIframe()) {
      retryInterval = setInterval(() => {
        if (hookIframe()) clearInterval(retryInterval);
      }, 500);
    }

    return () => {
      if (retryInterval) clearInterval(retryInterval);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [isMobile, isFirefox]);

  const containerStyle = isWii ? {
    background: '#ffffff',
    border: '3px solid #0a0814',
    borderRadius: '0px',
    boxShadow: `
      inset 6px 6px 0 #c0d0d8,
      inset -6px -6px 0 #ffffff
    `,
    display: 'flex',
    alignItems: 'center',
    padding: '14px 20px',
    gap: '16px',
    minHeight: '72px',
    boxSizing: 'border-box',
  } : {
    background: '#3a5650',               /* panel – replaces #2a1610 */
    borderStyle: 'solid',
    borderWidth: '10px',
    borderColor: '#303030 #10F868 #10F868 #303030',  /* void / neon edges */
    borderRadius: '0px',
    boxShadow: `
      inset 8px 8px 0 #303030,           /* deep shadow recess */
      0 8px 18px rgba(0,0,0,0.5)
    `,
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    gap: '14px',
    minHeight: '72px',
    boxSizing: 'border-box',
  };

  const portraitFrameStyle = isWii ? {
    width: '52px', height: '52px', flexShrink: 0,
    background: '#f2f7f9', 
    border: '2px solid #0a0814', 
    borderRadius: '0px',
    boxShadow: 'inset 3px 3px 0 #c0d0d8, inset -3px -3px 0 #ffffff',
    overflow: 'hidden',
  } : {
    width: '54px', height: '54px', flexShrink: 0,
    boxSizing: 'border-box',
    background: '#507870',              /* stone tone – replaces #3d2418 */
    borderStyle: 'solid',
    borderWidth: '4px',
    borderColor: '#303030 #10F868 #10F868 #303030',
    borderRadius: '0px',
    boxShadow: '0 3px 6px rgba(0,0,0,0.4)',
    overflow: 'hidden',
  };

  const messageStyle = isWii ? {
    flex: 1,
    fontFamily: 'WiiMedium, "Segoe UI", sans-serif',
    fontSize: 'clamp(12px, 1.1vw, 15px)',
    color: '#3a3b3f',
    lineHeight: 1.6,
  } : {
    flex: 1,
    fontFamily: 'Earthbound, "Press Start 2P", monospace',
    fontSize: 'clamp(11px, 1.1vw, 15px)',
    color: '#e4f2e9',                    /* cream → light mint for readability */
    lineHeight: 1.7,
  };

  const cursorStyle = {
    animation: 'blink 0.6s step-end infinite',
    marginLeft: '2px',
    color: isWii ? '#1a8a9a' : '#10F868',  /* neon cursor */
  };

  return (
    <div style={containerStyle}>
      <div style={portraitFrameStyle}>
        <img
          src={portrait}
          alt="portrait"
          style={{
            width: '100%', height: '100%',
            objectFit: 'contain',
            imageRendering: 'pixelated',
            display: 'block',
          }}
        />
      </div>

      <div style={messageStyle}>
        {isFirefox ? (typeof message === 'string' ? message : message) : (displayText || (typeof message === 'string' ? message : message))}
        {!isFirefox && isTyping && <span style={cursorStyle}>▍</span>}
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(4px)} }
      `}</style>
    </div>
  );
};

export default BottomBar;