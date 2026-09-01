"""
Event Correlation Service — Gap 2

Groups related security events into Incidents based on:
  - Same source IP within a sliding time window
  - Same attack pattern signature
  - Attack-chain detection (recon → exploit → exfil)

Outputs Incident objects that bundle correlated events with a combined
risk score and a human-readable correlation narrative.
"""

import uuid
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from app.core.logger import app_logger


# ──────────────────────────────────────────────────────────────────────────── #
#  Data models                                                                  #
# ──────────────────────────────────────────────────────────────────────────── #

class CorrelatedIncident:
    """A bundle of correlated security events forming one Incident."""

    def __init__(
        self,
        incident_id: str,
        attack_type: str,
        source_ip: str,
        first_seen: str,
        last_seen: str,
        events: List[Dict[str, Any]],
        composite_score: int,
        narrative: str,
        status: str = "open",
    ):
        self.incident_id = incident_id
        self.attack_type = attack_type
        self.source_ip = source_ip
        self.first_seen = first_seen
        self.last_seen = last_seen
        self.events = events
        self.event_count = len(events)
        self.composite_score = composite_score
        self.narrative = narrative
        self.status = status
        self.created_at = datetime.now(timezone.utc).isoformat()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "incident_id": self.incident_id,
            "attack_type": self.attack_type,
            "source_ip": self.source_ip,
            "first_seen": self.first_seen,
            "last_seen": self.last_seen,
            "event_count": self.event_count,
            "composite_score": self.composite_score,
            "narrative": self.narrative,
            "status": self.status,
            "created_at": self.created_at,
            "events": self.events,
        }


# ──────────────────────────────────────────────────────────────────────────── #
#  Attack-chain rules                                                           #
# ──────────────────────────────────────────────────────────────────────────── #

# Map event types → attack phase
PHASE_MAP: Dict[str, str] = {
    "port_access": "recon",
    "port_scan": "recon",
    "login_failed": "brute_force",
    "login_attempt": "brute_force",
    "sql_injection": "exploit",
    "api_request": "exploit",
    "data_access": "exfil",
    "file_download": "exfil",
    "login_success": "persistence",
    "privilege_escalation": "persistence",
}

# Signatures: (attack_type, required_event_types, window_seconds, min_count)
CORRELATION_RULES: List[Tuple[str, List[str], int, int]] = [
    ("Brute Force Attack",      ["login_failed"],             60,  5),
    ("Port Scan",               ["port_access", "port_scan"], 120, 4),
    ("SQL Injection Campaign",  ["sql_injection", "api_request"], 300, 2),
    ("Attack Chain (Recon->Exploit)", ["port_access", "login_failed", "api_request"], 600, 3),
    ("Credential Stuffing",     ["login_failed", "login_success"],  120, 3),
]


# ──────────────────────────────────────────────────────────────────────────── #
#  CorrelationService                                                           #
# ──────────────────────────────────────────────────────────────────────────── #

class CorrelationService:
    """
    Sliding-window event correlator.

    Usage:
        service.ingest(enriched_log)   # add one log
        incidents = service.correlate_recent(window_seconds=300)
    """

    def __init__(self, max_buffer: int = 5000):
        # ip -> list of enriched log dicts (sorted by timestamp)
        self._events_by_ip: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        self._incidents: List[CorrelatedIncident] = []
        self._max_buffer = max_buffer

    # ------------------------------------------------------------------ #
    #  Ingestion                                                           #
    # ------------------------------------------------------------------ #

    def ingest(self, log: Dict[str, Any]) -> None:
        """Add a single enriched log entry to the correlation buffer."""
        ip = log.get("ip_address") or log.get("source_ip") or "unknown"
        self._events_by_ip[ip].append(log)
        # Trim buffer per IP
        if len(self._events_by_ip[ip]) > self._max_buffer:
            self._events_by_ip[ip].pop(0)

    def ingest_batch(self, logs: List[Dict[str, Any]]) -> None:
        for log in logs:
            self.ingest(log)

    # ------------------------------------------------------------------ #
    #  Correlation                                                         #
    # ------------------------------------------------------------------ #

    def correlate_recent(self, window_seconds: int = 300) -> List[CorrelatedIncident]:
        """
        Run all correlation rules over events within the last `window_seconds`.
        Returns newly created incidents (deduplicates against existing ones).
        """
        cutoff = datetime.now(timezone.utc) - timedelta(seconds=window_seconds)
        new_incidents: List[CorrelatedIncident] = []

        for ip, events in self._events_by_ip.items():
            # Filter to window
            windowed = [e for e in events if self._parse_ts(e) >= cutoff]
            if not windowed:
                continue

            for rule_name, required_types, rule_window, min_count in CORRELATION_RULES:
                rule_cutoff = datetime.now(timezone.utc) - timedelta(seconds=rule_window)
                matching = [
                    e for e in windowed
                    if self._parse_ts(e) >= rule_cutoff
                    and e.get("event_type", "").lower() in [t.lower() for t in required_types]
                ]
                if len(matching) >= min_count:
                    # Avoid duplicate incidents for same ip+rule within 5 min
                    if not self._already_exists(ip, rule_name, rule_window):
                        incident = self._build_incident(ip, rule_name, matching)
                        self._incidents.append(incident)
                        new_incidents.append(incident)
                        app_logger.info(
                            f"[Correlation] New incident: {rule_name} from {ip} "
                            f"({len(matching)} events)"
                        )

        return new_incidents

    def get_all_incidents(self, limit: int = 50) -> List[Dict[str, Any]]:
        return [i.to_dict() for i in sorted(
            self._incidents, key=lambda x: x.created_at, reverse=True
        )[:limit]]

    def get_incident_by_ip(self, ip: str) -> List[Dict[str, Any]]:
        return [i.to_dict() for i in self._incidents if i.source_ip == ip]

    def stats(self) -> Dict[str, Any]:
        return {
            "total_incidents": len(self._incidents),
            "unique_ips_tracked": len(self._events_by_ip),
            "total_events_buffered": sum(len(v) for v in self._events_by_ip.values()),
        }

    # ------------------------------------------------------------------ #
    #  Helpers                                                             #
    # ------------------------------------------------------------------ #

    def _parse_ts(self, event: Dict[str, Any]) -> datetime:
        ts_str = event.get("timestamp", "")
        try:
            dt = datetime.fromisoformat(str(ts_str).replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except Exception:
            return datetime.now(timezone.utc)

    def _already_exists(self, ip: str, rule_name: str, window_seconds: int) -> bool:
        cutoff = datetime.now(timezone.utc) - timedelta(seconds=window_seconds)
        for inc in self._incidents:
            if inc.source_ip == ip and inc.attack_type == rule_name:
                try:
                    created = datetime.fromisoformat(inc.created_at.replace("Z", "+00:00"))
                    if created.tzinfo is None:
                        created = created.replace(tzinfo=timezone.utc)
                    if created >= cutoff:
                        return True
                except Exception:
                    pass
        return False

    def _build_incident(
        self, ip: str, attack_type: str, events: List[Dict[str, Any]]
    ) -> CorrelatedIncident:
        timestamps = sorted([self._parse_ts(e) for e in events])
        first_seen = timestamps[0].isoformat() if timestamps else datetime.now(timezone.utc).isoformat()
        last_seen = timestamps[-1].isoformat() if timestamps else first_seen

        # Composite score: max individual score + volume bonus
        scores = [e.get("severity_score", 0) or e.get("score", 0) for e in events]
        max_score = max(scores, default=50)
        volume_bonus = min(len(events) * 3, 20)
        composite = min(int(max_score) + volume_bonus, 100)

        narrative = self._generate_narrative(ip, attack_type, events, composite)

        return CorrelatedIncident(
            incident_id=f"INC-{uuid.uuid4().hex[:8].upper()}",
            attack_type=attack_type,
            source_ip=ip,
            first_seen=first_seen,
            last_seen=last_seen,
            events=events,
            composite_score=composite,
            narrative=narrative,
        )

    def _generate_narrative(
        self, ip: str, attack_type: str, events: List[Dict], score: int
    ) -> str:
        event_types = list({e.get("event_type", "unknown") for e in events})
        phases = list({PHASE_MAP.get(et.lower(), "unknown") for et in event_types})
        severity = "CRITICAL" if score >= 90 else "HIGH" if score >= 70 else "MEDIUM" if score >= 40 else "LOW"
        return (
            f"**{severity} — {attack_type}** detected from IP `{ip}`. "
            f"{len(events)} related events were correlated across phases: {', '.join(phases)}. "
            f"Event types observed: {', '.join(event_types)}. "
            f"Composite risk score: {score}/100. "
            f"Immediate investigation recommended."
        )


# Singleton
correlation_service = CorrelationService()

def get_correlation_service() -> CorrelationService:
    return correlation_service
