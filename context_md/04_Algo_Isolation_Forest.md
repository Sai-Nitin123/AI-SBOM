# Algorithm: Isolation Forest

## Objective
Detect "Behavioral Deviations" in the execution environment. This includes anomalies like unusual execution times, unexpected token ratios, or an abnormal volume of tool interactions.

## How It Works
The Isolation Forest algorithm isolates anomalies instead of profiling normal data points. It builds a forest of random decision trees:
1. It randomly selects a feature and a split value.
2. Anomalous data points (which are sparse and different) will be isolated quickly, requiring fewer splits.
3. Normal data points (which are clustered together) will require more splits to be isolated.

By measuring the path length from the root node to the terminating node, the algorithm determines an anomaly score. Shorter paths indicate high behavioral deviation.

## Why it fits this framework
- **High Dimensionality:** Handles multiple features (latency, token counts, byte counts) easily.
- **Unsupervised:** Requires only a dataset of benign executions, meaning you do not need to possess logs of actual attacks to train it.
- **Efficiency:** Extremely fast inference times (1-5ms), making it ideal for the real-time SBOM.
