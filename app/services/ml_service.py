import json
import pickle
import pandas as pd
import numpy as np
import re
import os
from datetime import datetime, timedelta
from collections import defaultdict, deque
from typing import Dict, Any, Optional

class MLService:
    """
    Service layer for ML-based threat detection.
    Maintains state for rolling window feature extraction across API requests.
    """
    
    def __init__(self, model_path="app/models/threat_model.pkl", metadata_path="app/models/model_metadata.pkl"):
        # Load model and metadata
        if not os.path.exists(model_path) or not os.path.exists(metadata_path):
            raise FileNotFoundError(f"Model files not found at {model_path} or {metadata_path}")
            
        with open(model_path, 'rb') as f:
            self.model = pickle.load(f)
            
        with open(metadata_path, 'rb') as f:
            self.metadata = pickle.load(f)
            self.feature_cols = self.metadata['feature_cols']
            
        # State storage per IP (Thread-safety should be considered for high concurrecy)
        self.failed_logins = defaultdict(lambda: deque())
        self.ports_accessed = defaultdict(lambda: deque())
        self.request_times = defaultdict(lambda: deque())
        self.last_event_time = {} # ip -> last_timestamp
        
        self.sql_pattern = r"(?i)(OR\s+['\"]?\d|DROP\s+TABLE|UNION\s+SELECT|--|admin['\"]--|SELECT\s+\*\s+FROM|' OR '1'='1|' OR 'a'='a)"

    def _cleanup_state(self, ip: str, current_ts: datetime):
        """Remove old data points outside the feature windows."""
        min_1_ago = current_ts - timedelta(minutes=1)
        while self.failed_logins[ip] and self.failed_logins[ip][0] < min_1_ago:
            self.failed_logins[ip].popleft()
            
        while self.request_times[ip] and self.request_times[ip][0] < min_1_ago:
            self.request_times[ip].popleft()
            
        min_5_ago = current_ts - timedelta(minutes=5)
        while self.ports_accessed[ip] and self.ports_accessed[ip][0][0] < min_5_ago:
            self.ports_accessed[ip].popleft()

    def predict_log(self, log: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processes a raw log entry and returns an ML prediction.
        """
        ip = log.get('ip_address', 'unknown')
        ts_str = log.get('timestamp')
        if not ts_str:
            ts = datetime.now()
        else:
            ts = datetime.fromisoformat(ts_str.replace('Z', ''))
            
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
        
        # Predict
        X = pd.DataFrame([feature_data])[self.feature_cols]
        prediction = self.model.predict(X)[0]
        probabilities = self.model.predict_proba(X)[0]
        confidence = float(np.max(probabilities))
        
        label_map = {0: "Normal", 1: "Suspicious", 2: "Threat"}
        
        return {
            "label": label_map.get(int(prediction), "Unknown"),
            "severity_index": int(prediction),
            "confidence": confidence,
            "features": feature_data
        }

# Singleton instance for the app
ml_service = None

def get_ml_service():
    global ml_service
    if ml_service is None:
        # Paths relative to project root
        ml_service = MLService()
    return ml_service
