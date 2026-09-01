import traceback
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, WebSocket, WebSocketDisconnect
from typing import Dict, Any

from app.core.config import settings
from app.core.logger import app_logger
from app.schemas.log import LogEntry, BulkLogRequest
from app.services.ml_service import get_ml_service, MLService
from app.services.elasticsearch_service import get_es_service, ElasticsearchService
from app.services.buffer_service import get_buffer_service, BufferService
from app.services.soar_service import soar_service

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, buffer_service: BufferService = Depends(get_buffer_service)):
    """Handles real-time SSE connecting via WebSockets to stream telemetry."""
    await buffer_service.manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        buffer_service.manager.disconnect(websocket)
    except Exception as e:
        app_logger.error(f"WebSocket error: {e}", exc_info=True)

@router.get("/")
async def get_logs(
    limit: int = 100, 
    es: ElasticsearchService = Depends(get_es_service),
    buffer_service: BufferService = Depends(get_buffer_service)
):
    """
    Retrieves latest logs from Elasticsearch (or in-memory sliding window if ES is offline).
    """
    es_connected = False
    try:
        if es.client:
             logs = es.get_latest_logs(limit=limit)
             es_connected = True
        else:
             logs = buffer_service.get_recent_logs(limit)
    except Exception as e:
        app_logger.warning(f"Elasticsearch query failed, falling back to memory buffer. Reason: {e}")
        logs = buffer_service.get_recent_logs(limit)
        
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
async def ingest_log(
    log: LogEntry, 
    background_tasks: BackgroundTasks,
    ml: MLService = Depends(get_ml_service),
    buffer_service: BufferService = Depends(get_buffer_service)
):
    """
    Ingests a single log from an agent/API, performs ML analysis, stores in buffer, and broadcasts.
    """
    try:
        prediction = ml.predict_log(log.model_dump())
        
        enriched_log = log.model_dump()
        enriched_log.update({
            "label": prediction.get("label"),
            "severity_index": prediction.get("severity_index"),
            "confidence": prediction.get("confidence"),
            "features": prediction.get("features", {})
        })
        
        # Abstracted state mutation
        buffer_service.add_log(enriched_log)
        
        # Broadcast
        await buffer_service.manager.broadcast({"type": "NEW_LOG", "log": enriched_log})
        
        app_logger.info(f"Ingested single log: {log.ip_address} | {prediction.get('label')}")
        
        # Auto-trigger SOAR
        if prediction.get("severity_index", 0) > 0:
             background_tasks.add_task(soar_service.check_and_trigger_playbooks, enriched_log)
        
        return {
            "status": "success",
            "log": enriched_log,
            "analysis": prediction
        }
    except Exception as e:
        app_logger.error(f"Error ingesting log: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bulk-ingest")
async def bulk_ingest_logs(
    request: BulkLogRequest, 
    background_tasks: BackgroundTasks,
    ml: MLService = Depends(get_ml_service),
    buffer_service: BufferService = Depends(get_buffer_service)
):
    """
    Ingests multiple logs simultaneously (used by Attack Simulator).
    """
    results = []
    enriched_logs = []
    
    app_logger.info(f"Starting bulk ingestion of {len(request.logs)} logs")
    
    for log in request.logs:
        try:
            prediction = ml.predict_log(log.model_dump())
            enriched_log = log.model_dump()
            enriched_log.update({
                "label": prediction.get("label"),
                "severity_index": prediction.get("severity_index"),
                "confidence": prediction.get("confidence"),
                "features": prediction.get("features", {})
            })
            enriched_logs.append(enriched_log)
            results.append(prediction)
            
            # Auto-trigger SOAR
            if prediction.get("severity_index", 0) > 0:
                 background_tasks.add_task(soar_service.check_and_trigger_playbooks, enriched_log)
                 
        except Exception as e:
            app_logger.error(f"Error predicting on bulk log: {e}", exc_info=True)

    if enriched_logs:
        # Abstracted batch saving
        buffer_service.add_batch(enriched_logs)
            
    if results:
        await buffer_service.manager.broadcast({
            "type": "BULK_LOGS", 
            "count": len(results),
            "last_analysis": results[-1] if results else None
        })
        
    app_logger.info(f"Completed bulk ingestion of {len(results)} logs")
        
    return {
        "status": "success",
        "processed": len(results),
        "last_analysis": results[-1] if results else None
    }
