import json
import os
from datetime import datetime
from typing import List, Dict, Optional

from app.core.config import settings
from app.core.logger import app_logger

class StorageService:
    """
    Service for persistent storage of security reports and analysis data.
    """
    
    def __init__(self):
        # Ensure data directory exists
        os.makedirs(os.path.dirname(settings.REPORTS_PATH), exist_ok=True)
        app_logger.info("StorageService initialized")

    def save_incident_report(self, log_entry: Dict, ml_result: Dict, severity_data: Dict, report_markdown: str):
        """Formats and persists an incident report."""
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
            with open(settings.REPORTS_PATH, 'a', encoding='utf-8') as f:
                f.write(json.dumps(record) + '\n')
            app_logger.debug(f"Successfully saved report to disk: {report_id}")
            return report_id
        except Exception as e:
            app_logger.error(f"IO Error saving report {report_id}: {e}", exc_info=True)
            return None

    def get_all_reports(self) -> List[Dict]:
        """Retrieves all archived reports."""
        reports = []
        if not os.path.exists(settings.REPORTS_PATH):
            app_logger.debug(f"Reports path {settings.REPORTS_PATH} does not exist yet. Returning empty list.")
            return reports
            
        try:
            with open(settings.REPORTS_PATH, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.strip():
                        reports.append(json.loads(line))
            # Return reversed so latest is first
            return reports[::-1]
        except Exception as e:
            app_logger.error(f"Error reading reports from disk: {e}", exc_info=True)
            return []

    def get_report_by_id(self, report_id: str) -> Optional[Dict]:
        """Finds a specific report by ID."""
        reports = self.get_all_reports()
        for r in reports:
            if r.get('report_id') == report_id:
                return r
        app_logger.warning(f"Could not locate report by ID: {report_id}")
        return None

# Singleton instance
storage_service = StorageService()

def get_storage_service():
    return storage_service
