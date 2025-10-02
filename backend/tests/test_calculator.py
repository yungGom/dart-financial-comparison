"""
Test cases for Financial Ratio Calculator
"""
import pytest
from app.calculator import FinancialRatioCalculator


class TestFinancialRatioCalculator:
    """재무비율 계산기 테스트"""

    @pytest.fixture
    def calculator(self):
        """Calculator fixture"""
        return FinancialRatioCalculator()

    @pytest.fixture
    def sample_statements(self):
        """Sample financial statements data"""
        return [
            {
                'account_id': 'ifrs-full_CurrentAssets',
                'account_nm': '유동자산',
                'thstrm_amount': '1000000',
                'frmtrm_amount': '900000',
                'bfefrmtrm_amount': '800000',
                'sj_div': 'BS'
            },
            {
                'account_id': 'ifrs-full_Assets',
                'account_nm': '자산총계',
                'thstrm_amount': '2000000',
                'frmtrm_amount': '1800000',
                'bfefrmtrm_amount': '1600000',
                'sj_div': 'BS'
            },
            {
                'account_id': 'ifrs-full_CurrentLiabilities',
                'account_nm': '유동부채',
                'thstrm_amount': '500000',
                'frmtrm_amount': '450000',
                'bfefrmtrm_amount': '400000',
                'sj_div': 'BS'
            },
            {
                'account_id': 'ifrs-full_Liabilities',
                'account_nm': '부채총계',
                'thstrm_amount': '800000',
                'frmtrm_amount': '720000',
                'bfefrmtrm_amount': '640000',
                'sj_div': 'BS'
            },
            {
                'account_id': 'ifrs-full_Equity',
                'account_nm': '자본총계',
                'thstrm_amount': '1200000',
                'frmtrm_amount': '1080000',
                'bfefrmtrm_amount': '960000',
                'sj_div': 'BS'
            },
            {
                'account_id': 'ifrs-full_Revenue',
                'account_nm': '매출액',
                'thstrm_amount': '1500000',
                'frmtrm_amount': '1350000',
                'bfefrmtrm_amount': '1200000',
                'sj_div': 'IS'
            },
            {
                'account_id': 'dart_OperatingIncomeLoss',
                'account_nm': '영업이익',
                'thstrm_amount': '150000',
                'frmtrm_amount': '135000',
                'bfefrmtrm_amount': '120000',
                'sj_div': 'IS'
            },
            {
                'account_id': 'ifrs-full_ProfitLoss',
                'account_nm': '당기순이익',
                'thstrm_amount': '120000',
                'frmtrm_amount': '108000',
                'bfefrmtrm_amount': '96000',
                'sj_div': 'IS'
            }
        ]

    def test_extract_financial_data(self, calculator, sample_statements):
        """재무데이터 추출 테스트"""
        df = calculator.extract_financial_data(sample_statements)

        assert not df.empty
        assert len(df) == len(sample_statements)
        assert 'account_id' in df.columns
        assert 'thstrm_amount' in df.columns

        # Check data types
        assert df['thstrm_amount'].dtype in ['float64', 'int64']

    def test_calculate_stability_ratios(self, calculator, sample_statements):
        """안정성 비율 계산 테스트"""
        df = calculator.extract_financial_data(sample_statements)
        ratios = calculator.calculate_stability_ratios(df)

        assert 'current_ratio' in ratios
        assert 'debt_to_equity' in ratios
        assert 'equity_ratio' in ratios

        # Check calculated values
        # Current Ratio = 1000000 / 500000 * 100 = 200%
        assert ratios['current_ratio'] == 200.0

        # Debt-to-Equity = 800000 / 1200000 * 100 = 66.67%
        assert abs(ratios['debt_to_equity'] - 66.67) < 0.01

        # Equity Ratio = 1200000 / 2000000 * 100 = 60%
        assert ratios['equity_ratio'] == 60.0

    def test_calculate_profitability_ratios(self, calculator, sample_statements):
        """수익성 비율 계산 테스트"""
        df = calculator.extract_financial_data(sample_statements)
        ratios = calculator.calculate_profitability_ratios(df)

        assert 'operating_margin' in ratios
        assert 'net_margin' in ratios
        assert 'roa' in ratios
        assert 'roe' in ratios

        # Operating Margin = 150000 / 1500000 * 100 = 10%
        assert ratios['operating_margin'] == 10.0

        # Net Margin = 120000 / 1500000 * 100 = 8%
        assert ratios['net_margin'] == 8.0

        # ROA = 120000 / 2000000 * 100 = 6%
        assert ratios['roa'] == 6.0

        # ROE = 120000 / 1200000 * 100 = 10%
        assert ratios['roe'] == 10.0

    def test_calculate_activity_ratios(self, calculator, sample_statements):
        """활동성 비율 계산 테스트"""
        df = calculator.extract_financial_data(sample_statements)
        ratios = calculator.calculate_activity_ratios(df)

        assert 'asset_turnover' in ratios

        # Asset Turnover = 1500000 / 2000000 = 0.75
        assert ratios['asset_turnover'] == 0.75

    def test_calculate_all_ratios(self, calculator, sample_statements):
        """전체 비율 계산 테스트"""
        result = calculator.calculate_all_ratios(sample_statements)

        assert 'stability' in result
        assert 'profitability' in result
        assert 'activity' in result

        assert result['stability']['current_ratio'] == 200.0
        assert result['profitability']['roe'] == 10.0
        assert result['activity']['asset_turnover'] == 0.75

    def test_empty_statements(self, calculator):
        """빈 재무제표 처리 테스트"""
        result = calculator.calculate_all_ratios([])

        assert result['stability'] == {}
        assert result['profitability'] == {}
        assert result['activity'] == {}

    def test_zero_division_handling(self, calculator):
        """0으로 나누기 처리 테스트"""
        statements = [
            {
                'account_id': 'ifrs-full_CurrentAssets',
                'account_nm': '유동자산',
                'thstrm_amount': '1000000',
                'sj_div': 'BS'
            },
            {
                'account_id': 'ifrs-full_CurrentLiabilities',
                'account_nm': '유동부채',
                'thstrm_amount': '0',  # Zero liabilities
                'sj_div': 'BS'
            }
        ]

        df = calculator.extract_financial_data(statements)
        ratios = calculator.calculate_stability_ratios(df)

        # Should handle division by zero gracefully
        assert ratios['current_ratio'] == 0