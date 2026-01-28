import pandas as pd
import pickle
import os
from sklearn.metrics import confusion_matrix, accuracy_score

def compare_rule_vs_ml(feature_csv="data/ml_ready_features.csv", model_path="models/threat_model.pkl"):
    print("--- SOC Detection Comparison: Rule-Based vs. Machine Learning ---")
    
    if not os.path.exists(feature_csv) or not os.path.exists(model_path):
        print("Error: Required files missing.")
        return

    # 1. Load Data (y_rule is the Class column from our labeled dataset)
    df = pd.read_csv(feature_csv)
    X = df.drop('label', axis=1)
    y_rule = df['label']
    
    # 2. Load ML Model and Predict
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    
    y_ml = model.predict(X)
    
    # 3. Calculate Overall Agreement
    agreement = accuracy_score(y_rule, y_ml)
    print(f"\nOverall Agreement Rate: {agreement:.2%}")
    
    # 4. Identification of Mismatches
    mismatches = df[y_rule != y_ml].copy()
    mismatches['ml_pred'] = y_ml[y_rule != y_ml]
    
    print(f"Total Mismatches Found: {len(mismatches):,} out of {len(df):,}")
    
    # 5. Semantic Analysis of Mismatches
    print("\n--- Breakdown of Disagreements ---")
    
    # Type A: Rule says Threat, ML says Normal (Potential False Negatives for ML)
    type_a = mismatches[(mismatches['label'] == 2) & (mismatches['ml_pred'] == 0)]
    print(f"1. Rule says THREAT, ML says NORMAL: {len(type_a)}")
    
    # Type B: Rule says Normal, ML says Threat (ML found something rules missed, or False Positive)
    type_b = mismatches[(mismatches['label'] == 0) & (mismatches['ml_pred'] == 2)]
    print(f"2. Rule says NORMAL, ML says THREAT: {len(type_b)}")
    
    # Type C: Suspicious Disagreements
    type_c = mismatches[(mismatches['label'] == 1) ^ (mismatches['ml_pred'] == 1)]
    print(f"3. Disagreement on SUSPICIOUS label: {len(type_c)}")

    # 6. Sample Mismatches Detail
    if len(mismatches) > 0:
        print("\n--- Detailed Sample of Disagreements (First 5) ---")
        display_cols = ['failed_attempt_count', 'unique_ports_accessed', 'sql_flag', 'label', 'ml_pred']
        print(mismatches[display_cols].head(10).to_string(index=False))

    # Save mismatches log for manual SOC audit
    output_path = "data/detection_mismatches_log.csv"
    mismatches.to_csv(output_path, index=False)
    print(f"\nFull mismatch log saved to: {output_path}")

if __name__ == "__main__":
    compare_rule_vs_ml()
