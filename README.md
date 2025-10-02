# DART Financial Comparison System

## 📊 개요
DART OpenAPI를 활용한 기업 재무정보 비교 분석 시스템

## 🚀 주요 기능
- 다중 기업 재무제표 조회 및 비교
- 재무비율 자동 계산 (ROE, ROA, 유동비율 등)
- 감사인 및 회계기준 정보 추출
- Excel 파일 다운로드
- 시계열 분석 및 차트 시각화

## 🛠 기술 스택
- **Backend**: FastAPI, Python 3.9+
- **Frontend**: Next.js, React, TypeScript
- **Database**: PostgreSQL (optional)
- **Deployment**: Vercel

## 📦 프로젝트 구조
```
dart_financial_comparison/
├── backend/          # FastAPI 백엔드
│   ├── app/         # 애플리케이션 코드
│   └── tests/       # 백엔드 테스트
├── frontend/        # Next.js 프론트엔드
│   ├── src/         # 소스 코드
│   └── __tests__/   # 프론트엔드 테스트
└── tests/           # 통합 테스트
```

## 🔧 설치 및 실행

### 사전 요구사항
- Python 3.9+
- Node.js 18+
- DART API Key ([Open DART](https://opendart.fss.or.kr/)에서 발급)

### 백엔드 설정
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
```

### 환경 변수 설정
```bash
# backend/.env 파일 생성
DART_API_KEY=your_dart_api_key_here
```

### 백엔드 실행
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### 프론트엔드 설정 및 실행
```bash
cd frontend
npm install
npm run dev
```

## 🧪 테스트
```bash
# 백엔드 테스트
cd backend
pytest tests/

# 프론트엔드 테스트
cd frontend
npm test
```

## 📝 API 문서
백엔드 실행 후: http://localhost:8000/docs

## 🚀 배포
Vercel을 통한 자동 배포 (main 브랜치 push 시)

## 📄 라이센스
MIT

## 👨‍💻 개발자
- GitHub: [yungGom]

## 🤝 기여
Issues와 Pull Requests 환영합니다!
