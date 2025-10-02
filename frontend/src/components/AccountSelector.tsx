'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Button,
  Chip,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon
} from '@mui/icons-material';
import { apiService } from '@/services/api';

interface AccountSelectorProps {
  onAccountsChange: (accounts: string[]) => void;
}

interface AccountCategory {
  category: string;
  accounts: { [key: string]: string };
}

export default function AccountSelector({ onAccountsChange }: AccountSelectorProps) {
  const [accountData, setAccountData] = useState<{ [key: string]: AccountCategory }>({});
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);

  useEffect(() => {
    loadAccountList();
  }, []);

  const loadAccountList = async () => {
    setLoading(true);
    try {
      const response = await apiService.getAccountList();
      setAccountData(response.accounts);
    } catch (error) {
      console.error('Failed to load account list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountToggle = (accountId: string) => {
    const newSelected = new Set(selectedAccounts);
    if (newSelected.has(accountId)) {
      newSelected.delete(accountId);
    } else {
      newSelected.add(accountId);
    }
    setSelectedAccounts(newSelected);
    onAccountsChange(Array.from(newSelected));
  };

  const handleSelectAll = (categoryKey: string) => {
    const category = accountData[categoryKey];
    const accountIds = Object.keys(category.accounts);
    const newSelected = new Set(selectedAccounts);

    const allSelected = accountIds.every(id => selectedAccounts.has(id));

    if (allSelected) {
      // 모두 해제
      accountIds.forEach(id => newSelected.delete(id));
    } else {
      // 모두 선택
      accountIds.forEach(id => newSelected.add(id));
    }

    setSelectedAccounts(newSelected);
    onAccountsChange(Array.from(newSelected));
  };

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    if (isExpanded) {
      setExpanded([...expanded, panel]);
    } else {
      setExpanded(expanded.filter(p => p !== panel));
    }
  };

  const filteredAccounts = () => {
    if (!searchQuery) return accountData;

    const filtered: { [key: string]: AccountCategory } = {};

    Object.entries(accountData).forEach(([key, category]) => {
      const matchingAccounts: { [key: string]: string } = {};

      Object.entries(category.accounts).forEach(([accountId, accountName]) => {
        if (accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            accountId.toLowerCase().includes(searchQuery.toLowerCase())) {
          matchingAccounts[accountId] = accountName;
        }
      });

      if (Object.keys(matchingAccounts).length > 0) {
        filtered[key] = {
          category: category.category,
          accounts: matchingAccounts
        };
      }
    });

    return filtered;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const displayData = filteredAccounts();

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        계정과목 선택
      </Typography>

      {/* 검색 필드 */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="계정과목 검색..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {/* 선택된 계정과목 표시 */}
      {selectedAccounts.size > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            선택된 계정과목: {selectedAccounts.size}개
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {Array.from(selectedAccounts).slice(0, 5).map(accountId => {
              // Find account name
              let accountName = accountId;
              Object.values(accountData).forEach(category => {
                if (category.accounts[accountId]) {
                  accountName = category.accounts[accountId];
                }
              });
              return (
                <Chip
                  key={accountId}
                  label={accountName}
                  size="small"
                  onDelete={() => handleAccountToggle(accountId)}
                />
              );
            })}
            {selectedAccounts.size > 5 && (
              <Chip
                label={`+${selectedAccounts.size - 5} more`}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
      )}

      {/* 계정과목 카테고리별 표시 */}
      {Object.entries(displayData).map(([key, category]) => {
        const accountIds = Object.keys(category.accounts);
        const selectedCount = accountIds.filter(id => selectedAccounts.has(id)).length;
        const allSelected = selectedCount === accountIds.length && accountIds.length > 0;
        const someSelected = selectedCount > 0 && selectedCount < accountIds.length;

        return (
          <Accordion
            key={key}
            expanded={expanded.includes(key)}
            onChange={handleAccordionChange(key)}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`${key}-content`}
              id={`${key}-header`}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mr: 2 }}>
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleSelectAll(key);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <Typography sx={{ flexGrow: 1 }}>
                  {category.category}
                </Typography>
                <Chip
                  label={`${selectedCount} / ${accountIds.length}`}
                  size="small"
                  color={selectedCount > 0 ? "primary" : "default"}
                  variant={selectedCount > 0 ? "filled" : "outlined"}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <FormGroup>
                {Object.entries(category.accounts).map(([accountId, accountName]) => (
                  <FormControlLabel
                    key={accountId}
                    control={
                      <Checkbox
                        checked={selectedAccounts.has(accountId)}
                        onChange={() => handleAccountToggle(accountId)}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2">{accountName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {accountId}
                        </Typography>
                      </Box>
                    }
                    sx={{ mb: 1 }}
                  />
                ))}
              </FormGroup>
            </AccordionDetails>
          </Accordion>
        );
      })}

      {/* 전체 선택/해제 버튼 */}
      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            const allAccounts = new Set<string>();
            Object.values(accountData).forEach(category => {
              Object.keys(category.accounts).forEach(id => allAccounts.add(id));
            });
            setSelectedAccounts(allAccounts);
            onAccountsChange(Array.from(allAccounts));
          }}
        >
          전체 선택
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            setSelectedAccounts(new Set());
            onAccountsChange([]);
          }}
        >
          전체 해제
        </Button>
      </Box>
    </Box>
  );
}