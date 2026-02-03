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

# Vercel 서버리스 환경 감지
IS_VERCEL = os.getenv("VERCEL", "") == "1"

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

    # Cache Configuration - Vercel은 /tmp만 쓰기 가능
    cache_dir: Path = Path("/tmp/dart_cache") if IS_VERCEL else Path(__file__).parent.parent.parent / "data" / "cache"
    cache_ttl: int = 3600  # 1 hour in seconds

    # Data Configuration
    max_companies_per_request: int = 10
    max_years_per_request: int = 5

    class Config:
        env_file = ".env"
        case_sensitive = False

# Create settings instance
settings = Settings()

# Create cache directory if it doesn't exist (safe for both local and Vercel)
try:
    settings.cache_dir.mkdir(parents=True, exist_ok=True)
except OSError:
    # Vercel 환경에서 실패하면 무시 (캐시 없이 동작)
    pass