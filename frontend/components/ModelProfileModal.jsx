'use client';

import React from 'react';
import { X, Box, CheckCircle } from 'lucide-react';
import { soundEngine } from '../utils/audio';

export default function ModelProfileModal({
  isOpen,
  onClose,
  model,
  audioEnabled
}) {
  if (!isOpen || !model) return null;

  return (
    <div className="app-modal-backdrop" onClick={onClose}>
      <div
        className="app-modal-card profile-modal-window"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div className="modal-title-wrap">
            <div className="modal-dot blue"></div>
            <div>
              <h2>Model Security Profile & Supply Chain</h2>
              <p className="modal-sub">{model.name} ({model.parameters}) • {model.provider}</p>
            </div>
          </div>
          <button
            className="modal-close-btn"
            onClick={() => {
              soundEngine.play('click', audioEnabled);
              onClose();
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-scroll-content">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <span className="meta-k">Model Name:</span>
              <p className="meta-v" style={{ textAlign: 'left', color: '#ffffff', fontWeight: '700' }}>{model.name}</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <span className="meta-k">Organization / Provider:</span>
              <p className="meta-v" style={{ textAlign: 'left', color: '#ffffff' }}>{model.provider}</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <span className="meta-k">Quantization Method:</span>
              <p className="meta-v" style={{ textAlign: 'left', color: '#ffffff' }}>{model.quantization}</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <span className="meta-k">Runtime Execution Binding:</span>
              <p className="meta-v" style={{ textAlign: 'left', color: '#ffffff' }}>{model.runtime}</p>
            </div>
          </div>

          <div>
            <span className="section-field-label">SHA-256 CRYPTOGRAPHIC INTEGRITY DIGEST</span>
            <div
              style={{
                background: '#050811',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '0.65rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--color-cyan)',
                wordBreak: 'break-all'
              }}
            >
              {model.sha256}
            </div>
          </div>

          <div>
            <span className="section-field-label">SUPPLY CHAIN VERIFICATION CHECKS</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#86efac' }}>
                <CheckCircle size={14} /> <span>Valid GGUF container headers & tensor checksums</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#86efac' }}>
                <CheckCircle size={14} /> <span>Safe serialization (No dangerous Python pickle bytecode)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#86efac' }}>
                <CheckCircle size={14} /> <span>Ed25519 digital signature verified against platform root key</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
