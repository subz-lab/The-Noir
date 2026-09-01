from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Dict, Any

from app.schemas.soar import Playbook, PlaybookCreate, ActionLog
from app.services.soar_service import soar_service
from app.core.logger import app_logger

router = APIRouter()

@router.get("/playbooks", response_model=List[Playbook])
async def get_playbooks():
    """Get all playbooks."""
    return soar_service.get_playbooks()

@router.post("/playbooks", response_model=Playbook)
async def create_playbook(playbook_in: PlaybookCreate):
    """Create a new playbook."""
    return soar_service.create_playbook(playbook_in)

@router.delete("/playbooks/{playbook_id}")
async def delete_playbook(playbook_id: str):
    """Delete a playbook."""
    if playbook_id in soar_service.playbooks:
        del soar_service.playbooks[playbook_id]
        return {"status": "success", "message": f"Playbook {playbook_id} deleted"}
    raise HTTPException(status_code=404, detail="Playbook not found")

@router.post("/playbooks/{playbook_id}/execute", response_model=List[ActionLog])
async def execute_playbook(playbook_id: str, incident_data: Dict[str, Any]):
    """Manually execute a playbook against an incident."""
    try:
        logs = soar_service.execute_playbook(playbook_id, incident_data)
        return logs
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/actions/history", response_model=List[ActionLog])
async def get_action_history(limit: int = 50):
    """Get history of executed automated actions."""
    return soar_service.get_action_history(limit)
