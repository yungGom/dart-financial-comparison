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
  Divider,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Collapse,
  FormGroup,
  Checkbox
} from '@mui/material';
import {
  Download as DownloadIcon,
  Search as SearchIcon,
  Assessment as AssessmentIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import CompanySearch from '@/components/CompanySearch';
import AccountSelector from '@/components/AccountSelector';
import ComparisonTable from '@/components/ComparisonTable';
import { apiService } from '@/services/api';
import { Company, ComparisonRequest, ComparisonSummary } from '@/types/financial';

export default function Home() {
  // 상태 관리
  const [activeStep, setActiveStep] = useState(0);
  const [selectedCompanies, setSelectedCompanies] = useState<Company[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [includeRatios, setIncludeRatios] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(false);
  const [selectedNoteItems, setSelectedNoteItems] = useState<string[]>(['auditor', 'accounting_standard']);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<ComparisonSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 스텝 정의
  const steps = ['기업 선택', '연도 선택', '계정과목 선택', '옵션 설정'];

  // 연도 옵션 생성
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i);

  // 주석 항목 옵션
  const noteItemOptions = [
    { value: 'auditor', label: '감사인' },
    { value: 'accounting_standard', label: '회계기준' },
    { value: 'depreciation_policy', label: '감가상각 정책' },
    { value: 'useful_life', label: '내용연수' },
    { value: 'significant_policies', label: '주요 회계정책' }
  ];

  const handleYearsChange = (event: SelectChangeEvent<typeof selectedYears>) => {
    const value = event.target.value;
    setSelectedYears(typeof value === 'string' ? value.split(',') : value);
  };

  const handleNoteItemToggle = (item: string) => {
    if (selectedNoteItems.includes(item)) {
      setSelectedNoteItems(selectedNoteItems.filter(i => i !== item));
    } else {
      setSelectedNoteItems([...selectedNoteItems, item]);
    }
  };

  const simulateProgress = (steps: string[], duration: number = 500) => {
    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setProgressMessage(steps[currentStep]);
        setProgress((currentStep + 1) / steps.length * 100);
        currentStep++;
      } else {
        clearInterval(interval);
      }
    }, duration);
  };

  const handleAnalyze = async () => {
    if (selectedCompanies.length === 0 || selectedYears.length === 0) {
      setError('기업과 연도를 선택해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(0);

    // 진행 상황 시뮬레이션
    const steps = [
      '데이터 수집 준비...',
      '재무제표 조회 중...',
      '재무비율 계산 중...',
      includeNotes ? '주석 정보 추출 중...' : '',
      '데이터 정리 중...',
      '완료!'
    ].filter(Boolean);

    simulateProgress(steps);

    try {
      const request: any = {
        companies: selectedCompanies,
        years: selectedYears,
        selected_accounts: selectedAccounts,
        include_ratios: includeRatios,
        include_notes: includeNotes,
        note_items: selectedNoteItems
      };

      const response = await apiService.createComparison(request);
      setComparisonData(response.data);
      setSummaryData(response.summary);
      setSuccess('분석이 완료되었습니다!');
      setProgress(100);
      setProgressMessage('완료!');
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setError(err.response?.data?.detail || '분석 중 오류가 발생했습니다.');
      setProgress(0);
    } finally {
      setLoading(false);
      setTimeout(() => {
        setProgress(0);
        setProgressMessage('');
      }, 2000);
    }
  };

  const handleExport = async () => {
    if (!comparisonData) {
      setError('먼저 분석을 실행해주세요.');
      return;
    }

    setLoading(true);
    setProgressMessage('Excel 파일 생성 중...');

    try {
      // Excel export 시 선택한 계정과목과 주석 포함 여부 전달
      const blob = await apiService.exportToExcel(
        comparisonData,
        selectedAccounts,  // 선택한 계정과목
        includeNotes       // 주석 정보 포함 여부
      );
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
      setProgressMessage('');
    }
  };

  const canProceed = () => {
    switch (activeStep) {
      case 0: return selectedCompanies.length > 0;
      case 1: return selectedYears.length > 0;
      case 2: return true; // 계정과목은 선택사항
      case 3: return true;
      default: return false;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* 헤더 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center" fontWeight="bold">
          DART 재무정보 비교 분석 시스템
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary">
          여러 기업의 재무정보를 비교 분석하고 Excel로 내보낼 수 있습니다
        </Typography>
      </Box>

      {/* 진행 상황 표시 */}
      {progress > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {progressMessage}
          </Typography>
          <LinearProgress variant="determinate" value={progress} />
        </Box>
      )}

      {/* 스테퍼 */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mt: 4 }}>
          {/* Step 1: 기업 선택 */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                분석할 기업을 선택하세요
              </Typography>
              <CompanySearch
                onCompaniesChange={setSelectedCompanies}
                maxCompanies={5}
              />
            </Box>
          )}

          {/* Step 2: 연도 선택 */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                분석할 연도를 선택하세요
              </Typography>
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
            </Box>
          )}

          {/* Step 3: 계정과목 선택 */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                분석할 계정과목을 선택하세요 (선택사항)
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                선택하지 않으면 모든 계정과목이 포함됩니다
              </Typography>
              <AccountSelector onAccountsChange={setSelectedAccounts} />
            </Box>
          )}

          {/* Step 4: 옵션 설정 */}
          {activeStep === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                추가 옵션 설정
              </Typography>

              <FormGroup>
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
                      checked={includeNotes}
                      onChange={(e) => setIncludeNotes(e.target.checked)}
                    />
                  }
                  label="주석 정보 포함"
                />
              </FormGroup>

              {/* 주석 항목 선택 */}
              <Collapse in={includeNotes}>
                <Box sx={{ mt: 2, pl: 4 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    추출할 주석 항목:
                  </Typography>
                  <FormGroup row>
                    {noteItemOptions.map(option => (
                      <FormControlLabel
                        key={option.value}
                        control={
                          <Checkbox
                            checked={selectedNoteItems.includes(option.value)}
                            onChange={() => handleNoteItemToggle(option.value)}
                            size="small"
                          />
                        }
                        label={option.label}
                      />
                    ))}
                  </FormGroup>
                </Box>
              </Collapse>

              {/* 선택 요약 */}
              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  선택 요약:
                </Typography>
                <Typography variant="body2">
                  • 기업: {selectedCompanies.map(c => c.name).join(', ')}
                </Typography>
                <Typography variant="body2">
                  • 연도: {selectedYears.join(', ')}
                </Typography>
                <Typography variant="body2">
                  • 계정과목: {selectedAccounts.length > 0 ? `${selectedAccounts.length}개 선택` : '전체'}
                </Typography>
                <Typography variant="body2">
                  • 옵션: {[
                    includeRatios && '재무비율',
                    includeNotes && '주석정보'
                  ].filter(Boolean).join(', ') || '없음'}
                </Typography>
              </Box>
            </Box>
          )}

          {/* 네비게이션 버튼 */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              disabled={activeStep === 0}
              onClick={() => setActiveStep(activeStep - 1)}
            >
              이전
            </Button>

            <Box sx={{ display: 'flex', gap: 2 }}>
              {activeStep === steps.length - 1 ? (
                <>
                  <Button
                    variant="contained"
                    onClick={handleAnalyze}
                    disabled={loading || !canProceed()}
                    startIcon={loading ? <CircularProgress size={20} /> : <AssessmentIcon />}
                  >
                    {loading ? '분석 중...' : '분석 시작'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleExport}
                    disabled={loading || !comparisonData}
                    startIcon={<DownloadIcon />}
                  >
                    Excel 다운로드
                  </Button>
                </>
              ) : (
                <Button
                  variant="contained"
                  onClick={() => setActiveStep(activeStep + 1)}
                  disabled={!canProceed()}
                >
                  다음
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* 결과 표시 */}
      {summaryData.length > 0 && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            비교 분석 결과
          </Typography>
          <ComparisonTable data={summaryData} />
        </Paper>
      )}

      {/* 알림 메시지 */}
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