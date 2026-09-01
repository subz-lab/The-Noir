from typing import List, Dict, Optional
from datetime import datetime
import json
import uuid

# In-memory storage for playbooks and action logs to simulate a database.
_PLAYBOOKS: Dict[str, dict] = {}
_ACTION_LOGS: List[dict] = []

def get_db_playbooks():
    return _PLAYBOOKS

def get_db_action_logs():
    return _ACTION_LOGS
