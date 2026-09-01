import logging
import sys
from app.core.config import settings

def setup_logger(name: str) -> logging.Logger:
    """Configures and returns a structured logger."""
    logger = logging.getLogger(name)
    
    # Only configure if no handlers exist to avoid duplicate logs in uvicorn
    if not logger.handlers:
        logger.setLevel(logging.INFO if settings.ENVIRONMENT == "production" else logging.DEBUG)
        
        # Create console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.DEBUG)
        
        # Create formatter
        formatter = logging.Formatter(
            '%(asctime)s | %(levelname)-8s | [%(name)s] %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)
        
    return logger

# Create the main application logger
app_logger = setup_logger("soc_backend")
