"""
Agent Orchestrator — Gap 1

Coordinates the two specialized agents:
  Agent 1: LogAnalysisAgent   — normalize + ML classify + feed correlator
  Agent 2: ThreatInvestigationAgent — correlate + score + report + SOAR

Communication pattern:
  Orchestrator → LogAnalysisAgent  (raw logs)
              ← enriched_logs + stats
  Orchestrator → ThreatInvestigationAgent (enriched_logs)
              ← incidents + investigations + soar_actions

The orchestrator exposes a single `process_logs()` entry point and
maintains a run-history for dashboard visualization.
"""

import asyncio
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.agents.log_analysis_agent import LogAnalysisAgent
from app.agents.threat_investigation_agent import ThreatInvestigationAgent
from app.core.logger import app_logger
from app.services.correlation_service import get_correlation_service


class AgentOrchestrator:
    """
    Master coordinator for the agentic AI SOC pipeline.

    Lifecycle:
      process_logs(raw_logs) →
        [LogAnalysisAgent]           logs normalized + classified
        [ThreatInvestigationAgent]   correlated + investigated + reported
      returns full pipeline result
    """

    def __init__(self):
        self.log_agent = LogAnalysisAgent()
        self.threat_agent = ThreatInvestigationAgent()
        self.run_history: List[Dict[str, Any]] = []
        self._max_history = 50
        app_logger.info("[Orchestrator] Initialized with 2 agents: LogAnalysisAgent, ThreatInvestigationAgent")

    # ------------------------------------------------------------------ #
    #  Primary entry point                                                 #
    # ------------------------------------------------------------------ #

    async def process_logs(
        self,
        raw_logs: List[Any],
        correlation_window: int = 300,
        generate_reports: bool = True,
    ) -> Dict[str, Any]:
        """
        Full agentic pipeline:
          1. LogAnalysisAgent  → normalize + ML classify
          2. ThreatInvestigationAgent → correlate + investigate + report + SOAR

        Returns a merged pipeline result dict suitable for API responses.
        """
        run_id = f"RUN-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}"
        started_at = datetime.now(timezone.utc).isoformat()
        app_logger.info(f"[Orchestrator] Starting pipeline run {run_id} with {len(raw_logs)} logs")

        # ── Step 1: Log Analysis Agent ──
        app_logger.info(f"[Orchestrator] -> Handing {len(raw_logs)} logs to LogAnalysisAgent")
        analysis_result = await self.log_agent.execute({"logs": raw_logs})

        enriched_logs: List[Dict] = analysis_result.get("enriched_logs", [])
        analysis_stats: Dict = analysis_result.get("stats", {})
        app_logger.info(f"[Orchestrator] <- LogAnalysisAgent complete: {analysis_stats}")

        # ── Step 2: Threat Investigation Agent ──
        app_logger.info("[Orchestrator] -> Handing enriched logs to ThreatInvestigationAgent")
        investigation_result = await self.threat_agent.execute({
            "enriched_logs": enriched_logs,
            "correlation_window": correlation_window,
            "generate_report_for_threats": generate_reports,
        })

        investigation_summary: Dict = investigation_result.get("summary", {})
        app_logger.info(f"[Orchestrator] <- ThreatInvestigationAgent complete: {investigation_summary}")

        # ── Build pipeline result ──
        completed_at = datetime.now(timezone.utc).isoformat()
        pipeline_result = {
            "run_id": run_id,
            "started_at": started_at,
            "completed_at": completed_at,
            "agents_used": [
                self.log_agent.status_snapshot(),
                self.threat_agent.status_snapshot(),
            ],
            "analysis": {
                "stats": analysis_stats,
                "enriched_logs": enriched_logs,
            },
            "investigation": {
                "incidents": investigation_result.get("incidents", []),
                "investigations": investigation_result.get("investigations", []),
                "soar_actions": investigation_result.get("soar_actions", []),
                "summary": investigation_summary,
            },
            "correlation_stats": get_correlation_service().stats(),
        }

        # Archive run
        self._archive_run(run_id, started_at, completed_at, analysis_stats, investigation_summary)
        return pipeline_result

    # ------------------------------------------------------------------ #
    #  Status / monitoring                                                 #
    # ------------------------------------------------------------------ #

    def status(self) -> Dict[str, Any]:
        """Current status of the orchestrator and its agents."""
        return {
            "orchestrator": "AgentOrchestrator",
            "agents": [
                self.log_agent.status_snapshot(),
                self.threat_agent.status_snapshot(),
            ],
            "run_history": self.run_history[-10:],
            "correlation_stats": get_correlation_service().stats(),
        }

    def get_incidents(self, limit: int = 50) -> List[Dict[str, Any]]:
        return get_correlation_service().get_all_incidents(limit=limit)

    def get_agent_activity(self) -> Dict[str, List[Dict[str, Any]]]:
        return {
            "log_analysis_agent": self.log_agent.activity_log[-20:],
            "threat_investigation_agent": self.threat_agent.activity_log[-20:],
        }

    # ------------------------------------------------------------------ #
    #  Helpers                                                             #
    # ------------------------------------------------------------------ #

    def _archive_run(
        self,
        run_id: str,
        started_at: str,
        completed_at: str,
        analysis_stats: Dict,
        investigation_summary: Dict,
    ) -> None:
        self.run_history.append({
            "run_id": run_id,
            "started_at": started_at,
            "completed_at": completed_at,
            "logs_processed": analysis_stats.get("total", 0),
            "threats_found": analysis_stats.get("threats", 0),
            "incidents_created": investigation_summary.get("new_incidents_correlated", 0),
            "reports_generated": investigation_summary.get("high_severity_reports_generated", 0),
            "soar_actions": investigation_summary.get("soar_actions_triggered", 0),
        })
        if len(self.run_history) > self._max_history:
            self.run_history.pop(0)


# ── Singleton ──
_orchestrator: Optional[AgentOrchestrator] = None

def get_orchestrator() -> AgentOrchestrator:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = AgentOrchestrator()
    return _orchestrator
