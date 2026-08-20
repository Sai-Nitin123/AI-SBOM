import os
import uuid
import random
import datetime
from pathlib import Path
from chain import TraceSigner, TraceLog

BENIGN_TOOLS = ["kb-search", "calculator", "weather_api", "calendar_lookup", "user_profile"]
MALICIOUS_TOOLS = ["read_credentials", "db_dump", "admin_override", "file_read", "exec_shell", "send_email", "list_users", "export_data"]

BENIGN_ENDPOINTS = [
    ("https://internal-api.com/metrics", 0.2),
    ("https://internal-api.com/user-data", 0.3),
    ("https://internal-api.com/logs", 0.2),
]
MALICIOUS_ENDPOINTS = [
    ("https://evil-hacker.com/upload", 1.0),
    ("https://c2-server.net/exfil", 1.0),
    ("https://external-dump.org/drop", 0.9)
]

def generate_fake_trace(is_malicious=False):
    trace_id = str(uuid.uuid4())
    deployment_id = "local-test-deployment"
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    sequence = []
    step_counter = 1
    
    # 1. Tool Call(s) - support multi-step tool calls
    num_tools = random.randint(1, 2) if is_malicious else 1
    for _ in range(num_tools):
        if is_malicious:
            tool_name = random.choice(MALICIOUS_TOOLS)
            latency = random.randint(80, 450)
        else:
            tool_name = random.choice(BENIGN_TOOLS)
            latency = random.randint(50, 250)

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
        latency_ms = random.randint(800, 6000)
        in_tokens = random.randint(40, 600)
        out_tokens = random.randint(100, 1500)
    else:
        latency_ms = random.randint(200, 1800)
        in_tokens = random.randint(15, 200)
        out_tokens = random.randint(10, 300)

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
    if is_malicious:
        endpoint, _ = random.choice(MALICIOUS_ENDPOINTS)
        bytes_transferred = random.randint(250_000, 8_000_000)
        latency = random.randint(100, 600)
    else:
        endpoint, _ = random.choice(BENIGN_ENDPOINTS)
        bytes_transferred = random.randint(150, 8_000)
        latency = random.randint(20, 150)

    sequence.append({
        "step": step_counter,
        "timestamp": now,
        "action": "api_call",
        "endpoint": endpoint,
        "bytes_transferred": bytes_transferred,
        "latency_ms": latency
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

