'use client';

import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import _ from 'lodash';
import * as Sentry from '@sentry/nextjs';
import Filters from './components/Filters';
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { DataItem, FilterOptions, FiltersState } from './types';

const BarChart = lazy(() => import('./components/BarChart'));
const ScatterPlot = lazy(() => import('./components/ScatterPlot'));
const WorldMap = lazy(() => import('./components/WorldMap'));

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://my-backend-xi5n.onrender.com';
const POLLING_INTERVAL = parseInt(process.env.NEXT_PUBLIC_POLLING_INTERVAL || '5000', 10);
const USE_POLLING = process.env.NEXT_PUBLIC_USE_POLLING === 'true';

if (!API_URL) {
  console.error('NEXT_PUBLIC_API_URL is not defined. API requests will fail.');
  Sentry.captureMessage('NEXT_PUBLIC_API_URL is not defined', 'error');
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache',
  },
});

axiosRetry(api, {
  retries: 3,
  retryDelay: (retryCount: number) => retryCount * 1000,
  retryCondition: (error: AxiosError) => {
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response?.status ?? 0) >= 500
    );
  },
});

const warmupBackend = async (attempts = 2, delay = 1000) => {
  for (let i = 0; i < attempts; i++) {
    try {
      await api.get('/warmup', { timeout: 5000 });
      console.info('Backend warmed up successfully');
      return true;
    } catch (error) {
      let errorMessage = 'Warm-up failed';
      if (error instanceof AxiosError) {
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Warm-up timed out';
        } else if (!error.response && error.request) {
          errorMessage = 'CORS error: Missing Access-Control-Allow-Origin header';
        } else {
          errorMessage = `Server error: ${error.response?.status || 'Unknown'}`;
        }
      }
      console.warn(`Warm-up attempt ${i + 1} failed: ${errorMessage}`, error);
      Sentry.captureException(error, { extra: { attempt: i + 1, errorMessage } });
      if (i < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  console.error('All warm-up attempts failed. Backend may be slow or misconfigured.');
  Sentry.captureMessage('All warm-up attempts failed', 'error');
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
          `/api/data?${params}`,
          {
            headers: { 'If-Modified-Since': new Date().toUTCString() },
          }
        );
        setData(response.data.data);
        setFilterOptions(response.data.filters);
        console.info('Data fetched successfully:', response.data.data.length, 'items');
      } catch (error) {
        let errorMessage = 'Failed to fetch data. Please try again later.';
        if (error instanceof AxiosError) {
          if (!error.response && error.request) {
            errorMessage = 'CORS error: Backend is not responding or misconfigured.';
          } else {
            errorMessage = error.response
              ? `Server error: ${error.response.status} - ${error.response.data?.error || 'Unknown error'}`
              : 'No response from server. It may be starting up.';
          }
          console.error('Fetch error:', errorMessage, error.response?.data);
          Sentry.captureException(error, { extra: { errorMessage } });
        } else {
          console.error('Unexpected error:', error);
          Sentry.captureException(error);
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }, 1000),
    [filters]
  );

  const handleFilterChange = useCallback(
    _.debounce((newFilters: FiltersState) => {
      console.info('Filters updated:', newFilters);
      setFilters(newFilters);
    }, 500),
    []
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