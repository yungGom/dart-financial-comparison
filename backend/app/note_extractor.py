"""
Enhanced Note Extraction Module
주석 정보 추출 강화 모듈
"""
import re
from bs4 import BeautifulSoup
from typing import Dict, Any, Optional, List
import logging

logger = logging.getLogger(__name__)


class NoteExtractor:
    """주석 정보 추출기"""

    def __init__(self):
        # 주요 추출 패턴 정의
        self.patterns = {
            'auditor': [
                r'감사인\s*[:：]\s*([^\n]+)',
                r'외부감사인\s*[:：]\s*([^\n]+)',
                r'감사법인\s*[:：]\s*([^\n]+)',
                r'회계법인\s*[:：]\s*([^\n]+)'
            ],
            'accounting_standard': [
                r'회계처리기준\s*[:：]\s*([^\n]+)',
                r'회계기준\s*[:：]\s*([^\n]+)',
                r'재무제표.*?작성기준\s*[:：]\s*([^\n]+)'
            ],
            'depreciation_policy': [
                r'감가상각방법\s*[:：]\s*([^\n]+)',
                r'감가상각정책\s*[:：]\s*([^\n]+)',
                r'유형자산.*?감가상각\s*[:：]\s*([^\n]+)'
            ],
            'useful_life': [
                r'내용연수\s*[:：]\s*([^\n]+)',
                r'추정내용연수\s*[:：]\s*([^\n]+)',
                r'경제적\s*내용연수\s*[:：]\s*([^\n]+)'
            ]
        }

    def extract_comprehensive_notes(self, html_content: str, note_items: List[str] = None) -> Dict[str, Any]:
        """
        포괄적인 주석 정보 추출

        Args:
            html_content: 감사보고서 HTML
            note_items: 추출할 항목 리스트 (None이면 모든 항목)

        Returns:
            추출된 주석 정보
        """
        result = {
            'auditor': '',
            'accounting_standard': '',
            'depreciation_policy': {},
            'useful_life': {},
            'audit_opinion': '',
            'significant_policies': [],
            'raw_notes': {}
        }

        # note_items가 지정되지 않으면 모든 항목 추출
        if note_items is None:
            note_items = ['auditor', 'accounting_standard', 'depreciation_policy',
                         'useful_life', 'audit_opinion', 'significant_policies']

        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            text = soup.get_text()

            # 1. 감사인 추출
            if 'auditor' in note_items:
                result['auditor'] = self._extract_auditor(text)

            # 2. 회계기준 추출
            if 'accounting_standard' in note_items:
                result['accounting_standard'] = self._extract_accounting_standard(text)

            # 3. 감사의견 추출
            if 'audit_opinion' in note_items:
                result['audit_opinion'] = self._extract_audit_opinion(text)

            # 4. 감가상각 정책 추출
            if 'depreciation_policy' in note_items:
                result['depreciation_policy'] = self._extract_depreciation_policy(text)

            # 5. 내용연수 추출
            if 'useful_life' in note_items:
                result['useful_life'] = self._extract_useful_life(text)

            # 6. 주요 회계정책 추출
            if 'significant_policies' in note_items:
                result['significant_policies'] = self._extract_significant_policies(text)

        except Exception as e:
            logger.error(f"Note extraction error: {e}")

        return result

    def _extract_auditor(self, text: str) -> str:
        """감사인 정보 추출"""
        # 주요 회계법인 리스트
        major_auditors = [
            '삼일회계법인', '삼정KPMG', '안진회계법인', '한영회계법인',
            'EY한영', '딜로이트', '대주회계법인', '대현회계법인'
        ]

        # 패턴 매칭
        for pattern in self.patterns['auditor']:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()

        # 회계법인명 직접 검색
        for auditor in major_auditors:
            if auditor in text:
                return auditor

        return "정보 없음"

    def _extract_accounting_standard(self, text: str) -> str:
        """회계기준 추출"""
        # K-IFRS 체크
        if any(keyword in text for keyword in ['K-IFRS', '한국채택국제회계기준', 'KIFRS']):
            return 'K-IFRS'

        # K-GAAP 체크
        if any(keyword in text for keyword in ['K-GAAP', '일반기업회계기준', 'KGAAP']):
            return 'K-GAAP'

        # 패턴 매칭
        for pattern in self.patterns['accounting_standard']:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                standard = match.group(1).strip()
                if 'IFRS' in standard or '국제' in standard:
                    return 'K-IFRS'
                elif 'GAAP' in standard or '일반' in standard:
                    return 'K-GAAP'

        return "정보 없음"

    def _extract_audit_opinion(self, text: str) -> str:
        """감사의견 추출"""
        opinion_patterns = [
            r'감사의견\s*[:：]\s*([^\n]+)',
            r'의견\s*[:：]\s*([^\n]+)',
            r'감사의견.*?적정.*?의견',
            r'감사의견.*?한정.*?의견',
            r'감사의견.*?부적정.*?의견',
            r'감사의견.*?의견거절'
        ]

        for pattern in opinion_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                opinion = match.group(0) if '의견' in pattern else match.group(1)
                if '적정' in opinion and '부적정' not in opinion:
                    return '적정'
                elif '한정' in opinion:
                    return '한정'
                elif '부적정' in opinion:
                    return '부적정'
                elif '거절' in opinion:
                    return '의견거절'

        return "정보 없음"

    def _extract_depreciation_policy(self, text: str) -> Dict[str, str]:
        """감가상각 정책 추출"""
        policy = {}

        # 유형자산 감가상각 방법 찾기
        depreciation_section = self._find_section(text, ['감가상각', '유형자산', '상각'])

        if depreciation_section:
            # 정액법/정률법 확인
            if '정액법' in depreciation_section:
                policy['method'] = '정액법'
            elif '정률법' in depreciation_section:
                policy['method'] = '정률법'
            else:
                policy['method'] = '기타'

            # 감가상각 관련 상세 정보 추출
            policy['details'] = self._extract_policy_details(depreciation_section)

        return policy

    def _extract_useful_life(self, text: str) -> Dict[str, str]:
        """내용연수 정보 추출"""
        useful_life = {}

        # 내용연수 섹션 찾기
        life_section = self._find_section(text, ['내용연수', '추정내용연수', '경제적 내용연수'])

        if life_section:
            # 주요 자산별 내용연수 추출
            asset_patterns = [
                (r'건물\s*[:：]?\s*(\d+)\s*년', '건물'),
                (r'구축물\s*[:：]?\s*(\d+)\s*년', '구축물'),
                (r'기계장치\s*[:：]?\s*(\d+)\s*년', '기계장치'),
                (r'차량운반구\s*[:：]?\s*(\d+)\s*년', '차량운반구'),
                (r'비품\s*[:：]?\s*(\d+)\s*년', '비품'),
                (r'시설장치\s*[:：]?\s*(\d+)\s*년', '시설장치')
            ]

            for pattern, asset_type in asset_patterns:
                match = re.search(pattern, life_section)
                if match:
                    useful_life[asset_type] = f"{match.group(1)}년"

        return useful_life

    def _extract_significant_policies(self, text: str) -> List[str]:
        """주요 회계정책 추출"""
        policies = []

        # 주요 회계정책 키워드
        policy_keywords = [
            '수익인식', '재고자산평가', '외화환산', '충당부채',
            '금융상품', '리스', '퇴직급여', '법인세'
        ]

        for keyword in policy_keywords:
            section = self._find_section(text, [keyword])
            if section and len(section) > 50:  # 의미있는 내용이 있는 경우
                # 첫 200자만 저장
                policies.append(f"{keyword}: {section[:200]}...")

        return policies

    def _find_section(self, text: str, keywords: List[str]) -> Optional[str]:
        """특정 키워드가 포함된 섹션 찾기"""
        for keyword in keywords:
            # 키워드 주변 텍스트 추출 (앞뒤 500자)
            pattern = rf'.{{0,500}}{keyword}.{{0,500}}'
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                return match.group(0)

        return None

    def _extract_policy_details(self, section: str) -> str:
        """정책 상세 내용 추출"""
        # 불필요한 공백 제거
        details = re.sub(r'\s+', ' ', section)

        # 최대 500자까지만
        if len(details) > 500:
            details = details[:500] + "..."

        return details.strip()

    def extract_from_multiple_reports(
        self,
        reports: Dict[str, str]
    ) -> Dict[str, Dict[str, Any]]:
        """
        여러 보고서에서 주석 정보 추출

        Args:
            reports: {company_year: html_content} 형태

        Returns:
            {company_year: extracted_notes} 형태
        """
        results = {}

        for key, html_content in reports.items():
            if html_content:
                results[key] = self.extract_comprehensive_notes(html_content)

        return results


# 싱글톤 인스턴스
note_extractor = NoteExtractor()