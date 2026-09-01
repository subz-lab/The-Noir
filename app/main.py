from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.core.config import settings
from app.core.logger import app_logger
from app.routers import logs, detections, reports, dashboard, soar

app = FastAPI(
    title="AI-Powered SOC Automation API",
    description="Backend hub for ML-based threat detection and LLM-powered incident reporting.",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app_logger.info("Initializing SOC Automation API Routes")

# Include Routers
app.include_router(logs.router, prefix="/api/logs", tags=["Logs"])
app.include_router(detections.router, prefix="/api/detections", tags=["Detections"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(soar.router, prefix="/api/soar", tags=["SOAR"])

@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "SOC Automation API is operational",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    app_logger.info(f"Starting server on {settings.API_HOST}:{settings.API_PORT}")
    uvicorn.run("app.main:app", host=settings.API_HOST, port=settings.API_PORT, reload=True)
