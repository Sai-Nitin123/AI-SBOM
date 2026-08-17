import pandas as pd
from pathlib import Path

print("=== FILE CHECK ===")
files = {
    "benign_traces.jsonl": "Raw benign data",
    "malicious_traces.jsonl": "Raw malicious data",
    "feature_table.csv": "ML dataset",
    "fused_session_scores.csv": "Detection results",
    "iforest_model.joblib": "Isolation Forest model",
    "lstm_model.pt": "LSTM model",
    "xgb_model.joblib": "XGBoost model",
}
all_ok = True
for f, desc in files.items():
    size = Path(f).stat().st_size if Path(f).exists() else 0
    status = "OK" if size > 0 else "MISSING"
    if status == "MISSING":
        all_ok = False
    print(f"  [{status}] {f} ({size:,} bytes) - {desc}")

print()
print("=== DATASET CHECK ===")
df = pd.read_csv("feature_table.csv")
print(f"  Total sessions    : {len(df)}")
print(f"  Benign (label=0)  : {(df['label']==0).sum()}")
print(f"  Malicious(label=1): {(df['label']==1).sum()}")

print()
print("=== RESULTS CHECK ===")
fs = pd.read_csv("fused_session_scores.csv")
allow = (fs["action"]=="ALLOW").sum()
flag  = (fs["action"]=="FLAG_FOR_REVIEW").sum()
block = (fs["action"]=="BLOCK").sum()
malicious_blocked = fs[(fs["true_label"]==1) & (fs["action"]=="BLOCK")].shape[0]
total_malicious = (fs["true_label"]==1).sum()
print(f"  ALLOW             : {allow}")
print(f"  FLAG_FOR_REVIEW   : {flag}")
print(f"  BLOCK             : {block}")
print(f"  Malicious caught  : {malicious_blocked}/{total_malicious}")
print()
if all_ok and malicious_blocked == total_malicious:
    print("  ✓ ALL SYSTEMS WORKING CORRECTLY")
else:
    print("  ✗ Some issues detected")
