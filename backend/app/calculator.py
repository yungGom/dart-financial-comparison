"""
Financial Ratio Calculator Module
재무비율 계산 모듈
"""
import pandas as pd
from typing import Dict, Any, List, Optional
from decimal import Decimal


class FinancialRatioCalculator:
    """재무비율 계산기"""

    def __init__(self):
        # Common account IDs in DART (IFRS)
        self.account_mapping = {
            # 재무상태표 (Balance Sheet)
            'current_assets': ['ifrs-full_CurrentAssets', 'ifrs_CurrentAssets'],
            'total_assets': ['ifrs-full_Assets', 'ifrs_Assets'],
            'current_liabilities': ['ifrs-full_CurrentLiabilities', 'ifrs_CurrentLiabilities'],
            'total_liabilities': ['ifrs-full_Liabilities', 'ifrs_Liabilities'],
            'total_equity': ['ifrs-full_Equity', 'ifrs_Equity'],

            # 손익계산서 (Income Statement)
            'revenue': ['ifrs-full_Revenue', 'ifrs_Revenue'],
            'cost_of_sales': ['ifrs-full_CostOfSales', 'ifrs_CostOfSales'],
            'gross_profit': ['ifrs-full_GrossProfit', 'ifrs_GrossProfit'],
            'operating_profit': [
                'dart_OperatingIncomeLoss',
                'ifrs-full_OperatingIncomeLoss',
                'ifrs_OperatingIncomeLoss'
            ],
            'net_income': [
                'ifrs-full_ProfitLoss',
                'ifrs_ProfitLoss',
                'ifrs-full_ProfitLossAttributableToOwnersOfParent'
            ],

            # 현금흐름표 (Cash Flow)
            'operating_cash_flow': [
                'ifrs-full_CashFlowsFromUsedInOperatingActivities',
                'ifrs_CashFlowsFromUsedInOperatingActivities'
            ],
            'investing_cash_flow': [
                'ifrs-full_CashFlowsFromUsedInInvestingActivities',
                'ifrs_CashFlowsFromUsedInInvestingActivities'
            ],
            'financing_cash_flow': [
                'ifrs-full_CashFlowsFromUsedInFinancingActivities',
                'ifrs_CashFlowsFromUsedInFinancingActivities'
            ]
        }

    def extract_financial_data(self, statements: List[Dict]) -> pd.DataFrame:
        """
        재무제표 데이터를 DataFrame으로 변환
        """
        if not statements:
            return pd.DataFrame()

        df = pd.DataFrame(statements)

        # Required columns
        required_cols = ['account_id', 'account_nm', 'thstrm_amount', 'frmtrm_amount', 'bfefrmtrm_amount', 'sj_div']
        for col in required_cols:
            if col not in df.columns:
                df[col] = None

        # Convert amounts to numeric
        amount_cols = ['thstrm_amount', 'frmtrm_amount', 'bfefrmtrm_amount']
        for col in amount_cols:
            df[col] = df[col].astype(str).str.replace(',', '').fillna('0')
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

        return df

    def get_account_value(
        self,
        df: pd.DataFrame,
        account_ids: List[str],
        period: str = 'thstrm_amount'
    ) -> float:
        """
        특정 계정과목의 값 추출

        Args:
            df: 재무제표 DataFrame
            account_ids: 계정 ID 리스트
            period: 기간 ('thstrm_amount', 'frmtrm_amount', 'bfefrmtrm_amount')
        """
        for account_id in account_ids:
            mask = df['account_id'].str.strip() == account_id
            if mask.any():
                return float(df.loc[mask, period].iloc[0])
        return 0.0

    def calculate_stability_ratios(self, df: pd.DataFrame) -> Dict[str, float]:
        """
        안정성 비율 계산
        """
        current_assets = self.get_account_value(df, self.account_mapping['current_assets'])
        current_liabilities = self.get_account_value(df, self.account_mapping['current_liabilities'])
        total_assets = self.get_account_value(df, self.account_mapping['total_assets'])
        total_liabilities = self.get_account_value(df, self.account_mapping['total_liabilities'])
        total_equity = self.get_account_value(df, self.account_mapping['total_equity'])

        ratios = {}

        # 유동비율 (Current Ratio)
        if current_liabilities > 0:
            ratios['current_ratio'] = round(current_assets / current_liabilities * 100, 2)
        else:
            ratios['current_ratio'] = 0

        # 부채비율 (Debt-to-Equity Ratio)
        if total_equity > 0:
            ratios['debt_to_equity'] = round(total_liabilities / total_equity * 100, 2)
        else:
            ratios['debt_to_equity'] = 0

        # 자기자본비율 (Equity Ratio)
        if total_assets > 0:
            ratios['equity_ratio'] = round(total_equity / total_assets * 100, 2)
        else:
            ratios['equity_ratio'] = 0

        return ratios

    def calculate_profitability_ratios(self, df: pd.DataFrame) -> Dict[str, float]:
        """
        수익성 비율 계산
        """
        revenue = self.get_account_value(df, self.account_mapping['revenue'])
        gross_profit = self.get_account_value(df, self.account_mapping['gross_profit'])
        operating_profit = self.get_account_value(df, self.account_mapping['operating_profit'])
        net_income = self.get_account_value(df, self.account_mapping['net_income'])
        total_assets = self.get_account_value(df, self.account_mapping['total_assets'])
        total_equity = self.get_account_value(df, self.account_mapping['total_equity'])

        ratios = {}

        # 매출총이익률 (Gross Profit Margin)
        if revenue > 0:
            ratios['gross_margin'] = round(gross_profit / revenue * 100, 2)
        else:
            ratios['gross_margin'] = 0

        # 영업이익률 (Operating Profit Margin)
        if revenue > 0:
            ratios['operating_margin'] = round(operating_profit / revenue * 100, 2)
        else:
            ratios['operating_margin'] = 0

        # 순이익률 (Net Profit Margin)
        if revenue > 0:
            ratios['net_margin'] = round(net_income / revenue * 100, 2)
        else:
            ratios['net_margin'] = 0

        # ROA (Return on Assets)
        if total_assets > 0:
            ratios['roa'] = round(net_income / total_assets * 100, 2)
        else:
            ratios['roa'] = 0

        # ROE (Return on Equity)
        if total_equity > 0:
            ratios['roe'] = round(net_income / total_equity * 100, 2)
        else:
            ratios['roe'] = 0

        return ratios

    def calculate_activity_ratios(self, df: pd.DataFrame) -> Dict[str, float]:
        """
        활동성 비율 계산
        """
        revenue = self.get_account_value(df, self.account_mapping['revenue'])
        total_assets = self.get_account_value(df, self.account_mapping['total_assets'])

        ratios = {}

        # 총자산회전율 (Total Asset Turnover)
        if total_assets > 0:
            ratios['asset_turnover'] = round(revenue / total_assets, 2)
        else:
            ratios['asset_turnover'] = 0

        return ratios

    def calculate_growth_rates(
        self,
        df_current: pd.DataFrame,
        df_previous: pd.DataFrame
    ) -> Dict[str, float]:
        """
        성장성 비율 계산 (전년 대비)
        """
        # Current year values
        revenue_current = self.get_account_value(df_current, self.account_mapping['revenue'])
        net_income_current = self.get_account_value(df_current, self.account_mapping['net_income'])
        total_assets_current = self.get_account_value(df_current, self.account_mapping['total_assets'])

        # Previous year values
        revenue_previous = self.get_account_value(df_previous, self.account_mapping['revenue'])
        net_income_previous = self.get_account_value(df_previous, self.account_mapping['net_income'])
        total_assets_previous = self.get_account_value(df_previous, self.account_mapping['total_assets'])

        ratios = {}

        # 매출 성장률 (Revenue Growth Rate)
        if revenue_previous > 0:
            ratios['revenue_growth'] = round(
                (revenue_current - revenue_previous) / revenue_previous * 100, 2
            )
        else:
            ratios['revenue_growth'] = 0

        # 순이익 성장률 (Net Income Growth Rate)
        if net_income_previous > 0:
            ratios['net_income_growth'] = round(
                (net_income_current - net_income_previous) / net_income_previous * 100, 2
            )
        else:
            ratios['net_income_growth'] = 0

        # 총자산 성장률 (Total Assets Growth Rate)
        if total_assets_previous > 0:
            ratios['asset_growth'] = round(
                (total_assets_current - total_assets_previous) / total_assets_previous * 100, 2
            )
        else:
            ratios['asset_growth'] = 0

        return ratios

    def calculate_all_ratios(self, statements: List[Dict]) -> Dict[str, Any]:
        """
        모든 재무비율 계산

        Returns:
            {
                "stability": {...},
                "profitability": {...},
                "activity": {...}
            }
        """
        df = self.extract_financial_data(statements)

        if df.empty:
            return {
                "stability": {},
                "profitability": {},
                "activity": {}
            }

        return {
            "stability": self.calculate_stability_ratios(df),
            "profitability": self.calculate_profitability_ratios(df),
            "activity": self.calculate_activity_ratios(df)
        }

    def create_comparison_table(
        self,
        companies_data: Dict[str, Dict]
    ) -> pd.DataFrame:
        """
        여러 기업의 재무비율 비교 테이블 생성

        Args:
            companies_data: {
                "company_name_year": {
                    "statements": [...],
                    "company_name": "...",
                    "year": "..."
                }
            }

        Returns:
            비교 테이블 DataFrame
        """
        comparison_data = []

        for key, data in companies_data.items():
            statements = data.get('statements', [])
            company_name = data.get('company_name', '')
            year = data.get('year', '')

            ratios = self.calculate_all_ratios(statements)

            row = {
                '기업명': company_name,
                '연도': year,
                '유동비율(%)': ratios['stability'].get('current_ratio', 0),
                '부채비율(%)': ratios['stability'].get('debt_to_equity', 0),
                '자기자본비율(%)': ratios['stability'].get('equity_ratio', 0),
                'ROE(%)': ratios['profitability'].get('roe', 0),
                'ROA(%)': ratios['profitability'].get('roa', 0),
                '영업이익률(%)': ratios['profitability'].get('operating_margin', 0),
                '순이익률(%)': ratios['profitability'].get('net_margin', 0),
                '총자산회전율': ratios['activity'].get('asset_turnover', 0)
            }

            comparison_data.append(row)

        return pd.DataFrame(comparison_data)


# Create singleton instance
calculator = FinancialRatioCalculator()