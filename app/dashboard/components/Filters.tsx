'use client';

import React, { useCallback } from 'react';
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
      const newFilters = { ...filters, [key]: value };
      setFilters(newFilters);
      onFilterChange(newFilters);
    },
    [filters, onFilterChange, setFilters] // Added setFilters
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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

      <TextField
        id="end_year"
        name="end_year"
        label="End Year"
        value={filters.end_year || ''}
        onChange={(e) => handleChange('end_year', e.target.value)}
        fullWidth
      />

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
    </Box>
  );
}