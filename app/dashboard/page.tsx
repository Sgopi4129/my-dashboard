'use client';

import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import _ from 'lodash';
import Filters from './components/Filters';
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { DataItem, FilterOptions, FiltersState } from './types';

const BarChart = lazy(() => import('./components/BarChart'));
const ScatterPlot = lazy(() => import('./components/ScatterPlot'));
const WorldMap = lazy(() => import('./components/WorldMap'));

// Environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const POLLING_INTERVAL = parseInt(process.env.NEXT_PUBLIC_POLLING_INTERVAL || '5000', 10);
const USE_POLLING = process.env.NEXT_PUBLIC_USE_POLLING === 'true';

// Log environment variables for debugging
console.log('Environment Variables:', {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_POLLING_INTERVAL: process.env.NEXT_PUBLIC_POLLING_INTERVAL,
  NEXT_PUBLIC_USE_POLLING: process.env.NEXT_PUBLIC_USE_POLLING,
});

if (!API_URL) {
  console.error('NEXT_PUBLIC_API_URL is not defined. Using fallback URL.');
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/jsonographics',
    'Cache-Control': 'no-cache',
    'Origin': 'https://my-dashboard-hobbits-projects-1895405b.vercel.app',
  },
});

axiosRetry(api, {
  retries: 2,
  retryDelay: (retryCount: number) => retryCount * 1000,
  retryCondition: (error: AxiosError) => {
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      error.response?.status === 503
    );
  },
});

const warmupBackend = async (attempts = 2, delay = 1000): Promise<boolean> => {
  for (let i = 0; i < attempts; i++) {
    try {
      await api.get('/warmup', { timeout: 5000 });
      console.info('Backend warmed up successfully');
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof AxiosError
          ? error.code === 'ECONNABORTED'
            ? 'Warm-up timed out'
            : !error.response && error.request
            ? 'CORS error: Missing Access-Control-Allow-Origin header'
            : `Server error: ${error.response?.status || 'Unknown'}`
          : 'Warm-up failed';
      console.warn(`Warm-up attempt ${i + 1} failed: ${errorMessage}`);
      if (i < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  console.error('All warm-up attempts failed. Backend may be slow or misconfigured.');
  return false;
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

  const fetchData = useCallback(
    _.debounce(async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            if (Array.isArray(value)) {
              value.forEach((val) => params.append(key, val));
            } else {
              params.append(key, value.toString());
            }
          }
        });
        const response = await api.get<{ data: DataItem[]; filters: FilterOptions }>(
          `/api/data?${params}`
        );
        setData(response.data.data);
        setFilterOptions(response.data.filters);
        console.info('Data fetched successfully:', response.data.data.length, 'items');
      } catch (error) {
        const errorMessage =
          error instanceof AxiosError
            ? !error.response && error.request
              ? 'CORS error: Backend is not responding or misconfigured. Missing Access-Control-Allow-Origin header.'
              : error.response
              ? `Server error: ${error.response.status} - ${error.response.data?.error || 'Unknown error'}`
              : 'No response from server. It may be starting up.'
            : 'Failed to fetch data. Please try again later.';
        console.error('Fetch error:', errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }, 1500),
    [filters]
  );

  const handleFilterChange = useCallback(
    _.debounce((newFilters: FiltersState) => {
      setFilters(newFilters);
    }, 500),
    [] // eslint-disable-next-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const initialize = async () => {
      const warmedUp = await warmupBackend();
      if (!warmedUp) {
        setError('Backend may be slow or misconfigured. Please try again.');
      }
      fetchData();

      if (USE_POLLING) {
        interval = setInterval(fetchData, POLLING_INTERVAL);
      }
    };

    initialize();

    return () => {
      if (interval) {
        clearInterval(interval);
      }
      fetchData.cancel();
    };
  }, [fetchData]);

  const chartComponents = useMemo(
    () => (
      <>
        <Suspense fallback={<CircularProgress />}>
          <BarChart data={data} xKey="topic" yKey="intensity" title="Intensity by Topic" />
        </Suspense>
        <Suspense fallback={<CircularProgress />}>
          <ScatterPlot
            data={data}
            xKey="likelihood"
            yKey="relevance"
            colorKey="intensity"
            title="Likelihood vs Relevance"
          />
        </Suspense>
        <Suspense fallback={<CircularProgress />}>
          <WorldMap data={data} />
        </Suspense>
      </>
    ),
    [data]
  );

  return (
    <Box sx={{ padding: 4, maxWidth: '1200px', margin: '0 auto' }}>
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mt: 4, width: '100%' }}>
            {data.length === 0 ? (
              <Typography>No data available. Try adjusting filters.</Typography>
            ) : (
              chartComponents
            )}
          </Box>
        </>
      )}
    </Box>
  );
}