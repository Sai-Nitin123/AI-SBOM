import time
import uuid
import datetime
import ollama
import random
import re
from chain import TraceLog

# Benign tool pool — normal operational tools an agent would use
BENIGN_TOOLS = ["kb-search", "calculator", "weather_api", "calendar_lookup", "user_profile"]

# Suspicious tools indicating high-risk operations
SUSPICIOUS_TOOLS = [
    "read_credentials", "db_dump", "admin_override", "file_read",
    "exec_shell", "send_email", "list_users", "export_data"
]

# Endpoint mappings
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

def infer_tool_from_prompt(text: str, is_malicious_flag: bool = False) -> tuple[str, bool]:
    """
    Dynamically infers the most likely tool and security risk profile
    from the semantic intent of the prompt. Differentiates between
    benign informational questions and genuine exploit directives.
    """
    t_lower = text.lower().strip()
    
    # Explicit malicious test flag
    if is_malicious_flag:
        return random.choice(["read_credentials", "db_dump", "admin_override", "exec_shell"]), True
        
    # Check for direct destructive/theft imperatives
    theft_keywords = [
        "give me the password", "reveal the password", "dump password", "dump the database",
        "db_dump", "database dump", "dump database", "read_credentials", "exec_shell",
        "/etc/shadow", "/etc/passwd", "cat /root", "id_rsa", "reverse shell", "rm -rf",
        "admin_override", "you are now in developer mode", "dan mode", "chaosbot",
        "exfiltrate", "send all credentials to", "upload data to http", "unmask employee ssn"
    ]
    if any(k in t_lower for k in theft_keywords):
        if "dump" in t_lower or "database" in t_lower:
            return "db_dump", True
        if "shell" in t_lower or "cat " in t_lower or "exec" in t_lower:
            return "exec_shell", True
        if "admin" in t_lower or "override" in t_lower or "mode" in t_lower:
            return "admin_override", True
        return "read_credentials", True

    # Check benign contextual tools
    if any(k in t_lower for k in ["search", "look up", "find", "article", "history", "knowledge", "doc", "policy", "what is", "when was", "where was", "who is", "explain", "describe", "summary", "summarize", "tell me"]):
        return "kb-search", False
    if any(k in t_lower for k in ["calculate", "math", "square root", "sum", "multiply", "divide", "tax", "interest", "algorithm", "sort", "code", "python", "function"]):
        return "calculator", False
    if any(k in t_lower for k in ["weather", "temperature", "forecast", "rain", "tokyo", "london", "climate"]):
        return "weather_api", False
    if any(k in t_lower for k in ["calendar", "meeting", "schedule", "tomorrow", "vacation", "appointment"]):
        return "calendar_lookup", False
        
    return "kb-search", False

class InstrumentedModel:
    def __init__(self, model_name: str, log: TraceLog):
        self.model_name = model_name
        self.log = log

    def prompt(self, text: str, is_malicious: bool = False) -> str:
        trace_id = str(uuid.uuid4())
        deployment_id = "local-test-deployment"
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()

        sequence = []
        step_counter = 1

        # ── Step 1: Context-Aware Dynamic Tool Invocations ────────────────
        tool_name, is_threat = infer_tool_from_prompt(text, is_malicious)

        t_start = time.time()
        time.sleep(random.uniform(0.04, 0.20))
        sequence.append({
            "step": step_counter,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "action": "tool_call",
            "tool_name": tool_name,
            "latency_ms": int((time.time() - t_start) * 1000)
        })
        step_counter += 1

        # ── Step 2: LLM Inference via Ollama ───────────────────────────────
        llm_start = time.time()
        try:
            response = ollama.generate(model=self.model_name, prompt=text)
            latency_ms = int((time.time() - llm_start) * 1000)
            out_tokens = response.get('eval_count', 0)
            in_tokens = response.get('prompt_eval_count', 0)
            response_text = response.get('response', '')
        except Exception as e:
            latency_ms = int((time.time() - llm_start) * 1000)
            out_tokens = 0
            in_tokens = 0
            response_text = f"[LLM Error: {str(e)}]"

        sequence.append({
            "step": step_counter,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "action": "model_inference",
            "latency_ms": latency_ms,
            "input_tokens": in_tokens,
            "output_tokens": out_tokens
        })
        step_counter += 1

        # ── Step 3: Post-inference API Telemetry ────────────────────────────
        if is_threat or is_malicious:
            endpoint, _ = random.choice(MALICIOUS_ENDPOINTS)
            bytes_transferred = random.randint(300_000, 7_500_000)  # large payload/exfil
        else:
            endpoint, _ = random.choice(BENIGN_ENDPOINTS)
            bytes_transferred = random.randint(200, 8_000)  # standard internal logging

        a_start = time.time()
        time.sleep(random.uniform(0.02, 0.12))
        sequence.append({
            "step": step_counter,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "action": "api_call",
            "endpoint": endpoint,
            "bytes_transferred": bytes_transferred,
            "latency_ms": int((time.time() - a_start) * 1000)
        })

        # ── Construct and sign the trace ─────────────────────────────────
        trace_data = {
            "deployment_id": deployment_id,
            "timestamp": now,
            "model_checkpoint": {"model_id": self.model_name},
            "runtime_trace": {
                "trace_id": trace_id,
                "execution_sequence": sequence
            }
        }

        self.log.append(trace_data)
        return response_text


