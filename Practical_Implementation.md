# Practical Implementation: Real-Time SBOM Anomaly Detection

## 1. Overview and Architecture

The implementation introduces a streaming Software Bill of Materials (SBOM) integrated with a three-layer Machine Learning and Deep Learning (ML/DL) anomaly detection framework. Designed to execute during live model inference, this system captures runtime traces and flags anomalous behavior in real-time, enabling forensic analysis of model behavior in production.

**System Architecture:**
1. **Live Model Execution:** Captures execution steps in real-time.
2. **Streaming Trace Capture:** Records latency, tokens, tool calls, and APIs.
3. **Anomaly Detection Layer:**
   - *ML:* Execution Pattern Anomaly (Isolation Forest)
   - *DL:* Tool Call Sequence Anomaly (LSTM)
   - *ML:* Data Exfiltration Risk (XGBoost)
4. **Fused Risk Scoring:** Aggregates individual detector scores.
5. **Decision Engine:** Evaluates overall risk to Allow, Flag, or Block operations.

---

## 2. Streaming Real-Time SBOM Schema

Unlike static SBOMs, the streaming SBOM is generated dynamically during inference. It captures the runtime trace and appends real-time anomaly scores.

```json
{
  "deployment_id": "prod-support-agent-v1",
  "timestamp": "2024-07-15T14:32:10Z",
  "model_checkpoint": {
    "model_id": "gpt-4-turbo",
    "hash_at_deployment": "sha256:abc123...",
    "last_verified": "2024-07-15T14:32:00Z"
  },
  "runtime_trace": {
    "trace_id": "exec-2024-07-15-00123",
    "execution_sequence": [
      {
        "step": 1,
        "action": "model_inference",
        "latency_ms": 234,
        "input_tokens": 256,
        "output_tokens": 128
      },
      {
        "step": 2,
        "action": "tool_call",
        "tool_name": "kb-search-v2",
        "latency_ms": 1023
      }
    ]
  },
  "anomaly_scores": {
    "behavioral_deviation": 0.12,  <- ML detects this
    "tool_usage_anomaly": 0.08,    <- DL detects this
    "data_exfil_risk": 0.03,       <- Risk predictor detects this
    "overall_risk_score": 0.07,
    "flag_for_review": false
  }
}
```

---

## 3. Anomaly Detection Models

The framework utilizes three parallel detectors to evaluate the runtime trace.

### 3.1 Execution Pattern Anomaly (Isolation Forest)
- **Objective:** Detect deviations in execution behavior, such as abnormal latency, excessive tool usage, or unusual token ratios.
- **Methodology:** An Isolation Forest algorithm is employed to handle high-dimensional feature spaces. It is trained on historical, benign execution traces to identify outliers without requiring labeled malicious data.
- **Performance:** Inference completes in 1-5ms.

### 3.2 Tool Call Sequence Anomaly (LSTM)
- **Objective:** Identify unusual or restricted sequences of tool usage (e.g., accessing credentials followed immediately by an external API call).
- **Methodology:** A Long Short-Term Memory (LSTM) network analyzes the sequential order of tool calls. It learns standard operational patterns and assigns low probabilities to anomalous sequences.
- **Performance:** Inference completes in 20-50ms (can be optimized <5ms with GPU acceleration).

### 3.3 Data Exfiltration Risk Predictor (XGBoost)
- **Objective:** Predict the likelihood of a data exfiltration event based on data transfer volumes and endpoint sensitivity.
- **Methodology:** An XGBoost classifier evaluates features such as `total_bytes_transferred`, access to highly sensitive internal APIs, and connections to external IP addresses. It requires a mixed dataset of benign and labeled anomalous traces for training.
- **Performance:** Inference completes in 5-10ms.

---

## 4. Fused Risk Scoring

The outputs from the three models are aggregated using a weighted average to calculate an **Overall Risk Score (0-1)**.

*Note: The specific weights and decision thresholds are highly dependent on the dataset provided and the organization's risk tolerance. They must be calibrated using a validation dataset to balance false positives (alert fatigue) and false negatives (missed attacks).*

- **Weighting Example (Calibrated to Dataset):** 
  - Behavioral (30%) + Tool Sequence (30%) + Data Exfil (40%)
- **Decision Thresholds (Tuned via Validation Data):**
  - `> 0.6`: Critical alert; log to security team and potentially block.
  - `> 0.3`: Warning; log for review.
  - `< 0.3`: Normal execution.

---

## 5. Efficiency Analysis

To be viable for production, real-time monitoring must not introduce significant latency. The combined parallel execution of the three models evaluates a trace in **30-60ms**. 

**Implementation Strategy:** For systems requiring sub-millisecond responses, these traces can be logged and processed asynchronously via background worker threads to avoid blocking the main application flow.

---

## 6. Data Requirements

Deploying this system requires specific datasets for model training:
1. **Benign Execution Traces:** 100+ historical traces for training the Isolation Forest and 1000+ sequences for the LSTM.
2. **Labeled Malicious Traces:** 50-100 labeled traces containing exfiltration patterns to train the XGBoost model.
3. **API Classifications:** A predefined sensitivity mapping for internal and external endpoints.

---

## 7. Limitations

While highly effective at detecting behavioral deviations, this framework is a single layer of defense. It **cannot** reliably detect:
- Subtle data poisoning where output remains contextually reasonable.
- Backdoors triggered by highly specific, stealthy conditions.
- Sophisticated prompt injections that manipulate output without altering operational behavior parameters.
