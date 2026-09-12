'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import DashboardView from '../components/DashboardView';
import ThreatConsoleView from '../components/ThreatConsoleView';
import ModelsView from '../components/ModelsView';
import ReportsView from '../components/ReportsView';
import SettingsView from '../components/SettingsView';
import ExplainModal from '../components/ExplainModal';
import ModelProfileModal from '../components/ModelProfileModal';
import SbomModal from '../components/SbomModal';
import { fetchModels, fetchReports, fetchStats, API_BASE, WS_BASE, DEFAULT_MODELS } from '../utils/api';
import { soundEngine } from '../utils/audio';
import { X, ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentTheme, setCurrentTheme] = useState('theme-obsidian');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Models & Selected Model
  const [models, setModels] = useState(DEFAULT_MODELS);
  const [selectedModel, setSelectedModel] = useState('llama3.2:3b');

  // Stats & Dynamic Pulse - Starts at 0 on server startup!
  const [stats, setStats] = useState({ total: 0, flagged: 0, blocked: 0, allowed: 0 });
  const [pulseCards, setPulseCards] = useState({ total: false, flagged: false, blocked: false, allowed: false });

  // Live Activity Feed - Starts empty on server startup!
  const [activityFeed, setActivityFeed] = useState([]);

  // Reports
  const [reports, setReports] = useState([]);

  // System Telemetry (Live from host computer)
  const [systemUsage, setSystemUsage] = useState({
    cpu: 18,
    cpu_percent: 18,
    memUsed: 8.5,
    memTotal: 16.0,
    memory_used_gb: 8.5,
    memory_total_gb: 16.0,
    memory_percent: 53,
    disk: 180,
    disk_used_gb: 180,
    disk_total_gb: 475,
    disk_percent: 38,
    net: 148,
    gpu_available: true,
    gpu_name: 'NVIDIA GeForce RTX 3050 Laptop GPU',
    vram_used_gb: 0.3,
    vram_total_gb: 4.0,
    vram_percent: 8,
    gpu_temp_c: 44,
    gpu_percent: 0,
    gpu: {
      available: true,
      name: 'NVIDIA GeForce RTX 3050 Laptop GPU',
      vram_total_gb: 4.0,
      vram_used_gb: 0.3,
      vram_pct: 7.5,
      temp_c: 44,
      gpu_percent: 0
    }
  });

  // Modals
  const [explainModal, setExplainModal] = useState({ isOpen: false, data: null, prompt: '', model: '' });
  const [profileModal, setProfileModal] = useState({ isOpen: false, model: null });
  const [sbomModal, setSbomModal] = useState({ isOpen: false, modelTag: '' });

  // Toast Notifications
  const [toasts, setToasts] = useState([]);
  const processedEventIds = useRef(new Set());

  // Show Toast Helper
  const showToast = useCallback(({ title, message, type = 'info' }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  // Theme & Settings LocalStorage Initialization
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('ai_sbom_theme') || 'theme-obsidian';
      const savedCollapsed = localStorage.getItem('ai_sbom_sidebar_collapsed') === 'true';
      const savedAudio = localStorage.getItem('ai_sbom_audio') !== 'false';

      setCurrentTheme(savedTheme);
      setSidebarCollapsed(savedCollapsed);
      setAudioEnabled(savedAudio);

      document.body.className = `platform-app-body ${savedTheme}`;
    }
  }, []);

  // Apply Theme changes to body class
  const handleThemeChange = (newTheme) => {
    setCurrentTheme(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai_sbom_theme', newTheme);
      document.body.className = `platform-app-body ${newTheme}`;
    }
  };

  // Toggle Sidebar
  const handleToggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai_sbom_sidebar_collapsed', String(next));
    }
  };

  // Toggle Audio
  const handleToggleAudio = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai_sbom_audio', String(next));
    }
  };

  // Trigger pulse on metric card
  const pulseCard = (key) => {
    setPulseCards((prev) => ({ ...prev, [key]: true, total: true }));
    setTimeout(() => {
      setPulseCards((prev) => ({ ...prev, [key]: false, total: false }));
    }, 850);
  };

  // Ingest incoming detection event (from HTTP or WebSocket) with deduplication
  const handleIncomingEvent = useCallback(({ data, prompt, model, eventStats }) => {
    if (!data || !data.trace_id) return;
    if (processedEventIds.current.has(data.trace_id)) return;
    processedEventIds.current.add(data.trace_id);

    const isBlock = data.action === 'BLOCK';
    const isFlag = data.action === 'FLAG_FOR_REVIEW';
    const color = isBlock ? 'red' : isFlag ? 'amber' : 'green';

    // 1. Update stats in real-time
    if (eventStats) {
      setStats({
        total: eventStats.total || 0,
        blocked: eventStats.blocked || 0,
        flagged: eventStats.flagged || 0,
        allowed: eventStats.allowed || 0
      });
    } else {
      setStats((prev) => ({
        ...prev,
        total: prev.total + 1,
        blocked: isBlock ? prev.blocked + 1 : prev.blocked,
        flagged: isFlag ? prev.flagged + 1 : prev.flagged,
        allowed: !isBlock && !isFlag ? prev.allowed + 1 : prev.allowed
      }));
    }

    // 2. Pulse metric cards & audio feedback
    if (isBlock) {
      pulseCard('blocked');
      showToast({
        title: 'CRITICAL THREAT BLOCKED',
        message: `${model || data.model}: Pre-inference injection intercepted.`,
        type: 'danger'
      });
    } else if (isFlag) {
      pulseCard('flagged');
      showToast({
        title: 'PROMPT FLAGGED FOR REVIEW',
        message: `${model || data.model}: Boundary probing detected.`,
        type: 'warning'
      });
    } else {
      pulseCard('allowed');
    }

    // 3. Prepend to live activity feed
    setActivityFeed((prev) => [
      {
        action: data.action,
        color,
        model: model || data.model || 'Llama 3.2',
        sub: data.explanation || 'Processed through security gateway',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      },
      ...prev.slice(0, 25)
    ]);

    // 4. Prepend to real-time reports ledger & sync
    const scanId = (data.trace_id || '').slice(0, 8) || `trc-${Math.random().toString(36).slice(2, 6)}`;
    const secScore = Math.max(0, Math.min(100, Math.round((1.0 - (data.overall_score !== undefined ? data.overall_score : (isBlock ? 0.95 : isFlag ? 0.40 : 0.05))) * 100)));
    const liveReport = {
      scan_id: scanId,
      model_tag: model || data.model || 'llama3.2:3b',
      model_name: model || data.model || 'Llama 3.2',
      scan_date: new Date().toISOString().replace('T', ' ').slice(0, 19),
      security_score: secScore,
      risk_level: isBlock ? 'CRITICAL THREAT' : isFlag ? 'REVIEW REQUIRED' : 'LOW RISK',
      threats_count: isBlock || isFlag ? 1 : 0,
      vulnerabilities_count: data.hard_rule_applied ? 1 : 0,
      action: data.action,
      prompt: prompt,
      model_response: data.model_response,
      explanation: data.explanation || 'Processed through AI-SBOM multi-tier defense.'
    };
    setReports((prev) => [liveReport, ...prev.filter((r) => r.scan_id !== scanId)]);
    fetchReports().then((serverReports) => {
      if (serverReports && serverReports.length > 0) {
        setReports(serverReports);
      }
    });
  }, [showToast]);

  // Initial Data Fetch, Periodic Hardware Polling, and WebSocket Listener
  useEffect(() => {
    fetchModels().then(setModels);
    fetchReports().then(setReports);
    fetchStats().then((s) => {
      if (s) {
        setStats({
          total: s.total_sessions || 0,
          flagged: s.flagged || 0,
          blocked: s.blocked || 0,
          allowed: s.allowed || 0
        });
      }
    });

    // Real-Time Computer Hardware Telemetry Polling (every 1.5s)
    const pollUsage = () => {
      fetch(`${API_BASE}/api/system/usage`)
        .then((r) => r.json())
        .then((data) => {
          if (data) setSystemUsage(data);
        })
        .catch(() => {});
    };

    pollUsage();
    const usageInterval = setInterval(pollUsage, 1500);

    // WebSocket Real-time Ingestion
    let ws = null;
    try {
      ws = new WebSocket(WS_BASE);
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'detection_event') {
            handleIncomingEvent({
              data: payload.data,
              prompt: payload.prompt,
              model: payload.data?.model,
              eventStats: payload.stats
            });
          }
        } catch {}
      };
    } catch {}

    return () => {
      clearInterval(usageInterval);
      if (ws) ws.close();
    };
  }, [handleIncomingEvent]);

  return (
    <div className={`platform-shell ${sidebarCollapsed ? 'collapsed-sidebar' : ''}`} id="app-platform-shell">
      {/* ── Sidebar Navigation ── */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        audioEnabled={audioEnabled}
      />

      {/* ── Main Content Viewport ── */}
      <main className="platform-viewport">
        {/* Top Header */}
        <Header
          currentPage={currentPage}
          currentTheme={currentTheme}
          onThemeChange={handleThemeChange}
          onQuickScan={() => setCurrentPage('console')}
          audioEnabled={audioEnabled}
        />

        {/* Dynamic Page Views */}
        {currentPage === 'dashboard' && (
          <DashboardView
            stats={stats}
            pulseCards={pulseCards}
            activityFeed={activityFeed}
            onClearFeed={() => setActivityFeed([])}
            models={models}
            onSelectModel={(tag) => setSelectedModel(tag)}
            onOpenModelProfile={(model) => setProfileModal({ isOpen: true, model })}
            onNavigate={(page) => setCurrentPage(page)}
            systemUsage={systemUsage}
            audioEnabled={audioEnabled}
          />
        )}

        {currentPage === 'console' && (
          <ThreatConsoleView
            models={models}
            selectedModel={selectedModel}
            onSelectModel={(tag) => setSelectedModel(tag)}
            onOpenExplainModal={(data, prompt, model) => setExplainModal({ isOpen: true, data, prompt, model })}
            onOpenSbomModal={(tag) => setSbomModal({ isOpen: true, modelTag: tag })}
            onNewEvaluation={(data, prompt, model) => handleIncomingEvent({ data, prompt, model })}
            audioEnabled={audioEnabled}
            onShowToast={showToast}
          />
        )}

        {currentPage === 'models' && (
          <ModelsView
            models={models}
            onOpenModelProfile={(model) => setProfileModal({ isOpen: true, model })}
            onOpenSbomModal={(modelTag) => setSbomModal({ isOpen: true, modelTag })}
            onScanComplete={() => fetchReports().then(setReports)}
            audioEnabled={audioEnabled}
            onShowToast={showToast}
          />
        )}

        {currentPage === 'reports' && (
          <ReportsView
            reports={reports}
            onRefresh={() => {
              fetchReports().then((r) => {
                setReports(r);
                showToast({
                  title: 'Ledger Refreshed',
                  message: `Loaded ${r.length} real-time audit records.`,
                  type: 'info'
                });
              });
            }}
            onOpenSbomModal={(modelTag) => setSbomModal({ isOpen: true, modelTag })}
            onOpenExplainModal={(report) => {
              const secScore = report.security_score ?? 94;
              const riskScore = (100 - secScore) / 100;
              setExplainModal({
                isOpen: true,
                data: {
                  trace_id: report.scan_id,
                  model: report.model_name,
                  action: report.action || (secScore < 60 ? 'BLOCK' : secScore < 90 ? 'FLAG_FOR_REVIEW' : 'ALLOW'),
                  overall_score: riskScore,
                  if_score: Math.min(1.0, riskScore * 0.85),
                  lstm_score: Math.min(1.0, riskScore * 0.95),
                  xgb_score: Math.min(1.0, riskScore * 0.90),
                  pre_scan_score: riskScore,
                  explanation: report.explanation || `Supply-Chain & Prompt Security score: ${secScore}/100.`,
                  pre_scan_triggers: report.action === 'BLOCK' ? [report.explanation || 'Adversarial Injection Pattern Detected'] : [],
                  suspicious_tools_found: [],
                  hard_rule_applied: report.vulnerabilities_count > 0,
                  model_response: report.model_response || (report.action === 'BLOCK' ? `[BLOCKED BY AI-SBOM GATEWAY] ${report.explanation}` : `Audit Record: ${report.model_name} processed cleanly.`),
                  timestamp: report.scan_date || new Date().toISOString()
                },
                prompt: report.prompt || `Automated Security Audit of ${report.model_name}`,
                model: report.model_name
              });
            }}
            audioEnabled={audioEnabled}
            onShowToast={showToast}
          />
        )}

        {currentPage === 'settings' && (
          <SettingsView
            currentTheme={currentTheme}
            onThemeChange={handleThemeChange}
            audioEnabled={audioEnabled}
            onToggleAudio={handleToggleAudio}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* ── Modals ── */}
      <ExplainModal
        isOpen={explainModal.isOpen}
        onClose={() => setExplainModal({ isOpen: false, data: null, prompt: '', model: '' })}
        data={explainModal.data}
        promptText={explainModal.prompt}
        modelName={explainModal.model}
        audioEnabled={audioEnabled}
      />

      <ModelProfileModal
        isOpen={profileModal.isOpen}
        onClose={() => setProfileModal({ isOpen: false, model: null })}
        model={profileModal.model}
        audioEnabled={audioEnabled}
      />

      <SbomModal
        isOpen={sbomModal.isOpen}
        onClose={() => setSbomModal({ isOpen: false, modelTag: '' })}
        modelTag={sbomModal.modelTag}
        audioEnabled={audioEnabled}
      />

      {/* ── Toast Deck ── */}
      <div className="toast-notification-deck" id="toast-deck">
        {toasts.map((t) => (
          <div key={t.id} className={`floating-toast ${t.type === 'danger' ? '' : t.type === 'warning' ? 'warning' : 'success'}`}>
            <div className="toast-ico">
              {t.type === 'danger' ? (
                <ShieldAlert size={20} />
              ) : t.type === 'warning' ? (
                <AlertTriangle size={20} />
              ) : (
                <CheckCircle size={20} />
              )}
            </div>
            <div className="toast-info-block">
              <div className="toast-head">{t.title}</div>
              <div className="toast-msg">{t.message}</div>
            </div>
            <button
              className="toast-dismiss-btn"
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
