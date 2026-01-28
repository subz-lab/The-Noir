import pandas as pd
import pickle
import os

def generate_prediction_results(feature_csv="data/ml_ready_features.csv", model_path="models/threat_model.pkl", output_csv="data/ml_prediction_results.csv"):
    print(f"Generating prediction results from {feature_csv}...")
    
    if not os.path.exists(feature_csv) or not os.path.exists(model_path):
        print("Error: Missing required files.")
        return

    # Load data
    df = pd.read_csv(feature_csv)
    X = df.drop('label', axis=1)
    y_actual = df['label']
    
    # Load model
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
        
    # Predict
    y_pred = model.predict(X)
    y_proba = model.predict_proba(X)
    
    # Create results dataframe
    results_df = df.copy()
    results_df['predicted_label'] = y_pred
    
    # Add max probability (confidence)
    results_df['confidence'] = [max(p) for p in y_proba]
    
    # Mark mismatches
    results_df['is_correct'] = results_df['label'] == results_df['predicted_label']
    
    print(f"Saving {len(results_df):,} prediction results to {output_csv}...")
    results_df.to_csv(output_csv, index=False)
    
    # Print summary
    correct_count = results_df['is_correct'].sum()
    print(f"\nResults Summary:")
    print(f"Total Samples: {len(results_df):,}")
    print(f"Correct Predictions: {correct_count:,} ({correct_count/len(results_df):.2%})")
    print(f"Mismatches: {len(results_df) - correct_count:,}")

if __name__ == "__main__":
    generate_prediction_results()
