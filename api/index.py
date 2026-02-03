"""
Vercel Serverless Function Entry Point
FastAPI 앱을 Vercel에서 실행하기 위한 진입점
"""
import sys
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.main import app

# Vercel Python Runtime은 ASGI app을 직접 지원
handler = app