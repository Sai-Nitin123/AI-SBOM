# Product Requirement Specification: XGBoost Module

## 1. Objective
To operationalize the XGBoost classifier to predict data exfiltration risk for live execution traces.

## 2. Functional Requirements
- **Sensitivity Mapping:** Maintain a configuration mapping API endpoints to sensitivity weights (0.0 to 1.0).
- **Feature Extraction:** Calculate `total_bytes`, `max_api_sensitivity`, and `num_api_calls` from the trace.
- **Model Training:** Train on a labeled dataset containing both benign and simulated malicious traces.
- **Live Inference:** Extract features from a live trace and output the exfiltration probability.

## 3. Expected Inputs
- **Training:** Labeled DataFrame of extracted features.
- **Inference:** A single live JSON trace.

## 4. Output Data Structure
```json
{
  "is_risky": "boolean",
  "risk_score": "float (0.0 to 1.0)",
  "features_extracted": "object"
}
```

## 5. Implementation Guidelines
- Use the `xgboost` Python library.
- Ensure feature names align exactly between training and live inference.
