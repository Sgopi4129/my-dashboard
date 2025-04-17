// app/dashboard/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import Filters from './components/Filters';
import BarChart from './components/BarChart';
import ScatterPlot from './components/ScatterPlot';
import WorldMap from './components/WorldMap';
import { Box, Typography } from '@mui/material';
import { DataItem, FilterOptions, FiltersState } from './types'; // Import shared types

export default function Dashboard() {
  const [data, setData] = useState<DataItem[]>([]);
  const [filters, setFilters] = useState<FiltersState>({});
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    end_years: [],
    topics: [],
    sectors: [],
    regions: [],
    pestles: [],
    sources: [],
    countries: [],
  });

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams(
        Object.entries(filters).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== '') {
            if (Array.isArray(value)) {
              value.forEach((val) => acc.append(key, val));
            } else {
              acc.append(key, value.toString());
            }
          }
          return acc;
        }, new URLSearchParams())
      ).toString();
      const response = await axios.get<{ data: DataItem[]; filters: FilterOptions }>(
        `http://localhost:5000/api/data?${params}`
      );
      setData(response.data.data);
      setFilterOptions(response.data.filters);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error instanceof AxiosError) {
        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
        } else if (error.request) {
          console.error('No response received:', error.request);
        } else {
          console.error('Error message:', error.message);
        }
      } else {
        console.error('Unexpected error:', error);
      }
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange: (newFilters: FiltersState) => void = (newFilters) => {
    setFilters(newFilters);
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>Insights Dashboard</Typography>
      <Filters options={filterOptions} onFilterChange={handleFilterChange} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mt: 4 }}>
        <BarChart data={data} xKey="topic" yKey="intensity" title="Intensity by Topic" />
        <ScatterPlot
          data={data}
          xKey="likelihood"
          yKey="relevance"
          colorKey="intensity"
          title="Likelihood vs Relevance"
        />
        <WorldMap data={data} />
      </Box>
    </Box>
  );
}