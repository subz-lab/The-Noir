from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.core.config import settings
from app.core.logger import app_logger
from app.routers import logs, detections, reports, dashboard, soar
from app.routers import agents  # Agentic AI — Gap 1

app = FastAPI(
    title="AI-Powered SOC Automation API",
    description="Backend hub for ML-based threat detection, LLM-powered incident reporting, and Agentic AI collaboration.",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app_logger.info("Initializing SOC Automation API Routes v2 (Agentic AI)")

# Existing routers
app.include_router(logs.router,       prefix="/api/logs",       tags=["Logs"])
app.include_router(detections.router, prefix="/api/detections", tags=["Detections"])
app.include_router(reports.router,    prefix="/api/reports",    tags=["Reports"])
app.include_router(dashboard.router,  prefix="/api/dashboard",  tags=["Dashboard"])
app.include_router(soar.router,       prefix="/api/soar",       tags=["SOAR"])

# Agentic AI router — Gap 1
app.include_router(agents.router,     prefix="/api/agents",     tags=["Agents"])

@app.on_event("startup")
async def startup_event():
    """Auto-starts continuous live telemetry stream on backend launch."""
    try:
        from app.services.continuous_streamer import get_streamer_service
        streamer = get_streamer_service()
        streamer.start(delay=2.0)
        app_logger.info("[Startup] Autonomous Continuous Telemetry Stream initialized & active")
    except Exception as e:
        app_logger.warning(f"[Startup] Failed to start continuous streamer: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Stops continuous background workers gracefully on shutdown."""
    try:
        from app.services.continuous_streamer import get_streamer_service
        get_streamer_service().stop()
    except Exception:
        pass

@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "SOC Automation API is operational (Agentic AI v2)",
        "version": "2.0.0",
        "agents": ["LogAnalysisAgent", "ThreatInvestigationAgent"],
        "new_endpoints": [
            "POST /api/agents/process",
            "GET  /api/agents/status",
            "GET  /api/agents/incidents",
            "GET  /api/agents/activity",
            "GET  /api/reports/{id}/download",
        ]
    }

if __name__ == "__main__":
    import uvicorn
    app_logger.info(f"Starting server on {settings.API_HOST}:{settings.API_PORT}")
    uvicorn.run("app.main:app", host=settings.API_HOST, port=settings.API_PORT, reload=True)
