"""
Base Agent — Foundation for all specialized SOC AI agents.

Each agent has:
  - A unique name and role description
  - A context window (recent observations + memory)
  - A tool registry (callable capabilities)
  - A decision loop (observe → think → act → report)
  - A status tracker (idle / running / done / error)
"""

import asyncio
import uuid
from abc import ABC, abstractmethod
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Dict, List, Optional


class AgentStatus(str, Enum):
    IDLE    = "idle"
    RUNNING = "running"
    DONE    = "done"
    ERROR   = "error"


class AgentContext:
    """Sliding-window memory shared within one agent run."""

    def __init__(self, max_size: int = 100):
        self.observations: List[Dict[str, Any]] = []
        self.max_size = max_size
        self.metadata: Dict[str, Any] = {}

    def add_observation(self, obs: Dict[str, Any]) -> None:
        self.observations.append({**obs, "ts": datetime.utcnow().isoformat()})
        if len(self.observations) > self.max_size:
            self.observations.pop(0)

    def get_recent(self, n: int = 10) -> List[Dict[str, Any]]:
        return self.observations[-n:]

    def set(self, key: str, value: Any) -> None:
        self.metadata[key] = value

    def get(self, key: str, default: Any = None) -> Any:
        return self.metadata.get(key, default)


class AgentTool:
    """A named, callable capability registered with an agent."""

    def __init__(self, name: str, description: str, fn: Callable):
        self.name = name
        self.description = description
        self._fn = fn

    async def run(self, **kwargs) -> Any:
        if asyncio.iscoroutinefunction(self._fn):
            return await self._fn(**kwargs)
        return self._fn(**kwargs)


class BaseAgent(ABC):
    """
    Abstract base class for all SOC agents.

    Subclasses implement:
      - `setup_tools()` — register AgentTool objects
      - `run(payload)` — agentic decision loop
    """

    def __init__(self, name: str, role: str):
        self.agent_id: str = str(uuid.uuid4())[:8]
        self.name = name
        self.role = role
        self.status: AgentStatus = AgentStatus.IDLE
        self.context: AgentContext = AgentContext()
        self.tools: Dict[str, AgentTool] = {}
        self.activity_log: List[Dict[str, Any]] = []
        self.created_at: str = datetime.utcnow().isoformat()
        self.last_run_at: Optional[str] = None
        self.setup_tools()

    # ------------------------------------------------------------------ #
    #  Tool management                                                     #
    # ------------------------------------------------------------------ #
    def register_tool(self, tool: AgentTool) -> None:
        self.tools[tool.name] = tool

    async def use_tool(self, tool_name: str, **kwargs) -> Any:
        if tool_name not in self.tools:
            raise ValueError(f"Agent '{self.name}' has no tool named '{tool_name}'")
        self._log_activity(f"Using tool: {tool_name}", kwargs)
        result = await self.tools[tool_name].run(**kwargs)
        self._log_activity(f"Tool '{tool_name}' completed", {"result_type": type(result).__name__})
        return result

    # ------------------------------------------------------------------ #
    #  Activity logging                                                    #
    # ------------------------------------------------------------------ #
    def _log_activity(self, action: str, details: Optional[Dict] = None) -> None:
        entry = {
            "agent": self.name,
            "agent_id": self.agent_id,
            "action": action,
            "details": details or {},
            "timestamp": datetime.utcnow().isoformat(),
        }
        self.activity_log.append(entry)
        # Keep only last 200 entries
        if len(self.activity_log) > 200:
            self.activity_log.pop(0)

    # ------------------------------------------------------------------ #
    #  Lifecycle                                                           #
    # ------------------------------------------------------------------ #
    async def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Public entry point — wraps run() with status management."""
        self.status = AgentStatus.RUNNING
        self.last_run_at = datetime.utcnow().isoformat()
        self._log_activity("Agent started", {"payload_keys": list(payload.keys())})
        try:
            result = await self.run(payload)
            self.status = AgentStatus.DONE
            self._log_activity("Agent completed successfully")
            return result
        except Exception as exc:
            self.status = AgentStatus.ERROR
            self._log_activity("Agent error", {"error": str(exc)})
            raise

    # ------------------------------------------------------------------ #
    #  Abstract interface                                                  #
    # ------------------------------------------------------------------ #
    @abstractmethod
    def setup_tools(self) -> None:
        """Register all tools this agent can use."""
        ...

    @abstractmethod
    async def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Core agentic decision loop — observe, think, act, report."""
        ...

    # ------------------------------------------------------------------ #
    #  Serialization                                                       #
    # ------------------------------------------------------------------ #
    def status_snapshot(self) -> Dict[str, Any]:
        return {
            "agent_id": self.agent_id,
            "name": self.name,
            "role": self.role,
            "status": self.status.value,
            "created_at": self.created_at,
            "last_run_at": self.last_run_at,
            "tools": list(self.tools.keys()),
            "recent_activity": self.activity_log[-5:],
        }
