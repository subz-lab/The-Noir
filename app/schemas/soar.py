from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

class ActionBase(BaseModel):
    name: str = Field(..., description="Name of the action")
    action_type: str = Field(..., description="Type of action (e.g., 'block_ip', 'send_email', 'quarantine')")
    params: Dict[str, Any] = Field(default={}, description="Parameters required for the action")

class ActionCreate(ActionBase):
    pass

class Action(ActionBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))

class PlaybookBase(BaseModel):
    name: str = Field(..., description="Name of the playbook")
    description: Optional[str] = Field(None, description="Detailed description")
    trigger_type: str = Field(..., description="The type of alert or condition that triggers this playbook (e.g., 'SQL Injection', 'Brute Force')")
    is_active: bool = Field(default=True, description="Whether the playbook is currently active")

class PlaybookCreate(PlaybookBase):
    actions: List[ActionCreate] = Field(default=[], description="List of actions to perform")

class Playbook(PlaybookBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    actions: List[Action] = Field(default=[], description="List of actions to perform")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ActionLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    playbook_id: Optional[str] = None
    incident_id: Optional[str] = None
    action_type: str
    status: str = Field(..., description="'success', 'failed', 'pending'")
    details: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
