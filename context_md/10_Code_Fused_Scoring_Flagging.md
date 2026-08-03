# Product Requirement Specification: Fused Decision Engine

## 1. Objective
To serve as the master controller that aggregates scores from all active anomaly detectors and makes the final decision to Allow, Flag, or Block the execution.

## 2. Functional Requirements
- **Parallel Orchestration:** Trigger the RAG Verifier, Isolation Forest, LSTM, and XGBoost models.
- **Score Fusion:** Calculate a final `overall_risk_score` using a configurable weighted average of the individual model scores.
- **Threat Escalation:** Automatically override and escalate the final risk score if a critical threshold is breached by a highly confident model (e.g., RAG detects a confirmed malware signature).
- **Decision Logic:** Compare the fused score against predefined thresholds to determine the final action.
- **SBOM Finalization:** Append all scores and the final decision to the live trace to create the final Streaming SBOM.

## 3. Expected Inputs
- The live `runtime_trace`.
- Configurable weights (e.g., Behavioral: 30%, Sequence: 30%, Exfil: 40%).
- Configurable decision thresholds.

## 4. Output Data Structure (Final SBOM Segment)
```json
{
  "anomaly_scores": {
    "behavioral_deviation": "float",
    "tool_usage_anomaly": "float",
    "data_exfil_risk": "float",
    "rag_threat_score": "float",
    "overall_risk_score": "float",
    "action_taken": "ALLOW | FLAG_FOR_REVIEW | BLOCK"
  }
}
```

## 5. Implementation Guidelines
- Focus heavily on low latency. Model execution should be non-blocking or heavily parallelized.
- Expose weights and thresholds as environmental configurations so they can be tuned without code changes.
