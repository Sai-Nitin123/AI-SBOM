'use client';

import React, { useState } from 'react';
import {
  Box,
  Layers,
  Search,
  CheckCircle,
  Play,
  RotateCcw,
  Cpu
} from 'lucide-react';
import { API_BASE } from '../utils/api';
import { soundEngine } from '../utils/audio';

export default function ModelsView({
  models,
  onOpenModelProfile,
  onOpenSbomModal,
  onScanComplete,
  audioEnabled,
  onShowToast
}) {
  const [scanning, setScanning] = useState(false);
  const [scanModel, setScanModel] = useState(models[0]?.tag || 'llama3.2:3b');
  const [scanProgress, setScanProgress] = useState(0);
  const [stageName, setStageName] = useState('');
  const [stageLogs, setStageLogs] = useState([]);

  const handleStartScan = async (modelTag) => {
    setScanning(true);
    setScanModel(modelTag);
    setScanProgress(5);
    setStageName('Initiating Supply-Chain & Adversarial Scan...');
    setStageLogs([]);
    soundEngine.play('click', audioEnabled);

    try {
      const startRes = await fetch(`${API_BASE}/api/scan/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelTag, scan_type: 'Full AI Security Scan' })
      });
      const startData = await startRes.json();
      const scanId = startData.scan_id;

      // Poll progress across 10 genuine stages
      const pollInterval = setInterval(async () => {
        try {
          const stRes = await fetch(`${API_BASE}/api/scan/status/${scanId}`);
          const stData = await stRes.json();

          setScanProgress(stData.progress_percent || 0);
          setStageName(stData.stage_name || 'Analyzing...');
          setStageLogs(stData.stages_log || []);

          if (stData.status === 'completed' || stData.progress_percent >= 100) {
            clearInterval(pollInterval);
            setScanning(false);
            soundEngine.play('success', audioEnabled);
            onShowToast({
              title: 'Model Scan Completed',
              message: `Generated official CycloneDX SBOM & Security Assessment for ${modelTag}.`,
              type: 'success'
            });
            onScanComplete();
          }
        } catch {
          clearInterval(pollInterval);
          setScanning(false);
        }
      }, 500);

    } catch (err) {
      setScanning(false);
      onShowToast({
        title: 'Scan Error',
        message: err.message,
        type: 'danger'
      });
    }
  };

  return (
    <div className="page-container" id="page-models">
      <div className="page-top-actions-bar">
        <span className="section-tagline">
          Local Model Supply Chain Registry • Binary Cryptographic Digests • 10-Stage Security Scanner
        </span>
      </div>

      {/* Live Scan Execution Card (when scanning) */}
      {scanning && (
        <div className="scan-execution-card">
          <div className="scan-live-header">
            <div>
              <h3>Security Scan in Progress: {scanModel}</h3>
              <p>{stageName}</p>
            </div>
            <div className="scan-pct-badge">{scanProgress}%</div>
          </div>

          <div className="scan-large-track">
            <div className="scan-large-fill" style={{ width: `${scanProgress}%` }}></div>
          </div>

          <div className="scan-stages-log-deck">
            {stageLogs.map((s, idx) => (
              <div key={idx} className={`stage-log-item ${s.status === 'completed' ? 'complete' : 'running'}`}>
                <CheckCircle size={14} />
                <span>Stage {s.stage}: {s.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Models Inventory Grid */}
      <div className="models-inventory-grid">
        {models.map((m) => {
          const isHighSecurity = m.security_score >= 90;
          return (
            <div key={m.tag} className="model-inventory-card">
              <div className="model-card-top">
                <div className="model-card-title">
                  <h3>{m.name}</h3>
                  <span>{m.provider} • {m.runtime}</span>
                </div>
                <span className={`security-badge ${isHighSecurity ? 'secure' : 'warning'}`}>
                  SCORE: {m.security_score}/100
                </span>
              </div>

              <div className="model-meta-grid">
                <span className="meta-k">Parameters:</span>
                <span className="meta-v">{m.parameters}</span>
                <span className="meta-k">Quantization:</span>
                <span className="meta-v">{m.quantization}</span>
                <span className="meta-k">File Format:</span>
                <span className="meta-v">{m.format}</span>
                <span className="meta-k">Model Size:</span>
                <span className="meta-v">{m.size_formatted}</span>
                <span className="meta-k">SHA-256 Digest:</span>
                <span className="meta-v">{m.sha256.substring(0, 12)}...</span>
              </div>

              <div className="model-card-actions">
                <button
                  onClick={() => {
                    soundEngine.play('click', audioEnabled);
                    onOpenModelProfile(m);
                  }}
                >
                  <Cpu size={14} style={{ display: 'inline', marginRight: '4px' }} /> Profile
                </button>
                <button
                  onClick={() => {
                    soundEngine.play('click', audioEnabled);
                    onOpenSbomModal(m.tag);
                  }}
                >
                  <Layers size={14} style={{ display: 'inline', marginRight: '4px' }} /> View SBOM
                </button>
                <button
                  style={{ background: 'rgba(56,189,248,0.15)', borderColor: 'var(--color-cyan)', color: '#ffffff' }}
                  onClick={() => handleStartScan(m.tag)}
                >
                  <Play size={14} style={{ display: 'inline', marginRight: '4px' }} /> Deep Scan
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
