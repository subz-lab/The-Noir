from pydantic import BaseModel
from typing import Dict, Any, Optional

class GenerateReportRequest(BaseModel):
    """
    Schema for requesting the LLM to write a forensic incident report.
    """
    log_data: Dict[str, Any]
    ml_result: Dict[str, Any]
