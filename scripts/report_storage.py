import json
import os
from datetime import datetime

class ReportStorage:
    """
    Handles persistence of AI-generated incident reports.
    Stores reports in a JSONL file for easy dashboard access and analysis.
    """
    
    def __init__(self, storage_path="data/incident_reports.jsonl"):
        self.storage_path = storage_path
        # Ensure data directory exists
        os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)

    def save_report(self, log_entry, ml_result, severity_data, report_content):
        """
        Saves a single report with its associated metadata.
        """
        report_id = f"IR-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{log_entry.get('ip_address', 'unknown')}"
        
        report_data = {
            "report_id": report_id,
            "timestamp": datetime.now().isoformat(),
            "log_data": log_entry,
            "ml_analysis": ml_result,
            "severity_assessment": severity_data,
            "report_markdown": report_content
        }
        
        try:
            with open(self.storage_path, 'a', encoding='utf-8') as f:
                f.write(json.dumps(report_data) + '\n')
            print(f"Report {report_id} saved to {self.storage_path}")
            return report_id
        except Exception as e:
            print(f"Error saving report: {e}")
            return None

    def get_all_reports(self):
        """
        Reads all saved reports.
        """
        reports = []
        if not os.path.exists(self.storage_path):
            return reports
            
        try:
            with open(self.storage_path, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.strip():
                        reports.append(json.loads(line))
        except Exception as e:
            print(f"Error reading reports: {e}")
        
        return reports

if __name__ == "__main__":
    # Test Block
    storage = ReportStorage("data/test_reports.jsonl")
    storage.save_report(
        {"ip_address": "1.1.1.1"},
        {"label": 2},
        {"score": 90, "label": "CRITICAL"},
        "# Mock Report"
    )
    print(f"Total test reports: {len(storage.get_all_reports())}")
