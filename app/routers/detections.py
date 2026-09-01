from fastapi import APIRouter, Depends, BackgroundTasks
from app.core.logger import app_logger
from app.schemas.report import GenerateReportRequest  # Reuse for now or create generic
from app.services.ml_service import get_ml_service, MLService
from app.services.soar_service import soar_service

router = APIRouter()

@router.get("/stats")
async def get_detection_stats():
    """
    Returns summary statistics of ML detections.
    """
    return {"total_threats": 0, "accuracy_baseline": 0.97, "model_type": "RandomForest"}

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
