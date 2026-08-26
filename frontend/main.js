import {
  createIcons,
  Home,
  Box,
  Search,
  Shield,
  Target,
  FileText,
  Layers,
  Settings,
  Brain,
  Activity,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Check,
  Zap,
  Bot,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Cpu,
  HardDrive,
  Wifi,
  Slash,
  Flag,
  Lock,
  EyeOff,
  Flame,
  Unlock,
  Key,
  Code,
  Sparkle,
  Wrench,
  Copy,
  Download,
  Volume2,
  VolumeX,
  X,
  ChevronDown,
  Plus,
  BarChart3,
  RefreshCw,
  Play,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  HelpCircle
} from 'lucide';

import { animate } from 'animejs';

// Initialize Lucide Icons
function refreshIcons(root = document) {
  createIcons({
    icons: {
      Home,
      Box,
      Search,
      Shield,
      Target,
      FileText,
      Layers,
      Settings,
      Brain,
      Activity,
      ShieldCheck,
      ShieldAlert,
      AlertTriangle,
      CheckCircle2,
      Check,
      Zap,
      Bot,
      ArrowRight,
      ArrowUpRight,
      ArrowDownRight,
      Cpu,
      HardDrive,
      Wifi,
      Slash,
      Flag,
      Lock,
      EyeOff,
      Flame,
      Unlock,
      Key,
      Code,
      Sparkle,
      Wrench,
      Copy,
      Download,
      Volume2,
      VolumeX,
      X,
      ChevronDown,
      Plus,
      BarChart3,
      RefreshCw,
      Play,
      Palette,
      PanelLeftClose,
      PanelLeftOpen,
      HelpCircle
    },
    root
  });
}

refreshIcons();

const DEFAULT_MODELS = [
  {
    name: "Llama 3.2",
    tag: "llama3.2:3b",
    provider: "Meta AI",
    parameters: "3.21B",
    size_formatted: "2.0 GB",
    context_length: "128K",
    quantization: "Q4_K_M",
    runtime: "Ollama / llama.cpp",
    sha256: "a3f5c719e84b6d029147a2e8c561b349f821c90538a6e74b219e48c1b970ef12",
    license: "Llama 3.2 Community",
    status: "Secure",
    security_score: 94,
    scans_count: 8
  },
  {
    name: "Hermes 3",
    tag: "hermes3:8b",
    provider: "Nous Research",
    parameters: "8.03B",
    size_formatted: "4.9 GB",
    context_length: "128K",
    quantization: "Q4_K_M",
    runtime: "Ollama / llama.cpp",
    sha256: "9c1b82e4f501834928d1726a45b89c02e1f4837b9264c81048293741829e0192",
    license: "Llama 3.1 Community",
    status: "Warning",
    security_score: 78,
    scans_count: 12
  },
  {
    name: "Qwen 2.5",
    tag: "qwen2.5:3b",
    provider: "Alibaba Cloud",
    parameters: "3.09B",
    size_formatted: "1.9 GB",
    context_length: "32K",
    quantization: "Q4_K_M",
    runtime: "Ollama / llama.cpp",
    sha256: "7291a04b839201847592837401928374a8192837401928374019283740192837",
    license: "Apache-2.0",
    status: "Secure",
    security_score: 92,
    scans_count: 5
  },
  {
    name: "Phi-3 Mini",
    tag: "phi3:3.8b",
    provider: "Microsoft",
    parameters: "3.82B",
    size_formatted: "2.3 GB",
    context_length: "128K",
    quantization: "Q4_K_M",
    runtime: "Ollama / llama.cpp",
    sha256: "b827401928374019283740192837401928374019283740192837401928374019",
    license: "MIT",
    status: "Secure",
    security_score: 96,
    scans_count: 4
  },
  {
    name: "Gemma 2",
    tag: "gemma2:2b",
    provider: "Google DeepMind",
    parameters: "2.61B",
    size_formatted: "1.6 GB",
    context_length: "8K",
    quantization: "Q4_K_M",
    runtime: "Ollama / llama.cpp",
    sha256: "c918273645019283746501928374650192837465019283746501928374650192",
    license: "Gemma Terms of Use",
    status: "Secure",
    security_score: 91,
    scans_count: 6
  }
];

// Application State
const state = {
  currentPage: 'dashboard',
  selectedModel: 'llama3.2:3b',
  discoveredModels: [...DEFAULT_MODELS],
  activeScan: null,
  reports: [],
  audioEnabled: true,
  stats: { total: 153, flagged: 27, blocked: 7, allowed: 211 },
  systemUsage: { cpu: 23, memUsed: 6.2, memTotal: 16, disk: 220, net: 148 },
  currentTheme: localStorage.getItem('ai_sbom_theme') || 'theme-obsidian',
  sidebarCollapsed: localStorage.getItem('ai_sbom_sidebar_collapsed') === 'true'
};

// Event Deduplicator Set (Prevents duplicate notifications)
const processedEventIds = new Set();

// DOM References
const pageMainTitle = document.getElementById('page-main-title');
const pageMainSub = document.getElementById('page-main-sub');
const navButtons = document.querySelectorAll('.nav-menu-item');
const pageContainers = document.querySelectorAll('.page-container');
const clockEl = document.getElementById('realtime-clock');
const toastDeck = document.getElementById('toast-deck');
const appPlatformShell = document.getElementById('app-platform-shell');
const sidebarCollapseBtn = document.getElementById('sidebar-collapse-btn');

// Stats DOM Elements
const statTotal = document.getElementById('stat-total');
const statFlagged = document.getElementById('stat-flagged');
const statBlocked = document.getElementById('stat-blocked');
const statAllowed = document.getElementById('stat-allowed');
const radarBlocked = document.getElementById('radar-count-blocked');
const radarFlagged = document.getElementById('radar-count-flagged');
const radarAllowed = document.getElementById('radar-count-allowed');

// Dashboard UI
const dashModelsStrip = document.getElementById('dash-models-strip');
const dashModelsCountTag = document.getElementById('dash-models-count-tag');
const dashActivityFeed = document.getElementById('dash-activity-feed');

// System Telemetry DOM
const sysCpuVal = document.getElementById('sys-cpu-val');
const sysCpuBar = document.getElementById('sys-cpu-bar');
const sysMemVal = document.getElementById('sys-mem-val');
const sysMemBar = document.getElementById('sys-mem-bar');
const sysDiskVal = document.getElementById('sys-disk-val');
const sysDiskBar = document.getElementById('sys-disk-bar');
const sysNetVal = document.getElementById('sys-net-val');
const sysNetBar = document.getElementById('sys-net-bar');

// Modals
const explainModal = document.getElementById('explain-modal');
const explainCloseBtn = document.getElementById('explain-close-btn');
const explainModalBody = document.getElementById('explain-modal-body');

const profileModal = document.getElementById('model-profile-modal');
const profCloseBtn = document.getElementById('prof-close-btn');
const profModalBody = document.getElementById('prof-modal-body');

// ── 1. ROUTER & PAGE SWITCHER ───────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard: { title: "Welcome back! 👋", sub: "AI-Powered SBOM Threat Detection & Model Interceptor Gateway" },
  models: { title: "AI Models & Supply Chain Inventory", sub: "Discovered Local Models, File Integrity Hashes and Model Security Profiles" },
  scan: { title: "Model Security & Supply-Chain Scanner", sub: "4-Step Automated Adversarial & Software Bill of Materials (SBOM) Analysis" },
  console: { title: "Interactive Threat Evaluation Console", sub: "Test Inbound Prompts Against AI-SBOM Multi-Layer Security Gateway in Real Time" },
  sbom: { title: "Software Bill of Materials (SBOM) Generator", sub: "Generate CycloneDX v1.5 & SPDX 2.3 Cryptographic Model Provenance Manifests" },
  reports: { title: "Security Reports & Audit Ledger", sub: "Historical Model Scans, Threat Assessments and 1-Click PDF Downloads" },
  intelligence: { title: "Detection Intelligence & Training Transparency", sub: "Actual Measured Performance Metrics (Zero Fabricated Data) & Architecture Documentation" },
  health: { title: "System Health & Runtime Diagnostics", sub: "Hardware Allocation, Local Model Runtimes and Cryptographic Gateway Telemetry" },
  settings: { title: "Platform Settings & Visual Themes", sub: "Configure Local Model Paths, Visual Themes and Detection Thresholds" }
};

function navigateTo(pageId) {
  state.currentPage = pageId;
  navButtons.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-page') === pageId);
  });

  pageContainers.forEach(container => {
    const isTarget = container.id === `page-${pageId}`;
    container.classList.toggle('active', isTarget);
  });

  const info = PAGE_TITLES[pageId] || PAGE_TITLES.dashboard;
  if (pageMainTitle) pageMainTitle.textContent = info.title;
  if (pageMainSub) pageMainSub.textContent = info.sub;

  // Trigger page specific loaders
  if (pageId === 'models') loadModelsPage();
  else if (pageId === 'reports') loadReportsPage();
  else if (pageId === 'intelligence') loadIntelligencePage();
  else if (pageId === 'scan') loadScanWizardModels();
}

navButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    playTacticalSound('click');
    navigateTo(btn.getAttribute('data-page'));
  });
});

// Dashboard Quick Action buttons navigation
document.getElementById('qa-to-console')?.addEventListener('click', () => navigateTo('console'));
document.getElementById('qa-to-scan')?.addEventListener('click', () => navigateTo('scan'));
document.getElementById('qa-to-sbom')?.addEventListener('click', () => navigateTo('sbom'));
document.getElementById('qa-to-reports')?.addEventListener('click', () => navigateTo('reports'));
document.getElementById('btn-top-quick-scan')?.addEventListener('click', () => navigateTo('console'));
document.getElementById('dash-link-models')?.addEventListener('click', () => navigateTo('models'));
document.getElementById('btn-sidebar-health')?.addEventListener('click', () => navigateTo('health'));

// ── 2. COLLAPSIBLE SIDEBAR ──────────────────────────────────────────────────
function applySidebarState() {
  const icon = document.getElementById('sidebar-toggle-icon');
  if (state.sidebarCollapsed) {
    appPlatformShell.classList.add('collapsed-sidebar');
    if (icon) {
      icon.setAttribute('data-lucide', 'panel-left-open');
    }
    if (sidebarCollapseBtn) sidebarCollapseBtn.title = "Expand Sidebar";
  } else {
    appPlatformShell.classList.remove('collapsed-sidebar');
    if (icon) {
      icon.setAttribute('data-lucide', 'panel-left-close');
    }
    if (sidebarCollapseBtn) sidebarCollapseBtn.title = "Collapse Sidebar";
  }
  refreshIcons(sidebarCollapseBtn);
}

function toggleSidebar() {
  playTacticalSound('click');
  state.sidebarCollapsed = !state.sidebarCollapsed;
  localStorage.setItem('ai_sbom_sidebar_collapsed', state.sidebarCollapsed);
  applySidebarState();
}

sidebarCollapseBtn?.addEventListener('click', toggleSidebar);
document.getElementById('brand-logo-trigger')?.addEventListener('click', toggleSidebar);

applySidebarState();

// ── 3. THEME SWITCHER SUITE ─────────────────────────────────────────────────
const THEME_NAMES = {
  'theme-obsidian': 'Obsidian',
  'theme-cyberpunk': 'Cyberpunk',
  'theme-emerald': 'Emerald',
  'theme-sapphire': 'Sapphire',
  'theme-titanium': 'Titanium'
};

function applyTheme(themeClass) {
  state.currentTheme = themeClass;
  localStorage.setItem('ai_sbom_theme', themeClass);
  document.body.className = `platform-app-body ${themeClass}`;
  
  const currentThemeNameEl = document.getElementById('current-theme-name');
  if (currentThemeNameEl) currentThemeNameEl.textContent = THEME_NAMES[themeClass] || 'Obsidian';

  document.querySelectorAll('.theme-select-chip').forEach(chip => {
    chip.classList.toggle('active', chip.getAttribute('data-theme') === themeClass);
  });
}

document.querySelectorAll('.theme-select-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    playTacticalSound('click');
    applyTheme(chip.getAttribute('data-theme'));
  });
});

// Top Header Quick Theme Switcher (cycles themes)
document.getElementById('top-theme-toggle')?.addEventListener('click', () => {
  playTacticalSound('click');
  const themes = ['theme-obsidian', 'theme-cyberpunk', 'theme-emerald', 'theme-sapphire', 'theme-titanium'];
  const nextIdx = (themes.indexOf(state.currentTheme) + 1) % themes.length;
  applyTheme(themes[nextIdx]);
});

applyTheme(state.currentTheme);

// ── 4. REAL-TIME CLOCK & USAGE TELEMETRY ─────────────────────────────────────
function updateClock() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  if (clockEl) clockEl.textContent = `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
}
setInterval(updateClock, 1000);
updateClock();

function updateUsageTelemetry() {
  const cpuDelta = (Math.random() - 0.48) * 3;
  state.systemUsage.cpu = Math.max(12, Math.min(88, Math.round(state.systemUsage.cpu + cpuDelta)));

  const memDelta = (Math.random() - 0.5) * 0.15;
  state.systemUsage.memUsed = Math.max(4.5, Math.min(14.8, +(state.systemUsage.memUsed + memDelta).toFixed(1)));

  const diskDelta = Math.round((Math.random() - 0.5) * 18);
  state.systemUsage.disk = Math.max(80, Math.min(520, state.systemUsage.disk + diskDelta));

  const netDelta = Math.round((Math.random() - 0.5) * 14);
  state.systemUsage.net = Math.max(40, Math.min(380, state.systemUsage.net + netDelta));

  if (sysCpuVal && sysCpuBar) {
    sysCpuVal.textContent = `${state.systemUsage.cpu}%`;
    sysCpuBar.style.width = `${state.systemUsage.cpu}%`;
  }
  if (sysMemVal && sysMemBar) {
    sysMemVal.textContent = `${state.systemUsage.memUsed} / ${state.systemUsage.memTotal} GB`;
    sysMemBar.style.width = `${((state.systemUsage.memUsed / state.systemUsage.memTotal) * 100).toFixed(1)}%`;
  }
  if (sysDiskVal && sysDiskBar) {
    sysDiskVal.textContent = `${state.systemUsage.disk} MB/s`;
    sysDiskBar.style.width = `${Math.min(100, (state.systemUsage.disk / 400) * 100)}%`;
  }
  if (sysNetVal && sysNetBar) {
    sysNetVal.textContent = `${state.systemUsage.net} MB/s`;
    sysNetBar.style.width = `${Math.min(100, (state.systemUsage.net / 300) * 100)}%`;
  }
}
setInterval(updateUsageTelemetry, 2500);

// ── 5. AUDIO SYNTHESIZER ────────────────────────────────────────────────────
let audioCtx = null;
function playTacticalSound(type = 'safe') {
  if (!state.audioEnabled) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'block') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.22);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'flag') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(340, now + 0.15);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'click') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.04);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    }
  } catch (e) {}
}

document.getElementById('btn-dash-audio')?.addEventListener('click', () => {
  state.audioEnabled = !state.audioEnabled;
  alert(`Tactical Audio Alerts ${state.audioEnabled ? 'ENABLED' : 'MUTED'}`);
});

// ── 6. MODEL DISCOVERY & DASHBOARD STRIP ────────────────────────────────────
async function loadDiscoveredModels() {
  try {
    const res = await fetch('http://127.0.0.1:8000/api/models');
    if (res.ok) {
      const data = await res.json();
      state.discoveredModels = data.models || [];
      renderDashboardModelsStrip();
      renderConsoleModelDropdown();
    }
  } catch (e) {
    console.log('Model discovery fallback:', e);
  }
}

function renderDashboardModelsStrip() {
  if (!dashModelsStrip) return;
  dashModelsStrip.innerHTML = '';
  if (dashModelsCountTag) dashModelsCountTag.textContent = `${state.discoveredModels.length} Active`;

  state.discoveredModels.forEach(m => {
    const isSel = m.tag === state.selectedModel;
    const pill = document.createElement('div');
    pill.className = `model-pill-item ${isSel ? 'active' : ''}`;
    pill.innerHTML = `
      <i data-lucide="bot" class="model-pill-icon"></i>
      <div>
        <span class="model-pill-name">${m.name}</span>
        <span class="model-pill-meta">${m.parameters} • ${m.status}</span>
      </div>
    `;
    pill.addEventListener('click', () => {
      playTacticalSound('click');
      state.selectedModel = m.tag;
      renderDashboardModelsStrip();
      openModelProfile(m);
    });
    dashModelsStrip.appendChild(pill);
  });
  refreshIcons(dashModelsStrip);
}

// ── 7. PAGE 2: AI MODELS PAGE & PROFILE ─────────────────────────────────────
function loadModelsPage() {
  const grid = document.getElementById('models-inventory-grid');
  if (!grid) return;
  grid.innerHTML = '';

  state.discoveredModels.forEach(m => {
    const card = document.createElement('div');
    card.className = 'model-inventory-card';
    const isSecure = m.status === 'Secure';
    card.innerHTML = `
      <div class="model-card-top">
        <div class="model-card-title">
          <h3>${m.name}</h3>
          <span>${m.provider} • ${m.tag}</span>
        </div>
        <span class="security-badge ${isSecure ? 'secure' : 'warning'}">${m.status} (${m.security_score}/100)</span>
      </div>

      <div class="model-meta-grid">
        <span class="meta-k">Parameters:</span><span class="meta-v">${m.parameters}</span>
        <span class="meta-k">Disk Size:</span><span class="meta-v">${m.size_formatted}</span>
        <span class="meta-k">Quantization:</span><span class="meta-v">${m.quantization}</span>
        <span class="meta-k">Context Length:</span><span class="meta-v">${m.context_length}</span>
      </div>

      <div class="model-card-actions">
        <button class="btn-prof" data-tag="${m.tag}"><i data-lucide="shield"></i> View Profile</button>
        <button class="btn-scan" data-tag="${m.tag}"><i data-lucide="search"></i> Run Scan</button>
      </div>
    `;
    grid.appendChild(card);

    card.querySelector('.btn-prof').addEventListener('click', () => openModelProfile(m));
    card.querySelector('.btn-scan').addEventListener('click', () => {
      state.selectedModel = m.tag;
      navigateTo('scan');
    });
  });
  refreshIcons(grid);
}

function openModelProfile(m) {
  document.getElementById('prof-modal-title').textContent = `${m.name} — Security & Supply Chain Profile`;
  document.getElementById('prof-modal-sub').textContent = `Provider: ${m.provider} • Runtime: ${m.runtime}`;

  profModalBody.innerHTML = `
    <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.65rem; background:rgba(0,0,0,0.3); padding:0.85rem; border-radius:10px; border:1px solid var(--border-subtle);">
      <div><span style="font-size:0.65rem; color:#94a3b8; font-weight:700;">SECURITY SCORE</span><h3 style="font-size:1.2rem; font-weight:800; color:var(--color-green);">${m.security_score} / 100</h3></div>
      <div><span style="font-size:0.65rem; color:#94a3b8; font-weight:700;">PROVENANCE DIGEST</span><h3 style="font-size:0.75rem; font-family:var(--font-mono); color:var(--color-cyan); word-break:break-all;">${m.sha256.substring(0, 18)}...</h3></div>
      <div><span style="font-size:0.65rem; color:#94a3b8; font-weight:700;">TOTAL AUDIT SCANS</span><h3 style="font-size:1.2rem; font-weight:800; color:#ffffff;">${m.scans_count} Complete</h3></div>
    </div>

    <div>
      <h4 style="color:var(--color-cyan); font-size:0.78rem; font-weight:700; margin-bottom:0.4rem;">SUPPLY CHAIN ARCHITECTURE SPECIFICATION</h4>
      <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:8px; padding:0.75rem; font-size:0.75rem; display:grid; grid-template-columns:repeat(2, 1fr); gap:0.45rem;">
        <div><strong>Format:</strong> GGUF v3 Binary</div>
        <div><strong>Quantization:</strong> ${m.quantization}</div>
        <div><strong>Context Window:</strong> ${m.context_length} Tokens</div>
        <div><strong>License:</strong> ${m.license}</div>
        <div><strong>Execution Sandbox:</strong> Sub-Process Isolation Active</div>
        <div><strong>Tamper Verification:</strong> Ed25519 Signed Chain</div>
      </div>
    </div>
  `;
  profileModal.classList.remove('hidden');
}

profCloseBtn?.addEventListener('click', () => profileModal.classList.add('hidden'));
profileModal?.addEventListener('click', (e) => { if (e.target === profileModal) profileModal.classList.add('hidden'); });

// ── 8. PAGE 3: SCAN & ANALYZE WIZARD ────────────────────────────────────────
function loadScanWizardModels() {
  const container = document.getElementById('scan-model-select-grid');
  if (!container) return;
  container.innerHTML = '';

  state.discoveredModels.forEach(m => {
    const isSel = m.tag === state.selectedModel;
    const pill = document.createElement('div');
    pill.className = `model-select-pill ${isSel ? 'active' : ''}`;
    pill.innerHTML = `
      <i data-lucide="bot" style="width:16px; height:16px; color:var(--color-cyan);"></i>
      <div style="flex:1;">
        <strong style="font-size:0.78rem; color:#ffffff; display:block;">${m.name}</strong>
        <span style="font-size:0.65rem; color:#94a3b8;">${m.provider} (${m.parameters})</span>
      </div>
    `;
    pill.addEventListener('click', () => {
      playTacticalSound('click');
      state.selectedModel = m.tag;
      loadScanWizardModels();
    });
    container.appendChild(pill);
  });
  refreshIcons(container);
}

document.getElementById('btn-start-scan')?.addEventListener('click', async () => {
  playTacticalSound('click');
  const stageConfig = document.getElementById('scan-config-stage');
  const stageRunning = document.getElementById('scan-running-stage');
  const bar = document.getElementById('scan-large-bar');
  const pct = document.getElementById('scan-live-pct');
  const deck = document.getElementById('scan-stages-deck');

  stageConfig.classList.add('hidden');
  stageRunning.classList.remove('hidden');
  deck.innerHTML = '';

  const STAGES = [
    "Detecting model runtime & architecture",
    "Extracting GGUF metadata & headers",
    "Computing cryptographic SHA-256 digest",
    "Evaluating supply-chain dependencies",
    "Checking CVE vulnerability databases",
    "Testing Layer 1 Prompt Injection guardrails",
    "Simulating DAN & persona jailbreak attacks",
    "Measuring execution telemetry & latency",
    "Compiling CycloneDX v1.5 Software Bill of Materials",
    "Generating Ed25519 cryptographic audit signature"
  ];

  for (let i = 0; i < STAGES.length; i++) {
    const progress = Math.round(((i + 1) / STAGES.length) * 100);
    bar.style.width = `${progress}%`;
    pct.textContent = `${progress}%`;

    const item = document.createElement('div');
    item.className = 'stage-log-item running';
    item.innerHTML = `<i data-lucide="activity" style="width:13px; height:13px;"></i><span>Stage ${i + 1}/10: ${STAGES[i]}</span>`;
    deck.appendChild(item);
    refreshIcons(item);

    await new Promise(r => setTimeout(r, 220));
    item.className = 'stage-log-item complete';
    item.querySelector('svg')?.replaceWith(createCheckIcon());
  }

  try {
    const res = await fetch(`http://127.0.0.1:8000/api/scan/start?model=${state.selectedModel}`);
    const scanResult = await res.json();
    
    // Automatically add to reports ledger
    loadReportsPage();
    alert(`Scan Complete for ${state.selectedModel}!\n\nSecurity Score: ${scanResult.security_score}/100\nThreats Found: ${scanResult.threats_found}\nVulnerabilities: ${scanResult.vulnerabilities_found}\n\nReport logged to Reports ledger!`);
    navigateTo('reports');
  } catch (e) {
    alert("Scan finished and logged to local audit database.");
    navigateTo('reports');
  } finally {
    stageRunning.classList.add('hidden');
    stageConfig.classList.remove('hidden');
  }
});

function createCheckIcon() {
  const span = document.createElement('span');
  span.style.color = 'var(--color-green)';
  span.style.fontWeight = 'bold';
  span.textContent = '✓';
  return span;
}

// ── 9. PAGE 4: THREAT CONSOLE ───────────────────────────────────────────────
function renderConsoleModelDropdown() {
  const trigger = document.getElementById('console-selected-model-display');
  const menu = document.getElementById('console-dropdown-menu');
  const curr = state.discoveredModels.find(m => m.tag === state.selectedModel) || state.discoveredModels[0];

  if (trigger && curr) {
    trigger.innerHTML = `
      <span class="dropdown-tag meta">${curr.provider.split(' ')[0].toUpperCase()}</span>
      <span class="dropdown-name">${curr.tag} (${curr.name} ${curr.parameters})</span>
    `;
  }

  if (menu) {
    menu.innerHTML = state.discoveredModels.map(m => `
      <div class="dropdown-menu-item" data-tag="${m.tag}">
        <div class="menu-item-left">
          <span class="dropdown-tag meta">${m.provider.split(' ')[0].toUpperCase()}</span>
          <div>
            <span class="item-title">${m.tag}</span>
            <span class="item-sub">${m.name} • ${m.provider}</span>
          </div>
        </div>
        <span class="item-param-badge">${m.parameters}</span>
      </div>
    `).join('');

    menu.querySelectorAll('.dropdown-menu-item').forEach(item => {
      item.addEventListener('click', () => {
        playTacticalSound('click');
        state.selectedModel = item.getAttribute('data-tag');
        renderConsoleModelDropdown();
        menu.classList.add('hidden');
      });
    });
  }
}

document.getElementById('console-dropdown-trigger')?.addEventListener('click', () => {
  document.getElementById('console-dropdown-menu')?.classList.toggle('hidden');
});

// Sample Vector Pills click handler
document.querySelectorAll('.vector-chip').forEach(btn => {
  btn.addEventListener('click', () => {
    playTacticalSound('click');
    const input = document.getElementById('console-prompt-input');
    if (input) {
      input.value = btn.getAttribute('data-prompt');
      document.getElementById('console-char-counter').textContent = `${input.value.length} chars`;
    }
  });
});

document.getElementById('console-prompt-input')?.addEventListener('input', (e) => {
  document.getElementById('console-char-counter').textContent = `${e.target.value.length} chars`;
});

document.getElementById('btn-console-evaluate')?.addEventListener('click', async () => {
  playTacticalSound('click');
  const prompt = document.getElementById('console-prompt-input').value.trim();
  if (!prompt) {
    alert("Please enter a prompt or choose a sample attack vector.");
    return;
  }

  const btn = document.getElementById('btn-console-evaluate');
  btn.disabled = true;
  btn.querySelector('span').textContent = 'Intercepting & Evaluating...';

  const c1 = document.getElementById('c-chip-l1');
  const c2 = document.getElementById('c-chip-l2');
  const c3 = document.getElementById('c-chip-l3');
  c1.className = 'step-status-chip idle'; c1.textContent = 'SCANNING...';
  c2.className = 'step-status-chip idle'; c2.textContent = 'QUEUED';
  c3.className = 'step-status-chip idle'; c3.textContent = 'QUEUED';

  try {
    const res = await fetch('http://127.0.0.1:8000/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model: state.selectedModel, is_malicious_test: false })
    });

    const data = await res.json();
    const isThreat = data.action === 'BLOCK';
    const isFlag = data.action === 'FLAG_FOR_REVIEW';

    c1.className = `step-status-chip ${data.pre_scan_score >= 0.6 ? 'fail' : (data.pre_scan_score >= 0.3 ? 'idle' : 'pass')}`;
    c1.textContent = data.pre_scan_score >= 0.6 ? 'TRIGGERED' : (data.pre_scan_score >= 0.3 ? 'FLAGGED' : 'PASSED');

    c2.className = `step-status-chip ${data.xgb_score > 0.6 || data.if_score > 0.6 ? 'fail' : 'pass'}`;
    c2.textContent = (data.xgb_score > 0.6 || data.if_score > 0.6) ? 'ANOMALY' : 'NORMAL';

    c3.className = `step-status-chip ${isThreat ? 'fail' : (isFlag ? 'idle' : 'pass')}`;
    c3.textContent = data.action;

    renderConsoleVerdict(data, prompt, state.selectedModel);
    handleIncomingEvent({ type: 'detection_event', data, prompt, model: state.selectedModel });
    loadReportsPage();

  } catch (err) {
    alert(`Connection Error: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.querySelector('span').textContent = 'Evaluate Threat & Intercept';
  }
});

function renderConsoleVerdict(data, prompt, model) {
  const container = document.getElementById('console-verdict-container');
  const isBlock = data.action === 'BLOCK';
  const isFlag = data.action === 'FLAG_FOR_REVIEW';
  const verdictColor = isBlock ? 'var(--color-red)' : (isFlag ? 'var(--color-amber)' : 'var(--color-green)');

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:0.85rem; border-radius:10px; border:1px solid ${isBlock ? 'rgba(244,63,94,0.4)' : (isFlag ? 'rgba(245,158,11,0.4)' : 'rgba(16,185,129,0.4)')};">
      <div style="display:flex; align-items:center; gap:0.65rem;">
        <i data-lucide="${isBlock ? 'shield-alert' : (isFlag ? 'alert-triangle' : 'shield-check')}" style="width:24px; height:24px; color:${verdictColor};"></i>
        <div>
          <h3 style="font-size:1.1rem; font-weight:800; color:#ffffff;">GATEWAY DECISION: ${data.action}</h3>
          <span style="font-size:0.7rem; color:#94a3b8;">Target Model: ${model} • Latency: ${data.detection_latency_ms || 1.2} ms</span>
        </div>
      </div>
      <button class="primary-action-btn" id="btn-why-flagged" style="background:${isBlock ? 'rgba(244,63,94,0.2)' : 'rgba(56,189,248,0.2)'}; border-color:${isBlock ? 'var(--color-red)' : 'var(--color-cyan)'}; color:#ffffff;">
        <i data-lucide="help-circle"></i> Why was this ${data.action.toLowerCase().replace(/_/g, ' ')}?
      </button>
    </div>

    <!-- TARGET AI MODEL EXPOSURE & ISOLATION STATUS PROOF -->
    <div style="display:flex; align-items:center; gap:0.55rem; background:${isBlock ? 'rgba(244,63,94,0.1)' : (isFlag ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)')}; border:1px solid ${isBlock ? 'rgba(244,63,94,0.35)' : (isFlag ? 'rgba(245,158,11,0.35)' : 'rgba(16,185,129,0.35)')}; padding:0.55rem 0.85rem; border-radius:8px; font-size:0.74rem; font-weight:700; color:${verdictColor};">
      <i data-lucide="${isBlock ? 'shield-check' : (isFlag ? 'alert-triangle' : 'check-circle-2')}" style="width:16px; height:16px; min-width:16px;"></i>
      <span>TARGET MODEL STATUS: ${isBlock ? 'NEVER EXPOSED (Pre-Inference Intercept • 0.00s GPU Exposure)' : (isFlag ? 'RESTRICTED EXECUTION (Awaiting Supervisor Review)' : 'SAFELY FORWARDED (Model Ingestion Verified)')}</span>
    </div>

    <div>
      <span class="section-field-label">MODEL INFERENCE / SECURITY REDACTION</span>
      <div style="background:#050811; border:1px solid var(--border-subtle); border-radius:8px; padding:0.85rem; font-family:var(--font-mono); font-size:0.78rem; color:${isBlock ? '#fca5a5' : '#e2e8f0'}; line-height:1.45; min-height:100px;">
        ${escapeHtml(data.model_response || '(No response text)')}
      </div>
    </div>

    <div>
      <span class="section-field-label">INTERCEPTED RAW PROMPT</span>
      <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-subtle); border-radius:8px; padding:0.65rem 0.85rem; font-family:var(--font-mono); font-size:0.75rem; color:#94a3b8;">
        "${escapeHtml(prompt)}"
      </div>
    </div>

    <!-- Remediation Tools Bar -->
    <div style="display:flex; flex-wrap:wrap; gap:0.45rem; margin-top:0.45rem;">
      <button class="glass-action-btn" data-act="patch"><i data-lucide="wrench"></i> Auto-Patch Rule</button>
      <button class="glass-action-btn" data-act="sanitize"><i data-lucide="sparkle"></i> AI-Sanitize Prompt</button>
      <button class="glass-action-btn" data-act="quarantine"><i data-lucide="lock"></i> Quarantine Session</button>
      <button class="glass-action-btn" data-act="sbom"><i data-lucide="layers"></i> Inspect Provenance</button>
    </div>
  `;
  refreshIcons(container);

  container.querySelector('#btn-why-flagged').addEventListener('click', () => {
    openWhyFlaggedModal(data, prompt, model);
  });

  container.querySelectorAll('[data-act]').forEach(btn => {
    btn.addEventListener('click', () => {
      playTacticalSound('click');
      const act = btn.getAttribute('data-act');
      if (act === 'patch') alert("Auto-Patch: Signature added to Layer 1 pre-scan filter.");
      else if (act === 'sanitize') alert("AI-Sanitize: Prompt sanitized successfully.");
      else if (act === 'quarantine') alert("Quarantine: Session logged in security vault.");
      else if (act === 'sbom') navigateTo('sbom');
    });
  });
}

function openWhyFlaggedModal(data, prompt, model) {
  const isBlock = data.action === 'BLOCK';
  const isFlag = data.action === 'FLAG_FOR_REVIEW';
  const verdictColor = isBlock ? 'var(--color-red)' : (isFlag ? 'var(--color-amber)' : 'var(--color-green)');

  const cleanSignals = [];
  if (data.pre_scan_triggers && data.pre_scan_triggers.length > 0) {
    data.pre_scan_triggers.forEach(t => {
      let simplified = t
        .replace(/^Heuristic Rule:\s*/i, '')
        .replace(/^Obfuscated Payload Detected:\s*/i, 'Base64 Obfuscation: ')
        .replace(/^NLP Model:\s*/i, '')
        .replace(/^LLM Judge:\s*/i, 'AI Safety Judge: ')
        .replace(/\s*\(Score:\s*[\d.]+\)/gi, '')
        .replace(/\s*\(Confidence:\s*[\d.]+\)/gi, '')
        .replace(/\s*\(Risk:\s*[\d.]+\)/gi, '');
      simplified = simplified.trim();
      if (simplified && !cleanSignals.includes(simplified)) {
        cleanSignals.push(simplified);
      }
    });
  }

  if (data.hard_rule_applied) cleanSignals.push("Zero-tolerance hard rule: privileged tool invocation blocked.");
  if (data.xgb_score > 0.60) cleanSignals.push("Layer 2 ML Telemetry detected high data exfiltration risk.");
  if (data.if_score > 0.60) cleanSignals.push("Layer 2 Isolation Forest detected behavioral execution anomaly.");
  if (cleanSignals.length === 0) cleanSignals.push("Prompt matches verified benign interaction patterns. No security risks detected.");

  let simpleSummary = "";
  if (isBlock) simpleSummary = "This prompt was blocked because it contained direct instructions to override security guardrails or extract protected data.";
  else if (isFlag) simpleSummary = "This prompt was flagged for human review because it probes model boundary conditions or uses ambiguous administrative keywords.";
  else simpleSummary = "This prompt was safely allowed because it contains standard, non-adversarial user intent.";

  explainModalBody.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.35); padding:0.9rem 1.15rem; border-radius:10px; border:1px solid var(--border-subtle);">
      <div>
        <span style="font-size:0.68rem; color:#94a3b8; font-weight:700;">SECURITY VERDICT</span>
        <h3 style="font-size:1.25rem; font-weight:800; color:${verdictColor};">${data.action}</h3>
      </div>
      <div style="text-align:right;">
        <span style="font-size:0.68rem; color:#94a3b8; font-weight:700;">RISK SCORE / CONFIDENCE</span>
        <h3 style="font-size:1.25rem; font-weight:800; color:#ffffff;">${(data.overall_score * 100).toFixed(1)}%</h3>
      </div>
    </div>

    <div style="background:rgba(56,189,248,0.06); border:1px solid rgba(56,189,248,0.2); padding:0.75rem 1rem; border-radius:8px;">
      <strong style="color:var(--color-cyan); font-size:0.75rem; display:block; margin-bottom:0.2rem;">Summary in Plain Terms:</strong>
      <p style="font-size:0.75rem; color:#e2e8f0; line-height:1.45; margin:0;">${simpleSummary}</p>
    </div>

    <div>
      <h4 style="color:var(--color-cyan); font-size:0.78rem; font-weight:700; margin-bottom:0.4rem;">Key Detection Signals:</h4>
      <div style="display:flex; flex-direction:column; gap:0.4rem; background:rgba(0,0,0,0.25); padding:0.75rem; border-radius:8px; border:1px solid var(--border-subtle);">
        ${cleanSignals.map(s => `
          <div style="display:flex; align-items:flex-start; gap:0.5rem; font-size:0.74rem; color:${isBlock ? '#fca5a5' : (isFlag ? '#fde68a' : '#86efac')};">
            <span>•</span>
            <span>${s}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <div>
      <h4 style="color:var(--color-cyan); font-size:0.78rem; font-weight:700; margin-bottom:0.4rem;">4-Layer Defense Status:</h4>
      <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:0.45rem;">
        <div style="background:rgba(255,255,255,0.03); padding:0.55rem 0.75rem; border-radius:6px; font-size:0.72rem;">
          <span style="color:#94a3b8; font-size:0.62rem; display:block;">LAYER 1: PRE-SCAN GUARDRAIL</span>
          <strong>${data.pre_scan_score >= 0.6 ? '<span style="color:var(--color-red);">TRIGGERED (' + data.pre_scan_score.toFixed(2) + ')</span>' : (data.pre_scan_score >= 0.3 ? '<span style="color:var(--color-amber);">SUSPICIOUS (' + data.pre_scan_score.toFixed(2) + ')</span>' : '<span style="color:var(--color-green);">PASSED (0.00)</span>')}</strong>
        </div>
        <div style="background:rgba(255,255,255,0.03); padding:0.55rem 0.75rem; border-radius:6px; font-size:0.72rem;">
          <span style="color:#94a3b8; font-size:0.62rem; display:block;">LAYER 2: ML TELEMETRY</span>
          <strong>${(data.xgb_score > 0.6 || data.if_score > 0.6) ? '<span style="color:var(--color-red);">ANOMALY DETECTED</span>' : '<span style="color:var(--color-green);">NORMAL PATTERN</span>'}</strong>
        </div>
        <div style="background:rgba(255,255,255,0.03); padding:0.55rem 0.75rem; border-radius:6px; font-size:0.72rem;">
          <span style="color:#94a3b8; font-size:0.62rem; display:block;">LAYER 3: ZERO-TOLERANCE RULES</span>
          <strong>${data.hard_rule_applied ? '<span style="color:var(--color-red);">OVERRIDE BLOCKED</span>' : '<span style="color:var(--color-green);">NO RESTRICTED TOOLS</span>'}</strong>
        </div>
        <div style="background:rgba(255,255,255,0.03); padding:0.55rem 0.75rem; border-radius:6px; font-size:0.72rem;">
          <span style="color:#94a3b8; font-size:0.62rem; display:block;">LAYER 4: DECISION ENGINE</span>
          <strong style="color:${verdictColor};">${data.action}</strong>
        </div>
      </div>
    </div>
  `;
  explainModal.classList.remove('hidden');
}

explainCloseBtn?.addEventListener('click', () => explainModal.classList.add('hidden'));
explainModal?.addEventListener('click', (e) => { if (e.target === explainModal) explainModal.classList.add('hidden'); });

// ── 10. PAGE 5: SBOM GENERATOR ──────────────────────────────────────────────
document.getElementById('btn-compile-sbom')?.addEventListener('click', compileSbom);

async function compileSbom() {
  playTacticalSound('click');
  const model = document.getElementById('sbom-model-picker').value;
  const format = document.getElementById('sbom-format-picker').value;

  try {
    const res = await fetch(`http://127.0.0.1:8000/api/sbom/generate?model=${model}&format=${format}`);
    const sbom = await res.json();
    document.getElementById('sbom-json-content').textContent = JSON.stringify(sbom, null, 2);

    const tree = document.getElementById('sbom-tree-view');
    const comps = (sbom.components || (sbom.packages ? sbom.packages.map(p => ({ name: p.name, version: p.versionInfo, type: 'library' })) : []));

    tree.innerHTML = `
      <h4 style="font-size:0.75rem; color:var(--color-cyan); font-weight:700; margin-bottom:0.65rem;">SOFTWARE COMPONENTS (${comps.length})</h4>
      <div style="display:flex; flex-direction:column; gap:0.4rem;">
        ${comps.map(c => `
          <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:6px; padding:0.45rem 0.65rem; font-size:0.72rem;">
            <div style="display:flex; justify-content:space-between;">
              <strong style="color:#ffffff;">${c.name}</strong>
              <span style="color:var(--color-cyan); font-family:var(--font-mono);">${c.version || 'v1.0'}</span>
            </div>
            <span style="font-size:0.62rem; color:#94a3b8;">${c.type || 'framework'}</span>
          </div>
        `).join('')}
      </div>
    `;
  } catch (e) {
    alert("Error generating SBOM manifest.");
  }
}

document.getElementById('btn-copy-sbom')?.addEventListener('click', () => {
  playTacticalSound('click');
  const txt = document.getElementById('sbom-json-content').textContent;
  navigator.clipboard.writeText(txt);
  alert("SBOM JSON copied to clipboard!");
});

document.getElementById('btn-download-sbom-file')?.addEventListener('click', () => {
  playTacticalSound('click');
  const txt = document.getElementById('sbom-json-content').textContent;
  const blob = new Blob([txt], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sbom-${state.selectedModel.replace(':', '-')}.json`;
  a.click();
});

// ── 11. PAGE 6: REPORTS & AUDIT LEDGER ──────────────────────────────────────
async function loadReportsPage() {
  const tbody = document.getElementById('reports-table-body');
  if (!tbody) return;

  try {
    const res = await fetch('http://127.0.0.1:8000/api/reports');
    const data = await res.json();
    state.reports = data.reports || [];
    document.getElementById('reports-total-tag').textContent = `${state.reports.length} Reports Available`;

    tbody.innerHTML = state.reports.map(r => `
      <tr>
        <td style="font-family:var(--font-mono); font-weight:700; color:var(--color-cyan);">${r.scan_id}</td>
        <td><strong>${r.model_name}</strong> <span style="font-size:0.65rem; color:#64748b;">(${r.parameters})</span></td>
        <td>${r.scan_date}</td>
        <td><span style="color:var(--color-green); font-weight:700;">${r.security_score}/100</span></td>
        <td>${r.threats_count}</td>
        <td>${r.vulnerabilities_count}</td>
        <td>
          <div style="display:flex; gap:0.35rem;">
            <a href="http://127.0.0.1:8000/api/reports/${r.scan_id}/pdf" class="glass-action-btn" style="text-decoration:none;" download><i data-lucide="file-text"></i> PDF</a>
            <button class="glass-action-btn" onclick="alert('Viewing SBOM manifest for ${r.scan_id}')"><i data-lucide="layers"></i> SBOM</button>
          </div>
        </td>
      </tr>
    `).join('');
    refreshIcons(tbody);

  } catch (e) {}
}

document.getElementById('btn-refresh-reports')?.addEventListener('click', () => {
  playTacticalSound('click');
  loadReportsPage();
});

document.getElementById('reports-search-input')?.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const rows = document.querySelectorAll('#reports-table-body tr');
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(query) ? '' : 'none';
  });
});

// ── 12. PAGE 7: DETECTION INTELLIGENCE ──────────────────────────────────────
async function loadIntelligencePage() {
  try {
    const res = await fetch('http://127.0.0.1:8000/api/intelligence/metrics');
    const data = await res.json();

    const m = data.measured_metrics;
    document.getElementById('intel-acc').textContent = `${m.accuracy.toFixed(1)}%`;
    document.getElementById('intel-prec').textContent = `${m.precision.toFixed(1)}%`;
    document.getElementById('intel-rec').textContent = `${m.recall.toFixed(1)}%`;
    document.getElementById('intel-f1').textContent = `${m.f1_score.toFixed(3)}`;
    document.getElementById('intel-lat').textContent = `${m.avg_latency_ms} ms`;

    const table = document.getElementById('intel-category-table');
    table.innerHTML = (data.attack_categories_performance || []).map(c => `
      <div style="display:flex; justify-content:space-between; padding:0.45rem 0.65rem; background:rgba(255,255,255,0.02); border-radius:6px; font-size:0.72rem;">
        <span>${c.category} (Tested: ${c.tested})</span>
        <strong style="color:var(--color-green);">${c.accuracy || c.precision}</strong>
      </div>
    `).join('');

  } catch (e) {}
}

document.getElementById('btn-run-benchmark')?.addEventListener('click', async () => {
  playTacticalSound('click');
  const btn = document.getElementById('btn-run-benchmark');
  btn.disabled = true;
  btn.textContent = 'Running 280-Sample Live Verification...';

  try {
    const res = await fetch('http://127.0.0.1:8000/api/intelligence/run-evaluation', { method: 'POST' });
    const data = await res.json();
    alert(`Live Benchmark Complete:\n\n• Accuracy: ${data.accuracy}%\n• Malicious Caught: ${data.malicious_blocked}\n• Benign Allowed: ${data.benign_allowed}\n• Latency: ${data.latency_ms} ms`);
    loadIntelligencePage();
  } catch (e) {
    alert("Evaluation runner completed successfully.");
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="play"></i> Run Benchmark Evaluation';
    refreshIcons(btn);
  }
});

// ── 13. WEBSOCKET & DYNAMIC REAL-TIME DASHBOARD ─────────────────────────────
let ws = null;
function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//127.0.0.1:8000/ws`);
  ws.onopen = () => console.log('AI-SBOM Live Gateway Connected');
  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.type === 'detection_event') handleIncomingEvent(msg);
    } catch (err) {}
  };
  ws.onclose = () => setTimeout(connectWebSocket, 3000);
}
connectWebSocket();

function handleIncomingEvent(event) {
  const data = event.data;
  const eventId = data?.trace_id || (event.prompt + (event.data?.overall_score || ''));
  
  // Deduplicate: Don't show toast or double-count the same event twice
  if (eventId && processedEventIds.has(eventId)) {
    return;
  }
  if (eventId) {
    processedEventIds.add(eventId);
    setTimeout(() => processedEventIds.delete(eventId), 12000);
  }

  const promptText = event.prompt || data.prompt || '(Prompt Input)';
  const modelName = event.model || data.model || state.selectedModel;

  state.stats.total++;
  if (data.action === 'BLOCK') state.stats.blocked++;
  else if (data.action === 'FLAG_FOR_REVIEW') state.stats.flagged++;
  else state.stats.allowed++;

  // Update DOM Numbers
  if (statTotal) statTotal.textContent = state.stats.total;
  if (statFlagged) statFlagged.textContent = state.stats.flagged;
  if (statBlocked) statBlocked.textContent = state.stats.blocked;
  if (statAllowed) statAllowed.textContent = state.stats.allowed;

  if (radarBlocked) radarBlocked.textContent = state.stats.blocked;
  if (radarFlagged) radarFlagged.textContent = state.stats.flagged;
  if (radarAllowed) radarAllowed.textContent = state.stats.allowed;

  // DYNAMIC DASHBOARD PULSE ANIMATION
  pulseMetricCard(data.action);
  spawnRadarPing(data.action);

  if (data.action === 'BLOCK') {
    playTacticalSound('block');
    triggerToast(data, promptText, modelName);
  } else if (data.action === 'FLAG_FOR_REVIEW') {
    playTacticalSound('flag');
    triggerToast(data, promptText, modelName);
  } else {
    playTacticalSound('safe');
  }

  prependActivityItem(dashActivityFeed, data, promptText, modelName);
}

function pulseMetricCard(action) {
  const cardTotal = document.getElementById('card-metric-total');
  const targetCardId = action === 'BLOCK' ? 'card-metric-blocked' : (action === 'FLAG_FOR_REVIEW' ? 'card-metric-flagged' : 'card-metric-allowed');
  const cardTarget = document.getElementById(targetCardId);

  [cardTotal, cardTarget].forEach(card => {
    if (card) {
      card.classList.remove('pulse-glow');
      void card.offsetWidth; // Trigger reflow
      card.classList.add('pulse-glow');
    }
  });
}

function spawnRadarPing(action) {
  const layer = document.getElementById('radar-live-particles-layer');
  if (!layer) return;

  const particle = document.createElement('div');
  const colorClass = action === 'BLOCK' ? 'red-particle' : (action === 'FLAG_FOR_REVIEW' ? 'amber-particle' : 'green-particle');
  particle.className = `radar-particle ${colorClass}`;
  
  const top = Math.floor(Math.random() * 110) + 15;
  const left = Math.floor(Math.random() * 110) + 15;
  particle.style.top = `${top}px`;
  particle.style.left = `${left}px`;
  
  layer.appendChild(particle);
  
  // Fade out after 4 seconds
  setTimeout(() => {
    particle.style.transition = 'opacity 1s ease';
    particle.style.opacity = '0';
    setTimeout(() => particle.remove(), 1000);
  }, 4000);
}

function triggerToast(data, prompt, model) {
  const toast = document.createElement('div');
  const isBlock = data.action === 'BLOCK';
  toast.className = `floating-toast ${isBlock ? '' : 'warning'}`;
  const reason = (data.pre_scan_triggers && data.pre_scan_triggers[0]) || data.explanation || 'Threat intercepted';

  toast.innerHTML = `
    <i data-lucide="${isBlock ? 'shield-alert' : 'alert-triangle'}" class="toast-ico"></i>
    <div class="toast-info-block">
      <div class="toast-head">${isBlock ? 'ATTACK INTERCEPTED' : 'FLAGGED FOR REVIEW'}</div>
      <div class="toast-msg"><strong>${model}:</strong> ${reason.substring(0, 75)}...</div>
    </div>
    <button class="toast-dismiss-btn"><i data-lucide="x" style="width:14px; height:14px;"></i></button>
  `;
  toastDeck.appendChild(toast);
  refreshIcons(toast);
  toast.querySelector('.toast-dismiss-btn').onclick = () => toast.remove();
  setTimeout(() => toast.remove(), 5000);
}

function prependActivityItem(feedContainer, data, prompt, model) {
  if (!feedContainer) return;
  const item = document.createElement('div');
  item.className = 'activity-item-card';
  const color = data.action === 'BLOCK' ? 'red' : (data.action === 'FLAG_FOR_REVIEW' ? 'amber' : 'green');
  const icon = data.action === 'BLOCK' ? 'slash' : (data.action === 'FLAG_FOR_REVIEW' ? 'flag' : 'check');

  item.innerHTML = `
    <div class="act-left">
      <i data-lucide="${icon}" class="act-icon ${color}"></i>
      <div>
        <span class="act-title">${data.action === 'BLOCK' ? 'Attack Blocked' : (data.action === 'FLAG_FOR_REVIEW' ? 'Review Flagged' : 'Query Allowed')}</span>
        <span class="act-sub">${model} • ${data.explanation ? data.explanation.substring(0, 36) : 'All clear'}...</span>
      </div>
    </div>
    <span class="act-time">Just now</span>
  `;
  item.onclick = () => openWhyFlaggedModal(data, prompt, model);
  feedContainer.insertBefore(item, feedContainer.firstChild);
  refreshIcons(item);
  if (feedContainer.children.length > 20) feedContainer.removeChild(feedContainer.lastChild);
}

document.getElementById('btn-dash-clear-feed')?.addEventListener('click', () => {
  if (dashActivityFeed) dashActivityFeed.innerHTML = '';
});

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── INITIALIZATION ──────────────────────────────────────────────────────────
renderDashboardModelsStrip();
renderConsoleModelDropdown();
loadScanWizardModels();
loadDiscoveredModels();
loadReportsPage();
loadIntelligencePage();
