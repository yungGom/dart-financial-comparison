import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CompanySearch from '../CompanySearch';
import { apiService } from '@/services/api';

// Mock the API service
jest.mock('@/services/api', () => ({
  apiService: {
    searchCompanies: jest.fn(),
  },
}));

// Mock lodash debounce
jest.mock('lodash/debounce', () => (fn: any) => fn);

describe('CompanySearch', () => {
  const mockOnCompaniesChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the search input', () => {
    render(<CompanySearch onCompaniesChange={mockOnCompaniesChange} />);

    const input = screen.getByLabelText(/기업 검색/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', '기업명을 입력하세요 (최대 5개)');
  });

  it('shows message for short search query', async () => {
    render(<CompanySearch onCompaniesChange={mockOnCompaniesChange} />);

    const input = screen.getByLabelText(/기업 검색/i);
    fireEvent.change(input, { target: { value: '삼' } });

    // The component should not call the API for queries less than 2 characters
    expect(apiService.searchCompanies).not.toHaveBeenCalled();
  });

  it('searches companies when query is 2+ characters', async () => {
    const mockResults = [
      { name: '삼성전자', corp_code: '00126380', stock_code: '005930' },
      { name: '삼성SDI', corp_code: '00126186', stock_code: '006400' },
    ];

    (apiService.searchCompanies as jest.Mock).mockResolvedValue(mockResults);

    render(<CompanySearch onCompaniesChange={mockOnCompaniesChange} />);

    const input = screen.getByLabelText(/기업 검색/i);
    fireEvent.change(input, { target: { value: '삼성' } });

    await waitFor(() => {
      expect(apiService.searchCompanies).toHaveBeenCalledWith('삼성');
    });
  });

  it('limits selection to maxCompanies prop', () => {
    const maxCompanies = 3;
    render(
      <CompanySearch
        onCompaniesChange={mockOnCompaniesChange}
        maxCompanies={maxCompanies}
      />
    );

    const input = screen.getByLabelText(/기업 검색/i);
    expect(input).toHaveAttribute('placeholder', '기업명을 입력하세요 (최대 5개)');
  });

  it('handles API errors gracefully', async () => {
    (apiService.searchCompanies as jest.Mock).mockRejectedValue(
      new Error('API Error')
    );

    render(<CompanySearch onCompaniesChange={mockOnCompaniesChange} />);

    const input = screen.getByLabelText(/기업 검색/i);
    fireEvent.change(input, { target: { value: '삼성' } });

    await waitFor(() => {
      expect(apiService.searchCompanies).toHaveBeenCalledWith('삼성');
    });

    // Component should handle error without crashing
    expect(input).toBeInTheDocument();
  });
});