# Algorithm: XGBoost (Extreme Gradient Boosting)

## Objective
Predict "Data Exfiltration Risk". This model acts as a highly accurate classifier to identify traces that bear the hallmarks of data theft.

## How It Works
XGBoost is an ensemble learning method that builds multiple decision trees sequentially.
1. Each new tree attempts to correct the errors made by the previous trees using gradient descent.
2. It evaluates tabular features such as `bytes_transferred`, `api_sensitivity_score`, and `execution_duration`.
3. It outputs a probability score representing the likelihood that the execution belongs to the "Exfiltration" class.

## Why it fits this framework
- **Mixed Data Types:** Flawlessly handles a mix of continuous variables (bytes) and categorical/derived variables (sensitivity labels).
- **Interpretability:** Provides Feature Importance scores, allowing security analysts to know *why* an alert was generated (e.g., "Alert generated because bytes_transferred > 50MB").
- **Supervised Precision:** Because it uses labeled data, it is specifically tuned to catch known attacker tactics.
