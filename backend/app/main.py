"""
FastAPI Main Application
DART Financial Comparison System Backend
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import List, Optional, Dict, Any
import pandas as pd
import io
from datetime import datetime

from .config import settings
from .dart_client import dart_client
from .calculator import calculator

# Create FastAPI app
app = FastAPI(
    title="DART Financial Comparison API",
    description="DART OpenAPI를 활용한 기업 재무정보 비교 분석 시스템",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """API 상태 확인"""
    return {
        "status": "running",
        "message": "DART Financial Comparison API",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/companies/search")
async def search_companies(
    q: str = Query(..., description="검색할 회사명"),
) -> List[Dict[str, str]]:
    """
    회사명으로 기업 검색

    Args:
        q: 검색 쿼리 (부분 일치)

    Returns:
        매칭되는 기업 리스트
    """
    if not q or len(q) < 2:
        raise HTTPException(status_code=400, detail="검색어는 2글자 이상 입력해주세요.")

    results = dart_client.search_companies(q)

    if not results:
        return []

    return results


@app.get("/api/financial/statements")
async def get_financial_statements(
    corp_codes: List[str] = Query(..., description="기업 고유번호 리스트"),
    years: List[str] = Query(..., description="조회할 연도 리스트")
) -> Dict[str, Any]:
    """
    여러 기업의 재무제표 조회

    Args:
        corp_codes: 기업 고유번호 리스트
        years: 조회할 연도 리스트

    Returns:
        재무제표 데이터
    """
    if len(corp_codes) > settings.max_companies_per_request:
        raise HTTPException(
            status_code=400,
            detail=f"최대 {settings.max_companies_per_request}개 기업까지 조회 가능합니다."
        )

    if len(years) > settings.max_years_per_request:
        raise HTTPException(
            status_code=400,
            detail=f"최대 {settings.max_years_per_request}개 연도까지 조회 가능합니다."
        )

    results = dart_client.get_multiple_financial_statements(corp_codes, years)

    if not results:
        raise HTTPException(status_code=404, detail="재무제표 데이터를 찾을 수 없습니다.")

    return results


@app.get("/api/financial/ratios")
async def calculate_financial_ratios(
    corp_codes: List[str] = Query(..., description="기업 고유번호 리스트"),
    years: List[str] = Query(..., description="조회할 연도 리스트")
) -> Dict[str, Any]:
    """
    재무비율 계산

    Args:
        corp_codes: 기업 고유번호 리스트
        years: 조회할 연도 리스트

    Returns:
        계산된 재무비율
    """
    # Get financial statements
    statements_data = dart_client.get_multiple_financial_statements(corp_codes, years)

    if not statements_data:
        raise HTTPException(status_code=404, detail="재무제표 데이터를 찾을 수 없습니다.")

    # Calculate ratios for each company-year combination
    ratios_results = {}

    for key, data in statements_data.items():
        corp_code, year = key.split('_')
        statements = data.get('list', [])

        if statements:
            # Get company name from statements
            company_name = statements[0].get('corp_name', '')

            ratios = calculator.calculate_all_ratios(statements)
            ratios_results[key] = {
                'corp_code': corp_code,
                'company_name': company_name,
                'year': year,
                'ratios': ratios
            }

    return ratios_results


@app.get("/api/financial/audit-info")
async def get_audit_info(
    rcept_no: str = Query(..., description="접수번호")
) -> Dict[str, Any]:
    """
    감사 정보 조회

    Args:
        rcept_no: 보고서 접수번호

    Returns:
        감사인, 회계기준 등 정보
    """
    html_content = dart_client.get_audit_report(rcept_no)

    if not html_content:
        raise HTTPException(status_code=404, detail="감사보고서를 찾을 수 없습니다.")

    audit_info = dart_client.extract_audit_info(html_content)

    return audit_info


@app.post("/api/financial/comparison")
async def create_comparison(
    request_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    기업 재무정보 비교 분석

    Request body:
        {
            "companies": [
                {"corp_code": "...", "name": "..."},
                ...
            ],
            "years": ["2023", "2022", ...],
            "include_ratios": true,
            "include_audit": false
        }
    """
    companies = request_data.get('companies', [])
    years = request_data.get('years', [])
    include_ratios = request_data.get('include_ratios', True)
    include_audit = request_data.get('include_audit', False)

    if not companies or not years:
        raise HTTPException(status_code=400, detail="기업과 연도를 선택해주세요.")

    comparison_data = {}

    # Fetch financial statements
    for company in companies:
        corp_code = company['corp_code']
        company_name = company['name']

        for year in years:
            key = f"{corp_code}_{year}"
            statements = dart_client.get_financial_statements(corp_code, year)

            if statements:
                comparison_data[key] = {
                    'statements': statements.get('list', []),
                    'company_name': company_name,
                    'year': year,
                    'corp_code': corp_code
                }

                if include_ratios:
                    ratios = calculator.calculate_all_ratios(statements.get('list', []))
                    comparison_data[key]['ratios'] = ratios

                if include_audit and statements.get('list'):
                    rcept_no = statements['list'][0].get('rcept_no')
                    if rcept_no:
                        audit_html = dart_client.get_audit_report(rcept_no)
                        if audit_html:
                            audit_info = dart_client.extract_audit_info(audit_html)
                            comparison_data[key]['audit_info'] = audit_info

    # Create comparison table
    comparison_df = calculator.create_comparison_table(comparison_data)

    return {
        'data': comparison_data,
        'summary': comparison_df.to_dict('records')
    }


@app.post("/api/export/excel")
async def export_to_excel(
    request_data: Dict[str, Any]
) -> StreamingResponse:
    """
    재무정보 비교 결과를 Excel 파일로 내보내기

    Request body:
        {
            "comparison_data": {...},
            "include_charts": false
        }
    """
    comparison_data = request_data.get('comparison_data', {})

    if not comparison_data:
        raise HTTPException(status_code=400, detail="내보낼 데이터가 없습니다.")

    # Create Excel file in memory
    output = io.BytesIO()

    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        # Summary sheet
        summary_df = calculator.create_comparison_table(comparison_data)
        summary_df.to_excel(writer, sheet_name='요약', index=False)

        # Detailed sheets for each company-year
        for key, data in comparison_data.items():
            company_name = data.get('company_name', '')
            year = data.get('year', '')
            sheet_name = f"{company_name}_{year}"[:31]  # Excel sheet name limit

            if 'statements' in data:
                df = calculator.extract_financial_data(data['statements'])
                if not df.empty:
                    df.to_excel(writer, sheet_name=sheet_name, index=False)

    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename=financial_comparison_{datetime.now().strftime('%Y%m%d')}.xlsx"
        }
    )


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "dart_api_key_configured": bool(settings.dart_api_key),
        "cache_dir": str(settings.cache_dir),
        "timestamp": datetime.now().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.server_host,
        port=settings.server_port,
        reload=True
    )