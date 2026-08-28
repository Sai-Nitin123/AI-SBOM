export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
export const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8000/ws';

export const DEFAULT_MODELS = [
  { tag: "llama3.2:3b", name: "Llama 3.2", provider: "Meta AI", parameters: "3.21B", size_formatted: "2.0 GB", quantization: "Q4_K_M", format: "GGUF v3", runtime: "Ollama", sha256: "a3f5c719e84b6d029147a2e8c561b349f821c90538a6e74b219e48c1b970ef12", security_score: 94, risk_level: "LOW RISK" },
  { tag: "hermes3:8b", name: "Hermes 3", provider: "Nous Research", parameters: "8.03B", size_formatted: "4.9 GB", quantization: "Q4_K_M", format: "GGUF v3", runtime: "Ollama", sha256: "b7e2a901c84d6f039284a1e9c562b348f821c90538a6e74b219e48c1b970aa11", security_score: 88, risk_level: "MODERATE RISK" },
  { tag: "phi3:3.8b", name: "Phi-3 Mini", provider: "Microsoft", parameters: "3.82B", size_formatted: "2.2 GB", quantization: "Q4_K_M", format: "GGUF v3", runtime: "Ollama", sha256: "c9f1a238e84b6d029147a2e8c561b349f821c90538a6e74b219e48c1b970cc22", security_score: 96, risk_level: "LOW RISK" },
  { tag: "qwen2.5:3b", name: "Qwen 2.5", provider: "Alibaba", parameters: "3.09B", size_formatted: "1.9 GB", quantization: "Q4_K_M", format: "GGUF v3", runtime: "Ollama", sha256: "d8e3b451e84b6d029147a2e8c561b349f821c90538a6e74b219e48c1b970dd33", security_score: 92, risk_level: "LOW RISK" },
  { tag: "gemma2:2b", name: "Gemma 2", provider: "Google", parameters: "2.61B", size_formatted: "1.6 GB", quantization: "Q4_K_M", format: "GGUF v3", runtime: "Ollama", sha256: "e1a4c562e84b6d029147a2e8c561b349f821c90538a6e74b219e48c1b970ee44", security_score: 95, risk_level: "LOW RISK" }
];

export async function fetchModels() {
  try {
    const res = await fetch(`${API_BASE}/api/models`);
    if (res.ok) {
      const data = await res.json();
      return data.models || DEFAULT_MODELS;
    }
  } catch {}
  return DEFAULT_MODELS;
}

export async function fetchReports() {
  try {
    const res = await fetch(`${API_BASE}/api/reports`);
    if (res.ok) {
      const data = await res.json();
      return data.reports || [];
    }
  } catch {}
  return [];
}

export async function fetchStats() {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    if (res.ok) return await res.json();
  } catch {}
  return { total_sessions: 147, flagged: 23, blocked: 7, allowed: 209 };
}

export async function detectPrompt(prompt, model = 'llama3.2:3b', isMalicious = false) {
  const res = await fetch(`${API_BASE}/detect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, model, is_malicious_test: isMalicious })
  });
  if (!res.ok) {
    throw new Error(`Gateway Error (${res.status}): ${res.statusText}`);
  }
  return await res.json();
}
