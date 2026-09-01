"""
Threat Investigation Agent — Gap 1 + Gap 2 integration

Specialized agent responsible for:
  1. Receiving enriched logs from LogAnalysisAgent (via Orchestrator)
  2. Running event correlation to detect multi-event incidents
  3. Calculating granular severity scores (LLMService)
  4. Generating forensic incident reports
  5. Triggering SOAR playbook execution for high-severity events
  6. Returning a structured investigation result
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.agents.base_agent import AgentTool, BaseAgent
from app.core.logger import app_logger
from app.services.correlation_service import get_correlation_service
from app.services.llm_service import get_llm_service
from app.services.soar_service import soar_service
from app.services.storage_service import get_storage_service


class ThreatInvestigationAgent(BaseAgent):
    """
    Agent 2: Threat Investigation Agent

    Decision loop:
      OBSERVE  → receive enriched logs + correlation window
      THINK    → run event correlation, identify incidents
      ACT      → score severity, generate report, trigger SOAR
      REPORT   → return investigation summary
    """

    def __init__(self):
        super().__init__(
            name="ThreatInvestigationAgent",
            role=(
                "Correlates related security events into Incidents, assigns "
                "granular severity scores, generates forensic reports with "
                "evidence-backed explanations, and triggers automated SOAR responses."
            ),
        )

    # ------------------------------------------------------------------ #
    #  Tool registration                                                   #
    # ------------------------------------------------------------------ #

    def setup_tools(self) -> None:
        self.register_tool(AgentTool(
            name="correlate_events",
            description="Run the correlation engine to detect multi-event incidents",
            fn=self._tool_correlate,
        ))
        self.register_tool(AgentTool(
            name="score_severity",
            description="Calculate granular severity score for a single enriched log",
            fn=self._tool_score_severity,
        ))
        self.register_tool(AgentTool(
            name="generate_report",
            description="Generate a markdown forensic incident report via LLMService",
            fn=self._tool_generate_report,
        ))
        self.register_tool(AgentTool(
            name="trigger_soar",
            description="Trigger SOAR playbooks for high-severity detections",
            fn=self._tool_trigger_soar,
        ))
        self.register_tool(AgentTool(
            name="save_report",
            description="Persist an incident report to StorageService",
            fn=self._tool_save_report,
        ))

    # ------------------------------------------------------------------ #
    #  Tool implementations                                                #
    # ------------------------------------------------------------------ #

    def _tool_correlate(self, window_seconds: int = 300) -> List[Dict[str, Any]]:
        svc = get_correlation_service()
        incidents = svc.correlate_recent(window_seconds=window_seconds)
        return [i.to_dict() for i in incidents]

    def _tool_score_severity(
        self, enriched_log: Dict[str, Any], ml_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        llm = get_llm_service()
        return llm.calculate_severity(ml_result, enriched_log)

    async def _tool_generate_report(
        self,
        log_entry: Dict[str, Any],
        ml_result: Dict[str, Any],
        severity_data: Dict[str, Any],
    ) -> str:
        llm = get_llm_service()
        return await llm.generate_incident_report(log_entry, ml_result, severity_data)

    def _tool_trigger_soar(self, detection: Dict[str, Any]) -> List[Dict[str, Any]]:
        try:
            logs = soar_service.check_and_trigger_playbooks(detection)
            return [log.dict() if hasattr(log, "dict") else dict(log) for log in logs]
        except Exception as e:
            app_logger.warning(f"[ThreatInvestigationAgent] SOAR trigger error: {e}")
            return []

    def _tool_save_report(
        self,
        log_entry: Dict[str, Any],
        ml_result: Dict[str, Any],
        severity_data: Dict[str, Any],
        report_markdown: str,
    ) -> Optional[str]:
        storage = get_storage_service()
        return storage.save_incident_report(log_entry, ml_result, severity_data, report_markdown)

    # ------------------------------------------------------------------ #
    #  Decision loop                                                       #
    # ------------------------------------------------------------------ #

    async def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        payload: {
            "enriched_logs": [...],          # from LogAnalysisAgent
            "correlation_window": 300,       # optional, seconds
            "generate_report_for_threats": True  # optional
        }
        Returns: {
            "incidents": [...],
            "investigations": [...],
            "soar_actions": [...],
            "summary": {...}
        }
        """
        enriched_logs: List[Dict] = payload.get("enriched_logs", [])
        correlation_window: int = payload.get("correlation_window", 300)
        generate_reports: bool = payload.get("generate_report_for_threats", True)

        self._log_activity("OBSERVE", {
            "enriched_log_count": len(enriched_logs),
            "correlation_window": correlation_window,
        })
        self.context.add_observation({
            "event": "received_enriched_logs",
            "count": len(enriched_logs),
        })

        # ── THINK: Correlate events ──
        self._log_activity("THINK", {"action": "running_correlation_engine"})
        new_incidents = await self.use_tool(
            "correlate_events", window_seconds=correlation_window
        )

        self.context.add_observation({
            "event": "correlation_complete",
            "new_incidents": len(new_incidents),
        })

        investigations = []
        soar_actions = []
        high_severity_count = 0

        # ── ACT: Investigate each high-risk enriched log ──
        for log in enriched_logs:
            ml_result = {
                "label": log.get("ml_label", "Normal"),
                "severity_index": log.get("ml_severity_index", 0),
                "confidence": log.get("ml_confidence", 0.0),
                "features": log.get("ml_features", {}),
            }

            # Only deeply investigate Suspicious or Threat
            if ml_result["severity_index"] < 1:
                continue

            # Score severity
            severity_data = await self.use_tool(
                "score_severity",
                enriched_log=log,
                ml_result=ml_result,
            )

            investigation: Dict[str, Any] = {
                "ip_address": log.get("ip_address"),
                "event_type": log.get("event_type"),
                "ml_label": ml_result["label"],
                "severity": severity_data,
                "timestamp": log.get("timestamp"),
                "investigated_by": self.name,
                "investigated_at": datetime.now(timezone.utc).isoformat(),
            }

            # Generate report for Threat-level events
            if generate_reports and severity_data.get("score", 0) >= 70:
                high_severity_count += 1
                report_md = await self.use_tool(
                    "generate_report",
                    log_entry=log,
                    ml_result=ml_result,
                    severity_data=severity_data,
                )
                report_id = await self.use_tool(
                    "save_report",
                    log_entry=log,
                    ml_result=ml_result,
                    severity_data=severity_data,
                    report_markdown=report_md,
                )
                investigation["report_id"] = report_id
                investigation["report_preview"] = report_md[:300] + "..."

            # Trigger SOAR
            soar_detection = {**log, **ml_result, **severity_data}
            soar_logs = await self.use_tool("trigger_soar", detection=soar_detection)
            if soar_logs:
                soar_actions.extend(soar_logs)
                investigation["soar_triggered"] = True

            investigations.append(investigation)

        # ── REPORT ──
        summary = {
            "total_logs_reviewed": len(enriched_logs),
            "logs_investigated": len(investigations),
            "new_incidents_correlated": len(new_incidents),
            "high_severity_reports_generated": high_severity_count,
            "soar_actions_triggered": len(soar_actions),
            "agent": self.name,
            "agent_id": self.agent_id,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }
        self._log_activity("REPORT", summary)
        self.context.add_observation({"event": "investigation_complete", **summary})

        return {
            "incidents": new_incidents,
            "investigations": investigations,
            "soar_actions": soar_actions,
            "summary": summary,
        }
