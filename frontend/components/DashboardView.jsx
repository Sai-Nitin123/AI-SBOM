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
  Search,
  Layers,
  FileText,
  AlertTriangle
} from 'lucide-react';
import LiveThreatRadar from './LiveThreatRadar';
import { soundEngine } from '../utils/audio';

export default function DashboardView({
  stats,
  pulseCards,
  particles,
  activityFeed,
  onClearFeed,
  models,
  onSelectModel,
  onOpenModelProfile,
  onNavigate,
  systemUsage,
  audioEnabled,
  onToggleAudio
}) {
  return (
    <div className="page-container" id="page-dashboard">
      {/* Row 1: 4 Metric Cards with Sparklines & Dynamic Pulse */}
      <section className="summary-cards-row">
        <div
          className={`summary-metric-card blue ${pulseCards.total ? 'pulse-glow' : ''}`}
          id="card-metric-total"
          title="Total inbound prompt requests intercepted"
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
            <span>12% vs last 24h</span>
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
            <span>8% vs last 24h</span>
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
            <span>5% vs last 24h</span>
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
            <span>99.2% Clean Ratio</span>
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

      {/* Row 3: Live Radar + Live Activity Feed */}
      <div className="dual-panels-grid">
        <LiveThreatRadar
          stats={stats}
          particles={particles}
          audioEnabled={audioEnabled}
          onToggleAudio={onToggleAudio}
        />

        <div className="dashboard-panel activity-panel-card">
          <div className="panel-card-head">
            <h3>Live Interception Stream</h3>
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
          <div className="activity-feed-list" id="dash-activity-feed">
            {activityFeed.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.75rem', padding: '1.5rem 0' }}>
                Waiting for incoming prompt events...
              </div>
            ) : (
              activityFeed.map((item, idx) => (
                <div key={idx} className="activity-item-card">
                  <div className="act-left">
                    <div className={`act-icon ${item.color}`}>
                      {item.action === 'BLOCK' ? (
                        <Slash size={15} />
                      ) : item.action === 'FLAG_FOR_REVIEW' ? (
                        <AlertTriangle size={15} />
                      ) : (
                        <Check size={15} />
                      )}
                    </div>
                    <div>
                      <span className="act-title">
                        {item.action}: {item.model}
                      </span>
                      <span className="act-sub">{item.sub}</span>
                    </div>
                  </div>
                  <span className="act-time">{item.time}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Quick Actions + System Usage */}
      <div className="dual-panels-grid bottom-row">
        <div className="dashboard-panel quick-actions-panel">
          <div className="panel-card-head">
            <h3>Quick Actions</h3>
          </div>
          <div className="quick-actions-quad">
            <button
              className="quick-action-card"
              onClick={() => {
                soundEngine.play('click', audioEnabled);
                onNavigate('console');
              }}
            >
              <div className="qa-icon-wrap"><Shield size={15} /></div>
              <span className="qa-title">Evaluate Threat</span>
              <span className="qa-desc">Test malicious prompt</span>
            </button>
            <button
              className="quick-action-card"
              onClick={() => {
                soundEngine.play('click', audioEnabled);
                onNavigate('models');
              }}
            >
              <div className="qa-icon-wrap"><Search size={15} /></div>
              <span className="qa-title">Scan Model</span>
              <span className="qa-desc">Run 10-stage analysis</span>
            </button>
            <button
              className="quick-action-card"
              onClick={() => {
                soundEngine.play('click', audioEnabled);
                onNavigate('models');
              }}
            >
              <div className="qa-icon-wrap"><Layers size={15} /></div>
              <span className="qa-title">Inspect SBOM</span>
              <span className="qa-desc">CycloneDX / SPDX</span>
            </button>
            <button
              className="quick-action-card"
              onClick={() => {
                soundEngine.play('click', audioEnabled);
                onNavigate('reports');
              }}
            >
              <div className="qa-icon-wrap"><FileText size={15} /></div>
              <span className="qa-title">View Reports</span>
              <span className="qa-desc">Download PDF export</span>
            </button>
          </div>
        </div>

        <div className="dashboard-panel system-overview-panel">
          <div className="panel-card-head">
            <h3>System Overview (Real-Time Telemetry)</h3>
          </div>
          <div className="system-meters-quad">
            <div className="system-meter-card">
              <div className="meter-head-row">
                <div className="meter-title-wrap blue">
                  <Cpu size={14} />
                  <span>CPU LOAD</span>
                </div>
                <span className="meter-val-large">{systemUsage.cpu}%</span>
              </div>
              <div className="meter-progress-track">
                <div className="meter-progress-fill blue" style={{ width: `${systemUsage.cpu}%` }}></div>
              </div>
            </div>

            <div className="system-meter-card">
              <div className="meter-head-row">
                <div className="meter-title-wrap purple">
                  <Activity size={14} />
                  <span>RAM USAGE</span>
                </div>
                <span className="meter-val-large">{systemUsage.memUsed} / {systemUsage.memTotal} GB</span>
              </div>
              <div className="meter-progress-track">
                <div className="meter-progress-fill purple" style={{ width: `${(systemUsage.memUsed / systemUsage.memTotal) * 100}%` }}></div>
              </div>
            </div>

            <div className="system-meter-card">
              <div className="meter-head-row">
                <div className="meter-title-wrap amber">
                  <HardDrive size={14} />
                  <span>DISK I/O</span>
                </div>
                <span className="meter-val-large">{systemUsage.disk} MB/s</span>
              </div>
              <div className="meter-progress-track">
                <div className="meter-progress-fill amber" style={{ width: '45%' }}></div>
              </div>
            </div>

            <div className="system-meter-card">
              <div className="meter-head-row">
                <div className="meter-title-wrap green">
                  <Wifi size={14} />
                  <span>NETWORK I/O</span>
                </div>
                <span className="meter-val-large">{systemUsage.net} MB/s</span>
              </div>
              <div className="meter-progress-track">
                <div className="meter-progress-fill green" style={{ width: '35%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
