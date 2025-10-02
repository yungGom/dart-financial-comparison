"""
Vercel Serverless Function Entry Point
FastAPI 앱을 Vercel에서 실행하기 위한 진입점
"""
from backend.app.main import app

# Vercel은 이 app 객체를 찾아서 실행합니다
handler = app