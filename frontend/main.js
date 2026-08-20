import { createIcons, ShieldAlert, AlertTriangle, ShieldCheck, Activity, Cpu, CheckCircle2, Network, Info } from 'lucide';

// Initialize Icons
createIcons({
  icons: {
    ShieldAlert,
    AlertTriangle,
    ShieldCheck,
    Activity,
    Cpu,
    CheckCircle2,
    Network,
    Info
  }
});

// State
let stats = {
  total: 0,
  flagged: 0,
  blocked: 0
};

// DOM Elements
const liveFeed = document.getElementById('live-feed');
const statTotal = document.getElementById('stat-total');
const statFlagged = document.getElementById('stat-flagged');
const statBlocked = document.getElementById('stat-blocked');

// --- WebSocket Setup ---
let ws;
function connectWebSocket() {
  ws = new WebSocket('ws://127.0.0.1:8000/ws');

  ws.onopen = () => {
    console.log('Connected to AI-SBOM Global Monitor');
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'detection_event') {
      handleDetectionEvent(message);
    }
  };

  ws.onclose = () => {
    console.warn('WebSocket disconnected. Reconnecting in 3s...');
    setTimeout(connectWebSocket, 3000);
  };
}

connectWebSocket();

// --- Security Monitor Feed ---
function handleDetectionEvent(event) {
  const data = event.data;
  
  // Remove empty state if present
  const emptyState = document.querySelector('.empty-state');
  if (emptyState) {
    emptyState.remove();
  }
  
  // Update Stats
  stats.total++;
  if (data.action === 'BLOCK') stats.blocked++;
  if (data.action === 'FLAG_FOR_REVIEW') stats.flagged++;
  
  // Animate Stat numbers
  animateNumber(statTotal, stats.total);
  animateNumber(statFlagged, stats.flagged);
  animateNumber(statBlocked, stats.blocked);

  // Create Card
  const card = document.createElement('div');
  card.className = `trace-card ${data.action}`;
  
  const icon = data.action === 'ALLOW' ? 'shield-check' : (data.action === 'BLOCK' ? 'shield-alert' : 'alert-triangle');

  card.innerHTML = `
    <div class="trace-header">
      <span class="trace-id">TRACE-${data.trace_id.substring(0, 8).toUpperCase()}</span>
      <span class="trace-badge"><i data-lucide="${icon}" style="width: 14px; height: 14px;"></i>${data.action}</span>
    </div>
    <div class="trace-prompt">"${event.prompt}"</div>
    <div class="scores-grid">
      <div class="score-item">
        <span class="score-label">Overall Risk</span>
        <span class="score-val" style="color: ${getScoreColor(data.overall_score)}">${data.overall_score.toFixed(2)}</span>
      </div>
      <div class="score-item">
        <span class="score-label">Behavior (IF)</span>
        <span class="score-val">${data.if_score.toFixed(2)}</span>
      </div>
      <div class="score-item">
        <span class="score-label">Sequence (LSTM)</span>
        <span class="score-val">${data.lstm_score.toFixed(3)}</span>
      </div>
      <div class="score-item">
        <span class="score-label">Exfil (XGB)</span>
        <span class="score-val">${data.xgb_score.toFixed(3)}</span>
      </div>
    </div>
    <div class="trace-explanation">
      <i data-lucide="info" style="width:16px; height:16px; min-width:16px;"></i> 
      <span>${data.explanation}</span>
    </div>
  `;

  // Prepend to feed
  liveFeed.insertBefore(card, liveFeed.firstChild);
  createIcons({ root: card });

  // AnimeJS Entrance Animation
  anime({
    targets: card,
    opacity: [0, 1],
    translateY: [-30, 0],
    scale: [0.97, 1],
    duration: 800,
    easing: 'easeOutElastic(1, .8)'
  });
  
  // Cleanup old cards (keep max 100)
  if (liveFeed.children.length > 100) {
    liveFeed.removeChild(liveFeed.lastChild);
  }
}

function animateNumber(element, newValue) {
  anime({
    targets: element,
    innerHTML: [newValue - 1, newValue],
    round: 1,
    duration: 500,
    easing: 'easeOutExpo'
  });
}

function getScoreColor(score) {
  if (score > 0.6) return 'var(--status-block)';
  if (score > 0.3) return 'var(--status-flag)';
  return 'var(--status-allow)';
}
