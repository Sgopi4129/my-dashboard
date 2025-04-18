// app/dashboard/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import Filters from './components/Filters';
import BarChart from './components/BarChart';
import ScatterPlot from './components/ScatterPlot';
import WorldMap from './components/WorldMap';
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { DataItem, FilterOptions, FiltersState } from './types';
import { AxiosInstance, AxiosError as AxiosRetryError } from 'axios';

// Configure axios instance with retries for Render spin-down
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  timeout: 60000, // 60 seconds to handle spin-down
});

interface RetryConfig {
  retries: number;
  retryDelay: (retryCount: number) => number;
  retryCondition: (error: AxiosRetryError) => boolean;
}

axiosRetry(api as AxiosInstance, {
  retries: 3,
  retryDelay: (retryCount: number): number => retryCount * 2000, // 2s, 4s, 6s
  retryCondition: (error: AxiosRetryError): boolean => {
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response?.status ?? 0) >= 500
    );
  },
} as RetryConfig);

// Warm up the backend to reduce spin-down latency
const warmupBackend = async () => {
  try {
    await api.get('/warmup');
    console.log('Backend warmed up');
  } catch (error) {
    console.error('Warm-up failed:', error);
  }
};

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
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
      const response = await api.get<{ data: DataItem[]; filters: FilterOptions }>(
        `/api/data?${params}`
      );
      setData(response.data.data);
      setFilterOptions(response.data.filters);
    } catch (error) {
      let errorMessage = 'Failed to fetch data. Please try again later.';
      if (error instanceof AxiosError) {
        if (error.response) {
          errorMessage = `Server error: ${error.response.status} - ${
            error.response.data?.error || 'Unknown error'
          }`;
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
        } else if (error.request) {
          errorMessage = 'No response from server. It may be starting up.';
          console.error('No response received:', error.request);
        } else {
          console.error('Error message:', error.message);
        }
      } else {
        console.error('Unexpected error:', error);
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    // Warm up the backend on mount
    warmupBackend();
    // Fetch data
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (newFilters: FiltersState) => {
    setFilters(newFilters);
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>
        Insights Dashboard
      </Typography>
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert
          severity="error"
          sx={{ my: 2 }}
          action={
            <Button color="inherit" size="small" onClick={fetchData}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      {!loading && !error && (
        <>
          <Filters options={filterOptions} onFilterChange={handleFilterChange} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mt: 4 }}>
            {data.length === 0 ? (
              <Typography>No data available. Try adjusting filters.</Typography>
            ) : (
              <>
                <BarChart
                  data={data}
                  xKey="topic"
                  yKey="intensity"
                  title="Intensity by Topic"
                />
                <ScatterPlot
                  data={data}
                  xKey="likelihood"
                  yKey="relevance"
                  colorKey="intensity"
                  title="Likelihood vs Relevance"
                />
                <WorldMap data={data} />
              </>
            )}
          </Box>
        </>
      )}
    </Box>
  );
}