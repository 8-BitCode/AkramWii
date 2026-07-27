/* WarningScreen.jsx */
import React from "react";
import "./Warningscreen.css";

export default function WarningScreen() {
  return (
    <div className="warning-screen">
      <div className="warning-body">
        <div className="warning-title-row">
          <svg className="warning-icon" viewBox="0 0 100 90" aria-hidden="true">
            <path
              d="M50 4 L96 84 L4 84 Z"
              fill="#ffd21f"
              stroke="#000"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            <rect x="45.5" y="30" width="9" height="26" rx="3.5" fill="#111" />
            <circle cx="50" cy="68" r="5" fill="#111" />
          </svg>
          <h1>WARNING&nbsp;-&nbsp;HEALTH AND SAFETY</h1>
        </div>

        <p className="warning-text">
          BEFORE PLAYING, READ YOUR OPERATIONS
          <br />
          MANUAL FOR IMPORTANT INFORMATION
          <br />
          ABOUT YOUR HEALTH AND SAFETY.
        </p>

        <p className="warning-online">
          Also online at
          <br />
          <span className="warning-link">www.nintendo.com/healthsafety/</span>
        </p>

        <div className="warning-continue">
          <span className="scroll-chevron" aria-hidden="true">
            <svg viewBox="0 0 24 14" width="26" height="16">
              <polyline
                points="1,1 12,12 23,1"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>Scroll to continue</span>
        </div>
      </div>
    </div>
  );
}