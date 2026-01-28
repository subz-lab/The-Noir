from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import logs, detections, reports

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

# Include Routers
app.include_router(logs.router, prefix="/api/logs", tags=["Logs"])
app.include_router(detections.router, prefix="/api/detections", tags=["Detections"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])

@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "SOC Automation API is operational",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
