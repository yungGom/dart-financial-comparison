"""
Configuration module for DART Financial Comparison System
"""
import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

class Settings(BaseSettings):
    """Application settings"""

    # DART API Configuration
    dart_api_key: str = os.getenv("DART_API_KEY", "")
    dart_base_url: str = "https://opendart.fss.or.kr/api"

    # Server Configuration
    server_host: str = os.getenv("SERVER_HOST", "0.0.0.0")
    server_port: int = int(os.getenv("SERVER_PORT", "8000"))

    # CORS Configuration
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # Cache Configuration
    cache_dir: Path = Path(__file__).parent.parent.parent / "data" / "cache"
    cache_ttl: int = 3600  # 1 hour in seconds

    # Data Configuration
    max_companies_per_request: int = 10
    max_years_per_request: int = 5

    class Config:
        env_file = ".env"
        case_sensitive = False

# Create settings instance
settings = Settings()

# Create cache directory if it doesn't exist
settings.cache_dir.mkdir(parents=True, exist_ok=True)