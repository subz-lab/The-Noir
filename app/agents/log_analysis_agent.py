"""
Log Analysis Agent — Gap 1

Specialized agent responsible for:
  1. Normalizing raw logs (multi-format via NormalizerService)
  2. Extracting ML features and classifying threats (MLService)
  3. Feeding normalized + enriched logs into the correlation buffer
  4. Emitting structured observations for the Orchestrator
"""

import asyncio
from datetime import datetime, timezone
from typing import Any, Dict, List

from app.agents.base_agent import AgentTool, BaseAgent
from app.core.logger import app_logger
from app.services.normalizer_service import get_normalizer_service
from app.services.ml_service import get_ml_service
from app.services.correlation_service import get_correlation_service


class LogAnalysisAgent(BaseAgent):
    """
    Agent 1: Log Analysis Agent

    Decision loop:
      OBSERVE  → receive raw log(s)
      THINK    → normalize format, extract features
      ACT      → run ML classification, feed correlator
      REPORT   → return enriched log with prediction + format metadata
    """

    def __init__(self):
        super().__init__(
            name="LogAnalysisAgent",
            role=(
                "Ingests raw security logs in any format, normalizes them to a "
                "unified schema, extracts behavioral features, classifies threats "
                "with the ML model, and feeds results into the correlation buffer."
            ),
        )

    # ------------------------------------------------------------------ #
    #  Tool registration                                                   #
    # ------------------------------------------------------------------ #

    def setup_tools(self) -> None:
        self.register_tool(AgentTool(
            name="normalize_log",
            description="Convert a raw log string/dict to the Unified Log Schema",
            fn=self._tool_normalize,
        ))
        self.register_tool(AgentTool(
            name="ml_classify",
            description="Run ML threat classification on a normalized log dict",
            fn=self._tool_ml_classify,
        ))
        self.register_tool(AgentTool(
            name="feed_correlator",
            description="Add an enriched log entry to the correlation service buffer",
            fn=self._tool_feed_correlator,
        ))

    # ------------------------------------------------------------------ #
    #  Tool implementations                                                #
    # ------------------------------------------------------------------ #

    def _tool_normalize(self, raw_log: Any) -> Dict[str, Any]:
        svc = get_normalizer_service()
        unified = svc.normalize(raw_log)
        return unified.to_dict()

    def _tool_ml_classify(self, log_dict: Dict[str, Any]) -> Dict[str, Any]:
        try:
            ml = get_ml_service()
            return ml.predict_log(log_dict)
        except Exception as e:
            app_logger.warning(f"[LogAnalysisAgent] ML classify fallback: {e}")
            return {
                "label": "Unknown",
                "severity_index": 0,
                "confidence": 0.0,
                "features": {},
                "error": str(e),
            }

    def _tool_feed_correlator(self, enriched_log: Dict[str, Any]) -> bool:
        svc = get_correlation_service()
        svc.ingest(enriched_log)
        return True

    # ------------------------------------------------------------------ #
    #  Decision loop                                                       #
    # ------------------------------------------------------------------ #

    async def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        payload: {
            "logs": [raw_log, ...]   # list of raw log strings or dicts
        }
        Returns: {
            "enriched_logs": [...],
            "stats": { total, threats, suspicious, normal }
        }
        """
        raw_logs: List[Any] = payload.get("logs", [])
        if not raw_logs:
            return {"enriched_logs": [], "stats": {"total": 0, "threats": 0, "suspicious": 0, "normal": 0}}

        self._log_activity("OBSERVE", {"raw_log_count": len(raw_logs)})
        self.context.add_observation({"event": "received_logs", "count": len(raw_logs)})

        enriched: List[Dict[str, Any]] = []
        stats = {"total": 0, "threats": 0, "suspicious": 0, "normal": 0}

        for raw in raw_logs:
            try:
                # ── THINK: Normalize ──
                normalized = await self.use_tool("normalize_log", raw_log=raw)
                self.context.add_observation({
                    "event": "normalized",
                    "format": normalized.get("source_format"),
                    "ip": normalized.get("ip_address"),
                })

                # ── ACT: ML Classify ──
                ml_result = await self.use_tool("ml_classify", log_dict=normalized)

                # Merge into enriched log
                enriched_log = {
                    **normalized,
                    "ml_label": ml_result.get("label"),
                    "ml_severity_index": ml_result.get("severity_index", 0),
                    "ml_confidence": ml_result.get("confidence", 0.0),
                    "ml_features": ml_result.get("features", {}),
                    "processed_by": self.name,
                    "processed_at": datetime.now(timezone.utc).isoformat(),
                }

                # ── ACT: Feed correlator ──
                await self.use_tool("feed_correlator", enriched_log=enriched_log)

                enriched.append(enriched_log)
                stats["total"] += 1

                label = ml_result.get("label", "Normal")
                if label == "Threat":
                    stats["threats"] += 1
                elif label == "Suspicious":
                    stats["suspicious"] += 1
                else:
                    stats["normal"] += 1

            except Exception as exc:
                app_logger.error(f"[LogAnalysisAgent] Error processing log: {exc}", exc_info=True)
                enriched.append({
                    "raw": str(raw)[:200],
                    "error": str(exc),
                    "processed_by": self.name,
                    "processed_at": datetime.now(timezone.utc).isoformat(),
                })
                stats["total"] += 1

        # ── REPORT ──
        self._log_activity("REPORT", stats)
        self.context.add_observation({"event": "processing_complete", **stats})

        return {
            "enriched_logs": enriched,
            "stats": stats,
            "agent": self.name,
            "agent_id": self.agent_id,
        }
