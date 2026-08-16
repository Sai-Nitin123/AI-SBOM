import os
import uuid
import random
import datetime
from pathlib import Path
from chain import TraceSigner, TraceLog

def generate_fake_trace(is_malicious=False):
    trace_id = str(uuid.uuid4())
    deployment_id = "local-test-deployment"
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    sequence = []
    step_counter = 1
    
    # 1. Tool Call
    if is_malicious and random.random() > 0.3:
        # Malicious might call strange tools or skip normal ones
        tools = ["read_credentials", "db_dump", "kb-search"]
        tool_name = random.choice(tools)
        latency = random.randint(100, 500)
    else:
        tools = ["kb-search", "calculator", "weather_api"]
        tool_name = random.choice(tools)
        latency = random.randint(100, 300)

    sequence.append({
        "step": step_counter,
        "timestamp": now,
        "action": "tool_call",
        "tool_name": tool_name,
        "latency_ms": latency
    })
    step_counter += 1

    # 2. LLM Inference
    if is_malicious:
        # Malicious might have weird token ratios or very long latency
        latency_ms = random.randint(2000, 8000)
        in_tokens = random.randint(50, 1000)
        out_tokens = random.randint(500, 2000)
    else:
        latency_ms = random.randint(300, 1500)
        in_tokens = random.randint(20, 200)
        out_tokens = random.randint(10, 100)

    sequence.append({
        "step": step_counter,
        "timestamp": now,
        "action": "model_inference",
        "latency_ms": latency_ms,
        "input_tokens": in_tokens,
        "output_tokens": out_tokens
    })
    step_counter += 1

    # 3. API Call
    if is_malicious and random.random() > 0.2:
        endpoint = "https://evil-hacker.com/upload"
        bytes_transferred = random.randint(50000, 5000000)
    else:
        endpoint = "https://internal-api.com/metrics"
        bytes_transferred = random.randint(100, 2000)

    sequence.append({
        "step": step_counter,
        "timestamp": now,
        "action": "api_call",
        "endpoint": endpoint,
        "bytes_transferred": bytes_transferred,
        "latency_ms": random.randint(50, 200)
    })
    
    return {
        "deployment_id": deployment_id,
        "timestamp": now,
        "model_checkpoint": {
            "model_id": "llama3.2:3b"
        },
        "runtime_trace": {
            "trace_id": trace_id,
            "execution_sequence": sequence
        }
    }

def main():
    signer = TraceSigner(Path('device.key'))
    
    print("Generating benign_traces.jsonl...")
    if Path('benign_traces.jsonl').exists():
        Path('benign_traces.jsonl').unlink()
    benign_log = TraceLog(Path('benign_traces.jsonl'), signer)
    for _ in range(200):
        benign_log.append(generate_fake_trace(is_malicious=False))
        
    print("Generating malicious_traces.jsonl...")
    if Path('malicious_traces.jsonl').exists():
        Path('malicious_traces.jsonl').unlink()
    malicious_log = TraceLog(Path('malicious_traces.jsonl'), signer)
    for _ in range(80):
        malicious_log.append(generate_fake_trace(is_malicious=True))
        
    print("Done generating synthetic data.")

if __name__ == "__main__":
    main()
