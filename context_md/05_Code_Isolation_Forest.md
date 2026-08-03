# Code: Isolation Forest Implementation

## Overview
Python implementation utilizing `scikit-learn` to extract features from the JSON trace and calculate behavioral deviation scores.

## Implementation

```python
from sklearn.ensemble import IsolationForest
import numpy as np
from datetime import datetime

class ExecutionAnomalyDetector:
    def __init__(self, contamination=0.05):
        self.model = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_estimators=100
        )
        self.feature_names = None
        self.is_trained = False
    
    def extract_features(self, execution_trace):
        features = {}
        
        # Feature 1: Latency pattern
        latencies = [step['latency_ms'] for step in execution_trace['execution_sequence'] if 'latency_ms' in step]
        features['avg_latency'] = np.mean(latencies) if latencies else 0
        features['max_latency'] = np.max(latencies) if latencies else 0
        
        # Feature 2: Tool usage pattern
        tool_counts = sum(1 for step in execution_trace['execution_sequence'] if step['action'] == 'tool_call')
        features['total_tool_calls'] = tool_counts
        
        # Feature 3: Data transfer pattern
        features['total_bytes_transferred'] = sum(step.get('bytes_transferred', 0) for step in execution_trace['execution_sequence'])
        
        return features
    
    def train(self, historical_traces):
        X = []
        for trace in historical_traces:
            features = self.extract_features(trace['runtime_trace'])
            if not self.feature_names:
                self.feature_names = sorted(features.keys())
            X.append([features[k] for k in self.feature_names])
        
        self.model.fit(np.array(X))
        self.is_trained = True
    
    def detect_anomaly(self, execution_trace):
        if not self.is_trained:
            raise ValueError("Model not trained yet")
            
        features = self.extract_features(execution_trace['runtime_trace'])
        X = np.array([[features[k] for k in self.feature_names]])
        
        # Predict anomaly score
        prediction = self.model.predict(X)[0] # -1 is anomaly, 1 is normal
        anomaly_score = -self.model.score_samples(X)[0] # Normalize
        
        # Scale score to 0-1 range
        normalized_score = max(0.0, min(1.0, (anomaly_score + 1) / 2))
        
        return {
            "is_anomaly": prediction == -1,
            "anomaly_score": float(normalized_score),
            "features": features
        }
```
