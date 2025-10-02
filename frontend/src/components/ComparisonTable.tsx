'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip
} from '@mui/material';
import { ComparisonSummary } from '@/types/financial';

interface ComparisonTableProps {
  data: ComparisonSummary[];
}

export default function ComparisonTable({ data }: ComparisonTableProps) {
  if (!data || data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          비교할 데이터가 없습니다
        </Typography>
      </Box>
    );
  }

  // Function to get color based on value
  const getValueColor = (value: number, metric: string) => {
    if (metric.includes('부채비율')) {
      return value > 200 ? 'error' : value > 100 ? 'warning' : 'success';
    }
    if (metric.includes('ROE') || metric.includes('ROA')) {
      return value > 15 ? 'success' : value > 5 ? 'default' : 'error';
    }
    if (metric.includes('유동비율')) {
      return value > 150 ? 'success' : value > 100 ? 'default' : 'error';
    }
    return 'default';
  };

  return (
    <TableContainer component={Paper} sx={{ mt: 3 }}>
      <Table sx={{ minWidth: 650 }} aria-label="comparison table">
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            <TableCell><strong>기업명</strong></TableCell>
            <TableCell align="center"><strong>연도</strong></TableCell>
            <TableCell align="right"><strong>유동비율(%)</strong></TableCell>
            <TableCell align="right"><strong>부채비율(%)</strong></TableCell>
            <TableCell align="right"><strong>자기자본비율(%)</strong></TableCell>
            <TableCell align="right"><strong>ROE(%)</strong></TableCell>
            <TableCell align="right"><strong>ROA(%)</strong></TableCell>
            <TableCell align="right"><strong>영업이익률(%)</strong></TableCell>
            <TableCell align="right"><strong>순이익률(%)</strong></TableCell>
            <TableCell align="right"><strong>총자산회전율</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, index) => (
            <TableRow
              key={`${row.기업명}-${row.연도}-${index}`}
              sx={{
                '&:nth-of-type(odd)': {
                  backgroundColor: '#fafafa',
                },
                '&:hover': {
                  backgroundColor: '#f0f0f0',
                }
              }}
            >
              <TableCell component="th" scope="row">
                <Typography variant="body2" fontWeight="medium">
                  {row.기업명}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Chip label={row.연도} size="small" variant="outlined" />
              </TableCell>
              <TableCell align="right">
                <Chip
                  label={row['유동비율(%)'].toFixed(1)}
                  size="small"
                  color={getValueColor(row['유동비율(%)'], '유동비율')}
                  variant="filled"
                />
              </TableCell>
              <TableCell align="right">
                <Chip
                  label={row['부채비율(%)'].toFixed(1)}
                  size="small"
                  color={getValueColor(row['부채비율(%)'], '부채비율')}
                  variant="filled"
                />
              </TableCell>
              <TableCell align="right">{row['자기자본비율(%)'].toFixed(1)}</TableCell>
              <TableCell align="right">
                <Chip
                  label={row['ROE(%)'].toFixed(1)}
                  size="small"
                  color={getValueColor(row['ROE(%)'], 'ROE')}
                  variant="filled"
                />
              </TableCell>
              <TableCell align="right">
                <Chip
                  label={row['ROA(%)'].toFixed(1)}
                  size="small"
                  color={getValueColor(row['ROA(%)'], 'ROA')}
                  variant="filled"
                />
              </TableCell>
              <TableCell align="right">{row['영업이익률(%)'].toFixed(1)}</TableCell>
              <TableCell align="right">{row['순이익률(%)'].toFixed(1)}</TableCell>
              <TableCell align="right">{row['총자산회전율'].toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}