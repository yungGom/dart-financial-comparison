/**
 * Financial data types
 */

// 재무제표 구분 타입
export type FsDiv = 'CFS' | 'OFS';

export interface Company {
  name: string;
  corp_code: string;
  stock_code?: string;
}

export interface FinancialStatement {
  account_id: string;
  account_nm: string;
  thstrm_amount: number;
  frmtrm_amount: number;
  bfefrmtrm_amount: number;
  sj_div: string;
}

export interface FinancialRatios {
  stability: {
    current_ratio?: number;
    debt_to_equity?: number;
    equity_ratio?: number;
  };
  profitability: {
    gross_margin?: number;
    operating_margin?: number;
    net_margin?: number;
    roa?: number;
    roe?: number;
  };
  activity: {
    asset_turnover?: number;
  };
}

export interface AuditInfo {
  auditor: string;
  accounting_standard: string;
  audit_opinion: string;
}

export interface ComparisonData {
  corp_code: string;
  company_name: string;
  year: string;
  statements?: FinancialStatement[];
  ratios?: FinancialRatios;
  audit_info?: AuditInfo;
  fs_div?: FsDiv;  // 재무제표 구분
  fs_div_name?: string;  // 재무제표 구분 이름 (연결재무제표/별도재무제표)
}

export interface ComparisonRequest {
  companies: Company[];
  years: string[];
  include_ratios: boolean;
  include_audit: boolean;
  include_notes?: boolean;
  note_items?: string[];
  selected_accounts?: string[];
  fs_div?: FsDiv;  // 연결(CFS) 또는 별도(OFS) 재무제표
}

export interface ComparisonSummary {
  기업명: string;
  연도: string;
  '유동비율(%)': number;
  '부채비율(%)': number;
  '자기자본비율(%)': number;
  'ROE(%)': number;
  'ROA(%)': number;
  '영업이익률(%)': number;
  '순이익률(%)': number;
  '총자산회전율': number;
}