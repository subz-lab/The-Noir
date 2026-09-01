import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from app.schemas.soar import PlaybookCreate, Playbook, Action, ActionLog
from app.models.soar import get_db_playbooks, get_db_action_logs
from app.core.logger import app_logger

class SoarService:
    def __init__(self):
        self.playbooks = get_db_playbooks()
        self.action_logs = get_db_action_logs()
        # Cooldown tracker: (playbook_id, ip) -> last_triggered_time
        self._cooldowns: Dict[str, datetime] = {}
        self._cooldown_seconds = 30  # Don't re-trigger same playbook for same IP within 30s
        self._seed_initial_data()

    def _seed_initial_data(self):
        if not self.playbooks:
            # 1. High Severity / Brute Force playbook
            pb1 = Playbook(
                name="Auto-Block Malicious IP",
                description="Blocks the source IP when a high-severity threat is detected (e.g., brute force)",
                trigger_type="High Severity",
                is_active=True,
                actions=[
                    Action(name="Block IP Address", action_type="block_ip", params={"target": "source_ip"})
                ]
            )
            self.playbooks[pb1.id] = pb1.dict()

            # 2. SQL Injection playbook
            pb2 = Playbook(
                name="SQL Injection Defense",
                description="Blocks attacker IP and sends WAF alert when SQL injection is detected",
                trigger_type="SQL Injection",
                is_active=True,
                actions=[
                    Action(name="Block Attacker IP", action_type="block_ip", params={"target": "source_ip"}),
                    Action(name="Send WAF Alert", action_type="send_email", params={"template": "sql_injection_alert"})
                ]
            )
            self.playbooks[pb2.id] = pb2.dict()

            # 3. Port Scan playbook
            pb3 = Playbook(
                name="Port Scan Containment",
                description="Blocks scanning IP and quarantines the targeted host on port scan detection",
                trigger_type="Port Scan",
                is_active=True,
                actions=[
                    Action(name="Block Scanner IP", action_type="block_ip", params={"target": "source_ip"}),
                    Action(name="Quarantine Target Host", action_type="quarantine", params={"scope": "network_segment"})
                ]
            )
            self.playbooks[pb3.id] = pb3.dict()

    def get_playbooks(self) -> List[Playbook]:
        return [Playbook(**pb) for pb in self.playbooks.values()]
        
    def get_playbook(self, playbook_id: str) -> Optional[Playbook]:
        pb_data = self.playbooks.get(playbook_id)
        if pb_data:
            return Playbook(**pb_data)
        return None

    def create_playbook(self, playbook_in: PlaybookCreate) -> Playbook:
        actions = []
        for act in playbook_in.actions:
            actions.append(Action(name=act.name, action_type=act.action_type, params=act.params))
            
        pb = Playbook(
            name=playbook_in.name,
            description=playbook_in.description,
            trigger_type=playbook_in.trigger_type,
            is_active=playbook_in.is_active,
            actions=actions
        )
        self.playbooks[pb.id] = pb.dict()
        app_logger.info(f"Created new SOAR playbook: {pb.name} ({pb.id})")
        return pb

    def execute_playbook(self, playbook_id: str, incident_data: Dict[str, Any]) -> List[ActionLog]:
        playbook = self.get_playbook(playbook_id)
        if not playbook:
            raise ValueError(f"Playbook {playbook_id} not found")
            
        if not playbook.is_active:
            app_logger.info(f"Skipping execution of inactive playbook {playbook_id}")
            return []

        app_logger.info(f"Executing playbook {playbook.name} for incident {incident_data.get('id', 'unknown')}")
        
        execution_logs = []
        for action in playbook.actions:
            # Simulate action execution
            app_logger.info(f"Executing action {action.action_type} - {action.name}")
            status = "success"
            details = f"Successfully executed {action.action_type}"
            
            # Simple mock logic — check both ip_address (ML enriched) and source_ip (manual)
            if action.action_type == "block_ip":
                ip_to_block = incident_data.get("ip_address") or incident_data.get("source_ip", "unknown")
                details = f"Blocked IP {ip_to_block} via firewall integration"
            elif action.action_type == "quarantine":
                host = incident_data.get("asset") or incident_data.get("ip_address") or incident_data.get("source_ip", "unknown")
                details = f"Quarantined host {host}"
            elif action.action_type == "send_email":
                details = f"Sent alert email to SOC team"
                
            log_entry = ActionLog(
                playbook_id=playbook_id,
                incident_id=incident_data.get("id"),
                action_type=action.action_type,
                status=status,
                details=details
            )
            self.action_logs.append(log_entry.dict())
            execution_logs.append(log_entry)
            
        return execution_logs

    def check_and_trigger_playbooks(self, detection: Dict[str, Any]) -> List[ActionLog]:
        """Check if any playbooks match the detection and trigger them."""
        all_logs = []
        trigger_types = []
        
        # ML model outputs 'label' instead of 'prediction' in the enriched dictionary
        if "label" in detection and isinstance(detection["label"], str):
            label = detection["label"]
            if label.lower() == "threat" or label.lower() == "critical":
                trigger_types.append("High Severity")
            elif label.lower() == "suspicious":
                trigger_types.append("Suspicious")
            else:
                trigger_types.append(label)
                
        # ML model outputs 'severity_index' instead of 'severity' string
        severity_index = detection.get("severity_index", 0)
        if severity_index is not None and int(severity_index) >= 2:
            if "High Severity" not in trigger_types:
                trigger_types.append("High Severity")
        elif severity_index is not None and int(severity_index) == 1:
            if "Suspicious" not in trigger_types:
                trigger_types.append("Suspicious")

        # Detect specific attack types from ML features
        features = detection.get("features", {})
        # If no nested features, check top-level keys (enriched logs flatten features)
        sql_flag = features.get("sql_flag") if features else detection.get("sql_flag")
        unique_ports = features.get("unique_ports_accessed") if features else detection.get("unique_ports_accessed")
        event_type = detection.get("event_type", "")

        # SQL Injection: sql_flag is set or payload contains SQL patterns
        if sql_flag and int(sql_flag) >= 1:
            trigger_types.append("SQL Injection")

        # Port Scan: many unique ports accessed or event_type is port_access
        if unique_ports is not None and int(unique_ports) >= 5:
            trigger_types.append("Port Scan")
        elif event_type == "port_access":
            trigger_types.append("Port Scan")

        # Also check if it's explicitly typed in the telemetry object
        if "type" in detection and isinstance(detection["type"], str):
            trigger_types.append(detection["type"])

        # Deduplicate trigger types
        trigger_types = list(set(trigger_types))

        app_logger.info(f"Checking playbooks for triggers: {trigger_types}")

        # Deduplication: use IP + playbook ID as cooldown key
        source_ip = detection.get("ip_address") or detection.get("source_ip", "unknown")
        now = datetime.utcnow()

        for pb in self.get_playbooks():
            if pb.is_active and pb.trigger_type in trigger_types:
                cooldown_key = f"{pb.id}:{source_ip}"
                last_triggered = self._cooldowns.get(cooldown_key)
                
                if last_triggered and (now - last_triggered).total_seconds() < self._cooldown_seconds:
                    app_logger.info(f"Skipping playbook {pb.name} for {source_ip} (cooldown active)")
                    continue
                    
                try:
                    logs = self.execute_playbook(pb.id, detection)
                    all_logs.extend(logs)
                    self._cooldowns[cooldown_key] = now
                except Exception as e:
                    app_logger.error(f"Failed to execute playbook {pb.id}: {str(e)}")
                    
        return all_logs

    def get_action_history(self, limit: int = 50) -> List[ActionLog]:
        # Return sorted by timestamp desc
        sorted_logs = sorted(self.action_logs, key=lambda x: x['timestamp'], reverse=True)
        return [ActionLog(**log) for log in sorted_logs[:limit]]

soar_service = SoarService()
