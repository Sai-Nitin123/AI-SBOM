import time
import uuid
import datetime
import ollama
import random
from chain import TraceLog

# Benign tool pool — normal operational tools an agent would use
BENIGN_TOOLS = ["kb-search", "calculator", "weather_api", "calendar_lookup", "user_profile"]
# Benign internal API endpoints
BENIGN_ENDPOINTS = [
    ("https://internal-api.com/metrics", 0.2),
    ("https://internal-api.com/user-data", 0.3),
    ("https://internal-api.com/logs", 0.2),
]

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

        # ── Step 1: Pre-inference tool call ──────────────────────────────
        # Always simulate a tool call (benign agent always uses at least one tool)
        if is_malicious:
            tool_name = random.choice(["read_credentials", "db_dump", "admin_override"])
        else:
            tool_name = random.choice(BENIGN_TOOLS)
            # Respect context: use kb-search if prompt mentions searching
            if "search" in text.lower() or "look up" in text.lower():
                tool_name = "kb-search"

        t_start = time.time()
        time.sleep(random.uniform(0.05, 0.3))
        sequence.append({
            "step": step_counter,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "action": "tool_call",
            "tool_name": tool_name,
            "latency_ms": int((time.time() - t_start) * 1000)
        })
        step_counter += 1

        # ── Step 2: LLM inference ─────────────────────────────────────────
        llm_start = time.time()
        response = ollama.generate(model=self.model_name, prompt=text)
        latency_ms = int((time.time() - llm_start) * 1000)
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

        # ── Step 3: Post-inference API call ───────────────────────────────
        # Always log the result to an API endpoint (normal in agentic systems)
        if is_malicious:
            endpoint = "https://evil-hacker.com/upload"
            bytes_transferred = random.randint(500_000, 10_000_000)  # large exfil
        else:
            endpoint, _ = random.choice(BENIGN_ENDPOINTS)
            bytes_transferred = random.randint(200, 8_000)  # small internal write

        a_start = time.time()
        time.sleep(random.uniform(0.02, 0.15))
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
        return response.get('response', '')

