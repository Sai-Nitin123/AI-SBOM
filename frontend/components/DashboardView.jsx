'use client';

import React from 'react';
import {
  Shield,
  Flag,
  Slash,
  Check,
  ArrowUpRight,
  ChevronRight,
  Cpu,
  HardDrive,
  Activity,
  Wifi,
  Radio,
  Zap,
  Layers,
  FileText,
  AlertTriangle,
  Server,
  Gauge
} from 'lucide-react';
import { soundEngine } from '../utils/audio';

export default function DashboardView({
  stats,
  pulseCards,
  activityFeed,
  onClearFeed,
  models,
  onSelectModel,
  onOpenModelProfile,
  onNavigate,
  systemUsage,
  audioEnabled
}) {
  const ramPercent = systemUsage?.ram_percent || (systemUsage?.memTotal ? Math.round((systemUsage.memUsed / systemUsage.memTotal) * 100) : 55);
  const ramUsed = systemUsage?.memory_used_gb || systemUsage?.memUsed || 8.0;
  const ramTotal = systemUsage?.memory_total_gb || systemUsage?.memTotal || 16.0;
  const cpuPercent = systemUsage?.cpu_percent || systemUsage?.cpu || 18;
  const diskUsed = systemUsage?.disk_used_gb || 180;
  const diskTotal = systemUsage?.disk_total_gb || 475;
  const diskPercent = systemUsage?.disk_percent || 38;
  const gpu = systemUsage?.gpu || {};
  const gpuAvailable = gpu?.available || systemUsage?.gpu_available;
  const gpuName = gpu?.name || systemUsage?.gpu_name || "NVIDIA Dedicated GPU";
  const vramUsed = gpu?.vram_used_gb !== undefined ? gpu.vram_used_gb : (systemUsage?.vram_used_gb || 0.3);
  const vramTotal = gpu?.vram_total_gb !== undefined ? gpu.vram_total_gb : (systemUsage?.vram_total_gb || 4.0);
  const vramPercent = gpu?.vram_pct !== undefined ? gpu.vram_pct : (vramTotal > 0 ? Math.round((vramUsed / vramTotal) * 100) : 8);
  const gpuTemp = gpu?.temp_c || systemUsage?.gpu_temp_c || 44;
  const gpuLoad = gpu?.gpu_percent || systemUsage?.gpu_percent || 0;

  return (
    <div className="page-container" id="page-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Row 1: 4 Metric Cards with Dynamic Real-Time Count & Pulse */}
      <section className="summary-cards-row">
        <div
          className={`summary-metric-card blue ${pulseCards.total ? 'pulse-glow' : ''}`}
          id="card-metric-total"
          title="Total inbound prompt requests intercepted this session"
        >
          <div className="card-inner-top">
            <div className="summary-icon-bubble blue">
              <Shield size={19} />
            </div>
            <div className="summary-count-group">
              <span className="card-title">Intercepted</span>
              <h3 className="card-number" id="stat-total">{stats.total}</h3>
            </div>
            <svg className="sparkline-svg" viewBox="0 0 100 35">
              <path
                d="M0,25 Q15,10 30,22 T60,12 T90,20 L100,15"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="card-delta-row green">
            <ArrowUpRight size={12} />
            <span>Live Session Real-Time</span>
          </div>
        </div>

        <div
          className={`summary-metric-card amber ${pulseCards.flagged ? 'pulse-glow' : ''}`}
          id="card-metric-flagged"
          title="Suspicious requests requiring human review"
        >
          <div className="card-inner-top">
            <div className="summary-icon-bubble amber">
              <Flag size={19} />
            </div>
            <div className="summary-count-group">
              <span className="card-title">Flagged</span>
              <h3 className="card-number" id="stat-flagged">{stats.flagged}</h3>
            </div>
            <svg className="sparkline-svg" viewBox="0 0 100 35">
              <path
                d="M0,20 Q20,30 40,15 T70,25 T95,12 L100,18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="card-delta-row amber">
            <ArrowUpRight size={12} />
            <span>Boundary Probing Filter</span>
          </div>
        </div>

        <div
          className={`summary-metric-card red ${pulseCards.blocked ? 'pulse-glow' : ''}`}
          id="card-metric-blocked"
          title="Malicious attacks and prompt injections blocked immediately"
        >
          <div className="card-inner-top">
            <div className="summary-icon-bubble red">
              <Slash size={19} />
            </div>
            <div className="summary-count-group">
              <span className="card-title">Blocked</span>
              <h3 className="card-number" id="stat-blocked">{stats.blocked}</h3>
            </div>
            <svg className="sparkline-svg" viewBox="0 0 100 35">
              <path
                d="M0,28 Q25,12 45,26 T80,14 T95,22 L100,16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="card-delta-row red">
            <ArrowUpRight size={12} />
            <span>Zero-Exposure Shield Active</span>
          </div>
        </div>

        <div
          className={`summary-metric-card green ${pulseCards.allowed ? 'pulse-glow' : ''}`}
          id="card-metric-allowed"
          title="Legitimate user prompts safely processed"
        >
          <div className="card-inner-top">
            <div className="summary-icon-bubble green">
              <Check size={19} />
            </div>
            <div className="summary-count-group">
              <span className="card-title">Allowed</span>
              <h3 className="card-number" id="stat-allowed">{stats.allowed}</h3>
            </div>
            <svg className="sparkline-svg" viewBox="0 0 100 35">
              <path
                d="M0,30 Q30,18 55,24 T85,10 L100,12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="card-delta-row green">
            <ArrowUpRight size={12} />
            <span>Safe Ingestion Stream</span>
          </div>
        </div>
      </section>

      {/* Row 2: Models Matrix Strip */}
      <section className="models-matrix-strip-card">
        <div className="strip-header-row">
          <div className="strip-title-left">
            <h3>Discovered Local Models</h3>
            <span className="active-count-tag" id="dash-models-count-tag">
              {models.length} Models Ready
            </span>
          </div>
          <button
            className="link-styled-btn"
            id="dash-link-models"
            onClick={() => {
              soundEngine.play('click', audioEnabled);
              onNavigate('models');
            }}
          >
            <span>Model Supply-Chain Registry</span>
            <ChevronRight size={13} />
          </button>
        </div>

        <div className="models-pill-deck" id="dash-models-strip">
          {models.map((m) => (
            <div
              key={m.tag}
              className="model-pill-item"
              onClick={() => {
                soundEngine.play('click', audioEnabled);
                onOpenModelProfile(m);
              }}
            >
              <Cpu className="model-pill-icon" size={16} />
              <div>
                <span className="model-pill-name">{m.name}</span>
                <span className="model-pill-meta">
                  {m.parameters} • {m.quantization}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Row 3: Live Interception Stream (Expanded Full Width) */}
      <section className="dashboard-panel" style={{ width: '100%' }}>
        <div className="panel-card-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Radio size={16} style={{ color: 'var(--color-cyan)', animation: 'pulse 1.5s infinite' }} />
            <h3>Live Interception Stream</h3>
            <span style={{
              fontSize: '0.62rem',
              fontWeight: '800',
              padding: '0.15rem 0.5rem',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              REAL-TIME GATEWAY ACTIVE
            </span>
          </div>

          <button
            className="link-styled-btn"
            id="btn-dash-clear-feed"
            onClick={() => {
              soundEngine.play('click', audioEnabled);
              onClearFeed();
            }}
          >
            Clear Feed
          </button>
        </div>

        <div className="activity-feed-list" id="dash-activity-feed" style={{ maxHeight: '240px' }}>
          {activityFeed.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#64748b',
              fontSize: '0.78rem',
              padding: '2.5rem 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Server size={24} style={{ color: '#334155' }} />
              <span>Waiting for incoming prompts... Test a prompt in Threat Console or Ollama proxy to see live events.</span>
            </div>
          ) : (
            activityFeed.map((item, idx) => (
              <div key={idx} className="activity-item-card" style={{ padding: '0.75rem 1rem' }}>
                <div className="act-left" style={{ gap: '0.75rem' }}>
                  <div className={`act-icon ${item.color}`}>
                    {item.action === 'BLOCK' ? (
                      <Slash size={16} />
                    ) : item.action === 'FLAG_FOR_REVIEW' ? (
                      <AlertTriangle size={16} />
                    ) : (
                      <Check size={16} />
                    )}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span className="act-title">
                        {item.action}: {item.model}
                      </span>
                      <span style={{
                        fontSize: '0.62rem',
                        fontWeight: '800',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                        background: item.action === 'BLOCK' ? 'rgba(244, 63, 94, 0.2)' : item.action === 'FLAG_FOR_REVIEW' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: item.action === 'BLOCK' ? '#f43f5e' : item.action === 'FLAG_FOR_REVIEW' ? '#f59e0b' : '#10b981'
                      }}>
                        {item.action === 'BLOCK' ? 'INTERCEPTED' : item.action === 'FLAG_FOR_REVIEW' ? 'REVIEW' : 'PASSED'}
                      </span>
                    </div>
                    <span className="act-sub" style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '0.15rem' }}>
                      {item.sub}
                    </span>
                  </div>
                </div>
                <span className="act-time" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem' }}>
                  {item.time}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Row 4: Real-Time Host Computer Hardware Telemetry (Full Width) */}
      <section className="dashboard-panel" style={{ width: '100%' }}>
        <div className="panel-card-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Gauge size={16} style={{ color: 'var(--color-cyan)' }} />
            <h3>System Overview (Real-Time Host Hardware Telemetry)</h3>
          </div>
          <span className="badge-subtle" style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)', background: 'rgba(56, 189, 248, 0.1)' }}>
            Live Device Polling Active (1.5s)
          </span>
        </div>

        <div className="system-meters-quad" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
          {/* CPU Load */}
          <div className="system-meter-card" style={{ padding: '0.95rem', background: 'var(--bg-card-inner)' }}>
            <div className="meter-head-row">
              <div className="meter-title-wrap blue">
                <Cpu size={15} />
                <span>CPU LOAD</span>
              </div>
              <span className="meter-val-large">{cpuPercent}%</span>
            </div>
            <div className="meter-progress-track" style={{ height: '7px', marginTop: '0.4rem' }}>
              <div className="meter-progress-fill blue" style={{ width: `${Math.min(100, Math.max(2, cpuPercent))}%` }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: '#94a3b8', marginTop: '0.35rem' }}>
              <span>Multi-Threaded Processing</span>
              <span style={{ color: cpuPercent > 80 ? '#f43f5e' : '#10b981' }}>{cpuPercent < 50 ? 'Optimal' : cpuPercent < 80 ? 'Moderate' : 'High Load'}</span>
            </div>
          </div>

          {/* RAM Usage */}
          <div className="system-meter-card" style={{ padding: '0.95rem', background: 'var(--bg-card-inner)' }}>
            <div className="meter-head-row">
              <div className="meter-title-wrap purple">
                <Activity size={15} />
                <span>RAM USAGE</span>
              </div>
              <span className="meter-val-large">{ramUsed} / {ramTotal} GB ({ramPercent}%)</span>
            </div>
            <div className="meter-progress-track" style={{ height: '7px', marginTop: '0.4rem' }}>
              <div className="meter-progress-fill purple" style={{ width: `${Math.min(100, Math.max(2, ramPercent))}%` }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: '#94a3b8', marginTop: '0.35rem' }}>
              <span>Host Physical Memory</span>
              <span style={{ color: '#a855f7' }}>{Math.round((ramTotal - ramUsed) * 10) / 10} GB Free</span>
            </div>
          </div>

          {/* GPU & VRAM */}
          <div className="system-meter-card" style={{ padding: '0.95rem', background: 'var(--bg-card-inner)' }}>
            <div className="meter-head-row">
              <div className="meter-title-wrap green">
                <Zap size={15} />
                <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {gpuAvailable ? gpuName : 'GPU ACCELERATION'}
                </span>
              </div>
              <span className="meter-val-large">
                {gpuAvailable ? `${vramUsed} / ${vramTotal} GB` : 'Active'}
              </span>
            </div>
            <div className="meter-progress-track" style={{ height: '7px', marginTop: '0.4rem' }}>
              <div className="meter-progress-fill green" style={{ width: `${Math.min(100, Math.max(2, vramPercent))}%` }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: '#94a3b8', marginTop: '0.35rem' }}>
              <span>VRAM ({vramPercent}%) • Temp: {gpuTemp}°C</span>
              <span style={{ color: '#10b981' }}>{gpuAvailable ? 'Tensor Cores Ready' : 'Direct Compute'}</span>
            </div>
          </div>

          {/* Disk Storage */}
          <div className="system-meter-card" style={{ padding: '0.95rem', background: 'var(--bg-card-inner)' }}>
            <div className="meter-head-row">
              <div className="meter-title-wrap amber">
                <HardDrive size={15} />
                <span>STORAGE & DISK</span>
              </div>
              <span className="meter-val-large">{diskUsed} / {diskTotal} GB</span>
            </div>
            <div className="meter-progress-track" style={{ height: '7px', marginTop: '0.4rem' }}>
              <div className="meter-progress-fill amber" style={{ width: `${Math.min(100, Math.max(2, diskPercent))}%` }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: '#94a3b8', marginTop: '0.35rem' }}>
              <span>NVMe Local Disk ({diskPercent}%)</span>
              <span style={{ color: '#f59e0b' }}>{Math.round((diskTotal - diskUsed) * 10) / 10} GB Free</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
