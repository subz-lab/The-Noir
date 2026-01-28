import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional

class StorageService:
    """
    Service for persistent storage of security reports and analysis data.
    Wraps log and report archival logic.
    """
    
    def __init__(self, reports_path="data/incident_reports.jsonl"):
        self.reports_path = reports_path
        # Ensure data directory exists relative to project root
        os.makedirs(os.path.dirname(self.reports_path), exist_ok=True)

    def save_incident_report(self, log_entry: Dict, ml_result: Dict, severity_data: Dict, report_markdown: str):
        """
        Formats and persists an incident report.
        """
        report_id = f"IR-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{log_entry.get('ip_address', 'unknown')}"
        
        record = {
            "report_id": report_id,
            "timestamp": datetime.now().isoformat(),
            "source_ip": log_entry.get('ip_address'),
            "event_type": log_entry.get('event_type'),
            "severity_label": severity_data.get('label'),
            "severity_score": severity_data.get('score'),
            "ml_confidence": ml_result.get('confidence'),
            "report_markdown": report_markdown,
            "raw_log": log_entry
        }
        
        try:
            with open(self.reports_path, 'a', encoding='utf-8') as f:
                f.write(json.dumps(record) + '\n')
            return report_id
        except Exception as e:
            # In a real app, log this error properly
            print(f"Error saving report: {e}")
            return None

    def get_all_reports(self) -> List[Dict]:
        """
        Retrieves all archived reports.
        """
        reports = []
        if not os.path.exists(self.reports_path):
            return reports
            
        try:
            with open(self.reports_path, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.strip():
                        reports.append(json.loads(line))
            # Return reversed so latest is first
            return reports[::-1]
        except Exception as e:
            print(f"Error reading reports: {e}")
            return []

    def get_report_by_id(self, report_id: str) -> Optional[Dict]:
        """
        Finds a specific report by ID.
        """
        reports = self.get_all_reports()
        for r in reports:
            if r.get('report_id') == report_id:
                return r
        return None

# Singleton instance
storage_service = StorageService()

def get_storage_service():
    return storage_service
