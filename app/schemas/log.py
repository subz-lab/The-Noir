from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class LogEntry(BaseModel):
    """
    Schema for an incoming telemetry raw log.
    """
    timestamp: str
    ip_address: str
    user_id: Optional[str] = None
    event_type: str
    port_number: Optional[int] = None
    status: Optional[str] = None
    request_payload: Optional[str] = None

class BulkLogRequest(BaseModel):
    """
    Schema for batch ingestion from the Attack Simulator.
    """
    logs: List[LogEntry]
