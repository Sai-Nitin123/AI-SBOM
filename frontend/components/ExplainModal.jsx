'use client';

import React from 'react';
import { X, HelpCircle, Shield, AlertTriangle, ShieldCheck } from 'lucide-react';
import { soundEngine } from '../utils/audio';

export default function ExplainModal({
  isOpen,
  onClose,
  data,
  promptText,
  modelName,
  audioEnabled
}) {
  if (!isOpen || !data) return null;

  const isBlock = data.action === 'BLOCK';
  const isFlag = data.action === 'FLAG_FOR_REVIEW';
  const verdictColor = isBlock ? 'var(--color-red)' : isFlag ? 'var(--color-amber)' : 'var(--color-green)';

  return (
    <div className="app-modal-backdrop" onClick={onClose}>
      <div
        className="app-modal-card explain-modal-window"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div className="modal-title-wrap">
            <div className={`modal-dot ${isBlock ? 'red' : isFlag ? 'amber' : 'green'}`}></div>
            <div>
              <h2>Decision Analysis: {data.action}</h2>
              <p className="modal-sub">Multi-Layer Decision Engine & Behavioral Evidence</p>
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
          {/* Executive Verdict Box */}
          <div
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: `1px solid ${isBlock ? 'rgba(244,63,94,0.4)' : isFlag ? 'rgba(245,158,11,0.4)' : 'rgba(16,185,129,0.4)'}`,
              padding: '0.85rem',
              borderRadius: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <HelpCircle size={18} style={{ color: verdictColor }} />
              <strong style={{ fontSize: '0.88rem', color: '#ffffff' }}>
                {isBlock
                  ? 'CRITICAL THREAT: Execution Terminated Pre-Inference'
                  : isFlag
                  ? 'ELEVATED RISK: Flagged for Human Supervisor'
                  : 'BENIGN INTERACTION: Verified Safe to Forward'}
              </strong>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '0.45rem', lineHeight: '1.4' }}>
              {data.explanation || 'Evaluated across multi-grain NLP classifiers and runtime telemetry.'}
            </p>
          </div>

          {/* Target Model Exposure Status Proof */}
          <div
            style={{
              background: isBlock ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)',
              border: `1px solid ${isBlock ? 'rgba(244,63,94,0.3)' : 'rgba(16,185,129,0.3)'}`,
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.74rem',
              fontWeight: '700',
              color: verdictColor
            }}
          >
            TARGET MODEL ISOLATION: {isBlock ? 'ZERO EXPOSURE (Terminated before model ingestion)' : 'FORWARDED SAFELY (Executed in monitored sandbox)'}
          </div>

          {/* 4-Layer Decision Breakdown Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '800' }}>LAYER 1: PRE-SCAN GUARDRAIL</span>
              <p style={{ fontSize: '0.75rem', color: '#ffffff', marginTop: '0.2rem' }}>
                Score: {data.pre_scan_score?.toFixed(3) || '0.000'} • {data.pre_scan_score >= 0.6 ? 'TRIGGERED' : 'CLEAN'}
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '800' }}>LAYER 2: ISOLATION FOREST</span>
              <p style={{ fontSize: '0.75rem', color: '#ffffff', marginTop: '0.2rem' }}>
                Anomaly Score: {data.if_score?.toFixed(3) || '0.000'}
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '800' }}>LAYER 2: LSTM TRANSITIONS</span>
              <p style={{ fontSize: '0.75rem', color: '#ffffff', marginTop: '0.2rem' }}>
                Sequence Score: {data.lstm_score?.toFixed(3) || '0.000'}
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '800' }}>LAYER 2: XGBOOST EXFILTRATION</span>
              <p style={{ fontSize: '0.75rem', color: '#ffffff', marginTop: '0.2rem' }}>
                Exfiltration Score: {data.xgb_score?.toFixed(3) || '0.000'}
              </p>
            </div>
          </div>

          {/* Raw Prompt Evaluated */}
          <div>
            <span className="section-field-label">EVALUATED PROMPT TEXT</span>
            <div
              style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '0.65rem',
                borderRadius: '6px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: '#94a3b8'
              }}
            >
              "{promptText}"
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
