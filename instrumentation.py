import time
import uuid
import datetime
import ollama
import random
from chain import TraceLog

class InstrumentedModel:
    def __init__(self, model_name: str, log: TraceLog):
        self.model_name = model_name
        self.log = log

    def prompt(self, text: str) -> str:
        trace_id = str(uuid.uuid4())
        deployment_id = "local-test-deployment"
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        sequence = []
        step_counter = 1
        
        # 1. Simulate an API call before inference occasionally to simulate "fetching context"
        if "search" in text.lower():
            api_start = time.time()
            time.sleep(random.uniform(0.1, 0.5))
            sequence.append({
                "step": step_counter,
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "action": "tool_call",
                "tool_name": "kb-search",
                "latency_ms": int((time.time() - api_start) * 1000)
            })
            step_counter += 1

        # 2. Call the LLM
        llm_start = time.time()
        response = ollama.generate(model=self.model_name, prompt=text)
        latency_ms = int((time.time() - llm_start) * 1000)
        
        # Ollama API response contains: 'eval_count', 'prompt_eval_count'
        out_tokens = response.get('eval_count', 0)
        in_tokens = response.get('prompt_eval_count', 0)
        
        sequence.append({
            "step": step_counter,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "action": "model_inference",
            "latency_ms": latency_ms,
            "input_tokens": in_tokens,
            "output_tokens": out_tokens
        })
        step_counter += 1

        # 3. Simulate another action based on response
        res_text = response.get('response', '')
        if "http" in res_text.lower() or "download" in text.lower():
            api_start = time.time()
            time.sleep(random.uniform(0.1, 0.8))
            sequence.append({
                "step": step_counter,
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "action": "api_call",
                "endpoint": "https://external-api.com/data",
                "bytes_transferred": random.randint(1000, 5000000),
                "latency_ms": int((time.time() - api_start) * 1000)
            })
            step_counter += 1

        # Construct trace
        trace_data = {
            "deployment_id": deployment_id,
            "timestamp": now,
            "model_checkpoint": {
                "model_id": self.model_name
            },
            "runtime_trace": {
                "trace_id": trace_id,
                "execution_sequence": sequence
            }
        }
        
        # Log securely
        self.log.append(trace_data)
        
        return res_text
