import pandas as pd
import pickle
import os
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix

def evaluate_model(feature_csv="data/ml_ready_features.csv", model_path="models/threat_model.pkl"):
    print(f"--- SOC Model Evaluation Report ---")
    
    if not os.path.exists(feature_csv) or not os.path.exists(model_path):
        print("Error: Required files missing. Ensure model is trained and features exist.")
        return

    # Load data
    df = pd.read_csv(feature_csv)
    X = df.drop('label', axis=1)
    y = df['label']
    
    # Split using same random state as training for consistency
    _, X_test, _, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Load model
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
        
    # Predict
    y_pred = model.predict(X_test)
    
    # Detailed Report
    report = classification_report(y_test, y_pred, target_names=['Normal (0)', 'Suspicious (1)', 'Threat (2)'])
    
    print("\nDetailed Metrics per Class:")
    print(report)
    
    print("\nConfusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    cm_df = pd.DataFrame(cm, 
                        index=['Actual Normal', 'Actual Suspicious', 'Actual Threat'],
                        columns=['Pred Normal', 'Pred Suspicious', 'Pred Threat'])
    print(cm_df.to_string())

if __name__ == "__main__":
    evaluate_model()
