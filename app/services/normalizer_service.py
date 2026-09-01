"""
Log Normalizer Service — Gap 4

Converts diverse log formats (JSON, Syslog RFC 3164/5424, CEF, W3C) to
a common Unified Log Schema (ULS) that the rest of the pipeline consumes.
"""

import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


# ──────────────────────────────────────────────────────────────────────────── #
#  Unified Log Schema                                                           #
# ──────────────────────────────────────────────────────────────────────────── #

class UnifiedLog:
    """Canonical log object produced after normalization."""

    def __init__(
        self,
        source_format: str,
        timestamp: str,
        ip_address: str,
        event_type: str,
        severity: str = "INFO",
        port_number: Optional[int] = None,
        request_payload: Optional[str] = None,
        username: Optional[str] = None,
        host: Optional[str] = None,
        raw: Optional[str] = None,
        extra: Optional[Dict[str, Any]] = None,
    ):
        self.source_format = source_format
        self.timestamp = timestamp
        self.ip_address = ip_address
        self.event_type = event_type
        self.severity = severity
        self.port_number = port_number
        self.request_payload = request_payload
        self.username = username
        self.host = host
        self.raw = raw
        self.extra = extra or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source_format": self.source_format,
            "timestamp": self.timestamp,
            "ip_address": self.ip_address,
            "event_type": self.event_type,
            "severity": self.severity,
            "port_number": self.port_number,
            "request_payload": self.request_payload,
            "username": self.username,
            "host": self.host,
            "raw": self.raw,
            "extra": self.extra,
        }


# ──────────────────────────────────────────────────────────────────────────── #
#  Format detectors & parsers                                                   #
# ──────────────────────────────────────────────────────────────────────────── #

def _detect_format(raw: str) -> str:
    """Heuristically detect the log format from the raw string."""
    stripped = raw.strip()
    if stripped.startswith("{"):
        return "json"
    if stripped.startswith("CEF:"):
        return "cef"
    # Syslog RFC 5424: <PRI>VERSION TIMESTAMP
    if re.match(r"^<\d+>\d ", stripped):
        return "syslog5424"
    # Syslog RFC 3164: <PRI>Mon DD HH:MM:SS
    if re.match(r"^<\d+>[A-Za-z]{3}\s+\d", stripped):
        return "syslog3164"
    # W3C Extended Log Format (starts with a date field like "2024-01-01")
    if re.match(r"^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}", stripped):
        return "w3c"
    return "unknown"


def _parse_json(raw: str) -> UnifiedLog:
    import json
    data = json.loads(raw)
    ts = data.get("timestamp") or data.get("time") or datetime.now(timezone.utc).isoformat()
    ip = (
        data.get("ip_address")
        or data.get("src_ip")
        or data.get("source_ip")
        or data.get("remote_addr")
        or "0.0.0.0"
    )
    event = (
        data.get("event_type")
        or data.get("event")
        or data.get("action")
        or "unknown"
    )
    sev = str(data.get("severity", data.get("level", "INFO"))).upper()
    return UnifiedLog(
        source_format="json",
        timestamp=ts,
        ip_address=ip,
        event_type=event,
        severity=sev,
        port_number=data.get("port_number") or data.get("port"),
        request_payload=data.get("request_payload") or data.get("payload") or data.get("message"),
        username=data.get("username") or data.get("user"),
        host=data.get("host") or data.get("hostname"),
        raw=raw,
        extra={k: v for k, v in data.items() if k not in {
            "timestamp", "time", "ip_address", "src_ip", "source_ip", "remote_addr",
            "event_type", "event", "action", "severity", "level", "port_number", "port",
            "request_payload", "payload", "message", "username", "user", "host", "hostname"
        }},
    )


def _parse_cef(raw: str) -> UnifiedLog:
    """
    CEF format:
    CEF:Version|DeviceVendor|DeviceProduct|DeviceVersion|SignatureID|Name|Severity|Extensions
    """
    parts = raw.split("|", 7)
    if len(parts) < 8:
        raise ValueError("Malformed CEF line")
    severity_str = parts[6].strip()
    name = parts[5].strip()
    ext_str = parts[7] if len(parts) > 7 else ""
    ext: Dict[str, str] = {}
    for match in re.finditer(r'(\w+)=([^=]+?)(?=\s+\w+=|$)', ext_str):
        ext[match.group(1)] = match.group(2).strip()

    ip = ext.get("src") or ext.get("sourceAddress") or "0.0.0.0"
    ts = ext.get("rt") or ext.get("start") or datetime.now(timezone.utc).isoformat()
    sev_map = {"0": "LOW", "1": "LOW", "2": "LOW", "3": "LOW",
               "4": "MEDIUM", "5": "MEDIUM", "6": "MEDIUM",
               "7": "HIGH", "8": "HIGH", "9": "CRITICAL", "10": "CRITICAL"}
    sev = sev_map.get(severity_str, "INFO")
    return UnifiedLog(
        source_format="cef",
        timestamp=ts,
        ip_address=ip,
        event_type=name.lower().replace(" ", "_"),
        severity=sev,
        port_number=int(ext["spt"]) if "spt" in ext else None,
        request_payload=ext.get("request") or ext.get("msg"),
        username=ext.get("suser") or ext.get("duser"),
        host=ext.get("dhost") or ext.get("shost"),
        raw=raw,
        extra=ext,
    )


def _parse_syslog3164(raw: str) -> UnifiedLog:
    """Parse BSD syslog (RFC 3164)."""
    # <PRI>Mon DD HH:MM:SS HOSTNAME TAG: MSG
    m = re.match(r"^<(\d+)>(\w{3}\s+\d+\s+\d+:\d+:\d+)\s+(\S+)\s+(.*)", raw)
    if not m:
        raise ValueError("Malformed syslog3164 line")
    pri = int(m.group(1))
    sev_map = {0: "CRITICAL", 1: "CRITICAL", 2: "CRITICAL", 3: "HIGH",
               4: "MEDIUM", 5: "MEDIUM", 6: "INFO", 7: "INFO"}
    severity = sev_map.get(pri % 8, "INFO")
    host = m.group(3)
    msg = m.group(4)
    ip_match = re.search(r"\b(\d{1,3}(?:\.\d{1,3}){3})\b", msg)
    ip = ip_match.group(1) if ip_match else "0.0.0.0"
    event = "syslog_event"
    for kw, ev in [("login", "login_event"), ("failed", "login_failed"),
                   ("port", "port_access"), ("sql", "sql_query"), ("deny", "access_denied")]:
        if kw in msg.lower():
            event = ev
            break
    return UnifiedLog(
        source_format="syslog3164",
        timestamp=m.group(2),
        ip_address=ip,
        event_type=event,
        severity=severity,
        host=host,
        request_payload=msg,
        raw=raw,
    )


def _parse_syslog5424(raw: str) -> UnifiedLog:
    """Parse IETF syslog (RFC 5424)."""
    m = re.match(
        r"^<(\d+)>(\d+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(.*)", raw
    )
    if not m:
        raise ValueError("Malformed syslog5424 line")
    pri = int(m.group(1))
    sev_map = {0: "CRITICAL", 1: "CRITICAL", 2: "CRITICAL", 3: "HIGH",
               4: "MEDIUM", 5: "MEDIUM", 6: "INFO", 7: "INFO"}
    severity = sev_map.get(pri % 8, "INFO")
    ts = m.group(3)
    host = m.group(4)
    msg = m.group(8)
    ip_match = re.search(r"\b(\d{1,3}(?:\.\d{1,3}){3})\b", msg)
    ip = ip_match.group(1) if ip_match else host
    return UnifiedLog(
        source_format="syslog5424",
        timestamp=ts,
        ip_address=ip,
        event_type="syslog_event",
        severity=severity,
        host=host,
        request_payload=msg,
        raw=raw,
    )


def _parse_w3c(raw: str) -> UnifiedLog:
    """Parse W3C Extended Log Format (common for IIS / web proxies)."""
    # Fields: date time s-ip cs-method cs-uri-stem cs-uri-query s-port cs-username c-ip ...
    parts = raw.strip().split()
    ts = f"{parts[0]}T{parts[1]}" if len(parts) >= 2 else datetime.now(timezone.utc).isoformat()
    c_ip = parts[8] if len(parts) > 8 else "0.0.0.0"
    cs_method = parts[3] if len(parts) > 3 else "unknown"
    uri = parts[4] if len(parts) > 4 else ""
    query = parts[5] if len(parts) > 5 else ""
    port = int(parts[6]) if len(parts) > 6 and parts[6].isdigit() else None
    sc_status = parts[11] if len(parts) > 11 else "200"
    sev = "HIGH" if sc_status.startswith("5") else ("MEDIUM" if sc_status.startswith("4") else "INFO")
    return UnifiedLog(
        source_format="w3c",
        timestamp=ts,
        ip_address=c_ip,
        event_type=f"http_{cs_method.lower()}",
        severity=sev,
        port_number=port,
        request_payload=f"{uri}?{query}" if query and query != "-" else uri,
        raw=raw,
    )


# ──────────────────────────────────────────────────────────────────────────── #
#  NormalizerService — public API                                               #
# ──────────────────────────────────────────────────────────────────────────── #

class NormalizerService:
    """
    Multi-format log normalizer.
    Accepts raw strings or pre-parsed dicts; returns UnifiedLog objects.
    """

    def normalize(self, raw: Any) -> UnifiedLog:
        """
        Normalize a single log entry.
        `raw` can be a str (auto-detect format) or dict (treated as JSON).
        """
        if isinstance(raw, dict):
            import json
            raw_str = json.dumps(raw)
            return _parse_json(raw_str)

        raw_str = str(raw).strip()
        fmt = _detect_format(raw_str)

        parsers = {
            "json": _parse_json,
            "cef": _parse_cef,
            "syslog3164": _parse_syslog3164,
            "syslog5424": _parse_syslog5424,
            "w3c": _parse_w3c,
        }

        parser = parsers.get(fmt)
        if parser:
            try:
                return parser(raw_str)
            except Exception:
                pass  # fall through to unknown handler

        # Unknown / fallback — extract what we can
        ip_match = re.search(r"\b(\d{1,3}(?:\.\d{1,3}){3})\b", raw_str)
        return UnifiedLog(
            source_format="unknown",
            timestamp=datetime.now(timezone.utc).isoformat(),
            ip_address=ip_match.group(1) if ip_match else "0.0.0.0",
            event_type="unknown",
            severity="INFO",
            request_payload=raw_str[:500],
            raw=raw_str,
        )

    def normalize_batch(self, raws: List[Any]) -> List[UnifiedLog]:
        """Normalize a list of log entries."""
        results = []
        for raw in raws:
            try:
                results.append(self.normalize(raw))
            except Exception as e:
                results.append(UnifiedLog(
                    source_format="error",
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    ip_address="0.0.0.0",
                    event_type="parse_error",
                    severity="INFO",
                    request_payload=str(raw)[:200],
                    raw=str(raw),
                    extra={"parse_error": str(e)},
                ))
        return results

    def get_stats(self) -> Dict[str, Any]:
        return {"service": "NormalizerService", "supported_formats": ["json", "cef", "syslog3164", "syslog5424", "w3c"]}


# Singleton
normalizer_service = NormalizerService()

def get_normalizer_service() -> NormalizerService:
    return normalizer_service
