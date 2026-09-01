import os
import sys
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """
    Centralized Configuration Management for the SOC Backend.
    Validates environment variables on startup.
    """
    # API Settings
    API_PORT: int = 8000
    API_HOST: str = "0.0.0.0"
    ENVIRONMENT: str = "development"
    
    # LLM Settings
    GROQ_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"
    MODEL_NAME: str = "groq/compound"
    
    # Elasticsearch Settings
    ELASTICSEARCH_URL: str = "http://localhost:9200"
    ES_LOG_INDEX: str = "server-logs-*"
    
    # Paths
    LIVE_LOGS_PATH: str = "data/live_logs.jsonl"
    REPORTS_PATH: str = "data/incident_reports.jsonl"
    MODEL_PATH: str = "app/models/threat_model.pkl"
    METADATA_PATH: str = "app/models/model_metadata.pkl"

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

# Singleton instance
settings = Settings()
