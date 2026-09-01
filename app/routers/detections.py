from fastapi import APIRouter, Depends, BackgroundTasks
from app.core.logger import app_logger
from app.schemas.report import GenerateReportRequest  # Reuse for now or create generic
from app.services.ml_service import get_ml_service, MLService
from app.services.soar_service import soar_service

router = APIRouter()

from app.services.buffer_service import get_buffer_service, BufferService

@router.get("/stats")
async def get_detection_stats(buffer: BufferService = Depends(get_buffer_service)):
    """
    Returns live summary statistics of ML detections from active buffer.
    """
    logs = buffer.live_logs
    threats = sum(1 for l in logs if l.get("label") == "Threat")
    suspicious = sum(1 for l in logs if l.get("label") == "Suspicious")
    confidences = [l.get("confidence", 0) for l in logs if l.get("confidence")]
    avg_conf = round(sum(confidences) / max(len(confidences), 1), 3) if confidences else 0.95

    return {
        "total_analyzed": len(logs),
        "total_threats": threats,
        "total_suspicious": suspicious,
        "average_confidence": avg_conf,
        "model_type": "RandomForest"
    }

@router.post("/predict")
async def predict_threat(request: dict, background_tasks: BackgroundTasks, ml: MLService = Depends(get_ml_service)):
    """
    Predicts threat level for a given log using the trained ML model, and triggers SOAR.
    """
    app_logger.debug(f"Standalone ML predict requested for IP: {request.get('ip_address')}")
    result = ml.predict_log(request)
    
    # Auto-trigger SOAR
    if result.get("severity_index", 0) > 0:
         detection_data = {**request, "prediction": result.get("label"), "severity_index": result.get("severity_index")}
         background_tasks.add_task(soar_service.check_and_trigger_playbooks, detection_data)
         
    return result
