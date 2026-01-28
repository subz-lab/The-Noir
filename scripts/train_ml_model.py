import pandas as pd
import numpy as np
import pickle
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

def train_model(input_csv="data/ml_ready_features.csv", model_path="models/threat_model.pkl"):
    print(f"Loading features from {input_csv}...")
    if not os.path.exists(input_csv):
        print(f"Error: {input_csv} not found. Please run scripts/feature_engineering.py first.")
        return

    # Load data
    df = pd.read_csv(input_csv)
    
    # Define features (X) and target (y)
    X = df.drop('label', axis=1)
    y = df['label']
    
    # Split data: 80% Training, 20% Testing
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    print(f"Training Data: {len(X_train)} samples")
    print(f"Testing Data:  {len(X_test)} samples")
    
    # Initialize and train Random Forest
    print("\nTraining Random Forest Classifier...")
    model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
    model.fit(X_train, y_train)
    
    # Predictions
    y_pred = model.predict(X_test)
    
    # Evaluation
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\nModel Accuracy: {accuracy:.4f}")
    
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Normal', 'Suspicious', 'Threat']))
    
    # Confusion Matrix
    cm = confusion_matrix(y_test, y_pred)
    print("\nConfusion Matrix:")
    print(cm)
    
    # Feature Importance
    importances = model.feature_importances_
    feature_names = X.columns
    feature_importance_df = pd.DataFrame({'Feature': feature_names, 'Importance': importances})
    feature_importance_df = feature_importance_df.sort_values(by='Importance', ascending=False)
    
    print("\nFeature Importance:")
    print(feature_importance_df)
    
    # Save the model
    print(f"\nSaving model to {model_path}...")
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    
    # Also save metadata (feature columns) so we can ensure consistent prediction
    with open("models/model_metadata.pkl", 'wb') as f:
        pickle.dump({'feature_cols': list(X.columns)}, f)
        
    print("Model training and persistence complete!")

if __name__ == "__main__":
    train_model()
