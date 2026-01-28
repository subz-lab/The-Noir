from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.services.storage_service import get_storage_service, StorageService
from app.services.llm_service import get_llm_service, LLMService

router = APIRouter()

class GenerateReportRequest(BaseModel):
    log_data: dict
    ml_result: dict

@router.get("/")
async def list_reports(storage: StorageService = Depends(get_storage_service)):
    """
    Lists all archived AI-generated incident reports.
    """
    return storage.get_all_reports()

@router.get("/{report_id}")
async def get_report(report_id: str, storage: StorageService = Depends(get_storage_service)):
    """
    Retrieves a specific incident report by ID.
    """
    report = storage.get_report_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@router.post("/generate")
async def generate_new_report(
    request: GenerateReportRequest, 
    llm: LLMService = Depends(get_llm_service),
    storage: StorageService = Depends(get_storage_service)
):
    """
    Triggers LLM analyst to generate and save a new report.
    """
    # 1. Calculate Severity
    severity = llm.calculate_severity(request.ml_result, request.log_data)
    
    # 2. Generate Report
    markdown_content = await llm.generate_incident_report(request.log_data, request.ml_result, severity)
    
    # 3. Store Report
    report_id = storage.save_incident_report(request.log_data, request.ml_result, severity, markdown_content)
    
    return {
        "report_id": report_id,
        "severity": severity,
        "markdown": markdown_content
    }
