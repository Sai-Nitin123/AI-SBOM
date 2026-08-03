# System Specification: LSTM Algorithm

## 1. Objective
To detect "Tool Usage Sequence Anomalies" by evaluating the chronological order of operations performed by the AI agent.

## 2. Target Anomalies
- Logic bypasses (e.g., accessing a database without first calling the authentication tool).
- Exfiltration chains (e.g., reading credentials and immediately sending an external HTTP request).

## 3. Model Characteristics
- **Type:** Deep Learning (Recurrent Neural Network).
- **Mechanism:** Maintains a hidden state context to predict the likelihood of the next tool in a sequence. Low probability indicates an anomaly.
- **Advantage:** Inherently understands temporal relationships and sequence order, unlike static models.

## 4. Output Expectation
- A sequence normality score, inverted to represent an anomaly score (0.0 to 1.0).
