"""
Test cases for FastAPI endpoints
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app


@pytest.fixture
def client():
    """Test client fixture"""
    return TestClient(app)


class TestAPI:
    """API 엔드포인트 테스트"""

    def test_root_endpoint(self, client):
        """루트 엔드포인트 테스트"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "running"
        assert "version" in data

    def test_health_check(self, client):
        """헬스 체크 엔드포인트 테스트"""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

    @patch('app.main.dart_client')
    def test_search_companies(self, mock_dart_client, client):
        """기업 검색 테스트"""
        # Mock the search_companies method
        mock_dart_client.search_companies.return_value = [
            {'name': '삼성전자', 'corp_code': '00126380', 'stock_code': '005930'},
            {'name': '삼성SDI', 'corp_code': '00126186', 'stock_code': '006400'}
        ]

        response = client.get("/api/companies/search?q=삼성")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]['name'] == '삼성전자'

    def test_search_companies_short_query(self, client):
        """짧은 검색어 테스트"""
        response = client.get("/api/companies/search?q=삼")
        assert response.status_code == 400
        assert "2글자 이상" in response.json()['detail']

    @patch('app.main.dart_client')
    def test_get_financial_statements(self, mock_dart_client, client):
        """재무제표 조회 테스트"""
        # Mock the get_multiple_financial_statements method
        mock_dart_client.get_multiple_financial_statements.return_value = {
            '00126380_2023': {
                'status': '000',
                'list': [
                    {'account_id': 'ifrs-full_Assets', 'thstrm_amount': '1000000'}
                ]
            }
        }

        response = client.get(
            "/api/financial/statements?corp_codes=00126380&years=2023"
        )
        assert response.status_code == 200
        data = response.json()
        assert '00126380_2023' in data

    def test_get_financial_statements_too_many_companies(self, client):
        """너무 많은 기업 요청 테스트"""
        corp_codes = ['00126380'] * 11  # Exceeds max limit of 10
        query_str = '&'.join([f'corp_codes={c}' for c in corp_codes])
        response = client.get(f"/api/financial/statements?{query_str}&years=2023")
        assert response.status_code == 400
        assert "최대" in response.json()['detail']

    @patch('app.main.dart_client')
    @patch('app.main.calculator')
    def test_calculate_financial_ratios(
        self, mock_calculator, mock_dart_client, client
    ):
        """재무비율 계산 테스트"""
        # Mock the DART client
        mock_dart_client.get_multiple_financial_statements.return_value = {
            '00126380_2023': {
                'status': '000',
                'list': [
                    {'corp_name': '삼성전자', 'account_id': 'ifrs-full_Assets'}
                ]
            }
        }

        # Mock the calculator
        mock_calculator.calculate_all_ratios.return_value = {
            'stability': {'current_ratio': 200.0},
            'profitability': {'roe': 15.0},
            'activity': {'asset_turnover': 0.8}
        }

        response = client.get(
            "/api/financial/ratios?corp_codes=00126380&years=2023"
        )
        assert response.status_code == 200
        data = response.json()
        assert '00126380_2023' in data
        assert 'ratios' in data['00126380_2023']

    @patch('app.main.dart_client')
    def test_get_audit_info(self, mock_dart_client, client):
        """감사 정보 조회 테스트"""
        # Mock the audit report methods
        mock_dart_client.get_audit_report.return_value = "<html>감사보고서 내용</html>"
        mock_dart_client.extract_audit_info.return_value = {
            'auditor': '삼일회계법인',
            'accounting_standard': 'K-IFRS',
            'audit_opinion': '적정'
        }

        response = client.get("/api/financial/audit-info?rcept_no=20230330000001")
        assert response.status_code == 200
        data = response.json()
        assert data['auditor'] == '삼일회계법인'
        assert data['accounting_standard'] == 'K-IFRS'

    @patch('app.main.dart_client')
    @patch('app.main.calculator')
    def test_create_comparison(self, mock_calculator, mock_dart_client, client):
        """비교 분석 생성 테스트"""
        # Mock the DART client
        mock_dart_client.get_financial_statements.return_value = {
            'status': '000',
            'list': [{'account_id': 'ifrs-full_Assets'}]
        }

        # Mock the calculator
        mock_calculator.calculate_all_ratios.return_value = {
            'stability': {'current_ratio': 200.0}
        }
        mock_calculator.create_comparison_table.return_value.to_dict.return_value = [
            {'기업명': '삼성전자', '연도': '2023', '유동비율(%)': 200.0}
        ]

        request_data = {
            'companies': [{'corp_code': '00126380', 'name': '삼성전자'}],
            'years': ['2023'],
            'include_ratios': True,
            'include_audit': False
        }

        response = client.post("/api/financial/comparison", json=request_data)
        assert response.status_code == 200
        data = response.json()
        assert 'data' in data
        assert 'summary' in data

    def test_create_comparison_missing_data(self, client):
        """비교 분석 - 필수 데이터 누락 테스트"""
        request_data = {
            'companies': [],
            'years': []
        }

        response = client.post("/api/financial/comparison", json=request_data)
        assert response.status_code == 400
        assert "기업과 연도를 선택" in response.json()['detail']