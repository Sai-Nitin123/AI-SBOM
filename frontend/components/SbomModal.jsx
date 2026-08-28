'use client';

import React, { useState, useEffect } from 'react';
import { X, Layers, Copy, Check } from 'lucide-react';
import { API_BASE } from '../utils/api';
import { soundEngine } from '../utils/audio';

export default function SbomModal({
  isOpen,
  onClose,
  modelTag,
  audioEnabled
}) {
  const [sbomData, setSbomData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && modelTag) {
      setLoading(true);
      fetch(`${API_BASE}/api/sbom/generate?model=${encodeURIComponent(modelTag)}&format=cyclonedx`)
        .then((r) => r.json())
        .then((data) => {
          setSbomData(data);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [isOpen, modelTag]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!sbomData) return;
    navigator.clipboard.writeText(JSON.stringify(sbomData, null, 2));
    setCopied(true);
    soundEngine.play('click', audioEnabled);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="app-modal-backdrop" onClick={onClose}>
      <div
        className="app-modal-card sbom-modal-window"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div className="modal-title-wrap">
            <div className="modal-dot blue"></div>
            <div>
              <h2>Software Bill of Materials (CycloneDX v1.5 JSON)</h2>
              <p className="modal-sub">Target Model: {modelTag} • Cryptographic Ed25519 Provenance</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <button
              className="glass-action-btn"
              style={{ padding: '0.25rem 0.55rem', fontSize: '0.68rem' }}
              onClick={handleCopy}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
            </button>
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
        </div>

        <div className="modal-scroll-content" style={{ maxHeight: '65vh' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: '#64748b' }}>
              Compiling CycloneDX v1.5 Manifest...
            </div>
          ) : (
            <pre
              style={{
                background: '#050811',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '1rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: '#a5f3fc',
                overflowX: 'auto',
                lineHeight: '1.4'
              }}
            >
              {JSON.stringify(sbomData, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
