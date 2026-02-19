import json
import os
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.services.ml_service import get_ml_service, MLService
from app.services.elasticsearch_service import get_es_service, ElasticsearchService

router = APIRouter()

LIVE_LOGS_PATH = "data/live_logs.jsonl"

def load_live_logs():
    logs = []
    if os.path.exists(LIVE_LOGS_PATH):
        try:
            with open(LIVE_LOGS_PATH, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        logs.append(json.loads(line))
        except Exception as e:
            print(f"Error loading live logs: {e}")
    return logs

def save_live_log(log_dict: dict):
    try:
        os.makedirs(os.path.dirname(LIVE_LOGS_PATH), exist_ok=True)
        with open(LIVE_LOGS_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(log_dict) + "\n")
    except Exception as e:
        print(f"Error saving live log: {e}")

def save_live_logs_batch(log_dicts: list):
    try:
        os.makedirs(os.path.dirname(LIVE_LOGS_PATH), exist_ok=True)
        with open(LIVE_LOGS_PATH, "a", encoding="utf-8") as f:
            for log_dict in log_dicts:
                f.write(json.dumps(log_dict) + "\n")
    except Exception as e:
        print(f"Error saving live logs batch: {e}")

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                # Connection might be dead
                pass

manager = ConnectionManager()

class LogEntry(BaseModel):
    timestamp: str
    ip_address: str
    user_id: Optional[str] = None
    event_type: str
    port_number: Optional[int] = None
    status: Optional[str] = None
    request_payload: Optional[str] = None

class BulkLogRequest(BaseModel):
    logs: List[LogEntry]

# Mock storage for live demo
LIVE_LOGS = load_live_logs()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@router.get("/")
async def get_logs(limit: int = 100, es: ElasticsearchService = Depends(get_es_service)):
    """
    Retrieves latest logs from Elasticsearch (or in-memory buffer if ES is offline).
    """
    es_connected = False
    try:
        logs = es.get_latest_logs(limit=limit)
        if logs:
            es_connected = True
        else:
            # Fallback to in-memory buffer for newly ingested logs
            logs = LIVE_LOGS[-limit:]
    except Exception:
        # Fallback to in-memory if ES fails
        logs = LIVE_LOGS[-limit:]
        
    return {
        "status": "success",
        "count": len(logs),
        "logs": sorted(logs, key=lambda x: x.get('timestamp', ''), reverse=True),
        "metadata": {
            "es_connected": es_connected,
            "persistence": True,
            "mode": "Live Inference" if not es_connected else "Full SOC"
        }
    }

@router.post("/ingest")
async def ingest_log(log: LogEntry, ml: MLService = Depends(get_ml_service)):
    """
    Ingests a single log, performs ML analysis, and stores it in the live buffer.
    """
    try:
        # Perform ML analysis
        prediction = ml.predict_log(log.dict())
        
        # Merge log data with ML analysis
        enriched_log = log.dict()
        enriched_log.update({
            "label": prediction.get("label"),
            "severity_index": prediction.get("severity_index"),
            "confidence": prediction.get("confidence")
        })
        
        # Store in live buffer and persist
        LIVE_LOGS.append(enriched_log)
        if len(LIVE_LOGS) > 1000: LIVE_LOGS.pop(0) 
        save_live_log(enriched_log)
        
        # Broadcast to all connected clients
        await manager.broadcast({"type": "NEW_LOG", "log": enriched_log})
        
        return {
            "status": "success",
            "log": enriched_log,
            "analysis": prediction
        }
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bulk-ingest")
async def bulk_ingest_logs(request: BulkLogRequest, ml: MLService = Depends(get_ml_service)):
    """
    Ingests multiple logs for simulation speed.
    """
    results = []
    enriched_logs = []
    for log in request.logs:
        try:
            prediction = ml.predict_log(log.dict())
            enriched_log = log.dict()
            enriched_log.update({
                "label": prediction.get("label"),
                "severity_index": prediction.get("severity_index"),
                "confidence": prediction.get("confidence")
            })
            LIVE_LOGS.append(enriched_log)
            enriched_logs.append(enriched_log)
            results.append(prediction)
        except Exception as e:
            print(f"Error ingesting log in bulk: {e}")

    # Persist in one batch (MUCH FASTER)
    if enriched_logs:
        save_live_logs_batch(enriched_logs)
            
    # Broadcast bulk update
    if results:
        await manager.broadcast({
            "type": "BULK_LOGS", 
            "count": len(results),
            "last_analysis": results[-1] if results else None
        })
        
    # Keep buffer capped
    if len(LIVE_LOGS) > 1000:
        del LIVE_LOGS[:-1000]
        
    return {
        "status": "success",
        "processed": len(results),
        "last_analysis": results[-1] if results else None
    }
