import pandas as pd
import xgboost as xgb
import joblib

XGB_FEATURES = ['total_bytes', 'max_api_sensitivity', 'num_api_calls', 'avg_latency', 'total_tool_calls']

def train_xgboost(csv_path='feature_table.csv', model_path='xgb_model.joblib'):
    print("Loading data for XGBoost...")
    df = pd.read_csv(csv_path)
    
    # Train on both benign and malicious data
    X = df[XGB_FEATURES].fillna(0)
    y = df['label']
    
    print(f"Training on {len(X)} samples...")
    model = xgb.XGBClassifier(n_estimators=100, max_depth=3, learning_rate=0.08, random_state=42)
    model.fit(X, y)
    
    # Save the model using joblib
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")
    
    # Feature importances
    importances = model.feature_importances_
    print("Feature Importances:")
    for feature, imp in zip(XGB_FEATURES, importances):
        print(f"  {feature}: {imp:.4f}")

_CACHED_XGB = {}

def predict_xgboost(features_dict, model_path='xgb_model.joblib'):
    global _CACHED_XGB
    if "model" not in _CACHED_XGB or _CACHED_XGB.get("path") != model_path:
        _CACHED_XGB["model"] = joblib.load(model_path)
        _CACHED_XGB["path"] = model_path
        
    model = _CACHED_XGB["model"]
    df = pd.DataFrame([features_dict])[XGB_FEATURES].fillna(0)
    
    prob = model.predict_proba(df)[0][1] # Probability of class 1 (malicious)
    
    return {
        "is_risky": bool(prob > 0.5),
        "risk_score": float(round(prob, 6)),
        "features_extracted": {k: float(df[k].iloc[0]) for k in XGB_FEATURES}
    }

if __name__ == "__main__":
    train_xgboost()


