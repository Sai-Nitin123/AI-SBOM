$ErrorActionPreference = "Stop"
python 01_extract_benign.py
python 02_extract_malicious.py
python features.py
python 05_code_isolation_forest.py
python 07_code_lstm.py
python 09_code_xgboost.py
python 10_code_fused_scoring_flagging.py
