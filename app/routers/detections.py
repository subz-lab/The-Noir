from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.services.ml_service import get_ml_service, MLService

router = APIRouter()

class DetectionRequest(BaseModel):
    log_data: dict

@router.get("/stats")
async def get_detection_stats():
    """
    Returns summary statistics of ML detections.
    """
    return {"total_threats": 0, "accuracy_baseline": 0.97, "model_type": "RandomForest"}

@router.post("/predict")
async def predict_threat(request: DetectionRequest, ml: MLService = Depends(get_ml_service)):
    """
    Predicts threat level for a given log using the trained ML model.
    """
    result = ml.predict_log(request.log_data)
    return result
