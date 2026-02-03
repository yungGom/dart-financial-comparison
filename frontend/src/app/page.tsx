'use client';

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Grid,
  Alert,
  Snackbar,
  CircularProgress,
  FormControlLabel,
  Switch,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Collapse,
  FormGroup,
  Checkbox,
  Chip,
  Card,
  CardContent,
  Fade,
  Slide,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip
} from '@mui/material';
import {
  Download as DownloadIcon,
  Search as SearchIcon,
  Assessment as AssessmentIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Business as BusinessIcon,
  CalendarMonth as CalendarIcon,
  AccountBalance as AccountIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  AccountTree as AccountTreeIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import CompanySearch from '@/components/CompanySearch';
import AccountSelector from '@/components/AccountSelector';
import ComparisonTable from '@/components/ComparisonTable';
import { apiService } from '@/services/api';
import { Company, ComparisonRequest, ComparisonSummary, FsDiv } from '@/types/financial';

export default function Home() {
  // 상태 관리
  const [activeStep, setActiveStep] = useState(0);
  const [selectedCompanies, setSelectedCompanies] = useState<Company[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [fsDiv, setFsDiv] = useState<FsDiv>('CFS');  // 재무제표 구분 (연결/별도)
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
  const stepIcons = [<BusinessIcon key="business" />, <CalendarIcon key="calendar" />, <AccountIcon key="account" />, <SettingsIcon key="settings" />];

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
        note_items: selectedNoteItems,
        fs_div: fsDiv  // 연결(CFS) 또는 별도(OFS) 재무제표
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
      const blob = await apiService.exportToExcel(
        comparisonData,
        selectedAccounts,
        includeNotes
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
      case 2: return true;
      case 3: return true;
      default: return false;
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      py: 6
    }}>
      <Container maxWidth="xl">
        {/* 헤더 */}
        <Fade in timeout={800}>
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
              <TrendingUpIcon sx={{ fontSize: 60, color: 'white' }} />
            </Box>
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 800,
                color: 'white',
                textShadow: '0 2px 20px rgba(0,0,0,0.2)',
                fontSize: { xs: '2.5rem', md: '3.5rem' }
              }}
            >
              DART 재무정보 분석
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: 'rgba(255,255,255,0.9)',
                fontWeight: 300,
                maxWidth: '600px',
                mx: 'auto'
              }}
            >
              여러 기업의 재무제표를 한눈에 비교하고 Excel로 내보내세요
            </Typography>
          </Box>
        </Fade>

        {/* 진행 상황 표시 */}
        {progress > 0 && (
          <Slide direction="down" in={progress > 0}>
            <Paper
              elevation={0}
              sx={{
                mb: 3,
                p: 3,
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CircularProgress size={20} sx={{ mr: 2 }} />
                <Typography variant="body1" fontWeight="600" color="primary">
                  {progressMessage}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(102,126,234,0.1)'
                }}
              />
            </Paper>
          </Slide>
        )}

        {/* 메인 스테퍼 카드 */}
        <Fade in timeout={1000}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              mb: 4,
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 4,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}
          >
            <Stepper
              activeStep={activeStep}
              alternativeLabel
              sx={{
                '& .MuiStepLabel-root .Mui-completed': {
                  color: '#667eea',
                },
                '& .MuiStepLabel-root .Mui-active': {
                  color: '#764ba2',
                },
              }}
            >
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel
                    StepIconComponent={() => (
                      <Box
                        sx={{
                          width: 50,
                          height: 50,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: activeStep >= index
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            : '#e0e0e0',
                          color: 'white',
                          transition: 'all 0.3s',
                          boxShadow: activeStep >= index ? '0 4px 15px rgba(102,126,234,0.4)' : 'none'
                        }}
                      >
                        {activeStep > index ? <CheckCircleIcon /> : stepIcons[index]}
                      </Box>
                    )}
                  >
                    <Typography sx={{ fontWeight: activeStep === index ? 700 : 400, mt: 1 }}>
                      {label}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            <Box sx={{ mt: 5 }}>
              {/* Step 1: 기업 선택 */}
              {activeStep === 0 && (
                <Fade in timeout={500}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <BusinessIcon sx={{ fontSize: 32, color: '#667eea', mr: 2 }} />
                      <Box>
                        <Typography variant="h5" fontWeight="700" gutterBottom>
                          분석할 기업을 선택하세요
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          최대 5개 기업까지 동시에 비교할 수 있습니다
                        </Typography>
                      </Box>
                    </Box>
                    <CompanySearch
                      onCompaniesChange={setSelectedCompanies}
                      maxCompanies={5}
                    />
                  </Box>
                </Fade>
              )}

              {/* Step 2: 연도 선택 */}
              {activeStep === 1 && (
                <Fade in timeout={500}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <CalendarIcon sx={{ fontSize: 32, color: '#667eea', mr: 2 }} />
                      <Box>
                        <Typography variant="h5" fontWeight="700" gutterBottom>
                          분석할 연도를 선택하세요
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          여러 연도를 선택하여 연도별 트렌드를 분석할 수 있습니다
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={2} sx={{ mt: 2 }}>
                      {yearOptions.map((year) => (
                        <Grid item xs={6} sm={4} md={3} lg={2.4} key={year}>
                          <Card
                            elevation={selectedYears.includes(year.toString()) ? 8 : 1}
                            sx={{
                              cursor: 'pointer',
                              border: selectedYears.includes(year.toString())
                                ? '3px solid #667eea'
                                : '3px solid transparent',
                              background: selectedYears.includes(year.toString())
                                ? 'linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%)'
                                : 'white',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              transform: selectedYears.includes(year.toString()) ? 'scale(1.05)' : 'scale(1)',
                              '&:hover': {
                                transform: 'scale(1.05)',
                                boxShadow: selectedYears.includes(year.toString())
                                  ? '0 12px 40px rgba(102,126,234,0.3)'
                                  : '0 4px 20px rgba(0,0,0,0.1)',
                              }
                            }}
                            onClick={() => {
                              const yearStr = year.toString();
                              if (selectedYears.includes(yearStr)) {
                                setSelectedYears(selectedYears.filter(y => y !== yearStr));
                              } else {
                                setSelectedYears([...selectedYears, yearStr]);
                              }
                            }}
                          >
                            <CardContent sx={{ textAlign: 'center', py: 3 }}>
                              <Typography
                                variant="h4"
                                sx={{
                                  fontWeight: 800,
                                  color: selectedYears.includes(year.toString()) ? '#667eea' : '#333',
                                  mb: 0.5
                                }}
                              >
                                {year}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                {selectedYears.includes(year.toString()) ? '선택됨' : '클릭하여 선택'}
                              </Typography>
                              <Checkbox
                                checked={selectedYears.includes(year.toString())}
                                color="primary"
                                sx={{
                                  position: 'absolute',
                                  top: 8,
                                  right: 8,
                                  p: 0
                                }}
                              />
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>

                    {selectedYears.length > 0 && (
                      <Slide direction="up" in={selectedYears.length > 0}>
                        <Paper
                          sx={{
                            mt: 4,
                            p: 3,
                            background: 'linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%)',
                            border: '2px solid #667eea',
                            borderRadius: 3
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                            <Typography variant="subtitle1" fontWeight="700" color="#667eea" sx={{ mr: 2 }}>
                              선택된 연도:
                            </Typography>
                            {selectedYears.sort((a, b) => parseInt(b) - parseInt(a)).map(year => (
                              <Chip
                                key={year}
                                label={`${year}년`}
                                color="primary"
                                sx={{
                                  fontWeight: 600,
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                }}
                              />
                            ))}
                          </Box>
                        </Paper>
                      </Slide>
                    )}
                  </Box>
                </Fade>
              )}

              {/* Step 3: 계정과목 선택 */}
              {activeStep === 2 && (
                <Fade in timeout={500}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <AccountIcon sx={{ fontSize: 32, color: '#667eea', mr: 2 }} />
                      <Box>
                        <Typography variant="h5" fontWeight="700" gutterBottom>
                          분석할 계정과목을 선택하세요
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          선택하지 않으면 모든 계정과목이 포함됩니다
                        </Typography>
                      </Box>
                    </Box>
                    <AccountSelector onAccountsChange={setSelectedAccounts} />
                  </Box>
                </Fade>
              )}

              {/* Step 4: 옵션 설정 */}
              {activeStep === 3 && (
                <Fade in timeout={500}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <SettingsIcon sx={{ fontSize: 32, color: '#667eea', mr: 2 }} />
                      <Box>
                        <Typography variant="h5" fontWeight="700" gutterBottom>
                          추가 옵션 설정
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          재무제표 유형과 추가 정보를 선택하세요
                        </Typography>
                      </Box>
                    </Box>

                    {/* 재무제표 구분 선택 */}
                    <Paper
                      sx={{
                        p: 3,
                        mb: 3,
                        background: 'linear-gradient(135deg, rgba(102,126,234,0.08) 0%, rgba(118,75,162,0.08) 100%)',
                        border: '2px solid #667eea',
                        borderRadius: 3
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <DescriptionIcon sx={{ color: '#667eea', mr: 1 }} />
                        <Typography variant="subtitle1" fontWeight="700" color="#667eea">
                          재무제표 유형 선택
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        연결재무제표는 자회사를 포함한 그룹 전체의 재무정보를, 별도재무제표는 해당 기업만의 재무정보를 보여줍니다.
                      </Typography>
                      <ToggleButtonGroup
                        value={fsDiv}
                        exclusive
                        onChange={(_, newValue) => {
                          if (newValue !== null) {
                            setFsDiv(newValue);
                          }
                        }}
                        sx={{
                          width: '100%',
                          '& .MuiToggleButton-root': {
                            flex: 1,
                            py: 2,
                            borderRadius: 2,
                            fontWeight: 600,
                            fontSize: '1rem',
                            textTransform: 'none',
                            border: '2px solid #e0e0e0',
                            '&.Mui-selected': {
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              borderColor: '#667eea',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                              }
                            },
                            '&:hover': {
                              background: 'rgba(102,126,234,0.1)',
                            }
                          }
                        }}
                      >
                        <ToggleButton value="CFS">
                          <Tooltip title="자회사 포함 그룹 전체 재무정보">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <AccountTreeIcon />
                              <Box sx={{ textAlign: 'left' }}>
                                <Typography variant="body1" fontWeight="700">
                                  연결재무제표
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>
                                  Consolidated (CFS)
                                </Typography>
                              </Box>
                            </Box>
                          </Tooltip>
                        </ToggleButton>
                        <ToggleButton value="OFS">
                          <Tooltip title="해당 기업만의 재무정보">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <DescriptionIcon />
                              <Box sx={{ textAlign: 'left' }}>
                                <Typography variant="body1" fontWeight="700">
                                  별도재무제표
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>
                                  Separate (OFS)
                                </Typography>
                              </Box>
                            </Box>
                          </Tooltip>
                        </ToggleButton>
                      </ToggleButtonGroup>
                      <Alert
                        severity="info"
                        sx={{
                          mt: 2,
                          borderRadius: 2,
                          '& .MuiAlert-icon': { alignItems: 'center' }
                        }}
                      >
                        {fsDiv === 'CFS'
                          ? '연결재무제표: 종속회사를 포함한 연결기준 재무정보입니다. 그룹 전체의 재무상태를 파악할 수 있습니다.'
                          : '별도재무제표: 해당 법인만의 개별 재무정보입니다. 종속회사 투자금액은 원가로 표시됩니다.'
                        }
                      </Alert>
                    </Paper>

                    <Paper sx={{ p: 3, mb: 3, background: '#f8f9fa', borderRadius: 2 }}>
                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={includeRatios}
                              onChange={(e) => setIncludeRatios(e.target.checked)}
                              color="primary"
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body1" fontWeight="600">재무비율 계산</Typography>
                              <Typography variant="caption" color="text.secondary">
                                ROE, ROA, 부채비율 등 주요 재무비율을 자동으로 계산합니다
                              </Typography>
                            </Box>
                          }
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={includeNotes}
                              onChange={(e) => setIncludeNotes(e.target.checked)}
                              color="primary"
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body1" fontWeight="600">주석 정보 포함</Typography>
                              <Typography variant="caption" color="text.secondary">
                                감사인, 회계기준 등 주석 정보를 추출합니다
                              </Typography>
                            </Box>
                          }
                        />
                      </FormGroup>

                      {/* 주석 항목 선택 */}
                      <Collapse in={includeNotes}>
                        <Box sx={{ mt: 3, pl: 2, borderLeft: '3px solid #667eea' }}>
                          <Typography variant="subtitle2" fontWeight="700" gutterBottom sx={{ color: '#667eea' }}>
                            추출할 주석 항목:
                          </Typography>
                          <FormGroup row sx={{ gap: 1 }}>
                            {noteItemOptions.map(option => (
                              <Chip
                                key={option.value}
                                label={option.label}
                                onClick={() => handleNoteItemToggle(option.value)}
                                color={selectedNoteItems.includes(option.value) ? 'primary' : 'default'}
                                variant={selectedNoteItems.includes(option.value) ? 'filled' : 'outlined'}
                                sx={{
                                  fontWeight: 600,
                                  ...(selectedNoteItems.includes(option.value) && {
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                  })
                                }}
                              />
                            ))}
                          </FormGroup>
                        </Box>
                      </Collapse>
                    </Paper>

                    {/* 선택 요약 */}
                    <Paper
                      sx={{
                        p: 4,
                        background: 'linear-gradient(135deg, rgba(102,126,234,0.05) 0%, rgba(118,75,162,0.05) 100%)',
                        border: '2px solid #e0e0e0',
                        borderRadius: 3
                      }}
                    >
                      <Typography variant="h6" fontWeight="700" gutterBottom sx={{ mb: 3 }}>
                        📋 선택 요약
                      </Typography>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                            <BusinessIcon sx={{ mr: 2, color: '#667eea' }} />
                            <Box>
                              <Typography variant="subtitle2" color="text.secondary">기업</Typography>
                              <Typography variant="body1" fontWeight="600">
                                {selectedCompanies.map(c => c.name).join(', ')}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                            <CalendarIcon sx={{ mr: 2, color: '#667eea' }} />
                            <Box>
                              <Typography variant="subtitle2" color="text.secondary">연도</Typography>
                              <Typography variant="body1" fontWeight="600">
                                {selectedYears.sort((a, b) => parseInt(b) - parseInt(a)).join(', ')}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                            <DescriptionIcon sx={{ mr: 2, color: '#667eea' }} />
                            <Box>
                              <Typography variant="subtitle2" color="text.secondary">재무제표 유형</Typography>
                              <Typography variant="body1" fontWeight="600">
                                {fsDiv === 'CFS' ? '연결재무제표' : '별도재무제표'}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                            <AccountIcon sx={{ mr: 2, color: '#667eea' }} />
                            <Box>
                              <Typography variant="subtitle2" color="text.secondary">계정과목</Typography>
                              <Typography variant="body1" fontWeight="600">
                                {selectedAccounts.length > 0 ? `${selectedAccounts.length}개 선택` : '전체'}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                            <SettingsIcon sx={{ mr: 2, color: '#667eea' }} />
                            <Box>
                              <Typography variant="subtitle2" color="text.secondary">옵션</Typography>
                              <Typography variant="body1" fontWeight="600">
                                {[
                                  includeRatios && '재무비율',
                                  includeNotes && '주석정보'
                                ].filter(Boolean).join(', ') || '없음'}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Box>
                </Fade>
              )}

              {/* 네비게이션 버튼 */}
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Button
                  size="large"
                  disabled={activeStep === 0}
                  onClick={() => setActiveStep(activeStep - 1)}
                  sx={{
                    px: 4,
                    fontWeight: 600,
                    borderRadius: 2
                  }}
                >
                  이전
                </Button>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  {activeStep === steps.length - 1 ? (
                    <>
                      <Button
                        size="large"
                        variant="contained"
                        onClick={handleAnalyze}
                        disabled={loading || !canProceed()}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AssessmentIcon />}
                        sx={{
                          px: 4,
                          py: 1.5,
                          fontWeight: 700,
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          boxShadow: '0 4px 15px rgba(102,126,234,0.4)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                            boxShadow: '0 6px 20px rgba(102,126,234,0.5)',
                          }
                        }}
                      >
                        {loading ? '분석 중...' : '분석 시작'}
                      </Button>
                      <Button
                        size="large"
                        variant="outlined"
                        onClick={handleExport}
                        disabled={loading || !comparisonData}
                        startIcon={<DownloadIcon />}
                        sx={{
                          px: 4,
                          py: 1.5,
                          fontWeight: 700,
                          borderRadius: 2,
                          borderWidth: 2,
                          borderColor: '#667eea',
                          color: '#667eea',
                          '&:hover': {
                            borderWidth: 2,
                            borderColor: '#5568d3',
                            background: 'rgba(102,126,234,0.05)'
                          }
                        }}
                      >
                        Excel 다운로드
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="large"
                      variant="contained"
                      onClick={() => setActiveStep(activeStep + 1)}
                      disabled={!canProceed()}
                      sx={{
                        px: 4,
                        py: 1.5,
                        fontWeight: 700,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: '0 4px 15px rgba(102,126,234,0.4)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                          boxShadow: '0 6px 20px rgba(102,126,234,0.5)',
                        }
                      }}
                    >
                      다음
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
          </Paper>
        </Fade>

        {/* 결과 표시 */}
        {summaryData.length > 0 && (
          <Fade in timeout={1000}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: 4,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AssessmentIcon sx={{ fontSize: 32, color: '#667eea', mr: 2 }} />
                  <Typography variant="h5" fontWeight="700">
                    비교 분석 결과
                  </Typography>
                </Box>
                <Chip
                  icon={fsDiv === 'CFS' ? <AccountTreeIcon /> : <DescriptionIcon />}
                  label={fsDiv === 'CFS' ? '연결재무제표' : '별도재무제표'}
                  sx={{
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    '& .MuiChip-icon': { color: 'white' }
                  }}
                />
              </Box>
              <ComparisonTable data={summaryData} />
            </Paper>
          </Fade>
        )}

        {/* 알림 메시지 */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            severity="error"
            onClose={() => setError(null)}
            sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
          >
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            severity="success"
            onClose={() => setSuccess(null)}
            sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
          >
            {success}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}
