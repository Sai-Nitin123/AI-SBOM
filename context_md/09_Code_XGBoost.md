# Code: XGBoost Implementation

## Overview
Implementation using the `xgboost` python package to classify traces based on exfiltration risk indicators.

## Implementation

```python
import xgboost as xgb
import pandas as pd

class DataExfilRiskPredictor:
    def __init__(self):
        self.model = xgb.XGBClassifier(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            random_state=42
        )
        self.api_sensitivity = {
            'kb-search': 0.1,
            'billing-api': 0.9,
            'auth-service': 0.95
        }
        self.is_trained = False
        
    def extract_risk_features(self, execution_trace):
        features = {}
        trace = execution_trace['runtime_trace']
        
        total_bytes = sum(s.get('bytes_transferred', 0) for s in trace['execution_sequence'])
        features['total_bytes'] = total_bytes
        
        api_steps = [s for s in trace['execution_sequence'] if s['action'] == 'api_call']
        sensitivities = [self.api_sensitivity.get(s.get('endpoint', 'unknown'), 0.5) for s in api_steps]
        
        features['max_api_sensitivity'] = max(sensitivities) if sensitivities else 0
        features['num_api_calls'] = len(api_steps)
        
        return features

    def train(self, historical_traces, labels):
        X_data = [self.extract_risk_features(trace) for trace in historical_traces]
        X = pd.DataFrame(X_data)
        y = labels
        
        self.model.fit(X, y)
        self.is_trained = True

    def predict_risk(self, execution_trace):
        if not self.is_trained:
            raise ValueError("Model not trained")
            
        features = self.extract_risk_features(execution_trace)
        X = pd.DataFrame([features])
        
        # Get probability of class 1 (Exfiltration)
        risk_probability = self.model.predict_proba(X)[0][1]
        
        return {
            "risk_score": float(risk_probability),
            "is_risky": risk_probability > 0.5,
            "features": features
        }
```
