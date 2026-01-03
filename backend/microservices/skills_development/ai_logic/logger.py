"""
Logging Utility
Provides consistent logging across the application.
"""

import logging
from datetime import datetime
from typing import Literal

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

logger = logging.getLogger("NewsletterAgent")

def log(
    message: str, 
    level: Literal["INFO", "WARNING", "ERROR", "DEBUG"] = "INFO"
):
    """
    Centralized logging function.
    
    Args:
        message: Log message
        level: Log level (INFO, WARNING, ERROR, DEBUG)
    """
    if level == "INFO":
        logger.info(message)
    elif level == "WARNING":
        logger.warning(message)
    elif level == "ERROR":
        logger.error(message)
    elif level == "DEBUG":
        logger.debug(message)
    else:
        logger.info(message)
    
    # Also print to console for immediate visibility
    print(message)