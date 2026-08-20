import pandas as pd

# Import prediction functions from other scripts
from importlib import import_module
iforest = import_module('05_code_isolation_forest')
lstm = import_module('07_code_lstm')
xgb = import_module('09_code_xgboost')

WEIGHTS = {
    "behavioral": 0.20,
    "sequence": 0.45,
    "exfil": 0.35
}

THRESHOLDS = {
    "block": 0.60,
    "flag": 0.30
}

def evaluate_session(row):
    # Prepare features for Isolation Forest
    if_features = {
        'avg_latency': row.get('avg_latency', 0),
        'max_latency': row.get('max_latency', 0),
        'total_tool_calls': row.get('total_tool_calls', 0),
        'total_bytes': row.get('total_bytes', 0)
    }
    
    # Prepare features for XGBoost
    xgb_features = {
        'total_bytes': row.get('total_bytes', 0),
        'max_api_sensitivity': row.get('max_api_sensitivity', 0),
        'num_api_calls': row.get('num_api_calls', 0),
        'avg_latency': row.get('avg_latency', 0),
        'total_tool_calls': row.get('total_tool_calls', 0)
    }
    
    # Prepare tool sequence for LSTM
    seq_str = str(row.get('tool_sequence', ''))
    tool_sequence = seq_str.split(',') if seq_str and seq_str != 'nan' else []

    # Get individual scores
    if_res = iforest.predict_isolation_forest(if_features)
    lstm_res = lstm.predict_lstm(tool_sequence)
    xgb_res = xgb.predict_xgboost(xgb_features)
    
    # Calculate fused score (Max-pooling + weighted blend)
    ml_score = (
        (if_res['anomaly_score'] * WEIGHTS['behavioral']) +
        (lstm_res['anomaly_score'] * WEIGHTS['sequence']) +
        (xgb_res['risk_score'] * WEIGHTS['exfil'])
    )
    # If XGBoost or LSTM detected clear attack, max-pool ensures it isn't diluted
    overall_score = max(ml_score, xgb_res['risk_score'] if xgb_res['risk_score'] > 0.7 else 0.0, lstm_res['anomaly_score'] if lstm_res['anomaly_score'] > 0.7 else 0.0)
    overall_score = min(1.0, overall_score)
    
    # Determine action
    if overall_score >= THRESHOLDS['block']:
        action = "BLOCK"
    elif overall_score >= THRESHOLDS['flag']:
        action = "FLAG_FOR_REVIEW"
    else:
        action = "ALLOW"
        
    return {
        "trace_id": row.get('trace_id', 'unknown'),
        "true_label": row.get('label', 0),
        "if_score": round(if_res['anomaly_score'], 6),
        "lstm_score": round(lstm_res['anomaly_score'], 6),
        "xgb_score": round(xgb_res['risk_score'], 6),
        "overall_score": round(overall_score, 6),
        "action": action
    }

def main():
    print("Loading feature_table.csv...")
    df = pd.read_csv('feature_table.csv')
    
    results = []
    flagged_count = 0
    total = len(df)
    
    print("Evaluating sessions...")
    for idx, row in df.iterrows():
        res = evaluate_session(row)
        results.append(res)
        if res['action'] in ['BLOCK', 'FLAG_FOR_REVIEW']:
            flagged_count += 1
            
    print(f"{flagged_count}/{total} sessions flagged")
    
    res_df = pd.DataFrame(results)
    res_df.to_csv('fused_session_scores.csv', index=False)
    print("Saved fused_session_scores.csv")

if __name__ == "__main__":
    main()
