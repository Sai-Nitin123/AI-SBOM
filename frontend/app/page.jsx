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
import { fetchModels, fetchReports, fetchStats, WS_BASE, DEFAULT_MODELS } from '../utils/api';
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

  // Stats & Dynamic Pulse
  const [stats, setStats] = useState({ total: 153, flagged: 27, blocked: 7, allowed: 211 });
  const [pulseCards, setPulseCards] = useState({ total: false, flagged: false, blocked: false, allowed: false });

  // Live Threat Radar Particles
  const [particles, setParticles] = useState([
    { id: 1, color: 'red', top: 25, left: 35 },
    { id: 2, color: 'amber', top: 38, left: 105 },
    { id: 3, color: 'green', top: 95, left: 30 },
    { id: 4, color: 'red', top: 105, left: 95 },
    { id: 5, color: 'green', top: 70, left: 15 },
    { id: 6, color: 'amber', top: 110, left: 75 }
  ]);

  // Live Activity Feed
  const [activityFeed, setActivityFeed] = useState([
    { action: 'BLOCK', color: 'red', model: 'Llama 3.2', sub: 'Direct Prompt Override Intercepted', time: '1m ago' },
    { action: 'ALLOW', color: 'green', model: 'Hermes 3', sub: 'Benign General Query Verified', time: '3m ago' },
    { action: 'FLAG_FOR_REVIEW', color: 'amber', model: 'Phi-3 Mini', sub: 'Boundary Probing Detected', time: '7m ago' },
    { action: 'ALLOW', color: 'green', model: 'Qwen 2.5', sub: 'Safe Mathematical Query', time: '12m ago' }
  ]);

  // Reports
  const [reports, setReports] = useState([]);

  // System Telemetry
  const [systemUsage, setSystemUsage] = useState({ cpu: 23, memUsed: 6.2, memTotal: 16, disk: 220, net: 148 });

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

  // Spawn radar ping particle
  const spawnRadarPing = (color) => {
    const newParticle = {
      id: Date.now() + Math.random(),
      color,
      top: Math.floor(Math.random() * 110) + 15,
      left: Math.floor(Math.random() * 110) + 15
    };
    setParticles((prev) => [newParticle, ...prev.slice(0, 7)]);
  };

  // Ingest incoming detection event (from HTTP or WebSocket) with deduplication
  const handleIncomingEvent = useCallback(({ data, prompt, model }) => {
    if (!data || !data.trace_id) return;
    if (processedEventIds.current.has(data.trace_id)) return;
    processedEventIds.current.add(data.trace_id);

    const isBlock = data.action === 'BLOCK';
    const isFlag = data.action === 'FLAG_FOR_REVIEW';
    const color = isBlock ? 'red' : isFlag ? 'amber' : 'green';

    // 1. Update stats
    setStats((prev) => ({
      ...prev,
      total: prev.total + 1,
      blocked: isBlock ? prev.blocked + 1 : prev.blocked,
      flagged: isFlag ? prev.flagged + 1 : prev.flagged,
      allowed: !isBlock && !isFlag ? prev.allowed + 1 : prev.allowed
    }));

    // 2. Pulse card & spawn radar particle
    if (isBlock) {
      pulseCard('blocked');
      spawnRadarPing('red');
      showToast({
        title: 'CRITICAL THREAT BLOCKED',
        message: `${model || data.model}: Pre-inference injection stopped.`,
        type: 'danger'
      });
    } else if (isFlag) {
      pulseCard('flagged');
      spawnRadarPing('amber');
      showToast({
        title: 'PROMPT FLAGGED FOR REVIEW',
        message: `${model || data.model}: Boundary probing detected.`,
        type: 'warning'
      });
    } else {
      pulseCard('allowed');
      spawnRadarPing('green');
    }

    // 3. Prepend to activity feed
    setActivityFeed((prev) => [
      {
        action: data.action,
        color,
        model: model || data.model || 'Llama 3.2',
        sub: data.explanation || 'Processed through gateway',
        time: 'Just now'
      },
      ...prev.slice(0, 15)
    ]);

    // 4. Refresh reports ledger
    fetchReports().then(setReports);
  }, [showToast]);

  // Initial Data Fetch & WebSocket Listener
  useEffect(() => {
    fetchModels().then(setModels);
    fetchReports().then(setReports);
    fetchStats().then((s) => {
      if (s) {
        setStats({
          total: s.total_sessions || 153,
          flagged: s.flagged || 27,
          blocked: s.blocked || 7,
          allowed: s.allowed || 211
        });
      }
    });

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
              model: payload.data?.model
            });
          }
        } catch {}
      };
    } catch {}

    return () => {
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
            particles={particles}
            activityFeed={activityFeed}
            onClearFeed={() => setActivityFeed([])}
            models={models}
            onSelectModel={(tag) => setSelectedModel(tag)}
            onOpenModelProfile={(model) => setProfileModal({ isOpen: true, model })}
            onNavigate={(page) => setCurrentPage(page)}
            systemUsage={systemUsage}
            audioEnabled={audioEnabled}
            onToggleAudio={handleToggleAudio}
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
            onOpenSbomModal={(tag) => setSbomModal({ isOpen: true, modelTag: tag })}
            onScanComplete={() => fetchReports().then(setReports)}
            audioEnabled={audioEnabled}
            onShowToast={showToast}
          />
        )}

        {currentPage === 'reports' && (
          <ReportsView
            reports={reports}
            onRefresh={() => fetchReports().then(setReports)}
            onOpenSbomModal={(tag) => setSbomModal({ isOpen: true, modelTag: tag })}
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
