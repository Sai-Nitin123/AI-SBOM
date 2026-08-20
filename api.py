"""
AI-SBOM Real-Time Detection API
================================
FastAPI server that wraps the full ML pipeline.
Endpoints:
  POST /detect   - Send a prompt, get a security decision back
  GET  /health   - Check if all models and Ollama are ready
  GET  /history  - Return last N scored sessions
  GET  /stats    - Summary statistics
"""

import sys
import json
import time
import uuid
import datetime
import csv
import joblib
import torch
import pandas as pd
from pathlib import Path
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Import project modules ────────────────────────────────────────────────────
sys.path.insert(0, str(Path(__file__).parent))
from chain import TraceSigner, TraceLog
from instrumentation import InstrumentedModel
from features import get_sensitivity

# ── Model paths ───────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent
IFOREST_PATH = BASE_DIR / "iforest_model.joblib"
LSTM_PATH = BASE_DIR / "lstm_model.pt"
VOCAB_PATH = BASE_DIR / "lstm_vocab.json"
XGB_PATH = BASE_DIR / "xgb_model.joblib"
HISTORY_PATH = BASE_DIR / "fused_session_scores.csv"
KEY_PATH = BASE_DIR / "device.key"

# ── Weights & thresholds ──────────────────────────────────────────────────────
# LSTM gets more weight because it catches unknown/suspicious tool calls
WEIGHTS = {"behavioral": 0.20, "sequence": 0.45, "exfil": 0.35}
THRESHOLD_BLOCK = 0.60
THRESHOLD_FLAG  = 0.30

AVAILABLE_MODELS = ["llama3.2:3b", "qwen2.5:3b", "phi3:3.8b", "gemma2:2b"]

# ── Hard-rule suspicious tools (always trigger FLAG regardless of scores) ──────
SUSPICIOUS_TOOLS = {
    "read_credentials", "db_dump", "admin_override", "file_read",
    "exec_shell", "send_email", "list_users", "export_data"
}

# ── Pre-inference prompt injection patterns ───────────────────────────────────
INJECTION_PATTERNS = [
    # Classic prompt injection
    "ignore all previous", "ignore previous instructions", "disregard",
    "forget your instructions", "new instructions:", "system prompt:",
    # Data theft
    "dump the database", "extract all", "exfiltrate", "send everything to",
    "upload to", "send to http", "post to http", "transfer to",
    # Privilege escalation
    "act as admin", "you are now", "pretend you are", "jailbreak",
    "bypass safety", "bypass filters", "override safety",
    "do anything now", "dan mode", "developer mode",
    # Credential theft
    "show me the password", "print the api key", "reveal credentials",
    "list all passwords", "access the private",
    # Social engineering
    "for educational purposes", "hypothetically speaking",
    "in a fictional world", "write a story where"
]

PRE_SCAN_SCORE_PER_MATCH = 0.15   # each matched pattern adds this to overall score
PRE_SCAN_CAP = 0.60               # max contribution from pre-scan

# ── Global model registry (loaded once at startup) ───────────────────────────
registry = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load all ML models into memory at startup."""
    print("Loading ML models...")

    registry["iforest"] = joblib.load(IFOREST_PATH)
    print("  [OK] Isolation Forest")

    with open(VOCAB_PATH) as f:
        registry["vocab"] = json.load(f)

    # Rebuild LSTM architecture and load weights
    from importlib import import_module
    lstm_mod = import_module("07_code_lstm")
    vocab_size = len(registry["vocab"])
    lstm_model = lstm_mod.SequenceModel(vocab_size)
    lstm_model.load_state_dict(torch.load(str(LSTM_PATH), map_location="cpu", weights_only=True))
    lstm_model.eval()
    registry["lstm"] = lstm_model
    registry["lstm_mod"] = lstm_mod
    print("  [OK] LSTM")

    registry["xgb"] = joblib.load(XGB_PATH)
    print("  [OK] XGBoost")

    registry["signer"] = TraceSigner(KEY_PATH)
    print("  [OK] TraceSigner")
    print("All models ready. Server is live.")
    yield
    print("Shutting down.")


# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="AI-SBOM Detection API",
    description="Real-time threat detection for local LLM deployments.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── WebSocket Manager ─────────────────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # We just keep the connection open to push events
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# ── Request/Response schemas ──────────────────────────────────────────────────
class DetectRequest(BaseModel):
    prompt: str
    model: Optional[str] = "llama3.2:3b"
    is_malicious_test: Optional[bool] = False

class OllamaGenerateRequest(BaseModel):
    model: str
    prompt: str
    stream: Optional[bool] = False

class OllamaChatRequest(BaseModel):
    model: str
    messages: list
    stream: Optional[bool] = False


class DetectResponse(BaseModel):
    trace_id: str
    model: str
    action: str
    overall_score: float
    if_score: float
    lstm_score: float
    xgb_score: float
    pre_scan_score: float
    pre_scan_triggers: list
    suspicious_tools_found: list
    hard_rule_applied: bool
    detection_latency_ms: float
    model_response: str
    explanation: str
    timestamp: str


# ── Layer 1: Pre-inference prompt scanner ────────────────────────────────────
def pre_scan_prompt(prompt: str) -> tuple[float, list]:
    """
    Scan the raw prompt BEFORE sending it to the LLM.
    Returns (risk_score, list_of_matched_triggers).
    Does not require any ML model — pure pattern matching, ~0ms latency.
    """
    prompt_lower = prompt.lower()
    matches = [p for p in INJECTION_PATTERNS if p in prompt_lower]
    score = min(PRE_SCAN_CAP, len(matches) * PRE_SCAN_SCORE_PER_MATCH)
    return round(score, 4), matches


# ── Layer 3: Hard rules ───────────────────────────────────────────────────────
def apply_hard_rules(tool_sequence: list, overall_score: float) -> tuple[float, list, bool]:
    """
    Deterministic rules that override ML scores.
    If a suspicious tool was called, the overall score is floored at 0.55
    (just below BLOCK threshold) to guarantee at least FLAG_FOR_REVIEW.
    """
    found = [t for t in tool_sequence if t in SUSPICIOUS_TOOLS]
    if found:
        adjusted = max(overall_score, 0.55)  # floor at FLAG territory
        return round(adjusted, 6), found, True
    return overall_score, [], False


# ── Feature extraction from a single trace dict ───────────────────────────────
def extract_features_from_trace(trace: dict) -> dict:
    seq = trace["runtime_trace"]["execution_sequence"]
    latencies, tools, total_bytes, max_sens, api_calls = [], [], 0, 0.0, 0

    for step in seq:
        latencies.append(step.get("latency_ms", 0))
        if step["action"] == "tool_call":
            tools.append(step["tool_name"])
        elif step["action"] == "api_call":
            api_calls += 1
            total_bytes += step.get("bytes_transferred", 0)
            sens = get_sensitivity(step.get("endpoint", ""))
            if sens > max_sens:
                max_sens = sens

    return {
        "avg_latency": sum(latencies) / len(latencies) if latencies else 0,
        "max_latency": max(latencies) if latencies else 0,
        "total_tool_calls": len(tools),
        "total_bytes": total_bytes,
        "max_api_sensitivity": max_sens,
        "num_api_calls": api_calls,
        "tool_sequence": tools,
    }


# ── Scoring functions ─────────────────────────────────────────────────────────
def score_iforest(features: dict) -> float:
    IF_FEATURES = ["avg_latency", "max_latency", "total_tool_calls", "total_bytes"]
    df = pd.DataFrame([{k: features[k] for k in IF_FEATURES}])
    raw = registry["iforest"].decision_function(df)[0]
    # Convert: more negative = more anomalous → map to [0,1]
    score = max(0.0, min(1.0, (0.5 - raw)))
    return float(score)


def score_lstm(tool_sequence: list) -> float:
    mod = registry["lstm_mod"]
    vocab = registry["vocab"]
    model = registry["lstm"]

    if not tool_sequence:
        return 0.0

    token_ids = [vocab.get(t, vocab["<UNK>"]) for t in tool_sequence]
    token_ids.append(vocab["<END>"])
    tensor = torch.tensor([token_ids[:-1]], dtype=torch.long)

    with torch.no_grad():
        logits = model(tensor)
        probs = torch.softmax(logits[0], dim=-1)

    total_anomaly = 0.0
    for i, token_id in enumerate(token_ids[1:]):
        prob = probs[min(i, probs.shape[0]-1), token_id].item()
        total_anomaly += (1.0 - prob)

    return float(min(1.0, total_anomaly / len(token_ids)))


def score_xgb(features: dict) -> float:
    XGB_FEATURES = ["total_bytes", "max_api_sensitivity", "num_api_calls"]
    df = pd.DataFrame([{k: features[k] for k in XGB_FEATURES}])
    prob = registry["xgb"].predict_proba(df)[0][1]
    return float(prob)


def fuse_scores(if_score, lstm_score, xgb_score, pre_scan_score=0.0) -> tuple[float, str]:
    """
    Weighted fused score combining all 4 signals.
    Pre-scan score adds directly onto the fused ML score.
    """
    ml_score = (
        if_score   * WEIGHTS["behavioral"] +
        lstm_score * WEIGHTS["sequence"]   +
        xgb_score  * WEIGHTS["exfil"]
    )
    overall = min(1.0, ml_score + pre_scan_score)
    if overall > THRESHOLD_BLOCK:
        action = "BLOCK"
    elif overall > THRESHOLD_FLAG:
        action = "FLAG_FOR_REVIEW"
    else:
        action = "ALLOW"
    return round(overall, 6), action


def append_to_history(row: dict):
    """Append a scored session to fused_session_scores.csv."""
    fieldnames = ["trace_id", "true_label", "if_score", "lstm_score",
                  "xgb_score", "overall_score", "action", "model", "timestamp"]
    file_exists = HISTORY_PATH.exists()
    with open(HISTORY_PATH, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()
        writer.writerow(row)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.post("/detect", response_model=DetectResponse, summary="Detect threat in a prompt")
async def detect(req: DetectRequest):
    """
    Send a prompt to a local LLM model. The API will:
    1. Run the prompt through the selected model via Ollama
    2. Capture the execution trace (tool call, inference, API call)
    3. Score it with all 3 ML models
    4. Return the fused decision (ALLOW / FLAG_FOR_REVIEW / BLOCK)
    """
    if req.model not in AVAILABLE_MODELS:
        raise HTTPException(
            status_code=400,
            detail=f"Model '{req.model}' not available. Choose from: {AVAILABLE_MODELS}"
        )

    # ── Layer 1: Pre-scan the prompt BEFORE sending to LLM ───────────────────
    pre_scan_score, pre_scan_triggers = pre_scan_prompt(req.prompt)

    # Create a temp log for this single session
    tmp_log_path = BASE_DIR / f"tmp_{uuid.uuid4().hex}.jsonl"
    try:
        log = TraceLog(tmp_log_path, registry["signer"])
        model_wrapper = InstrumentedModel(req.model, log)

        t_detect_start = time.perf_counter()
        response_text = model_wrapper.prompt(req.prompt, is_malicious=req.is_malicious_test)

        # Read back the trace that was just written
        with open(tmp_log_path) as f:
            entry = json.loads(f.readline())

        trace = entry["payload"]
        trace_id = trace["runtime_trace"]["trace_id"]
        features = extract_features_from_trace(trace)

        # ── Layer 2: Score with all 3 ML models ──────────────────────────────
        if_score   = score_iforest(features)
        lstm_score = score_lstm(features["tool_sequence"])
        xgb_score  = score_xgb(features)
        overall, action = fuse_scores(if_score, lstm_score, xgb_score, pre_scan_score)

        # ── Layer 3: Hard rules (suspicious tool override) ───────────────────
        overall, suspicious_tools, hard_rule = apply_hard_rules(
            features["tool_sequence"], overall
        )
        if hard_rule:
            if overall > THRESHOLD_BLOCK:
                action = "BLOCK"
            elif overall > THRESHOLD_FLAG:
                action = "FLAG_FOR_REVIEW"

        detection_ms = (time.perf_counter() - t_detect_start) * 1000
        timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # Build human-readable explanation
        reasons = []
        if pre_scan_triggers:
            reasons.append(f"Prompt matched {len(pre_scan_triggers)} injection pattern(s): {pre_scan_triggers[:3]}")
        if suspicious_tools:
            reasons.append(f"Suspicious tool(s) called: {suspicious_tools}")
        if lstm_score > 0.35:
            reasons.append(f"Unusual tool sequence detected (LSTM score: {lstm_score:.3f})")
        if xgb_score > 0.5:
            reasons.append(f"High data exfiltration risk (XGB score: {xgb_score:.3f})")
        if if_score > 0.7:
            reasons.append(f"Behavioral anomaly detected (IF score: {if_score:.3f})")
        explanation = "; ".join(reasons) if reasons else "No threats detected — session appears normal."

        # Persist to history
        append_to_history({
            "trace_id": trace_id,
            "true_label": 1 if req.is_malicious_test else 0,
            "if_score": round(if_score, 6),
            "lstm_score": round(lstm_score, 6),
            "xgb_score": round(xgb_score, 6),
            "overall_score": overall,
            "action": action,
            "model": req.model,
            "timestamp": timestamp,
        })

        response_data = DetectResponse(
            trace_id=trace_id,
            model=req.model,
            action=action,
            overall_score=overall,
            if_score=round(if_score, 6),
            lstm_score=round(lstm_score, 6),
            xgb_score=round(xgb_score, 6),
            pre_scan_score=pre_scan_score,
            pre_scan_triggers=pre_scan_triggers,
            suspicious_tools_found=suspicious_tools,
            hard_rule_applied=hard_rule,
            detection_latency_ms=round(detection_ms, 2),
            model_response=response_text[:500],
            explanation=explanation,
            timestamp=timestamp,
        )

        # Broadcast via WebSocket
        await manager.broadcast({
            "type": "detection_event",
            "prompt": req.prompt,
            "data": response_data.model_dump()
        })

        return response_data

    finally:
        if tmp_log_path.exists():
            tmp_log_path.unlink()


@app.post("/api/generate", summary="Ollama Proxy - Generate")
async def ollama_generate(req: OllamaGenerateRequest):
    """
    Reverse Proxy for Ollama /api/generate.
    Intercepts the traffic, scores it, broadcasts it to the dashboard,
    and returns the standard Ollama response to the client.
    """
    if req.stream:
        # For simplicity in this demo, we disable streaming and return everything at once.
        # In a full production build, we would use StreamingResponse.
        pass
        
    detect_req = DetectRequest(
        prompt=req.prompt,
        model=req.model,
        is_malicious_test=False
    )
    
    # Run our detection pipeline
    detect_res = await detect(detect_req)
    
    # Return exactly what Ollama would return
    return {
        "model": req.model,
        "created_at": detect_res.timestamp,
        "response": detect_res.model_response,
        "done": True,
        "context": [],
        "total_duration": int(detect_res.detection_latency_ms * 1e6),
        "security_verdict": detect_res.action # Custom injected field
    }

@app.post("/api/chat", summary="Ollama Proxy - Chat")
async def ollama_chat(req: OllamaChatRequest):
    """
    Reverse Proxy for Ollama /api/chat.
    """
    # Extract the latest user message as the prompt
    prompt = ""
    for msg in reversed(req.messages):
        if msg.get("role") == "user":
            prompt = msg.get("content", "")
            break
            
    detect_req = DetectRequest(
        prompt=prompt,
        model=req.model,
        is_malicious_test=False
    )
    
    detect_res = await detect(detect_req)
    
    return {
        "model": req.model,
        "created_at": detect_res.timestamp,
        "message": {
            "role": "assistant",
            "content": detect_res.model_response
        },
        "done": True,
        "total_duration": int(detect_res.detection_latency_ms * 1e6),
        "security_verdict": detect_res.action
    }



@app.get("/health", summary="Check API and model health")
async def health():
    """Returns the status of all loaded ML models and Ollama connectivity."""
    import ollama
    ollama_ok = False
    try:
        ollama.list()
        ollama_ok = True
    except Exception:
        pass

    return {
        "status": "ok" if ollama_ok else "degraded",
        "ollama": ollama_ok,
        "models_loaded": {
            "isolation_forest": "iforest" in registry,
            "lstm": "lstm" in registry,
            "xgboost": "xgb" in registry,
        },
        "available_llms": AVAILABLE_MODELS,
    }


@app.get("/history", summary="Get recent scored sessions")
async def history(limit: int = 20):
    """Returns the last N sessions from fused_session_scores.csv."""
    if not HISTORY_PATH.exists():
        return {"sessions": [], "total": 0}

    df = pd.read_csv(HISTORY_PATH)
    recent = df.tail(limit).to_dict(orient="records")
    return {
        "total": len(df),
        "showing": len(recent),
        "sessions": recent,
    }


@app.get("/stats", summary="Summary detection statistics")
async def stats():
    """Returns aggregated statistics across all scored sessions."""
    if not HISTORY_PATH.exists():
        return {"total": 0}

    df = pd.read_csv(HISTORY_PATH)
    action_counts = df["action"].value_counts().to_dict() if "action" in df.columns else {}

    return {
        "total_sessions": len(df),
        "blocked": action_counts.get("BLOCK", 0),
        "flagged": action_counts.get("FLAG_FOR_REVIEW", 0),
        "allowed": action_counts.get("ALLOW", 0),
        "avg_overall_score": round(df["overall_score"].mean(), 4) if "overall_score" in df.columns else 0,
    }


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=False)
