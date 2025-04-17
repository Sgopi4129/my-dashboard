// app/dashboard/components/Filters.tsx
'use client';

import { useState } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Chip, OutlinedInput, SelectChangeEvent } from '@mui/material';
import { FilterOptions, FiltersState } from '../types'; // Import shared types

interface FiltersProps {
  options: FilterOptions;
  onFilterChange: (filters: FiltersState) => void;
}

export default function Filters({ options, onFilterChange }: FiltersProps) {
  const [filters, setFilters] = useState<FiltersState>({});

  const handleChange = (filterKey: string) => (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string | string[];
    const updatedFilters: FiltersState = { ...filters, [filterKey]: value };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const filterKeys = [
    { key: 'end_years', label: 'End Year' },
    { key: 'topics', label: 'Topic' },
    { key: 'sectors', label: 'Sector' },
    { key: 'regions', label: 'Region' },
    { key: 'pestles', label: 'PESTLE' },
    { key: 'sources', label: 'Source' },
    { key: 'countries', label: 'Country' },
  ];

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
      {filterKeys.map(({ key, label }) => (
        <FormControl key={key} sx={{ minWidth: 200 }}>
          <InputLabel>{label}</InputLabel>
          <Select
            multiple
            value={(filters[key] as string[]) || []}
            onChange={handleChange(key)}
            input={<OutlinedInput label={label} />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {(selected as string[]).map((value) => (
                  <Chip key={value} label={value} />
                ))}
              </Box>
            )}
          >
            {(options[key as keyof FilterOptions] || []).map((option: string) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ))}
    </Box>
  );
}