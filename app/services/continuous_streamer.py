"""
Continuous Live Log Streamer — Autonomous Background Telemetry Engine

Continuously generates and streams realistic enterprise security telemetry
into the ML classification pipeline, event correlation engine, and WebSocket broadcaster.
Runs asynchronously in the background so data flows non-stop into the dashboard.
"""

import asyncio
import random
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.core.logger import app_logger
from app.services.buffer_service import get_buffer_service
from app.services.correlation_service import get_correlation_service
from app.services.ml_service import get_ml_service
from app.services.normalizer_service import get_normalizer_service
from app.services.soar_service import soar_service


# ──────────────────────────────────────────────────────────────────────────── #
#  Realistic Telemetry Pools                                                   #
# ──────────────────────────────────────────────────────────────────────────── #

NORMAL_USERS = [
    {"user": "alex_sterling", "ip": "192.168.1.102", "role": "admin"},
    {"user": "dev_sarah", "ip": "192.168.1.105", "role": "developer"},
    {"user": "analyst_chen", "ip": "192.168.1.114", "role": "analyst"},
    {"user": "operator_vikram", "ip": "192.168.1.120", "role": "ops"},
    {"user": "service_account_db", "ip": "10.0.0.50", "role": "system"},
]

ATTACKER_POOLS = [
    {"ip": "185.220.101.45", "type": "brute_force", "targets": ["admin", "root", "alex_sterling"]},
    {"ip": "198.51.100.77", "type": "port_scanner", "ports": [21, 22, 23, 80, 443, 3306, 5432, 8080]},
    {"ip": "203.0.113.99", "type": "sql_injection", "payloads": [
        "GET /api/users?id=' OR '1'='1 HTTP/1.1",
        "POST /auth/login payload: admin'--",
        "GET /search?q=UNION SELECT username, password FROM users--",
        "GET /reports?file=../../../../etc/passwd HTTP/1.1",
    ]},
    {"ip": "45.33.32.156", "type": "credential_stuffing", "targets": ["admin", "dev_sarah", "operator_vikram"]},
]

COMMON_ENDPOINTS = [
    "/api/v1/telemetry", "/api/dashboard/stats", "/auth/verify-session",
    "/data/nodes/health", "/api/v1/audit/stream", "/services/billing/status",
    "/internal/metrics", "/api/v2/reports/summary", "/api/assets/inventory"
]


class ContinuousTelemetryStreamer:
    """
    Background worker that produces continuous real-time security events.
    """

    def __init__(self):
        self._running: bool = False
        self._task: Optional[asyncio.Task] = None
        self._delay: float = 2.0  # seconds between events
        self._total_streamed: int = 0
        self._threats_streamed: int = 0

    @property
    def is_running(self) -> bool:
        return self._running

    def status(self) -> Dict[str, Any]:
        return {
            "is_running": self._running,
            "delay_seconds": self._delay,
            "total_streamed": self._total_streamed,
            "threats_streamed": self._threats_streamed,
        }

    def start(self, delay: float = 2.0) -> bool:
        if self._running:
            return True
        self._delay = max(0.5, delay)
        self._running = True
        self._task = asyncio.create_task(self._stream_loop())
        app_logger.info(f"[Continuous Streamer] Started background telemetry stream (interval: {self._delay}s)")
        return True

    def stop(self) -> bool:
        if not self._running:
            return False
        self._running = False
        if self._task and not self._task.done():
            self._task.cancel()
        app_logger.info("[Continuous Streamer] Stopped background telemetry stream")
        return True

    def _generate_synthetic_log(self) -> Dict[str, Any]:
        """Generates a realistic randomized security log."""
        ts = datetime.now(timezone.utc).isoformat()
        roll = random.random()

        # 70% Normal Traffic
        if roll < 0.70:
            user_prof = random.choice(NORMAL_USERS)
            event_type = random.choice(["api_request", "web_request", "login_success", "port_access"])
            port = 443 if event_type in ("api_request", "web_request") else (22 if user_prof["role"] == "developer" else 80)
            return {
                "timestamp": ts,
                "ip_address": user_prof["ip"],
                "user_id": user_prof["user"],
                "event_type": event_type,
                "port_number": port,
                "status": "success",
                "request_payload": f"GET {random.choice(COMMON_ENDPOINTS)} HTTP/1.1",
            }

        # 30% Adversary / Anomaly Activity
        attacker = random.choice(ATTACKER_POOLS)
        att_type = attacker["type"]

        if att_type == "brute_force":
            return {
                "timestamp": ts,
                "ip_address": attacker["ip"],
                "user_id": random.choice(attacker["targets"]),
                "event_type": "login_failed",
                "port_number": 22,
                "status": "failed",
                "request_payload": "SSH-2.0-OpenSSH_8.2p1 auth password attempt",
            }
        elif att_type == "port_scanner":
            return {
                "timestamp": ts,
                "ip_address": attacker["ip"],
                "user_id": None,
                "event_type": "port_access",
                "port_number": random.choice(attacker["ports"]),
                "status": "failed",
                "request_payload": None,
            }
        elif att_type == "sql_injection":
            return {
                "timestamp": ts,
                "ip_address": attacker["ip"],
                "user_id": "anonymous",
                "event_type": "web_request",
                "port_number": 80,
                "status": "failed",
                "request_payload": random.choice(attacker["payloads"]),
            }
        else:  # credential stuffing
            return {
                "timestamp": ts,
                "ip_address": attacker["ip"],
                "user_id": random.choice(attacker["targets"]),
                "event_type": "login_failed",
                "port_number": 443,
                "status": "failed",
                "request_payload": "POST /api/v1/auth/token invalid_grant",
            }

    async def _stream_loop(self) -> None:
        """Main async generator loop."""
        buffer_svc = get_buffer_service()
        ml_svc = get_ml_service()
        corr_svc = get_correlation_service()

        while self._running:
            try:
                raw_log = self._generate_synthetic_log()

                # 1. Run ML Prediction
                prediction = ml_svc.predict_log(raw_log)

                # 2. Enrich log
                enriched = {
                    **raw_log,
                    "label": prediction.get("label", "Normal"),
                    "severity_index": prediction.get("severity_index", 0),
                    "confidence": prediction.get("confidence", 0.95),
                    "features": prediction.get("features", {}),
                }

                # 3. Add to In-Memory Sliding Buffer
                buffer_svc.add_log(enriched)

                # 4. Ingest into Correlation Service
                corr_svc.ingest(enriched)
                corr_svc.correlate_recent(window_seconds=300)

                # 5. Broadcast to Connected WebSocket Dashboard Clients
                await buffer_svc.manager.broadcast({"type": "NEW_LOG", "log": enriched})

                # 6. Auto-trigger SOAR for high severity threats
                if prediction.get("severity_index", 0) > 0:
                    self._threats_streamed += 1
                    soar_service.check_and_trigger_playbooks(enriched)

                self._total_streamed += 1

            except asyncio.CancelledError:
                break
            except Exception as exc:
                app_logger.warning(f"[Continuous Streamer] Loop error: {exc}")

            # Sleep between events (jitter ±0.5s for natural traffic feel)
            jitter = random.uniform(-0.4, 0.4)
            sleep_time = max(0.6, self._delay + jitter)
            await asyncio.sleep(sleep_time)


# Singleton instance
streamer_service = ContinuousTelemetryStreamer()

def get_streamer_service() -> ContinuousTelemetryStreamer:
    return streamer_service
