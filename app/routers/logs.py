from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.services.ml_service import get_ml_service, MLService
from app.services.elasticsearch_service import get_es_service, ElasticsearchService

router = APIRouter()

class LogEntry(BaseModel):
    timestamp: str
    ip_address: str
    user_id: Optional[str] = None
    event_type: str
    port_number: Optional[int] = None
    status: Optional[str] = None
    request_payload: Optional[str] = None

@router.get("/")
async def get_logs(limit: int = 100, es: ElasticsearchService = Depends(get_es_service)):
    """
    Retrieves latest logs from Elasticsearch.
    """
    logs = es.get_latest_logs(limit=limit)
    return {
        "status": "success",
        "count": len(logs),
        "logs": logs
    }

@router.post("/ingest")
async def ingest_log(log: LogEntry, ml: MLService = Depends(get_ml_service)):
    """
    Ingests a single log and returns initial ML analysis.
    """
    try:
        prediction = ml.predict_log(log.dict())
        return {
            "status": "success",
            "log": log,
            "analysis": prediction
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
