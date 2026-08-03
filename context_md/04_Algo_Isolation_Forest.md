# System Specification: Isolation Forest Algorithm

## 1. Objective
To detect "Behavioral Deviations" in the execution environment using an unsupervised machine learning approach.

## 2. Target Anomalies
- Abnormally high or low execution latencies.
- Suspicious input-to-output token ratios.
- Unusual volume of tool interactions within a single session.

## 3. Model Characteristics
- **Type:** Unsupervised Ensemble Learning.
- **Mechanism:** Isolates anomalies by building random decision trees. Anomalies require fewer splits to be isolated.
- **Advantage:** Does not require labeled malicious data; learns purely from baseline normal behavior.

## 4. Output Expectation
- A normalized anomaly score ranging from 0.0 (perfectly normal) to 1.0 (highly anomalous).
