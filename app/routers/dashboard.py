"""
Dashboard Router — Aggregated endpoints for The Noir SOC Dashboard.
All data is derived from the centralized BufferService.
"""

import os
import psutil
from datetime import datetime, timedelta
from collections import Counter, defaultdict
from fastapi import APIRouter, Depends

from app.core.logger import app_logger
from app.services.buffer_service import get_buffer_service, BufferService

router = APIRouter()


# ─── System Health (Real metrics via psutil) ──────────────────────────────────

@router.get("/system-health")
async def get_system_health():
    """Returns real system CPU, memory, disk, and network metrics."""
    cpu = psutil.cpu_percent(interval=0.5)
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    net = psutil.net_io_counters()

    return {
        "status": "success",
        "metrics": {
            "cpu": {
                "label": "CPU Load",
                "value": cpu,
                "unit": "%",
                "status": "critical" if cpu > 90 else "warning" if cpu > 70 else "healthy"
            },
            "memory": {
                "label": "Memory",
                "value": round(mem.percent, 1),
                "unit": "%",
                "used_gb": round(mem.used / (1024**3), 1),
                "total_gb": round(mem.total / (1024**3), 1),
                "status": "critical" if mem.percent > 90 else "warning" if mem.percent > 70 else "healthy"
            },
            "disk": {
                "label": "Storage",
                "value": round(disk.percent, 1),
                "unit": "%",
                "used_gb": round(disk.used / (1024**3), 1),
                "total_gb": round(disk.total / (1024**3), 1),
                "status": "critical" if disk.percent > 90 else "warning" if disk.percent > 80 else "healthy"
            },
            "network": {
                "label": "Network I/O",
                "bytes_sent": net.bytes_sent,
                "bytes_recv": net.bytes_recv,
                "sent_mb": round(net.bytes_sent / (1024**2), 1),
                "recv_mb": round(net.bytes_recv / (1024**2), 1),
                "status": "healthy"
            }
        },
        "overall": "critical" if cpu > 90 or mem.percent > 90 else "warning" if cpu > 70 or mem.percent > 70 else "optimal"
    }


# ─── AI Threat Timeline (Recent threat events from logs) ─────────────────────

@router.get("/timeline")
async def get_timeline(buffer: BufferService = Depends(get_buffer_service)):
    """Returns recent threat/suspicious events as a timeline."""
    app_logger.info("Fetching threat timeline")
    logs = buffer.get_recent_logs(500)

    # Filter only non-normal events (threats & suspicious)
    threat_events = [
        log for log in logs
        if log.get("label") in ("Threat", "Suspicious")
    ]

    # Take latest 20
    recent = threat_events[-20:][::-1]

    timeline = []
    for log in recent:
        severity = log.get("label", "Unknown")
        event_type = log.get("event_type", "unknown")
        ip = log.get("ip_address", "unknown")
        ts = log.get("timestamp", datetime.now().isoformat())
        confidence = log.get("confidence", 0)

        # Generate a human-readable description
        descriptions = {
            "login_failed": f"Failed login attempt from {ip}",
            "port_access": f"Unauthorized port access from {ip}",
            "web_request": f"Malicious web request detected from {ip}",
            "file_access": f"Suspicious file access by {ip}",
        }
        desc = descriptions.get(event_type, f"{event_type} event from {ip}")

        timeline.append({
            "id": f"{ts}-{ip}",
            "timestamp": ts,
            "severity": severity.lower(),
            "event_type": event_type,
            "description": desc,
            "ip_address": ip,
            "confidence": round(confidence, 2),
            "status": "auto_resolved" if confidence > 0.85 else "investigating"
        })

    return {"status": "success", "count": len(timeline), "events": timeline}


# ─── Playbook Status (Aggregated from log event types) ───────────────────────

@router.get("/playbooks")
async def get_playbooks(buffer: BufferService = Depends(get_buffer_service)):
    """Returns automation playbook status derived from log event patterns."""
    app_logger.info("Calculating playbook statuses")
    logs = buffer.get_recent_logs(500)

    # Count events by type
    event_counts = Counter(log.get("event_type", "unknown") for log in logs)
    threat_counts = Counter(
        log.get("event_type", "unknown") for log in logs
        if log.get("label") in ("Threat", "Suspicious")
    )
    total = len(logs)
    threats = sum(1 for log in logs if log.get("label") in ("Threat", "Suspicious"))

    playbooks = [
        {
            "name": "Brute Force Detection",
            "trigger": "login_failed",
            "status": "active" if event_counts.get("login_failed", 0) > 0 else "idle",
            "events_processed": event_counts.get("login_failed", 0),
            "threats_caught": threat_counts.get("login_failed", 0),
            "icon": "shield"
        },
        {
            "name": "Port Scan Analysis",
            "trigger": "port_access",
            "status": "active" if event_counts.get("port_access", 0) > 0 else "idle",
            "events_processed": event_counts.get("port_access", 0),
            "threats_caught": threat_counts.get("port_access", 0),
            "icon": "scan"
        },
        {
            "name": "SQL Injection Guard",
            "trigger": "web_request",
            "status": "active" if event_counts.get("web_request", 0) > 0 else "idle",
            "events_processed": event_counts.get("web_request", 0),
            "threats_caught": threat_counts.get("web_request", 0),
            "icon": "code"
        },
        {
            "name": "File Integrity Monitor",
            "trigger": "file_access",
            "status": "active" if event_counts.get("file_access", 0) > 0 else "idle",
            "events_processed": event_counts.get("file_access", 0),
            "threats_caught": threat_counts.get("file_access", 0),
            "icon": "file"
        }
    ]

    return {
        "status": "success",
        "total_events": total,
        "total_threats": threats,
        "automation_rate": round((threats / max(total, 1)) * 100, 1),
        "playbooks": playbooks
    }


# ─── AI Insights (ML model summary statistics) ──────────────────────────────

@router.get("/insights")
async def get_insights(buffer: BufferService = Depends(get_buffer_service)):
    """Returns AI/ML model performance insights derived from log analysis."""
    app_logger.info("Generating AI insights summary")
    logs = buffer.get_recent_logs(500)

    total = len(logs)
    threats = sum(1 for log in logs if log.get("label") == "Threat")
    suspicious = sum(1 for log in logs if log.get("label") == "Suspicious")
    normal = sum(1 for log in logs if log.get("label") == "Normal")

    # Average confidence
    confidences = [log.get("confidence", 0) for log in logs if log.get("confidence")]
    avg_confidence = round(sum(confidences) / max(len(confidences), 1), 3)

    # Top attacking IPs
    threat_ips = Counter(
        log.get("ip_address") for log in logs
        if log.get("label") in ("Threat", "Suspicious")
    )
    top_ips = threat_ips.most_common(5)

    # Recent trend (last 50 vs previous 50)
    last_50 = logs[-50:] if len(logs) >= 50 else logs
    prev_50 = logs[-100:-50] if len(logs) >= 100 else []
    recent_threats = sum(1 for l in last_50 if l.get("label") in ("Threat", "Suspicious"))
    prev_threats = sum(1 for l in prev_50 if l.get("label") in ("Threat", "Suspicious"))
    trend = "increasing" if recent_threats > prev_threats else "decreasing" if recent_threats < prev_threats else "stable"

    insights = [
        {
            "type": "stat",
            "title": "Model Accuracy",
            "value": f"{avg_confidence * 100:.1f}%",
            "description": f"Average ML confidence across {total} analyzed events"
        },
        {
            "type": "alert" if threats > 10 else "info",
            "title": "Threat Summary",
            "value": f"{threats} threats, {suspicious} suspicious",
            "description": f"Out of {total} total events analyzed. {normal} classified as normal."
        },
        {
            "type": "trend",
            "title": "Threat Trend",
            "value": trend.capitalize(),
            "description": f"Recent: {recent_threats} threats (last 50) vs {prev_threats} (previous 50)"
        },
        {
            "type": "intel",
            "title": "Top Threat Sources",
            "value": f"{len(top_ips)} unique IPs",
            "description": ", ".join([f"{ip} ({count})" for ip, count in top_ips]) if top_ips else "No threats detected"
        }
    ]

    return {
        "status": "success",
        "model_type": "RandomForest",
        "total_analyzed": total,
        "avg_confidence": avg_confidence,
        "insights": insights
    }


# ─── Network Topology (IP-based graph from logs) ────────────────────────────

@router.get("/topology")
async def get_topology(buffer: BufferService = Depends(get_buffer_service)):
    """Returns a network topology graph based on IP activity in logs."""
    app_logger.info("Rendering network topology graph data")
    logs = buffer.get_recent_logs(500)

    # Build nodes from unique IPs
    ip_data = defaultdict(lambda: {"events": 0, "threats": 0, "suspicious": 0, "event_types": set()})

    for log in logs:
        ip = log.get("ip_address", "unknown")
        ip_data[ip]["events"] += 1
        ip_data[ip]["event_types"].add(log.get("event_type", "unknown"))
        if log.get("label") == "Threat":
            ip_data[ip]["threats"] += 1
        elif log.get("label") == "Suspicious":
            ip_data[ip]["suspicious"] += 1

    nodes = []
    connections = []

    # Central node (our server)
    nodes.append({
        "id": "server",
        "label": "The Noir Core",
        "type": "server",
        "status": "active",
        "x": 50, "y": 50
    })

    # IP nodes arranged in a circle
    import math
    ip_list = list(ip_data.items())[:15]  # Limit to 15 nodes
    for i, (ip, data) in enumerate(ip_list):
        angle = (2 * math.pi * i) / max(len(ip_list), 1)
        radius = 35
        x = 50 + radius * math.cos(angle)
        y = 50 + radius * math.sin(angle)

        # Determine status based on actual label counts
        if data["threats"] > 0:
            status = "threat"
        elif data["suspicious"] > 0:
            status = "suspicious"
        else:
            status = "normal"

        nodes.append({
            "id": ip,
            "label": ip,
            "type": "endpoint",
            "status": status,
            "events": data["events"],
            "threats": data["threats"],
            "suspicious": data["suspicious"],
            "event_types": list(data["event_types"]),
            "x": round(x, 1),
            "y": round(y, 1)
        })

        connections.append({
            "from": ip,
            "to": "server",
            "status": status,
            "traffic": data["events"]
        })

    return {
        "status": "success",
        "node_count": len(nodes),
        "connection_count": len(connections),
        "nodes": nodes,
        "connections": connections
    }
