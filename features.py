import json
import pandas as pd
from pathlib import Path

# Mock sensitivity mapping
API_SENSITIVITY = {
    "https://internal-api.com/metrics": 0.2,
    "https://external-api.com/data": 0.5,
    "https://evil-hacker.com/upload": 1.0
}

def get_sensitivity(endpoint):
    for key, val in API_SENSITIVITY.items():
        if key in endpoint:
            return val
    return 0.5 # default

def parse_trace(log_file, label):
    records = []
    if not Path(log_file).exists():
        return records
        
    with open(log_file, 'r') as f:
        for line in f:
            if not line.strip():
                continue
            entry = json.loads(line)
            trace = entry['payload']
            trace_id = trace['runtime_trace']['trace_id']
            seq = trace['runtime_trace']['execution_sequence']
            
            latencies = []
            tool_calls = 0
            api_calls = 0
            total_bytes = 0
            max_sens = 0.0
            tools = []
            
            for step in seq:
                latencies.append(step.get('latency_ms', 0))
                
                if step['action'] == 'tool_call':
                    tool_calls += 1
                    tools.append(step['tool_name'])
                elif step['action'] == 'api_call':
                    api_calls += 1
                    total_bytes += step.get('bytes_transferred', 0)
                    sens = get_sensitivity(step.get('endpoint', ''))
                    if sens > max_sens:
                        max_sens = sens
                        
            avg_latency = sum(latencies)/len(latencies) if latencies else 0
            max_latency = max(latencies) if latencies else 0
            
            records.append({
                "trace_id": trace_id,
                "label": label,
                "avg_latency": avg_latency,
                "max_latency": max_latency,
                "total_tool_calls": tool_calls,
                "total_bytes": total_bytes,
                "max_api_sensitivity": max_sens,
                "num_api_calls": api_calls,
                "tool_sequence": ",".join(tools)
            })
    return records

def main():
    benign = parse_trace('benign_traces.jsonl', 0)
    malicious = parse_trace('malicious_traces.jsonl', 1)
    
    df = pd.DataFrame(benign + malicious)
    df.to_csv('feature_table.csv', index=False)
    print(f"Extracted {len(df)} traces into feature_table.csv")

if __name__ == "__main__":
    main()
