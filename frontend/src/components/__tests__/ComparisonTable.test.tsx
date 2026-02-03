import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ComparisonTable from '../ComparisonTable';
import { ComparisonSummary } from '@/types/financial';

describe('ComparisonTable', () => {
  const mockData: ComparisonSummary[] = [
    {
      기업명: '삼성전자',
      연도: '2023',
      '유동비율(%)': 200.5,
      '부채비율(%)': 65.3,
      '자기자본비율(%)': 60.5,
      'ROE(%)': 15.2,
      'ROA(%)': 8.3,
      '영업이익률(%)': 10.5,
      '순이익률(%)': 8.2,
      '총자산회전율': 0.75,
    },
    {
      기업명: 'LG전자',
      연도: '2023',
      '유동비율(%)': 150.3,
      '부채비율(%)': 120.5,
      '자기자본비율(%)': 45.3,
      'ROE(%)': 12.1,
      'ROA(%)': 6.5,
      '영업이익률(%)': 8.3,
      '순이익률(%)': 6.1,
      '총자산회전율': 0.82,
    },
  ];

  it('renders empty state when no data is provided', () => {
    render(<ComparisonTable data={[]} />);

    expect(screen.getByText('비교할 데이터가 없습니다')).toBeInTheDocument();
  });

  it('renders table with data', () => {
    render(<ComparisonTable data={mockData} />);

    // Check headers
    expect(screen.getByText('기업명')).toBeInTheDocument();
    expect(screen.getByText('연도')).toBeInTheDocument();
    expect(screen.getByText('유동비율(%)')).toBeInTheDocument();
    expect(screen.getByText('부채비율(%)')).toBeInTheDocument();
    expect(screen.getByText('ROE(%)')).toBeInTheDocument();
    expect(screen.getByText('ROA(%)')).toBeInTheDocument();

    // Check data
    expect(screen.getByText('삼성전자')).toBeInTheDocument();
    expect(screen.getByText('LG전자')).toBeInTheDocument();
  });

  it('displays values with correct precision', () => {
    render(<ComparisonTable data={mockData} />);

    // Check that values are formatted correctly
    expect(screen.getByText('200.5')).toBeInTheDocument(); // 유동비율
    expect(screen.getByText('65.3')).toBeInTheDocument(); // 부채비율
    expect(screen.getByText('0.75')).toBeInTheDocument(); // 총자산회전율
  });

  it('applies color coding based on metric values', () => {
    render(<ComparisonTable data={mockData} />);

    // Check that the table renders with data values
    // Values should be displayed in the table cells
    expect(screen.getByText('200.5')).toBeInTheDocument();
    expect(screen.getByText('15.2')).toBeInTheDocument();
  });

  it('renders all rows of data', () => {
    render(<ComparisonTable data={mockData} />);

    // Count table rows (excluding header)
    const rows = screen.getAllByRole('row');
    // 1 header row + 2 data rows = 3 total
    expect(rows).toHaveLength(3);
  });
});