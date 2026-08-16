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
    model = IsolationForest(n_estimators=100, contamination=0.01, random_state=42)
    model.fit(X_train)
    
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")

def predict_isolation_forest(features_dict, model_path='iforest_model.joblib'):
    model = joblib.load(model_path)
    df = pd.DataFrame([features_dict])[IF_FEATURES].fillna(0)
    # score_samples returns negative anomaly scores. Lower is more anomalous.
    score = model.score_samples(df)[0]
    
    # Normalize score to 0.0-1.0 (approximate mapping)
    # scikit-learn scores usually range from -1.0 to 0.5. 
    # We want 0.0 to be normal, 1.0 to be anomalous.
    # Score < 0 means anomaly in isolation forest.
    # Let's map [-1.0, 0.5] -> [1.0, 0.0]
    normalized = 0.5 - score 
    normalized = max(0.0, min(1.0, normalized))
    
    return {
        "is_anomaly": bool(model.predict(df)[0] == -1),
        "anomaly_score": float(normalized),
        "features_extracted": {k: float(df[k].iloc[0]) for k in IF_FEATURES}
    }

if __name__ == "__main__":
    train_isolation_forest()
