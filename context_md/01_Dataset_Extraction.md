# Dataset Extraction Module

## Overview
This module is responsible for hooking into the AI agent's execution environment and capturing a live trace of its actions. It records model inferences, tool calls, and external API requests, packaging them into the standardized streaming SBOM format.

## Implementation Details

```python
import json
import time
from datetime import datetime

class TraceExtractor:
    def __init__(self, deployment_id, model_id):
        self.deployment_id = deployment_id
        self.model_id = model_id
        self.current_trace = []
        self.step_counter = 1
        
    def start_new_trace(self, trace_id):
        self.current_trace = []
        self.step_counter = 1
        self.trace_id = trace_id
        
    def log_inference(self, input_tokens, output_tokens, latency_ms):
        self.current_trace.append({
            "step": self.step_counter,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "action": "model_inference",
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "latency_ms": latency_ms
        })
        self.step_counter += 1

    def log_tool_call(self, tool_name, params, latency_ms):
        self.current_trace.append({
            "step": self.step_counter,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "action": "tool_call",
            "tool_name": tool_name,
            "tool_params": params,
            "latency_ms": latency_ms
        })
        self.step_counter += 1
        
    def log_api_call(self, endpoint, method, response_code, bytes_transferred):
        self.current_trace.append({
            "step": self.step_counter,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "action": "api_call",
            "endpoint": endpoint,
            "method": method,
            "response_code": response_code,
            "bytes_transferred": bytes_transferred
        })
        self.step_counter += 1
        
    def get_extracted_dataset(self):
        return {
            "deployment_id": self.deployment_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "model_checkpoint": {
                "model_id": self.model_id
            },
            "runtime_trace": {
                "trace_id": self.trace_id,
                "execution_sequence": self.current_trace
            }
        }
```
