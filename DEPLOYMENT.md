# Deployment Guide

## GitHub 레포지토리 설정

### 1. GitHub에서 새 레포지토리 생성
1. GitHub.com에 로그인
2. 우측 상단 '+' 버튼 → 'New repository' 클릭
3. Repository 설정:
   - Repository name: `dart-financial-comparison`
   - Description: `DART OpenAPI를 활용한 기업 재무정보 비교 분석 시스템`
   - Public 선택
   - Initialize 옵션들은 모두 체크 해제 (이미 로컬에 파일이 있으므로)

### 2. 로컬 레포지토리를 GitHub에 연결
```bash
cd dart_financial_comparison

# Remote 추가 (your-username을 실제 GitHub 사용자명으로 변경)
git remote add origin https://github.com/your-username/dart-financial-comparison.git

# 푸시
git push -u origin master
```

## Vercel 배포 설정

### 1. Vercel 계정 설정
1. https://vercel.com 접속
2. GitHub으로 로그인 (권장)

### 2. 프로젝트 배포

#### 방법 1: Vercel Dashboard 사용
1. Vercel Dashboard → "Add New..." → "Project"
2. GitHub 레포지토리 연결
3. `dart-financial-comparison` 레포지토리 선택
4. Framework Preset: Next.js 자동 감지
5. Root Directory: `frontend` 설정
6. Environment Variables 추가:
   ```
   NEXT_PUBLIC_API_URL = https://your-backend-api.com
   ```
7. Deploy 클릭

#### 방법 2: Vercel CLI 사용
```bash
# Vercel CLI 설치
npm i -g vercel

# 프론트엔드 디렉토리에서 실행
cd frontend
vercel

# 프롬프트 따라 설정
# - Link to existing project? No (처음이면)
# - What's your project's name? dart-financial-comparison
# - In which directory is your code located? ./
# - Want to modify settings? N
```

### 3. 백엔드 배포 옵션

#### Option A: Vercel Functions (추천)
1. `frontend/api` 디렉토리 생성
2. FastAPI 엔드포인트를 Vercel Functions로 변환
3. `vercel.json` 설정:
```json
{
  "functions": {
    "api/*.py": {
      "runtime": "python3.9"
    }
  }
}
```

#### Option B: Railway 사용
1. https://railway.app 접속
2. GitHub으로 로그인
3. New Project → Deploy from GitHub repo
4. 레포지토리 선택 → `dart-financial-comparison`
5. Service 설정:
   - Root Directory: `/backend`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Environment Variables 추가:
   ```
   DART_API_KEY = your_dart_api_key
   ```
7. Deploy

#### Option C: Render 사용
1. https://render.com 접속
2. New → Web Service
3. GitHub 레포지토리 연결
4. 설정:
   - Name: dart-financial-api
   - Root Directory: backend
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Environment Variables 추가
6. Create Web Service

### 4. 환경 변수 설정

#### 필수 환경 변수
- **Backend**:
  ```
  DART_API_KEY=your_dart_api_key_here
  ```

- **Frontend**:
  ```
  NEXT_PUBLIC_API_URL=https://your-backend-url.com
  ```

### 5. 도메인 설정 (선택사항)
1. Vercel Dashboard → Settings → Domains
2. Add Domain
3. DNS 설정 (도메인 제공업체에서 설정)

## CI/CD 설정

### GitHub Actions 워크플로우
`.github/workflows/deploy.yml` 파일이 이미 설정되어 있으면:
- `main` 브랜치에 push 시 자동 배포
- PR 시 테스트 자동 실행

## 배포 체크리스트

- [ ] GitHub 레포지토리 생성 완료
- [ ] 코드 푸시 완료
- [ ] DART API 키 발급 (https://opendart.fss.or.kr/)
- [ ] 백엔드 배포 완료
- [ ] 백엔드 URL 확인
- [ ] 프론트엔드 환경 변수 설정
- [ ] 프론트엔드 배포 완료
- [ ] 전체 시스템 테스트

## 문제 해결

### CORS 에러
백엔드 `main.py`에서 CORS 설정 확인:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["your-frontend-url.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### API 연결 실패
1. 백엔드 로그 확인
2. 환경 변수 확인
3. 네트워크 설정 확인

## 모니터링
- Vercel Dashboard에서 프론트엔드 로그 확인
- Railway/Render Dashboard에서 백엔드 로그 확인