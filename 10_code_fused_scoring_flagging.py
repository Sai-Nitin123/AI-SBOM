import pandas as pd

# Import prediction functions from other scripts
from importlib import import_module
iforest = import_module('05_code_isolation_forest')
lstm = import_module('07_code_lstm')
xgb = import_module('09_code_xgboost')

WEIGHTS = {
    "behavioral": 0.3,
    "sequence": 0.3,
    "exfil": 0.4
}

THRESHOLDS = {
    "block": 0.6,
    "flag": 0.3
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
        'num_api_calls': row.get('num_api_calls', 0)
    }
    
    # Prepare tool sequence for LSTM
    seq_str = str(row.get('tool_sequence', ''))
    tool_sequence = seq_str.split(',') if seq_str and seq_str != 'nan' else []

    # Get individual scores
    if_res = iforest.predict_isolation_forest(if_features)
    lstm_res = lstm.predict_lstm(tool_sequence)
    xgb_res = xgb.predict_xgboost(xgb_features)
    
    # Calculate fused score
    overall_score = (
        (if_res['anomaly_score'] * WEIGHTS['behavioral']) +
        (lstm_res['anomaly_score'] * WEIGHTS['sequence']) +
        (xgb_res['risk_score'] * WEIGHTS['exfil'])
    )
    
    # Determine action
    if overall_score > THRESHOLDS['block']:
        action = "BLOCK"
    elif overall_score > THRESHOLDS['flag']:
        action = "FLAG_FOR_REVIEW"
    else:
        action = "ALLOW"
        
    return {
        "trace_id": row.get('trace_id', 'unknown'),
        "true_label": row.get('label', 0),
        "if_score": if_res['anomaly_score'],
        "lstm_score": lstm_res['anomaly_score'],
        "xgb_score": xgb_res['risk_score'],
        "overall_score": overall_score,
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
