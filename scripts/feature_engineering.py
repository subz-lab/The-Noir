import pandas as pd
import numpy as np
import re
from datetime import datetime, timedelta
import os

def perform_feature_engineering(input_csv="data/labeled_logs.csv", output_csv="data/ml_ready_features.csv"):
    print(f"Loading dataset from {input_csv}...")
    if not os.path.exists(input_csv):
        print(f"Error: {input_csv} not found.")
        return

    # Load data
    df = pd.read_csv(input_csv)
    
    # Convert timestamp to datetime
    df['timestamp'] = pd.to_datetime(df['timestamp'].str.replace('Z', ''))
    
    # Sort for window calculations
    df = df.sort_values(['ip_address', 'timestamp'])
    
    print("Engineering features...")

    # 1. SQL Flag (Binary)
    sql_pattern = r"(?i)(OR\s+['\"]?\d|DROP\s+TABLE|UNION\s+SELECT|--|admin['\"]--|SELECT\s+\*\s+FROM|' OR '1'='1|' OR 'a'='a)"
    df['sql_flag'] = df['request_payload'].astype(str).apply(lambda x: 1 if re.search(sql_pattern, x) else 0)

    # 2. Sequential Time Gaps per IP
    df['time_gap'] = df.groupby('ip_address')['timestamp'].diff().dt.total_seconds().fillna(0)

    # 3. Rolling Features
    df = df.set_index('timestamp')
    
    processed_groups = []
    
    for ip, group in df.groupby('ip_address'):
        # Sort group just in case
        group = group.sort_index()
        
        # Failed login count (1m window)
        is_failed = (group['event_type'] == 'login_failed').astype(int)
        group['failed_attempt_count'] = is_failed.rolling('60s').sum()
        
        # Request frequency (logs per minute)
        group['request_frequency'] = group['ip_address'].rolling('60s').count()
        
        # Unique ports accessed (5m window)
        # Using a custom function for unique count
        group['unique_ports_accessed'] = group['port_number'].rolling('300s').apply(lambda x: len(np.unique(x)), raw=False)
        
        processed_groups.append(group)

    # Combine back
    df = pd.concat(processed_groups).reset_index()

    # Select final features
    feature_cols = [
        'failed_attempt_count',
        'unique_ports_accessed',
        'request_frequency',
        'sql_flag',
        'time_gap',
        'label'
    ]

    ml_df = df[feature_cols].fillna(0)
    
    print(f"\nFeature Profile:")
    print(ml_df.describe().T[['mean', 'max', 'std']])
    
    # Save results
    ml_df.to_csv(output_csv, index=False)
    print(f"\nSaved {len(ml_df):,} feature rows to {output_csv}")

if __name__ == "__main__":
    perform_feature_engineering()
