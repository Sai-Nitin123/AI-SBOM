'use client';

import React from 'react';
import { Shield, Slash, Flag, Check, Volume2, VolumeX } from 'lucide-react';
import { soundEngine } from '../utils/audio';

export default function LiveThreatRadar({
  stats,
  particles,
  audioEnabled,
  onToggleAudio
}) {
  return (
    <div className="dashboard-panel radar-panel-card">
      <div className="panel-card-head">
        <h3>Live Threat Radar</h3>
        <button
          className="audio-toggle-icon"
          id="btn-dash-audio"
          title={audioEnabled ? "Disable Tactical Sounds" : "Enable Tactical Sounds"}
          onClick={() => {
            soundEngine.play('click', true);
            onToggleAudio();
          }}
        >
          {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>

      <div className="radar-visualizer-container" id="radar-screen-box">
        <div className="radar-concentric-circles">
          <div className="radar-ring ring-1"></div>
          <div className="radar-ring ring-2"></div>
          <div className="radar-ring ring-3"></div>
          <div className="radar-sweep-blade"></div>
          <div className="radar-center-shield">
            <Shield className="radar-shield-svg" size={14} />
          </div>

          {/* Dynamic Active Threat Particles Layer */}
          <div id="radar-live-particles-layer">
            {particles.map((p) => (
              <div
                key={p.id}
                className={`radar-particle ${p.color}-particle`}
                style={{ top: `${p.top}px`, left: `${p.left}px` }}
              ></div>
            ))}
          </div>
        </div>

        <div className="radar-legend-column">
          <div className="legend-badge red">
            <div className="legend-icon"><Slash size={14} /></div>
            <div className="legend-text">
              <span className="count" id="radar-count-blocked">{stats.blocked}</span>
              <span className="label">Blocked</span>
            </div>
          </div>
          <div className="legend-badge amber">
            <div className="legend-icon"><Flag size={14} /></div>
            <div className="legend-text">
              <span className="count" id="radar-count-flagged">{stats.flagged}</span>
              <span className="label">Flagged</span>
            </div>
          </div>
          <div className="legend-badge green">
            <div className="legend-icon"><Check size={14} /></div>
            <div className="legend-text">
              <span className="count" id="radar-count-allowed">{stats.allowed}</span>
              <span className="label">Allowed</span>
            </div>
          </div>
        </div>

        <div className="radar-bottom-live-tag">
          <span className="dot-green"></span> Live Stream Connected
        </div>
      </div>
    </div>
  );
}
