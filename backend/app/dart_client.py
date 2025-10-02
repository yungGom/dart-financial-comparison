"""
DART OpenAPI Client Module
"""
import requests
import zipfile
import io
import json
from xml.etree import ElementTree as ET
from typing import Optional, List, Dict, Any
from pathlib import Path
from datetime import datetime
import hashlib

from .config import settings


class DartAPIClient:
    """DART OpenAPI 클라이언트"""

    def __init__(self):
        self.api_key = settings.dart_api_key
        self.base_url = settings.dart_base_url
        self.cache_dir = settings.cache_dir

    def _get_cache_path(self, cache_key: str) -> Path:
        """캐시 파일 경로 생성"""
        return self.cache_dir / f"{cache_key}.json"

    def _load_from_cache(self, cache_key: str) -> Optional[Dict]:
        """캐시에서 데이터 로드"""
        cache_path = self._get_cache_path(cache_key)
        if cache_path.exists():
            # Check if cache is still valid
            cache_age = datetime.now().timestamp() - cache_path.stat().st_mtime
            if cache_age < settings.cache_ttl:
                with open(cache_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
        return None

    def _save_to_cache(self, cache_key: str, data: Dict):
        """데이터를 캐시에 저장"""
        cache_path = self._get_cache_path(cache_key)
        with open(cache_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def get_corp_code(self, company_name: str) -> Optional[str]:
        """
        회사명으로 고유번호(corp_code) 조회
        """
        # Cache key for corp codes
        cache_key = "corp_codes"
        corp_list = self._load_from_cache(cache_key)

        if not corp_list:
            # Download corp code file
            url = f"{self.base_url}/corpCode.xml"
            params = {'crtfc_key': self.api_key}

            try:
                response = requests.get(url, params=params)
                response.raise_for_status()

                # Extract zip file
                with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
                    xml_data = zf.read("CORPCODE.xml")

                # Parse XML
                root = ET.fromstring(xml_data)
                corp_list = []
                for corp in root.findall('.//list'):
                    corp_name_elem = corp.find('corp_name')
                    corp_code_elem = corp.find('corp_code')
                    stock_code_elem = corp.find('stock_code')

                    if corp_name_elem is not None and corp_code_elem is not None:
                        corp_list.append({
                            'corp_name': corp_name_elem.text.strip(),
                            'corp_code': corp_code_elem.text.strip(),
                            'stock_code': stock_code_elem.text.strip() if stock_code_elem is not None else ''
                        })

                # Save to cache
                self._save_to_cache(cache_key, {'corps': corp_list})

            except Exception as e:
                print(f"Error fetching corp codes: {e}")
                return None
        else:
            corp_list = corp_list.get('corps', [])

        # Find matching company
        for corp in corp_list:
            if corp['corp_name'] == company_name:
                return corp['corp_code']

        return None

    def search_companies(self, query: str) -> List[Dict[str, str]]:
        """
        회사명 검색 (부분 일치)
        """
        cache_key = "corp_codes"
        corp_data = self._load_from_cache(cache_key)

        if not corp_data:
            # Try to get corp codes first
            self.get_corp_code("dummy")  # This will populate the cache
            corp_data = self._load_from_cache(cache_key)

        if not corp_data:
            return []

        results = []
        for corp in corp_data.get('corps', []):
            if query.lower() in corp['corp_name'].lower():
                results.append({
                    'name': corp['corp_name'],
                    'corp_code': corp['corp_code'],
                    'stock_code': corp['stock_code']
                })

        return results[:50]  # Limit to 50 results

    def get_financial_statements(
        self,
        corp_code: str,
        bsns_year: str,
        reprt_code: str = "11011"
    ) -> Optional[Dict]:
        """
        재무제표 조회

        Args:
            corp_code: 고유번호
            bsns_year: 사업연도 (예: "2023")
            reprt_code: 보고서 코드
                - 11011: 사업보고서
                - 11012: 반기보고서
                - 11013: 1분기보고서
                - 11014: 3분기보고서
        """
        # Create cache key
        cache_key = f"fs_{corp_code}_{bsns_year}_{reprt_code}"
        cached_data = self._load_from_cache(cache_key)
        if cached_data:
            return cached_data

        url = f"{self.base_url}/fnlttSinglAcntAll.json"
        params = {
            'crtfc_key': self.api_key,
            'corp_code': corp_code,
            'bsns_year': bsns_year,
            'reprt_code': reprt_code,
            'fs_div': 'CFS'  # 연결재무제표
        }

        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            if data.get('status') == '000':
                # Save to cache
                self._save_to_cache(cache_key, data)
                return data
            else:
                print(f"API Error: {data.get('message')}")
                return None

        except Exception as e:
            print(f"Error fetching financial statements: {e}")
            return None

    def get_multiple_financial_statements(
        self,
        corp_codes: List[str],
        years: List[str]
    ) -> Dict[str, Dict[str, Any]]:
        """
        여러 기업의 여러 연도 재무제표 조회

        Returns:
            {
                "corp_code_year": {financial_data},
                ...
            }
        """
        results = {}

        for corp_code in corp_codes:
            for year in years:
                key = f"{corp_code}_{year}"
                data = self.get_financial_statements(corp_code, year)
                if data:
                    results[key] = data

        return results

    def get_audit_report(self, rcept_no: str) -> Optional[str]:
        """
        감사보고서 원문 조회

        Args:
            rcept_no: 접수번호
        """
        # Create cache key
        cache_key = f"audit_{rcept_no}"
        cached_data = self._load_from_cache(cache_key)
        if cached_data:
            return cached_data.get('content')

        url = f"{self.base_url}/document.xml"
        params = {
            'crtfc_key': self.api_key,
            'rcept_no': rcept_no
        }

        try:
            response = requests.get(url, params=params, stream=True)
            response.raise_for_status()

            # Extract zip file
            with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
                # Get first file (audit report)
                report_filename = zf.namelist()[0]
                with zf.open(report_filename) as report_file:
                    content = report_file.read().decode('utf-8')

                    # Save to cache
                    self._save_to_cache(cache_key, {'content': content})
                    return content

        except Exception as e:
            print(f"Error fetching audit report: {e}")
            return None

    def extract_audit_info(self, html_content: str) -> Dict[str, Any]:
        """
        감사보고서에서 주요 정보 추출

        Returns:
            {
                "auditor": "감사인명",
                "accounting_standard": "회계기준",
                "audit_opinion": "감사의견"
            }
        """
        from bs4 import BeautifulSoup
        import re

        soup = BeautifulSoup(html_content, 'html.parser')
        text = soup.get_text()

        result = {
            "auditor": "",
            "accounting_standard": "",
            "audit_opinion": ""
        }

        # Extract auditor
        auditor_pattern = r'감사인\s*[:：]\s*([^\n]+)'
        auditor_match = re.search(auditor_pattern, text)
        if auditor_match:
            result["auditor"] = auditor_match.group(1).strip()

        # Extract accounting standard
        if "K-IFRS" in text or "한국채택국제회계기준" in text:
            result["accounting_standard"] = "K-IFRS"
        elif "K-GAAP" in text or "일반기업회계기준" in text:
            result["accounting_standard"] = "K-GAAP"

        # Extract audit opinion
        opinion_patterns = [
            r'감사의견\s*[:：]\s*([^\n]+)',
            r'의견\s*[:：]\s*([^\n]+)'
        ]
        for pattern in opinion_patterns:
            opinion_match = re.search(pattern, text)
            if opinion_match:
                result["audit_opinion"] = opinion_match.group(1).strip()
                break

        return result


# Create singleton instance
dart_client = DartAPIClient()