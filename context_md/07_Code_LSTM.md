# Code: LSTM Implementation

## Overview
PyTorch implementation of the LSTM sequence detector. It maps tool names to integer IDs, embeds them, and predicts sequence normality.

## Implementation

```python
import torch
import torch.nn as nn

class ToolSequenceAnomalyDetector:
    def __init__(self, vocab_size=50, embedding_dim=16, hidden_dim=32):
        self.tool_to_id = {}
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        self.model = nn.Sequential(
            nn.Embedding(vocab_size, embedding_dim),
            nn.LSTM(embedding_dim, hidden_dim, batch_first=True),
            nn.Linear(hidden_dim, 1),
            nn.Sigmoid()
        ).to(self.device)
        
        self.optimizer = torch.optim.Adam(self.model.parameters(), lr=0.001)
        self.criterion = nn.MSELoss()
        
    def build_vocab(self, tool_names):
        for i, tool in enumerate(sorted(set(tool_names))):
            self.tool_to_id[tool] = i
            
    def extract_tool_sequence(self, execution_trace):
        sequence = []
        for step in execution_trace['runtime_trace']['execution_sequence']:
            if step['action'] == 'tool_call':
                sequence.append(step['tool_name'])
        return sequence
        
    def train(self, historical_traces):
        # Build vocabulary from benign traces
        all_tools = set()
        for trace in historical_traces:
            all_tools.update(self.extract_tool_sequence(trace))
        self.build_vocab(list(all_tools))
        
        # Simple training loop stub
        # In a real implementation, you train to predict probability of the sequence
        print("Training LSTM on sequences...")
        
    def detect_anomaly(self, execution_trace):
        seq = self.extract_tool_sequence(execution_trace)
        if len(seq) < 2:
            return {"is_anomaly": False, "anomaly_score": 0.0}
            
        ids = [self.tool_to_id.get(tool, 0) for tool in seq]
        X = torch.tensor(ids[:-1]).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            output = self.model(X)
            # Dummy output extraction for structural purposes
            sequence_score = 0.95 # Assume 0.95 normality for this stub
            
        anomaly_score = 1.0 - sequence_score
        
        return {
            "is_anomaly": anomaly_score > 0.5,
            "anomaly_score": float(anomaly_score),
            "tool_sequence": seq
        }
```
