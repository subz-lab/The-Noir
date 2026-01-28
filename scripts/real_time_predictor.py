import json
import pickle
import pandas as pd
import numpy as np
import re
import os
import time
from datetime import datetime, timedelta
from collections import defaultdict, deque

class RealTimePredictor:
    def __init__(self, model_path="models/threat_model.pkl", metadata_path="models/model_metadata.pkl"):
        print(f"Loading model from {model_path}...")
        with open(model_path, 'rb') as f:
            self.model = pickle.load(f)
        
        with open(metadata_path, 'rb') as f:
            self.metadata = pickle.load(f)
            self.feature_cols = self.metadata['feature_cols']
        
        # State storage per IP
        # Format: { ip: deque([timestamps]) }
        self.failed_logins = defaultdict(lambda: deque())
        self.ports_accessed = defaultdict(lambda: deque()) # deque of (timestamp, port)
        self.request_times = defaultdict(lambda: deque())
        self.last_event_time = {} # ip -> last_timestamp
        
        self.sql_pattern = r"(?i)(OR\s+['\"]?\d|DROP\s+TABLE|UNION\s+SELECT|--|admin['\"]--|SELECT\s+\*\s+FROM|' OR '1'='1|' OR 'a'='a)"
        
    def _parse_timestamp(self, ts_str):
        return datetime.fromisoformat(ts_str.replace('Z', ''))

    def _cleanup_state(self, ip, current_ts):
        """Remove old data points outside the feature windows."""
        # 1-minute window for failed logins and frequency
        min_1_ago = current_ts - timedelta(minutes=1)
        while self.failed_logins[ip] and self.failed_logins[ip][0] < min_1_ago:
            self.failed_logins[ip].popleft()
            
        while self.request_times[ip] and self.request_times[ip][0] < min_1_ago:
            self.request_times[ip].popleft()
            
        # 5-minute window for unique ports
        min_5_ago = current_ts - timedelta(minutes=5)
        while self.ports_accessed[ip] and self.ports_accessed[ip][0][0] < min_5_ago:
            self.ports_accessed[ip].popleft()

    def predict_single(self, log):
        """Process a single log and return prediction."""
        ip = log.get('ip_address')
        ts = self._parse_timestamp(log.get('timestamp'))
        event_type = log.get('event_type')
        port = log.get('port_number')
        payload = str(log.get('request_payload') or "")

        # Update state
        self._cleanup_state(ip, ts)
        self.request_times[ip].append(ts)
        
        if event_type == 'login_failed':
            self.failed_logins[ip].append(ts)
        
        if port:
            self.ports_accessed[ip].append((ts, port))

        # Calculate Features
        sql_flag = 1 if re.search(self.sql_pattern, payload) else 0
        
        time_gap = 0
        if ip in self.last_event_time:
            time_gap = (ts - self.last_event_time[ip]).total_seconds()
        self.last_event_time[ip] = ts

        failed_attempt_count = len(self.failed_logins[ip])
        request_frequency = len(self.request_times[ip])
        unique_ports = len(set(p for _, p in self.ports_accessed[ip]))

        # Prepare feature vector
        feature_data = {
            'failed_attempt_count': failed_attempt_count,
            'unique_ports_accessed': unique_ports,
            'request_frequency': request_frequency,
            'sql_flag': sql_flag,
            'time_gap': time_gap
        }
        
        # Ensure correct order and format
        X = pd.DataFrame([feature_data])[self.feature_cols]
        
        # Predict
        prediction = self.model.predict(X)[0]
        probabilities = self.model.predict_proba(X)[0]
        confidence = float(np.max(probabilities))
        
        return {
            'label': int(prediction),
            'confidence': confidence,
            'features': feature_data
        }

def tail_file(filename):
    """Wait for and yield new lines from a file."""
    with open(filename, 'r', encoding='utf-8', errors='ignore') as f:
        # Move to end of file initially or start? 
        # For demo, let's process the last few lines then wait.
        f.seek(0, os.SEEK_END)
        while True:
            line = f.readline()
            if not line:
                time.sleep(0.1)
                continue
            yield line

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Real-Time Threat Predictor')
    parser.add_argument('-f', '--file', default='data/server_logs.jsonl', help='Log file to monitor')
    args = parser.parse_args()

    predictor = RealTimePredictor()
    
    print(f"\nMonitoring {args.file} for new logs...")
    print("-" * 80)
    print(f"{'TIMESTAMP':25} | {'IP':15} | {'PREDICTION':12} | {'CONFIDENCE':10}")
    print("-" * 80)

    try:
        for line in tail_file(args.file):
            try:
                log = json.loads(line)
                result = predictor.predict_single(log)
                
                label_map = {0: "Normal", 1: "Suspicious", 2: "THREAT"}
                color_map = {0: "", 1: "\033[93m", 2: "\033[91m"} # Yellow, Red (if supported)
                reset = "\033[0m"

                prediction_text = label_map[result['label']]
                
                # Highlight threats
                if result['label'] >= 1:
                    print(f"{log['timestamp']:25} | {log['ip_address']:15} | {color_map[result['label']]}{prediction_text:12}{reset} | {result['confidence']:.2%}")
                    if result['label'] == 2:
                        print(f"  └─ Reason: {result['features']}")
                
            except json.JSONDecodeError:
                continue
    except KeyboardInterrupt:
        print("\nStopping monitor...")

if __name__ == "__main__":
    main()
