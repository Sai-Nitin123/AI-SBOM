'use client';

import React from 'react';
import { Palette, Volume2, VolumeX, Shield, Sliders } from 'lucide-react';
import { soundEngine } from '../utils/audio';

const THEMES = [
  { id: 'theme-obsidian', name: 'Obsidian Navy', desc: 'Dark cyber defense (Default)', orbClass: 'obsidian' },
  { id: 'theme-cyberpunk', name: 'Cyberpunk Neon', desc: 'Glowing cyan & purple', orbClass: 'cyberpunk' },
  { id: 'theme-emerald', name: 'Matrix Emerald', desc: 'Terminal phosphor green', orbClass: 'emerald' },
  { id: 'theme-sapphire', name: 'Sapphire Blue', desc: 'Royal blue & azure glass', orbClass: 'sapphire' },
  { id: 'theme-titanium', name: 'Titanium Light', desc: 'Clean modern glassmorphism', orbClass: 'titanium' }
];

export default function SettingsView({
  currentTheme,
  onThemeChange,
  audioEnabled,
  onToggleAudio,
  onShowToast
}) {
  return (
    <div className="page-container" id="page-settings">
      <div className="page-top-actions-bar">
        <span className="section-tagline">
          Platform Configuration • 5 Animated CSS Themes • Security Threshold Calibration
        </span>
      </div>

      <div className="settings-form-layout">
        {/* 5 Animated Themes Grid */}
        <div className="settings-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Palette size={16} style={{ color: 'var(--color-cyan)' }} />
            <h3>Platform Visual Aesthetics & Themes</h3>
          </div>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            Select an animated cybersecurity theme. Settings are saved across sessions.
          </p>

          <div className="theme-options-grid">
            {THEMES.map((t) => {
              const isActive = currentTheme === t.id;
              return (
                <div
                  key={t.id}
                  className={`theme-select-chip ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    soundEngine.play('click', audioEnabled);
                    onThemeChange(t.id);
                    onShowToast({
                      title: 'Theme Applied',
                      message: `Switched to ${t.name} theme.`,
                      type: 'success'
                    });
                  }}
                >
                  <div className={`theme-preview-orb ${t.orbClass}`}></div>
                  <div>
                    <strong>{t.name}</strong>
                    <span>{t.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Audio Feedback Preferences */}
        <div className="settings-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Volume2 size={16} style={{ color: 'var(--color-cyan)' }} />
            <h3>Tactical Audio Feedback</h3>
          </div>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            Synthesized Web Audio API sound effects for prompt evaluation, alerts, and clicks.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
            <button
              className="primary-action-btn"
              style={{
                background: audioEnabled ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                borderColor: audioEnabled ? 'var(--color-green)' : 'var(--border-subtle)',
                color: '#ffffff'
              }}
              onClick={() => {
                soundEngine.play('click', true);
                onToggleAudio();
              }}
            >
              {audioEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              <span>{audioEnabled ? 'Audio Effects: ENABLED' : 'Audio Effects: DISABLED'}</span>
            </button>
          </div>
        </div>

        {/* Security Thresholds */}
        <div className="settings-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Sliders size={16} style={{ color: 'var(--color-cyan)' }} />
            <h3>Detection Gateway Thresholds</h3>
          </div>

          <div className="form-row">
            <label>Pre-Scan Injection Sensitivity Threshold (Layer 1)</label>
            <input type="text" className="modern-text-input" defaultValue="0.60 (Strict Guardrail)" readOnly />
          </div>

          <div className="form-row">
            <label>Deterministic Hard Policy Rule Engine (Layer 3)</label>
            <input type="text" className="modern-text-input" defaultValue="Zero-Tolerance Active (Credential & Shell Sandbox)" readOnly />
          </div>
        </div>

        {/* Privacy & Provenance Card */}
        <div className="settings-card privacy-callout-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Shield size={16} style={{ color: 'var(--color-cyan)' }} />
            <h3>Cryptographic Provenance & Zero-Exposure Guarantee</h3>
          </div>
          <p>
            AI-SBOM operates as a local reverse-proxy firewall. When adversarial prompt injections or unauthorized system instructions are detected at Layer 1, the execution is terminated immediately without ever passing untrusted tokens to your local LLM weights.
          </p>
        </div>
      </div>
    </div>
  );
}
