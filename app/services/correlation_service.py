"""
Event Correlation Service — Multi-Entity & Attack-Chain Correlation

Groups related security events into Incidents based on:
  - Source IP within a sliding time window
  - Targeted User Account (Distributed Credential Stuffing / Multi-IP campaigns)
  - Attack-chain detection (Recon -> Credential Access -> Exploit -> Exfiltration -> Persistence)
  - MITRE ATT&CK technique mapping

Outputs Incident objects that bundle correlated events with composite risk scores,
MITRE ATT&CK taxonomy tags, and actionable remediation narratives.
"""

import uuid
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from app.core.logger import app_logger


# ──────────────────────────────────────────────────────────────────────────── #
#  MITRE ATT&CK Phase & Taxonomy Mapping                                       #
# ──────────────────────────────────────────────────────────────────────────── #

MITRE_TACTICS: Dict[str, Dict[str, str]] = {
    "recon": {
        "id": "TA0043",
        "name": "Reconnaissance",
        "technique": "T1046: Network Service Discovery",
    },
    "brute_force": {
        "id": "TA0006",
        "name": "Credential Access",
        "technique": "T1110: Brute Force / Password Spraying",
    },
    "exploit": {
        "id": "TA0001",
        "name": "Initial Access",
        "technique": "T1190: Exploit Public-Facing Application",
    },
    "exfil": {
        "id": "TA0010",
        "name": "Exfiltration",
        "technique": "T1048: Exfiltration Over Alternative Protocol",
    },
    "persistence": {
        "id": "TA0003",
        "name": "Persistence",
        "technique": "T1078: Valid Accounts / Privilege Escalation",
    },
}

PHASE_MAP: Dict[str, str] = {
    "port_access": "recon",
    "port_scan": "recon",
    "network_discovery": "recon",
    "login_failed": "brute_force",
    "login_attempt": "brute_force",
    "auth_failure": "brute_force",
    "sql_injection": "exploit",
    "api_request": "exploit",
    "web_request": "exploit",
    "xss_payload": "exploit",
    "data_access": "exfil",
    "file_download": "exfil",
    "db_dump": "exfil",
    "login_success": "persistence",
    "privilege_escalation": "persistence",
    "sudo_execution": "persistence",
}


# ──────────────────────────────────────────────────────────────────────────── #
#  Data models                                                                 #
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
        target_user: Optional[str] = None,
        mitre_tactics: Optional[List[Dict[str, str]]] = None,
        status: str = "open",
    ):
        self.incident_id = incident_id
        self.attack_type = attack_type
        self.source_ip = source_ip
        self.target_user = target_user
        self.first_seen = first_seen
        self.last_seen = last_seen
        self.events = events
        self.event_count = len(events)
        self.composite_score = composite_score
        self.narrative = narrative
        self.mitre_tactics = mitre_tactics or []
        self.status = status
        self.feedback = None  # None | "true_positive" | "false_positive"
        self.created_at = datetime.now(timezone.utc).isoformat()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "incident_id": self.incident_id,
            "attack_type": self.attack_type,
            "source_ip": self.source_ip,
            "target_user": self.target_user,
            "first_seen": self.first_seen,
            "last_seen": self.last_seen,
            "event_count": self.event_count,
            "composite_score": self.composite_score,
            "narrative": self.narrative,
            "mitre_tactics": self.mitre_tactics,
            "status": self.status,
            "feedback": self.feedback,
            "created_at": self.created_at,
            "events": self.events,
        }


# ──────────────────────────────────────────────────────────────────────────── #
#  Correlation Rules                                                           #
# ──────────────────────────────────────────────────────────────────────────── #

# Signatures: (attack_type, required_event_types, window_seconds, min_count)
CORRELATION_RULES: List[Tuple[str, List[str], int, int]] = [
    ("Brute Force Attack", ["login_failed", "auth_failure"], 60, 4),
    ("Port Scan Campaign", ["port_access", "port_scan"], 120, 4),
    ("SQL Injection Exploit", ["sql_injection", "api_request", "web_request"], 300, 2),
    ("Full Kill-Chain (Recon -> Exploit -> Persistence)", ["port_access", "login_failed", "api_request"], 600, 3),
    ("Credential Stuffing", ["login_failed", "login_success"], 120, 3),
]


# ──────────────────────────────────────────────────────────────────────────── #
#  CorrelationService                                                          #
# ──────────────────────────────────────────────────────────────────────────── #

class CorrelationService:
    """
    Multi-entity event correlation engine (IP-based, User-based, and Kill-Chain).
    """

    def __init__(self, max_buffer: int = 5000):
        self._events_by_ip: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        self._events_by_user: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        self._incidents: List[CorrelatedIncident] = []
        self._analyst_feedbacks: List[Dict[str, Any]] = []
        self._max_buffer = max_buffer

    # ------------------------------------------------------------------ #
    #  Ingestion                                                         #
    # ------------------------------------------------------------------ #

    def ingest(self, log: Dict[str, Any]) -> None:
        """Add an enriched log entry into IP and User correlation buffers."""
        ip = log.get("ip_address") or log.get("source_ip") or "unknown"
        user = log.get("user_id") or log.get("username")

        self._events_by_ip[ip].append(log)
        if len(self._events_by_ip[ip]) > self._max_buffer:
            self._events_by_ip[ip].pop(0)

        if user:
            self._events_by_user[user].append(log)
            if len(self._events_by_user[user]) > self._max_buffer:
                self._events_by_user[user].pop(0)

    def ingest_batch(self, logs: List[Dict[str, Any]]) -> None:
        for log in logs:
            self.ingest(log)

    # ------------------------------------------------------------------ #
    #  Correlation                                                       #
    # ------------------------------------------------------------------ #

    def correlate_recent(self, window_seconds: int = 300) -> List[CorrelatedIncident]:
        """
        Run multi-entity correlation across recent events (IP-based and User-based).
        """
        cutoff = datetime.now(timezone.utc) - timedelta(seconds=window_seconds)
        new_incidents: List[CorrelatedIncident] = []

        # 1. IP-Based Rule Correlation
        for ip, events in self._events_by_ip.items():
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
                    if not self._already_exists(ip, rule_name, rule_window):
                        incident = self._build_incident(ip, rule_name, matching)
                        self._incidents.append(incident)
                        new_incidents.append(incident)
                        app_logger.info(
                            f"[Correlation] New IP incident: {rule_name} from {ip} ({len(matching)} events)"
                        )

        # 2. User-Based Distributed Attack Correlation (Multi-IP -> Single User)
        for user, events in self._events_by_user.items():
            windowed = [e for e in events if self._parse_ts(e) >= cutoff]
            failed_logins = [e for e in windowed if e.get("event_type", "").lower() in ("login_failed", "auth_failure")]
            unique_ips = {e.get("ip_address") for e in failed_logins if e.get("ip_address")}

            if len(failed_logins) >= 5 and len(unique_ips) >= 2:
                rule_name = "Distributed Credential Attack (Password Spray)"
                if not self._already_exists(f"user:{user}", rule_name, window_seconds):
                    incident = self._build_incident(
                        ip=list(unique_ips)[0],
                        attack_type=rule_name,
                        events=failed_logins,
                        target_user=user
                    )
                    self._incidents.append(incident)
                    new_incidents.append(incident)
                    app_logger.info(
                        f"[Correlation] New User incident: {rule_name} targeting '{user}' across {len(unique_ips)} IPs"
                    )

        return new_incidents

    # ------------------------------------------------------------------ #
    #  Analyst Feedback Loop                                             #
    # ------------------------------------------------------------------ #

    def record_feedback(self, incident_id: str, verdict: str, notes: Optional[str] = None) -> bool:
        """
        Records human-in-the-loop analyst feedback (true_positive / false_positive).
        Reduces alert fatigue and dynamically adjusts threat state.
        """
        for inc in self._incidents:
            if inc.incident_id == incident_id:
                inc.feedback = verdict
                if verdict == "false_positive":
                    inc.status = "closed_fp"
                    inc.composite_score = max(0, inc.composite_score - 50)
                else:
                    inc.status = "verified_threat"
                
                self._analyst_feedbacks.append({
                    "incident_id": incident_id,
                    "verdict": verdict,
                    "notes": notes,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })
                app_logger.info(f"[Analyst Feedback] Incident {incident_id} marked as {verdict}")
                return True
        return False

    def get_feedback_stats(self) -> Dict[str, Any]:
        tp = sum(1 for f in self._analyst_feedbacks if f["verdict"] == "true_positive")
        fp = sum(1 for f in self._analyst_feedbacks if f["verdict"] == "false_positive")
        total = len(self._analyst_feedbacks)
        return {
            "total_reviews": total,
            "true_positives": tp,
            "false_positives": fp,
            "accuracy_ratio": round(tp / max(total, 1), 3),
            "recent_reviews": self._analyst_feedbacks[-10:],
        }

    # ------------------------------------------------------------------ #
    #  Queries & Helpers                                                 #
    # ------------------------------------------------------------------ #

    def get_all_incidents(self, limit: int = 50) -> List[Dict[str, Any]]:
        return [i.to_dict() for i in sorted(
            self._incidents, key=lambda x: x.created_at, reverse=True
        )[:limit]]

    def stats(self) -> Dict[str, Any]:
        return {
            "total_incidents": len(self._incidents),
            "unique_ips_tracked": len(self._events_by_ip),
            "unique_users_tracked": len(self._events_by_user),
            "total_events_buffered": sum(len(v) for v in self._events_by_ip.values()),
            "feedback_stats": self.get_feedback_stats(),
        }

    def _parse_ts(self, event: Dict[str, Any]) -> datetime:
        ts_str = event.get("timestamp", "")
        try:
            dt = datetime.fromisoformat(str(ts_str).replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except Exception:
            return datetime.now(timezone.utc)

    def _already_exists(self, key: str, rule_name: str, window_seconds: int) -> bool:
        cutoff = datetime.now(timezone.utc) - timedelta(seconds=window_seconds)
        for inc in self._incidents:
            match_key = (inc.source_ip == key) or (inc.target_user == key.replace("user:", ""))
            if match_key and inc.attack_type == rule_name:
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
        self, ip: str, attack_type: str, events: List[Dict[str, Any]], target_user: Optional[str] = None
    ) -> CorrelatedIncident:
        timestamps = sorted([self._parse_ts(e) for e in events])
        first_seen = timestamps[0].isoformat() if timestamps else datetime.now(timezone.utc).isoformat()
        last_seen = timestamps[-1].isoformat() if timestamps else first_seen

        scores = [e.get("severity_score", 0) or e.get("score", 0) or (90 if e.get("label") == "Threat" else 60) for e in events]
        max_score = max(scores, default=60)
        volume_bonus = min(len(events) * 4, 25)
        composite = min(int(max_score) + volume_bonus, 100)

        # Collect MITRE tactics
        tactics_set = {}
        for e in events:
            et = e.get("event_type", "").lower()
            phase = PHASE_MAP.get(et)
            if phase and phase in MITRE_TACTICS:
                tactics_set[phase] = MITRE_TACTICS[phase]
        mitre_list = list(tactics_set.values())

        narrative = self._generate_narrative(ip, attack_type, events, composite, mitre_list, target_user)

        return CorrelatedIncident(
            incident_id=f"INC-{uuid.uuid4().hex[:8].upper()}",
            attack_type=attack_type,
            source_ip=ip,
            target_user=target_user or events[0].get("user_id") or events[0].get("username"),
            first_seen=first_seen,
            last_seen=last_seen,
            events=events,
            composite_score=composite,
            narrative=narrative,
            mitre_tactics=mitre_list,
        )

    def _generate_narrative(
        self, ip: str, attack_type: str, events: List[Dict], score: int, mitre: List[Dict], target_user: Optional[str] = None
    ) -> str:
        event_types = list({e.get("event_type", "unknown") for e in events})
        tactic_names = [m["name"] for m in mitre] or ["Initial Access"]
        user_info = f" targeting user `{target_user}`" if target_user else ""
        return (
            f"**{attack_type}** detected from `{ip}`{user_info}. "
            f"Correlated {len(events)} events across MITRE ATT&CK tactics: {', '.join(tactic_names)}. "
            f"Observed vectors: {', '.join(event_types)}. "
            f"Calculated Threat Severity Score: {score}/100."
        )


# Singleton
correlation_service = CorrelationService()

def get_correlation_service() -> CorrelationService:
    return correlation_service
