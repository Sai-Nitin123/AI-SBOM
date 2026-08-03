# Dataset Filtering & Preprocessing Module

## Overview
Raw execution traces often contain missing values, broken sequences, or benign data mixed with anomalies. This module cleans the extracted datasets and formats them for the specific needs of the three models (Isolation Forest, LSTM, XGBoost).

## Implementation Details

```python
import pandas as pd
import numpy as np

class DatasetFilter:
    def __init__(self):
        self.benign_traces = []
        self.labeled_traces = []
        
    def clean_trace(self, trace):
        """Removes incomplete steps or null values from a trace."""
        cleaned_sequence = []
        for step in trace['runtime_trace']['execution_sequence']:
            # Drop steps with missing latency if they are model inferences
            if step['action'] == 'model_inference' and step.get('latency_ms') is None:
                continue
            cleaned_sequence.append(step)
            
        trace['runtime_trace']['execution_sequence'] = cleaned_sequence
        return trace

    def filter_for_unsupervised(self, raw_traces):
        """
        Filters out known malicious traces to create a clean baseline 
        for Isolation Forest and LSTM.
        """
        valid_benign = []
        for trace in raw_traces:
            if not trace.get('is_known_malicious', False):
                valid_benign.append(self.clean_trace(trace))
        return valid_benign
        
    def prepare_supervised_dataset(self, traces, labels):
        """
        Prepares a labeled dataset for the XGBoost model.
        Returns a structured DataFrame.
        """
        dataset = []
        for trace, label in zip(traces, labels):
            trace = self.clean_trace(trace)
            features = self._extract_basic_features(trace)
            features['label'] = label
            dataset.append(features)
            
        return pd.DataFrame(dataset)
        
    def _extract_basic_features(self, trace):
        # Stub for feature extraction (implemented fully in XGBoost module)
        return {"trace_id": trace['runtime_trace']['trace_id']}
```
