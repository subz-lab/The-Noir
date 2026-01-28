"""
Rule-Based Detection Engine
===========================
Applies heuristic rules to label security logs:
- 0: Normal
- 1: Suspicious (Port scanning behavior)
- 2: Threat (Brute force, SQL Injection)
"""

import json
import os
from datetime import datetime, timedelta
from collections import defaultdict
import re

class RuleBasedDetector:
    def __init__(self, log_path: str = "data/server_logs.jsonl"):
        self.log_path = log_path
        self.sql_patterns = [
            r"(?i)(OR\s+['\"]?\d|DROP\s+TABLE|UNION\s+SELECT|--|admin['\"]--|SELECT\s+\*\s+FROM|' OR '1'='1|' OR 'a'='a)"
        ]
        
    def _parse_timestamp(self, ts_str):
        try:
            return datetime.fromisoformat(ts_str.replace('Z', ''))
        except (ValueError, TypeError):
            return datetime.now()

    def detect(self, output_path: str = "data/labeled_logs.jsonl"):
        print(f"Reading logs from {self.log_path}...")
        
        if not os.path.exists(self.log_path):
            print(f"Error: {self.log_path} not found.")
            return

        # State for window-based rules
        ip_failed_logins = defaultdict(list)
        ip_ports_accessed = defaultdict(set)
        
        counts = {0: 0, 1: 0, 2: 0}
        labeled_logs = []

        # Try multiple encodings
        encodings = ['utf-8', 'utf-16', 'utf-16-le', 'utf-16-be']
        success = False
        
        for enc in encodings:
            try:
                with open(self.log_path, 'r', encoding=enc) as f:
                    # Test read
                    f.readline()
                current_encoding = enc
                success = True
                break
            except Exception:
                continue
        
        if not success:
            print("Failed to detect file encoding. Attempting with errors='ignore'...")
            current_encoding = 'utf-8'

        with open(self.log_path, 'r', encoding=current_encoding, errors='ignore') as f:
            for line in f:
                if not line.strip(): continue
                try:
                    log = json.loads(line)
                except json.JSONDecodeError:
                    continue
                
                label = 0
                reason = "Normal activity"
                
                ip = log.get("ip_address")
                ts_str = log.get("timestamp")
                if not ts_str: continue
                ts = self._parse_timestamp(ts_str)
                payload = str(log.get("request_payload") or "")
                event_type = log.get("event_type")
                port = log.get("port_number")

                # --- Rule 1: SQL Injection ---
                for pattern in self.sql_patterns:
                    if re.search(pattern, payload):
                        label = 2
                        reason = "SQL Injection pattern detected"
                        break

                if label < 2:
                    # --- Rule 2: Brute Force ---
                    if event_type == "login_failed":
                        ip_failed_logins[ip].append(ts)
                        ip_failed_logins[ip] = [t for t in ip_failed_logins[ip] if ts - t <= timedelta(minutes=1)]
                        
                        if len(ip_failed_logins[ip]) >= 10:
                            label = 2
                            reason = f"Brute force detected (>10 failed logins in 1m from {ip})"

                if label < 1:
                    # --- Rule 3: Suspicious Port Activity ---
                    if port:
                        ip_ports_accessed[ip].add(port)
                        if len(ip_ports_accessed[ip]) >= 20:
                            label = 1
                            reason = f"Suspicious port scanning (>20 unique ports from {ip})"

                log["label"] = label
                log["detection_reason"] = reason
                labeled_logs.append(log)
                counts[label] += 1

        print(f"\nDetection Complete! (Using encoding: {current_encoding})")
        print(f"-------------------")
        print(f"Normal (0):     {counts[0]:>8,}")
        print(f"Suspicious (1): {counts[1]:>8,}")
        print(f"Threat (2):     {counts[2]:>8,}")
        print(f"Total Logs:     {len(labeled_logs):>8,}")

        print(f"\nSaving results to {output_path}...")
        with open(output_path, 'w', encoding='utf-8') as f:
            for log in labeled_logs:
                f.write(json.dumps(log) + '\n')
        
        return counts

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='Rule-Based Threat Detector')
    parser.add_argument('-i', '--input', default='data/server_logs.jsonl', help='Input JSONL file')
    parser.add_argument('-o', '--output', default='data/labeled_logs.jsonl', help='Output JSONL file')
    
    args = parser.parse_args()
    
    detector = RuleBasedDetector(log_path=args.input)
    detector.detect(output_path=args.output)
