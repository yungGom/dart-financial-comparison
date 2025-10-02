'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  Chip,
  Box,
  CircularProgress
} from '@mui/material';
import { apiService } from '@/services/api';
import { Company } from '@/types/financial';
import debounce from 'lodash/debounce';

interface CompanySearchProps {
  onCompaniesChange: (companies: Company[]) => void;
  maxCompanies?: number;
}

export default function CompanySearch({
  onCompaniesChange,
  maxCompanies = 5
}: CompanySearchProps) {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<Company[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced search function
  const searchCompanies = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setOptions([]);
        return;
      }

      setLoading(true);
      try {
        const results = await apiService.searchCompanies(query);
        setOptions(results);
      } catch (error) {
        console.error('Failed to search companies:', error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    searchCompanies(inputValue);
  }, [inputValue, searchCompanies]);

  const handleChange = (event: any, newValue: Company[]) => {
    if (newValue.length <= maxCompanies) {
      setSelectedCompanies(newValue);
      onCompaniesChange(newValue);
    }
  };

  return (
    <Box sx={{ width: '100%', mb: 3 }}>
      <Autocomplete
        multiple
        options={options}
        getOptionLabel={(option) => `${option.name} (${option.stock_code || option.corp_code})`}
        value={selectedCompanies}
        onChange={handleChange}
        inputValue={inputValue}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue);
        }}
        loading={loading}
        renderInput={(params) => (
          <TextField
            {...params}
            label="기업 검색"
            placeholder="기업명을 입력하세요 (최대 5개)"
            variant="outlined"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderTags={(value: Company[], getTagProps) =>
          value.map((option: Company, index: number) => (
            <Chip
              variant="outlined"
              label={option.name}
              {...getTagProps({ index })}
              key={option.corp_code}
            />
          ))
        }
        isOptionEqualToValue={(option, value) => option.corp_code === value.corp_code}
        noOptionsText={inputValue.length < 2 ? "2글자 이상 입력하세요" : "검색 결과가 없습니다"}
        sx={{ width: '100%' }}
      />
    </Box>
  );
}