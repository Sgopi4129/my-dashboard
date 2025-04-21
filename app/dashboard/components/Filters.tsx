'use client';

import React, { useCallback, useMemo } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  TextField,
} from '@mui/material';
import { FiltersState, FilterOptions } from '../types';

interface FiltersProps {
  options: FilterOptions;
  onFilterChange: (filters: FiltersState) => void;
}

export default function Filters({ options, onFilterChange }: FiltersProps) {
  const [filters, setFilters] = React.useState<FiltersState>({});

  const handleChange = useCallback(
    (key: keyof FiltersState, value: string | string[]) => {
      // Avoid updating if the value hasn't changed
      if (JSON.stringify(filters[key]) === JSON.stringify(value)) return;

      const newFilters = { ...filters, [key]: value };
      setFilters(newFilters);
      onFilterChange(newFilters);
    },
    [filters, onFilterChange]
  );

  // Validate and handle End Year input
  const handleEndYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numeric values or empty string
    if (value === '' || /^\d{4}$/.test(value)) {
      handleChange('end_year', value);
    }
  };

  // Memoize Topics dropdown to prevent unnecessary re-renders
  const topicsDropdown = useMemo(() => (
    <FormControl fullWidth>
      <InputLabel id="topics-label">Topics</InputLabel>
      <Select
        labelId="topics-label"
        id="topics"
        name="topics"
        multiple
        value={filters.topics || []}
        onChange={(e) => handleChange('topics', e.target.value as string[])}
        renderValue={(selected) => (selected as string[]).join(', ')}
      >
        {options.topics.map((topic) => (
          <MenuItem key={topic} value={topic}>
            <Checkbox
              id={`topic-checkbox-${topic}`}
              name={`topic-checkbox-${topic}`}
              checked={(filters.topics || []).includes(topic)}
            />
            {topic}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  ), [options.topics, filters.topics, handleChange]);

  // Memoize Regions checkboxes
  const regionsCheckboxes = useMemo(() => (
    <Box>
      {options.regions.map((region) => (
        <FormControlLabel
          key={region}
          control={
            <Checkbox
              id={`region-checkbox-${region}`}
              name={`region-checkbox-${region}`}
              checked={(filters.regions || []).includes(region)}
              onChange={(e) => {
                const newRegions = e.target.checked
                  ? [...(filters.regions || []), region]
                  : (filters.regions || []).filter((r) => r !== region);
                handleChange('regions', newRegions);
              }}
            />
          }
          label={region}
          labelPlacement="end"
        />
      ))}
    </Box>
  ), [options.regions, filters.regions, handleChange]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {topicsDropdown}

      <TextField
        id="end_year"
        name="end_year"
        label="End Year"
        value={filters.end_year || ''}
        onChange={handleEndYearChange}
        fullWidth
        inputProps={{ pattern: '\\d{4}', maxLength: 4 }} // Restrict to 4 digits
        placeholder="e.g., 2025"
      />

      {regionsCheckboxes}
    </Box>
  );
}