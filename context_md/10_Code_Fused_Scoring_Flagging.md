# Code: Fused Scoring, Trigger Detection & Flagging

## Overview
This is the master decision engine. It takes the live trace, optionally runs RAG security verification, passes the trace to the three ML/DL models, fuses their scores, evaluates the threshold, and outputs the final SBOM.

## Implementation

```python
from datetime import datetime

class FusedDecisionEngine:
    def __init__(self, isolation_forest, lstm, xgboost, rag_verifier=None):
        self.iso_forest = isolation_forest
        self.lstm = lstm
        self.xgboost = xgboost
        self.rag_verifier = rag_verifier
        
        # Dataset-calibrated weights
        self.weights = {
            'behavioral': 0.3,
            'tool_sequence': 0.3,
            'data_exfil': 0.4
        }
        
    def evaluate_trace(self, execution_trace):
        # 1. (Optional) RAG Verification
        rag_score = 0.0
        if self.rag_verifier:
            rag_result = self.rag_verifier.verify_trace_safety(execution_trace['runtime_trace'])
            if not rag_result['is_safe']:
                print(f"RAG WARNING: Malicious pattern detected! {rag_result['flagged_content']}")
                rag_score = rag_result['highest_threat_score']

        # 2. Run ML/DL Ensembles
        behavioral_res = self.iso_forest.detect_anomaly(execution_trace)
        tool_seq_res = self.lstm.detect_anomaly(execution_trace)
        exfil_res = self.xgboost.predict_risk(execution_trace)
        
        # 3. Fuse Scores
        fused_score = (
            self.weights['behavioral'] * behavioral_res['anomaly_score'] +
            self.weights['tool_sequence'] * tool_seq_res['anomaly_score'] +
            self.weights['data_exfil'] * exfil_res['risk_score']
        )
        
        # If RAG detects a direct threat, automatically escalate risk
        if rag_score > 0.8:
            fused_score = max(fused_score, 0.9)
            
        # 4. Trigger Detection & Flagging
        is_flagged = fused_score > 0.6
        action_taken = "ALLOW"
        
        if fused_score > 0.8:
            action_taken = "BLOCK"
        elif is_flagged:
            action_taken = "FLAG_FOR_REVIEW"
            
        # 5. Append to SBOM
        execution_trace['anomaly_scores'] = {
            "behavioral_deviation": behavioral_res['anomaly_score'],
            "tool_usage_anomaly": tool_seq_res['anomaly_score'],
            "data_exfil_risk": exfil_res['risk_score'],
            "rag_threat_score": rag_score,
            "overall_risk_score": fused_score,
            "action_taken": action_taken
        }
        
        return execution_trace, action_taken
```
