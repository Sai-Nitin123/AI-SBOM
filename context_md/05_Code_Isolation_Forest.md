# Product Requirement Specification: Isolation Forest Module

## 1. Objective
To operationalize the Isolation Forest algorithm to score live execution traces for behavioral deviations.

## 2. Functional Requirements
- **Feature Extraction:** Parse the trace to calculate `avg_latency`, `max_latency`, `total_tool_calls`, and `total_bytes_transferred`.
- **Model Training:** Provide a training routine that accepts an array of historical benign traces and fits the Isolation Forest model.
- **Live Inference:** Provide a prediction method that takes a single live trace, extracts features, and returns a normalized anomaly score.

## 3. Expected Inputs
- **Training:** Collection of benign JSON traces.
- **Inference:** A single live JSON trace.

## 4. Output Data Structure
```json
{
  "is_anomaly": "boolean",
  "anomaly_score": "float (0.0 to 1.0)",
  "features_extracted": "object"
}
```

## 5. Implementation Guidelines
- Use the `scikit-learn` library (`IsolationForest`).
- Ensure the output anomaly score is scaled reliably between 0 and 1 for downstream fusion.
