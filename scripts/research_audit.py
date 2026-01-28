import pandas as pd
import numpy as np
import time
import pickle
import os
import json
from sklearn.metrics import accuracy_score
from datetime import datetime

# Load necessary components
MODEL_PATH = "models/threat_model.pkl"
METADATA_PATH = "models/model_metadata.pkl"
FEATURE_DATA_PATH = "data/ml_ready_features.csv"

def rule_based_classify(row):
    """
    Side-by-side rule engine baseline logic.
    Matches the detection logic used in Stage 3.
    """
    if row.get('failed_attempt_count', 0) >= 10:
        return 2 # Threat (Brute Force)
    if row.get('unique_ports_accessed', 0) >= 20:
        return 2 # Threat (Port Scan)
    if row.get('sql_flag', 0) == 1:
        return 2 # Threat (SQLi)
    if row.get('request_frequency', 0) > 100:
        return 1 # Suspicious (High Frequency)
    return 0 # Normal

def run_research_audit():
    print("🚀 Starting SOC Research Audit (Final Phase)...")
    
    if not os.path.exists(FEATURE_DATA_PATH):
        print(f"❌ Error: Feature data not found at {FEATURE_DATA_PATH}")
        return

    # Load data
    df = pd.read_csv(FEATURE_DATA_PATH)
    print(f"📊 Loaded {len(df)} logs with engineered features.")

    # Load Model
    with open(MODEL_PATH, 'rb') as f:
        model = pickle.load(f)
    with open(METADATA_PATH, 'rb') as f:
        metadata = pickle.load(f)
        feature_cols = metadata['feature_cols']

    # 1. Performance Measurement (Latency)
    print("\n⏱ Benchmarking Latency (n=2000)...")
    ml_latencies = []
    rule_latencies = []
    
    # Sample for latency check
    sample_size = min(2000, len(df))
    sample_df = df.sample(sample_size)
    
    for _, row in sample_df.iterrows():
        # ML Latency
        # Prepare single-row DF as the model expects a batch
        X = pd.DataFrame([row[feature_cols]])
        
        start = time.perf_counter()
        model.predict(X)
        ml_latencies.append(time.perf_counter() - start)
        
        # Rule Latency
        start = time.perf_counter()
        rule_based_classify(row)
        rule_latencies.append(time.perf_counter() - start)

    avg_ml_latency = np.mean(ml_latencies) * 1000 # ms
    avg_rule_latency = np.mean(rule_latencies) * 1000 # ms

    # 2. Accuracy Comparison
    print("🎯 Calculating Comparative Accuracy...")
    
    # ML Predictions (Batch)
    X_all = df[feature_cols]
    y_true = df['label']
    ml_preds = model.predict(X_all)
    
    # Rule-Based Predictions (Row-by-row)
    rule_preds = df.apply(rule_based_classify, axis=1)

    # Calculate Accuracy
    ml_accuracy = accuracy_score(y_true, ml_preds)
    rule_accuracy = accuracy_score(y_true, rule_preds)
    
    # Calculate False Positive Rate (FPR) for "Threat" (label 2)
    # FPR = FP / (FP + TN)
    def calculate_fpr(y_true, y_pred):
        # We define FP as predicting 2 (Threat) when it's actually 0 (Normal)
        fp = np.sum((y_true == 0) & (y_pred == 2))
        tn = np.sum((y_true == 0) & (y_pred == 0))
        return fp / (fp + tn) if (fp + tn) > 0 else 0

    ml_fpr = calculate_fpr(y_true, ml_preds)
    rule_fpr = calculate_fpr(y_true, rule_preds)

    # 3. Compile Results
    results = {
        "audit_timestamp": datetime.now().isoformat(),
        "dataset_size": len(df),
        "metrics": {
            "ml_model": {
                "type": "RandomForestClassifier",
                "accuracy": round(ml_accuracy, 4),
                "false_positive_rate": round(ml_fpr, 4),
                "avg_inference_latency_ms": round(avg_ml_latency, 4)
            },
            "rule_engine": {
                "type": "Static Thresholds",
                "accuracy": round(rule_accuracy, 4),
                "false_positive_rate": round(rule_fpr, 4),
                "avg_logic_latency_ms": round(avg_rule_latency, 4)
            }
        }
    }

    print("\n" + "═"*50)
    print("🏁 SOC PERFORMANCE AUDIT RESULTS")
    print("═"*50)
    print(f"{'Metric':<20} | {'ML Model':<12} | {'Rule Engine':<12}")
    print(f"{'-'*20}-|-{'-'*12}-|-{'-'*12}")
    print(f"{'Accuracy':<20} | {ml_accuracy:>11.2%} | {rule_accuracy:>11.2%}")
    print(f"{'False Pos Rate':<20} | {ml_fpr:>11.2%} | {rule_fpr:>11.2%}")
    print(f"{'Latency (avg/call)':<20} | {avg_ml_latency:>8.4f} ms | {avg_rule_latency:>8.4f} ms")
    print("═"*50)

    # Save to file
    with open("data/research_metrics.json", "w") as f:
        json.dump(results, f, indent=4)
    print("\n✅ Evidence saved to data/research_metrics.json")

if __name__ == "__main__":
    run_research_audit()
