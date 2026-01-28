import json
from datetime import datetime

class ThreatSummaryFormatter:
    """
    Converts raw threat log data and ML predictions into a 
    clean, structured summary for LLM prompt context.
    """
    
    @staticmethod
    def format_threat_context(log_entry, ml_result=None):
        """
        Creates a structured text snapshot of a security event.
        
        Args:
            log_entry (dict): The raw log data.
            ml_result (dict, optional): ML prediction output (label, confidence, features).
        """
        severity_map = {0: "LOW (Normal)", 1: "MEDIUM (Suspicious)", 2: "HIGH (THREAT)"}
        
        timestamp = log_entry.get('timestamp', 'N/A')
        ip = log_entry.get('ip_address', 'N/A')
        user = log_entry.get('user_id', 'Unknown')
        event = log_entry.get('event_type', 'N/A')
        port = log_entry.get('port_number', 'N/A')
        payload = log_entry.get('request_payload', 'None')
        status = log_entry.get('status', 'N/A')
        
        summary = []
        summary.append("=== SECURITY EVENT SNAPSHOT ===")
        summary.append(f"Timestamp: {timestamp}")
        summary.append(f"Source IP: {ip}")
        summary.append(f"User ID:   {user}")
        summary.append(f"Event:     {event.upper()} ({status})")
        summary.append(f"Port:      {port}")
        summary.append(f"Payload:   {payload}")
        
        if ml_result:
            label = ml_result.get('label', 0)
            conf = ml_result.get('confidence', 0.0)
            feats = ml_result.get('features', {})
            
            summary.append("\n=== AI ANALYST DETECTION ===")
            summary.append(f"Classification: {severity_map.get(label, 'Unknown')}")
            summary.append(f"Confidence:     {conf:.2%}")
            
            if feats:
                summary.append("\nBehavioral Evidence:")
                summary.append(f"- Failed Logins (1m): {feats.get('failed_attempt_count', 0)}")
                summary.append(f"- Port Variety (5m):  {feats.get('unique_ports_accessed', 0)}")
                summary.append(f"- Req Frequency/min:  {feats.get('request_frequency', 0)}")
                summary.append(f"- SQL Payload Flag:   {'Detected' if feats.get('sql_flag') else 'None'}")
                summary.append(f"- Heartbeat (Gap):    {feats.get('time_gap', 0)}s since last event")
        
        summary.append("\n===============================")
        
        return "\n".join(summary)

# Example Usage & Test
if __name__ == "__main__":
    test_log = {
        "timestamp": "2026-01-28T21:00:45Z",
        "ip_address": "185.144.143.34",
        "user_id": "root",
        "event_type": "login_failed",
        "port_number": 22,
        "status": "failed",
        "request_payload": None
    }
    
    test_ml = {
        "label": 2,
        "confidence": 0.9845,
        "features": {
            "failed_attempt_count": 15,
            "unique_ports_accessed": 1,
            "request_frequency": 30,
            "sql_flag": 0,
            "time_gap": 0.5
        }
    }
    
    formatter = ThreatSummaryFormatter()
    formatted_text = formatter.format_threat_context(test_log, test_ml)
    print(formatted_text)
