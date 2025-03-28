// app/dashboard/components/Filters.tsx
'use client';

import { useState } from 'react';
import { TextField, MenuItem, Slider, Box, Typography } from '@mui/material';

interface FilterOptions {
  end_years?: string[];
  topics?: string[];
  sectors?: string[];
  regions?: string[];
  pestles?: string[];
  sources?: string[];
  countries?: string[];
}

interface FiltersProps {
  options: FilterOptions;
  onFilterChange: (filters: any) => void;
}

export default function Filters({ options, onFilterChange }: FiltersProps) {
  const [filters, setFilters] = useState({
    end_year: '',
    topic: '',
    sector: '',
    region: '',
    pestle: '',
    source: '',
    country: '',
    intensity: [0, 100],
  });

  const handleChange = (key: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange({ ...newFilters, intensity_min: newFilters.intensity[0], intensity_max: newFilters.intensity[1] });
  };

  const handleIntensityChange = (event: Event, newValue: number | number[]) => {
    const newFilters = { ...filters, intensity: newValue as [number, number] };
    setFilters(newFilters);
    onFilterChange({ ...newFilters, intensity_min: newValue[0], intensity_max: newValue[1] });
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
      <TextField
        select
        label="End Year"
        value={filters.end_year}
        onChange={handleChange('end_year')}
        sx={{ minWidth: 150 }}
      >
        <MenuItem value="">All</MenuItem>
        {options.end_years?.map((year) => (
          <MenuItem key={year} value={year}>{year}</MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label="Topic"
        value={filters.topic}
        onChange={handleChange('topic')}
        sx={{ minWidth: 150 }}
      >
        <MenuItem value="">All</MenuItem>
        {options.topics?.map((topic) => (
          <MenuItem key={topic} value={topic}>{topic}</MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label="Sector"
        value={filters.sector}
        onChange={handleChange('sector')}
        sx={{ minWidth: 150 }}
      >
        <MenuItem value="">All</MenuItem>
        {options.sectors?.map((sector) => (
          <MenuItem key={sector} value={sector}>{sector}</MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label="Region"
        value={filters.region}
        onChange={handleChange('region')}
        sx={{ minWidth: 150 }}
      >
        <MenuItem value="">All</MenuItem>
        {options.regions?.map((region) => (
          <MenuItem key={region} value={region}>{region}</MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label="PESTLE"
        value={filters.pestle}
        onChange={handleChange('pestle')}
        sx={{ minWidth: 150 }}
      >
        <MenuItem value="">All</MenuItem>
        {options.pestles?.map((pestle) => (
          <MenuItem key={pestle} value={pestle}>{pestle}</MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label="Source"
        value={filters.source}
        onChange={handleChange('source')}
        sx={{ minWidth: 150 }}
      >
        <MenuItem value="">All</MenuItem>
        {options.sources?.map((source) => (
          <MenuItem key={source} value={source}>{source}</MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label="Country"
        value={filters.country}
        onChange={handleChange('country')}
        sx={{ minWidth: 150 }}
      >
        <MenuItem value="">All</MenuItem>
        {options.countries?.map((country) => (
          <MenuItem key={country} value={country}>{country}</MenuItem>
        ))}
      </TextField>
      <Box sx={{ minWidth: 200 }}>
        <Typography>Intensity Range</Typography>
        <Slider
          value={filters.intensity}
          onChange={handleIntensityChange}
          valueLabelDisplay="auto"
          min={0}
          max={100}
        />
      </Box>
    </Box>
  );
}