import pandas as pd
import joblib
from sklearn.ensemble import IsolationForest

IF_FEATURES = ['avg_latency', 'max_latency', 'total_tool_calls', 'total_bytes']

def train_isolation_forest(csv_path='feature_table.csv', model_path='iforest_model.joblib'):
    print("Loading data for Isolation Forest...")
    df = pd.read_csv(csv_path)
    
    # Train only on benign data
    benign_df = df[df['label'] == 0]
    X_train = benign_df[IF_FEATURES].fillna(0)
    
    print(f"Training on {len(X_train)} benign samples...")
    model = IsolationForest(n_estimators=100, contamination=0.02, random_state=42)
    model.fit(X_train)
    
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")

_CACHED_IFOREST = {}

def predict_isolation_forest(features_dict, model_path='iforest_model.joblib'):
    global _CACHED_IFOREST
    if "model" not in _CACHED_IFOREST or _CACHED_IFOREST.get("path") != model_path:
        _CACHED_IFOREST["model"] = joblib.load(model_path)
        _CACHED_IFOREST["path"] = model_path
        
    model = _CACHED_IFOREST["model"]
    df = pd.DataFrame([features_dict])[IF_FEATURES].fillna(0)
    
    # decision_function returns positive for inliers (> 0.15) and negative for outliers (< -0.10)
    df_val = float(model.decision_function(df)[0])
    
    # Calibrate: inliers (+0.25) -> ~0.10, boundary (0.0) -> 0.50, outliers (-0.25) -> ~0.88
    anomaly_score = max(0.0, min(1.0, 0.50 - (df_val * 1.5)))
    
    return {
        "is_anomaly": bool(model.predict(df)[0] == -1),
        "anomaly_score": float(round(anomaly_score, 6)),
        "features_extracted": {k: float(df[k].iloc[0]) for k in IF_FEATURES}
    }

if __name__ == "__main__":
    train_isolation_forest()


