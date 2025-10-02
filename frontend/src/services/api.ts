/**
 * API Service Module
 */
import axios from 'axios';
import {
  Company,
  ComparisonData,
  ComparisonRequest,
  AuditInfo,
  FinancialRatios,
  ComparisonSummary
} from '@/types/financial';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  /**
   * Get account list
   */
  async getAccountList(): Promise<any> {
    const response = await api.get('/api/accounts/list');
    return response.data;
  },
  /**
   * Search companies by name
   */
  async searchCompanies(query: string): Promise<Company[]> {
    const response = await api.get('/api/companies/search', {
      params: { q: query }
    });
    return response.data;
  },

  /**
   * Get financial statements for multiple companies and years
   */
  async getFinancialStatements(
    corpCodes: string[],
    years: string[]
  ): Promise<Record<string, any>> {
    const response = await api.get('/api/financial/statements', {
      params: {
        corp_codes: corpCodes,
        years: years
      },
      paramsSerializer: (params) => {
        const searchParams = new URLSearchParams();
        params.corp_codes.forEach((code: string) => {
          searchParams.append('corp_codes', code);
        });
        params.years.forEach((year: string) => {
          searchParams.append('years', year);
        });
        return searchParams.toString();
      }
    });
    return response.data;
  },

  /**
   * Calculate financial ratios
   */
  async getFinancialRatios(
    corpCodes: string[],
    years: string[]
  ): Promise<Record<string, any>> {
    const response = await api.get('/api/financial/ratios', {
      params: {
        corp_codes: corpCodes,
        years: years
      },
      paramsSerializer: (params) => {
        const searchParams = new URLSearchParams();
        params.corp_codes.forEach((code: string) => {
          searchParams.append('corp_codes', code);
        });
        params.years.forEach((year: string) => {
          searchParams.append('years', year);
        });
        return searchParams.toString();
      }
    });
    return response.data;
  },

  /**
   * Get audit information
   */
  async getAuditInfo(rceptNo: string): Promise<AuditInfo> {
    const response = await api.get('/api/financial/audit-info', {
      params: { rcept_no: rceptNo }
    });
    return response.data;
  },

  /**
   * Create comparison analysis
   */
  async createComparison(request: ComparisonRequest): Promise<{
    data: Record<string, ComparisonData>;
    summary: ComparisonSummary[];
  }> {
    const response = await api.post('/api/financial/comparison', request);
    return response.data;
  },

  /**
   * Export to Excel with enhanced options
   */
  async exportToExcel(
    comparisonData: Record<string, any>,
    selectedAccounts: string[] = [],
    includeNotes: boolean = false
  ): Promise<Blob> {
    const response = await api.post('/api/export/excel', {
      comparison_data: comparisonData,
      selected_accounts: selectedAccounts,
      include_notes: includeNotes
    }, {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Health check
   */
  async healthCheck(): Promise<any> {
    const response = await api.get('/api/health');
    return response.data;
  }
};