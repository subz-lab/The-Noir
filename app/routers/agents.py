"""
Agents Router — Gap 1

API endpoints for the Agentic AI pipeline:
  POST /api/agents/process    — run the full agent pipeline on raw logs
  GET  /api/agents/status     — orchestrator + agent status snapshot
  GET  /api/agents/incidents  — correlated incidents from the engine
  GET  /api/agents/activity   — recent agent activity logs
  GET  /api/agents/incidents/{incident_id} — single incident detail
"""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Body, HTTPException, Query
from pydantic import BaseModel

from app.agents.orchestrator import get_orchestrator
from app.core.logger import app_logger
from app.services.correlation_service import get_correlation_service

router = APIRouter()


# ──────────────────────────────────────────────────────────────────────────── #
#  Request / Response schemas                                                   #
# ──────────────────────────────────────────────────────────────────────────── #

class ProcessLogsRequest(BaseModel):
    logs: List[Any]
    correlation_window: int = 300          # seconds
    generate_reports: bool = True


# ──────────────────────────────────────────────────────────────────────────── #
#  Endpoints                                                                    #
# ──────────────────────────────────────────────────────────────────────────── #

@router.post("/process")
async def process_logs(request: ProcessLogsRequest):
    """
    Run the full agentic pipeline:
      LogAnalysisAgent → ThreatInvestigationAgent

    Returns the complete pipeline result including enriched logs,
    correlated incidents, investigation reports, and SOAR actions.
    """
    if not request.logs:
        raise HTTPException(status_code=400, detail="No logs provided")

    app_logger.info(f"[AgentsRouter] Pipeline triggered: {len(request.logs)} raw logs")
    orchestrator = get_orchestrator()
    try:
        result = await orchestrator.process_logs(
            raw_logs=request.logs,
            correlation_window=request.correlation_window,
            generate_reports=request.generate_reports,
        )
        return result
    except Exception as e:
        app_logger.error(f"[AgentsRouter] Pipeline error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Agent pipeline error: {str(e)}")


@router.get("/status")
async def get_agent_status():
    """
    Returns the current status of both agents and the orchestrator,
    including last-run timestamps, tool registries, and run history.
    Useful for dashboard visualization of agent activity.
    """
    orchestrator = get_orchestrator()
    return orchestrator.status()


@router.get("/incidents")
async def list_incidents(limit: int = Query(default=50, ge=1, le=200)):
    """
    Returns all correlated incidents detected by the correlation engine,
    sorted by most recent. Each incident bundles related events that
    share the same source IP / attack pattern.
    """
    corr = get_correlation_service()
    incidents = corr.get_all_incidents(limit=limit)
    stats = corr.stats()
    return {
        "incidents": incidents,
        "total": len(incidents),
        "correlation_stats": stats,
    }


@router.get("/incidents/{incident_id}")
async def get_incident(incident_id: str):
    """
    Returns a single correlated incident by ID, including all bundled events.
    """
    corr = get_correlation_service()
    all_incidents = corr.get_all_incidents(limit=1000)
    for inc in all_incidents:
        if inc.get("incident_id") == incident_id:
            return inc
    raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found")


@router.get("/activity")
async def get_agent_activity():
    """
    Returns recent activity logs for both agents — what they observed,
    what tools they used, and what they reported. Useful for real-time
    dashboard panels showing agent thought processes.
    """
    orchestrator = get_orchestrator()
    return orchestrator.get_agent_activity()
