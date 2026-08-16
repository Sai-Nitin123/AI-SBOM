# AI-SBOM Data Extraction — Execution Guide

One file, run top to bottom. Each phase produces a file the next phase
consumes — don't skip ahead.

---

## Phase 0 — Environment Setup

```bash
pip install pydantic cryptography ollama pandas scikit-learn xgboost torch joblib
```

Install and start Ollama, then pull the 5 models:

```bash
ollama serve   # leave running in a separate terminal

ollama pull llama3.2:3b
ollama pull qwen2.5:3b
ollama pull phi3:3.8b
ollama pull gemma2:2b
ollama pull hermes3:8b
```

**Checkpoint:** `ollama list` shows all 5 models before moving on.

---

## Phase 1 — Smoke Test (confirm the wiring works)

Confirm every model responds through your instrumented pipeline before
generating anything at scale:

```bash
python3 -c "
from pathlib import Path
from chain import TraceSigner, TraceLog
from instrumentation import InstrumentedModel

signer = TraceSigner(Path('device.key'))
log = TraceLog(Path('smoke_test.jsonl'), signer)

for name in ['llama3.2:3b', 'qwen2.5:3b', 'phi3:3.8b', 'gemma2:2b', 'hermes3:8b']:
    print(f'--- {name} ---')
    m = InstrumentedModel(name, log)
    print(m.prompt('Reply with just OK.'))

valid, broken = log.verify_chain()
print('Chain valid:', valid, broken or '')
"
```

**Checkpoint:** all 5 models print output, `Chain valid: True`.
If a model fails here, fix it now — don't generate a large dataset on
top of a broken hook.

---

## Phase 2 — Validate the Pipeline on Synthetic Data

Don't wait for real generation to finish before testing the ML code —
prove the whole pipeline works on fake data first, in minutes:

```bash
python3 synthetic_data.py       # -> benign_traces.jsonl, malicious_traces.jsonl
python3 features.py             # -> feature_table.csv
python3 05_code_isolation_forest.py
python3 09_code_xgboost.py
python3 07_code_lstm.py
python3 10_code_fused_scoring_flagging.py
```

**Checkpoint:** all five scripts run without errors, and
`10_code_fused_scoring_flagging.py` prints a flagged-session count
(e.g. `80/280 sessions flagged`). If any script breaks here, debug it
now — this is fake data you generated yourself, so bugs are easy to
isolate before real data is involved.

---

## Phase 3 — Expand the Benign Prompt Bank

Before real extraction, open `01_extract_benign.py` and expand
`BENIGN_PROMPTS` from the 10 starter examples to 200–500+, spanning:

- Everyday Q&A
- Summarization requests
- Tool/agent-use requests ("search the knowledge base for...", "look up...")
- Code-help requests
- Multi-turn-style follow-ups

**Checkpoint:** `BENIGN_PROMPTS` has real variety, not just repeats of
the starter set.

---

## Phase 4 — Real Data Extraction

```bash
python3 01_extract_benign.py
# -> overwrites benign_traces.jsonl with REAL traces from your 4 models

python3 02_extract_malicious.py
# -> overwrites malicious_traces.jsonl
# -> also produces generated_payloads.json (raw red-team payload bank)
```

**Checkpoint:** open `generated_payloads.json` and manually skim the
generated attack payloads. Hermes occasionally refuses or drifts
off-topic instead of returning clean payloads — the script warns on
parse failure, but a manual skim confirms the *content* is actually
realistic before you trust the labels.

---

## Phase 5 — Verify Data Integrity

Before training on real data, confirm both logs are intact:

```bash
python3 -c "
from pathlib import Path
from chain import TraceSigner, TraceLog

signer = TraceSigner(Path('device.key'))
for name in ['benign_traces.jsonl', 'malicious_traces.jsonl']:
    log = TraceLog(Path(name), signer)
    valid, broken = log.verify_chain()
    print(name, '-> valid:', valid, broken or '')
"
```

**Checkpoint:** both logs report `valid: True`. A broken chain means an
instrumentation bug corrupted the data — fix the source, regenerate,
don't train on a broken log.

---

## Phase 6 — Re-run the Pipeline on Real Data

Same commands as Phase 2, no code changes — just real data underneath now:

```bash
python3 features.py
python3 05_code_isolation_forest.py
python3 09_code_xgboost.py
python3 07_code_lstm.py
python3 10_code_fused_scoring_flagging.py
```

**Checkpoint — sanity checks, not just "did it run":**
- **Class balance**: malicious sessions should be a meaningful chunk of
  the corpus (aim for at least ~10%). If far lower, go back to Phase 4
  and generate more red-team payloads.
- **Scores dropped from Phase 2's near-perfect numbers**: expected and
  healthy. A perfect score on real data is a red flag for data leakage
  (e.g. near-duplicate sessions across train/test), not a win.
- **XGBoost feature importances** (printed by `09_code_xgboost.py`)
  make intuitive sense given what your red-team payloads actually target.

---

## Output Artifacts After This Guide

| File | What it is |
|---|---|
| `benign_traces.jsonl` / `malicious_traces.jsonl` | Your labeled, signed, tamper-evident dataset |
| `generated_payloads.json` | Standalone citable attack-payload bank |
| `feature_table.csv` | Flat ML-ready feature table |
| `iforest_model.joblib`, `xgb_model.joblib`, `lstm_model.pt` | Trained detectors |
| `fused_session_scores.csv` | Final per-session risk scores + flags |

If every checkpoint above passed, you have a working, validated
real-time-capable detection pipeline running on real local-model data —
ready to move into evaluation and write-up.