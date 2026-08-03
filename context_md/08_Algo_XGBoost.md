# System Specification: XGBoost Algorithm

## 1. Objective
To predict "Data Exfiltration Risk" by acting as a highly accurate, supervised classifier for known threat signatures.

## 2. Target Anomalies
- Massive data transfers to unauthorized external endpoints.
- Unusually frequent access to highly sensitive internal APIs (e.g., billing, credentials).

## 3. Model Characteristics
- **Type:** Supervised Ensemble Learning (Gradient Boosted Trees).
- **Mechanism:** Builds decision trees sequentially, optimizing to correctly classify labeled data.
- **Advantage:** Highly interpretable (feature importance) and capable of handling mixed data types (categorical endpoints, continuous byte counts).

## 4. Output Expectation
- A binary classification probability (0.0 to 1.0) indicating the likelihood of the trace being an exfiltration attempt.
