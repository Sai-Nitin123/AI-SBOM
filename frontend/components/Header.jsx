'use client';

import React, { useState, useEffect } from 'react';
import { Palette, Zap } from 'lucide-react';
import { soundEngine } from '../utils/audio';

const TITLES = {
  dashboard: {
    title: 'Platform Overview & Live Operations',
    sub: 'Real-Time Interception Metrics, Behavioral Anomaly Scores & Activity Feeds'
  },
  console: {
    title: 'Live Threat Console & Interceptor Gateway',
    sub: 'Pre-Inference Prompt Injection Testing, Boundary Probing & Real-Time Isolation'
  },
  models: {
    title: 'AI Model Registry & Supply-Chain Integrity',
    sub: 'GGUF Binaries, Quantization Levels, Cryptographic Checksums & 1-Click Deep Scan'
  },
  reports: {
    title: 'Security Reports & Audit Ledger',
    sub: 'Cryptographically Signed Trace Logs, CycloneDX SBOMs & Forensic PDF Exports'
  },
  settings: {
    title: 'System Settings & Theme Customization',
    sub: 'Platform Visual Aesthetics, Audio Feedback, Alert Thresholds & Sandbox Policies'
  }
};

const THEMES = [
  { id: 'theme-obsidian', name: 'Obsidian' },
  { id: 'theme-cyberpunk', name: 'Cyberpunk' },
  { id: 'theme-emerald', name: 'Emerald' },
  { id: 'theme-sapphire', name: 'Sapphire' },
  { id: 'theme-titanium', name: 'Titanium' }
];

export default function Header({
  currentPage,
  currentTheme,
  onThemeChange,
  onQuickScan,
  audioEnabled
}) {
  const [clock, setClock] = useState('00:00:00 UTC');

  useEffect(() => {
    const updateClock = () => {
      const d = new Date();
      const utc = d.toUTCString().split(' ')[4];
      setClock(`${utc} UTC`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const cycleTheme = () => {
    soundEngine.play('click', audioEnabled);
    const idx = THEMES.findIndex((t) => t.id === currentTheme);
    const nextIdx = (idx + 1) % THEMES.length;
    onThemeChange(THEMES[nextIdx].id);
  };

  const currentThemeObj = THEMES.find((t) => t.id === currentTheme) || THEMES[0];
  const info = TITLES[currentPage] || TITLES.dashboard;

  return (
    <header className="main-top-header">
      <div className="welcome-heading">
        <h1 id="page-main-title">{info.title}</h1>
        <p id="page-main-sub">{info.sub}</p>
      </div>

      <div className="top-header-actions">
        {/* Quick Theme Switcher Pill */}
        <button
          className="theme-quick-switch-btn"
          id="top-theme-toggle"
          title="Click to cycle themes"
          onClick={cycleTheme}
        >
          <Palette size={14} />
          <span>Theme: {currentThemeObj.name}</span>
        </button>

        {/* Live Status Badge */}
        <div className="header-status-badge">
          <span className="status-live-dot green"></span>
          <span className="status-badge-text">
            <span className="badge-label">GATEWAY:</span>
            <span className="badge-state">ARMED</span>
          </span>
        </div>

        {/* Real-time UTC Clock */}
        <div className="realtime-clock-display" id="realtime-clock">
          {clock}
        </div>

        {/* Quick Scan Action */}
        <button
          className="quick-scan-top-btn"
          id="btn-top-quick-scan"
          onClick={() => {
            soundEngine.play('click', audioEnabled);
            onQuickScan();
          }}
        >
          <Zap size={14} />
          <span>Quick Scan</span>
        </button>
      </div>
    </header>
  );
}
