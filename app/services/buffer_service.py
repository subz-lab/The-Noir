import json
import os
from typing import List, Dict, Any
from fastapi import WebSocket
from app.core.logger import app_logger
from app.core.config import settings

class ConnectionManager:
    """Manages active WebSocket connections for real-time telemetry broadcast."""
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        app_logger.debug(f"New WS connection. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            app_logger.debug(f"WS disconnected. Total active: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                app_logger.warning(f"Failed to broadcast to a WS client: {e}")
                pass # Connection might be dead, disconnect handling usually catches this later

class BufferService:
    """
    Manages the in-memory sliding window buffer of recent telemetry logs.
    Handles persistence of these live logs to the local filesystem payload.
    """
    def __init__(self, max_size: int = 1000):
        self.max_size = max_size
        self.live_logs: List[Dict[str, Any]] = self._load_live_logs()
        self.manager = ConnectionManager()
        
    def _load_live_logs(self) -> List[Dict[str, Any]]:
        logs = []
        if os.path.exists(settings.LIVE_LOGS_PATH):
            try:
                with open(settings.LIVE_LOGS_PATH, "r", encoding="utf-8") as f:
                    for line in f:
                        if line.strip():
                            logs.append(json.loads(line))
                app_logger.info(f"Loaded {len(logs)} logs from {settings.LIVE_LOGS_PATH}")
            except Exception as e:
                app_logger.error(f"Error loading live logs: {e}", exc_info=True)
        return logs

    def save_live_log(self, log_dict: dict):
        """Persist a single log entry."""
        try:
            os.makedirs(os.path.dirname(settings.LIVE_LOGS_PATH), exist_ok=True)
            with open(settings.LIVE_LOGS_PATH, "a", encoding="utf-8") as f:
                f.write(json.dumps(log_dict) + "\n")
        except Exception as e:
            app_logger.error(f"Error saving live log: {e}", exc_info=True)

    def save_live_logs_batch(self, log_dicts: List[Dict[str, Any]]):
        """Persist a batch of log entries efficiently."""
        try:
            os.makedirs(os.path.dirname(settings.LIVE_LOGS_PATH), exist_ok=True)
            with open(settings.LIVE_LOGS_PATH, "a", encoding="utf-8") as f:
                for log_dict in log_dicts:
                    f.write(json.dumps(log_dict) + "\n")
        except Exception as e:
             app_logger.error(f"Error saving live logs batch: {e}", exc_info=True)

    def add_log(self, enriched_log: dict):
        """Adds a log to the internal buffer and persists it."""
        self.live_logs.append(enriched_log)
        
        # Maintain sliding window size
        if len(self.live_logs) > self.max_size:
            self.live_logs.pop(0)
            
        self.save_live_log(enriched_log)

    def add_batch(self, enriched_logs: List[Dict[str, Any]]):
        """Adds a batch of logs to the internal buffer and persists them."""
        self.live_logs.extend(enriched_logs)
        
        # Maintain sliding window size
        if len(self.live_logs) > self.max_size:
            del self.live_logs[:-self.max_size]
            
        self.save_live_logs_batch(enriched_logs)

    def get_recent_logs(self, limit: int) -> List[Dict[str, Any]]:
        """Returns the N most recent logs from the buffer."""
        return self.live_logs[-limit:]
        
# Singleton instance
buffer_service = BufferService()

def get_buffer_service() -> BufferService:
    return buffer_service
