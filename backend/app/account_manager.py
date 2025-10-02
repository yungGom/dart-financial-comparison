# -*- coding: utf-8 -*-
"""
Account Management Module
계정과목 관리 모듈
"""
from typing import List, Dict, Set, Optional
import json
from pathlib import Path


class AccountManager:
    """계정과목 관리자"""

    def __init__(self):
        # K-IFRS 주요 계정과목 정의
        self.common_accounts = {
            # 재무상태표 - 자산
            "BS_ASSETS": {
                "category": "재무상태표 - 자산",
                "accounts": {
                    "ifrs-full_Assets": "자산총계",
                    "ifrs-full_CurrentAssets": "유동자산",
                    "ifrs-full_CashAndCashEquivalents": "현금및현금성자산",
                    "ifrs-full_TradeAndOtherCurrentReceivables": "매출채권및기타채권",
                    "ifrs-full_Inventories": "재고자산",
                    "ifrs-full_NoncurrentAssets": "비유동자산",
                    "ifrs-full_PropertyPlantAndEquipment": "유형자산",
                    "ifrs-full_IntangibleAssetsOtherThanGoodwill": "무형자산",
                    "ifrs-full_Goodwill": "영업권",
                    "ifrs-full_InvestmentProperty": "투자부동산",
                    "dart_ShortTermFinancialInstruments": "단기금융상품",
                    "dart_LongTermFinancialInstruments": "장기금융상품",
                }
            },
            # 재무상태표 - 부채
            "BS_LIABILITIES": {
                "category": "재무상태표 - 부채",
                "accounts": {
                    "ifrs-full_Liabilities": "부채총계",
                    "ifrs-full_CurrentLiabilities": "유동부채",
                    "ifrs-full_TradeAndOtherCurrentPayables": "매입채무및기타채무",
                    "ifrs-full_ShorttermBorrowings": "단기차입금",
                    "ifrs-full_NoncurrentLiabilities": "비유동부채",
                    "ifrs-full_LongtermBorrowings": "장기차입금",
                    "ifrs-full_Provisions": "충당부채",
                    "ifrs-full_DeferredTaxLiabilities": "이연법인세부채",
                }
            },
            # 재무상태표 - 자본
            "BS_EQUITY": {
                "category": "재무상태표 - 자본",
                "accounts": {
                    "ifrs-full_Equity": "자본총계",
                    "ifrs-full_IssuedCapital": "자본금",
                    "ifrs-full_SharePremium": "주식발행초과금",
                    "ifrs-full_RetainedEarnings": "이익잉여금",
                    "ifrs-full_OtherReserves": "기타자본항목",
                    "ifrs-full_EquityAttributableToOwnersOfParent": "지배기업소유주지분",
                    "ifrs-full_NoncontrollingInterests": "비지배지분",
                }
            },
            # 손익계산서
            "IS": {
                "category": "손익계산서",
                "accounts": {
                    "ifrs-full_Revenue": "매출액",
                    "ifrs-full_CostOfSales": "매출원가",
                    "ifrs-full_GrossProfit": "매출총이익",
                    "ifrs-full_SellingAndMarketingExpense": "판매비",
                    "ifrs-full_GeneralAndAdministrativeExpense": "관리비",
                    "dart_OperatingIncomeLoss": "영업이익(손실)",
                    "ifrs-full_FinanceIncome": "금융수익",
                    "ifrs-full_FinanceCosts": "금융비용",
                    "ifrs-full_OtherIncome": "기타수익",
                    "ifrs-full_OtherExpenses": "기타비용",
                    "ifrs-full_ProfitLossBeforeTax": "법인세비용차감전순이익",
                    "ifrs-full_IncomeTaxExpenseContinuingOperations": "법인세비용",
                    "ifrs-full_ProfitLoss": "당기순이익(손실)",
                    "ifrs-full_EarningsPerShare": "주당이익",
                }
            },
            # 현금흐름표
            "CF": {
                "category": "현금흐름표",
                "accounts": {
                    "ifrs-full_CashFlowsFromUsedInOperatingActivities": "영업활동현금흐름",
                    "ifrs-full_CashFlowsFromUsedInInvestingActivities": "투자활동현금흐름",
                    "ifrs-full_CashFlowsFromUsedInFinancingActivities": "재무활동현금흐름",
                    "ifrs-full_IncreaseDecreaseInCashAndCashEquivalents": "현금및현금성자산의순증감",
                    "ifrs-full_EffectOfExchangeRateChangesOnCashAndCashEquivalents": "환율변동효과",
                    "ifrs-full_CashAndCashEquivalentsAtBeginningOfPeriod": "기초현금및현금성자산",
                    "ifrs-full_CashAndCashEquivalentsAtEndOfPeriod": "기말현금및현금성자산",
                }
            }
        }

    def get_all_accounts(self) -> Dict[str, Dict]:
        """모든 계정과목 반환"""
        return self.common_accounts

    def get_accounts_by_category(self, category: str) -> Dict[str, str]:
        """카테고리별 계정과목 반환"""
        if category in self.common_accounts:
            return self.common_accounts[category]["accounts"]
        return {}

    def get_account_categories(self) -> List[str]:
        """계정과목 카테고리 목록 반환"""
        return [data["category"] for data in self.common_accounts.values()]

    def extract_selected_accounts(
        self,
        financial_statements: List[Dict],
        selected_account_ids: List[str]
    ) -> List[Dict]:
        """
        선택된 계정과목만 추출

        Args:
            financial_statements: 전체 재무제표 데이터
            selected_account_ids: 선택된 계정 ID 리스트

        Returns:
            선택된 계정과목 데이터만 포함된 리스트
        """
        if not selected_account_ids:
            return financial_statements

        selected_set = set(selected_account_ids)
        filtered_statements = []

        for statement in financial_statements:
            account_id = statement.get('account_id', '').strip()
            if account_id in selected_set:
                filtered_statements.append(statement)

        return filtered_statements

    def get_account_mapping(self) -> Dict[str, str]:
        """계정 ID와 한글명 매핑 반환"""
        mapping = {}
        for category_data in self.common_accounts.values():
            mapping.update(category_data["accounts"])
        return mapping

    def normalize_amount_unit(self, amount: float, unit: str) -> Dict[str, any]:
        """
        금액 단위 정규화

        Args:
            amount: 금액
            unit: 단위 (원, 천원, 백만원, 억원)

        Returns:
            {"value": 금액, "unit": 단위, "display": 표시문자열}
        """
        if unit == "원":
            divisor = 1
        elif unit == "천원":
            divisor = 1000
        elif unit == "백만원":
            divisor = 1000000
        elif unit == "억원":
            divisor = 100000000
        else:
            divisor = 1

        return {
            "value": amount,
            "unit": unit,
            "display": f"{amount:,.0f} {unit}" if amount else "-"
        }

    def detect_amount_unit(self, financial_statements: List[Dict]) -> str:
        """
        재무제표에서 금액 단위 감지

        DART 재무제표에는 보통 'currency' 필드에 단위 정보가 있음
        """
        for statement in financial_statements:
            # currency 필드 확인 (예: KRW, 천원 등)
            currency = statement.get('currency', '')
            if '천원' in currency:
                return '천원'
            elif '백만원' in currency:
                return '백만원'
            elif '억원' in currency:
                return '억원'

            # 또는 별도 단위 필드가 있을 수 있음
            unit = statement.get('unit', '')
            if unit:
                return unit

        # 기본값은 원
        return '원'


# 싱글톤 인스턴스
account_manager = AccountManager()