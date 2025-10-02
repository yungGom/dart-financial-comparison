'use client';

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Alert,
  Snackbar,
  CircularProgress,
  FormControlLabel,
  Switch,
  Divider
} from '@mui/material';
import {
  Download as DownloadIcon,
  Search as SearchIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import CompanySearch from '@/components/CompanySearch';
import ComparisonTable from '@/components/ComparisonTable';
import { apiService } from '@/services/api';
import { Company, ComparisonRequest, ComparisonSummary } from '@/types/financial';

export default function Home() {
  const [selectedCompanies, setSelectedCompanies] = useState<Company[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [includeRatios, setIncludeRatios] = useState(true);
  const [includeAudit, setIncludeAudit] = useState(false);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<ComparisonSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Generate year options (current year to 10 years ago)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const handleYearsChange = (event: SelectChangeEvent<typeof selectedYears>) => {
    const value = event.target.value;
    setSelectedYears(typeof value === 'string' ? value.split(',') : value);
  };

  const handleAnalyze = async () => {
    if (selectedCompanies.length === 0 || selectedYears.length === 0) {
      setError('기업과 연도를 선택해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: ComparisonRequest = {
        companies: selectedCompanies,
        years: selectedYears,
        include_ratios: includeRatios,
        include_audit: includeAudit
      };

      const response = await apiService.createComparison(request);
      setComparisonData(response.data);
      setSummaryData(response.summary);
      setSuccess('분석이 완료되었습니다!');
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setError(err.response?.data?.detail || '분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!comparisonData) {
      setError('먼저 분석을 실행해주세요.');
      return;
    }

    setLoading(true);
    try {
      const blob = await apiService.exportToExcel(comparisonData);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial_comparison_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccess('Excel 파일이 다운로드되었습니다!');
    } catch (err) {
      console.error('Export failed:', err);
      setError('Excel 파일 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center" fontWeight="bold">
          DART 재무정보 비교 분석 시스템
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary">
          여러 기업의 재무정보를 비교 분석하고 Excel로 내보낼 수 있습니다
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          <SearchIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          분석 설정
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <CompanySearch
              onCompaniesChange={setSelectedCompanies}
              maxCompanies={5}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>분석 연도</InputLabel>
              <Select
                multiple
                value={selectedYears}
                onChange={handleYearsChange}
                label="분석 연도"
                renderValue={(selected) => selected.join(', ')}
              >
                {yearOptions.map((year) => (
                  <MenuItem key={year} value={year.toString()}>
                    {year}년
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', height: '100%' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={includeRatios}
                    onChange={(e) => setIncludeRatios(e.target.checked)}
                  />
                }
                label="재무비율 계산"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={includeAudit}
                    onChange={(e) => setIncludeAudit(e.target.checked)}
                  />
                }
                label="감사 정보 포함"
              />
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleAnalyze}
                disabled={loading || selectedCompanies.length === 0 || selectedYears.length === 0}
                startIcon={loading ? <CircularProgress size={20} /> : <AssessmentIcon />}
              >
                {loading ? '분석 중...' : '분석 시작'}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={handleExport}
                disabled={loading || !comparisonData}
                startIcon={<DownloadIcon />}
              >
                Excel 다운로드
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {summaryData.length > 0 && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            비교 분석 결과
          </Typography>
          <ComparisonTable data={summaryData} />
        </Paper>
      )}

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
}