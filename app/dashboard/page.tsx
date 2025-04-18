'use client';

import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import _ from 'lodash'; // Lodash for debouncing
import Filters from './components/Filters';
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { DataItem, FilterOptions, FiltersState } from './types';

// Lazy-load charts to optimize initial load time
const BarChart = lazy(() => import('./components/BarChart'));
const ScatterPlot = lazy(() => import('./components/ScatterPlot'));
const WorldMap = lazy(() => import('./components/WorldMap'));

// Validate environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || API_URL.replace('http', 'ws').replace('https', 'wss');
if (!API_URL) {
  console.error('NEXT_PUBLIC_API_URL is not defined');
}

// Axios instance with production-ready config
const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

axiosRetry(api, {
  retries: 3,
  retryDelay: (retryCount: number) => retryCount * 2000,
  retryCondition: (error: AxiosError) => {
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response?.status ?? 0) >= 500
    );
  },
});

// Warm up backend with retry logic
const warmupBackend = async (attempts = 3, delay = 2000) => {
  for (let i = 0; i < attempts; i++) {
    try {
      await api.get('/warmup');
      console.info('Backend warmed up successfully');
      return true;
    } catch (error) {
      console.warn(`Warm-up attempt ${i + 1} failed:`, error);
      if (i < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  console.error('All warm-up attempts failed. Backend may be slow to respond.');
  return false;
};

// WebSocket setup for real-time updates
const setupWebSocket = (onMessage: (data: { data: DataItem[]; filters: FilterOptions }) => void) => {
  try {
    const socket = new WebSocket(WEBSOCKET_URL);
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        onMessage(message);
        console.info('WebSocket message received:', message);
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
      }
    };
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    socket.onclose = () => {
      console.warn('WebSocket connection closed');
    };
    return socket;
  } catch (error) {
    console.error('Failed to initialize WebSocket:', error);
    return null;
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
  const [useWebSocket, setUseWebSocket] = useState(true); // Toggle WebSocket vs. HTTP

  // Debounced fetchData function
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
        let errorMessage = 'Failed to fetch data. Please try again later.';
        if (error instanceof AxiosError) {
          errorMessage = error.response
            ? `Server error: ${error.response.status} - ${error.response.data?.error || 'Unknown error'}`
            : 'No response from server. It may be starting up.';
          console.error('Fetch error:', error.message, error.response?.data);
        } else {
          console.error('Unexpected error:', error);
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }, 1000), // Debounce for 1 second
    [filters]
  );

  // Memoized filter change handler
  const handleFilterChange = useCallback(
    _.debounce((newFilters: FiltersState) => {
      console.info('Filters updated:', newFilters);
      setFilters(newFilters);
    }, 500), // Debounce filter changes for 500ms
    []
  );

  // Initial fetch and WebSocket setup
  useEffect(() => {
    let socket: WebSocket | null = null;

    const initialize = async () => {
      const warmedUp = await warmupBackend();
      if (!warmedUp) {
        setError('Backend may be slow to respond. Retrying...');
      }

      // Try WebSocket for real-time updates
      if (useWebSocket) {
        socket = setupWebSocket((message) => {
          setData(message.data);
          setFilterOptions(message.filters);
          setLoading(false);
        });
        if (!socket) {
          console.warn('WebSocket unavailable, falling back to HTTP');
          setUseWebSocket(false);
          fetchData();
        }
      } else {
        fetchData();
      }
    };

    initialize();

    // Cleanup
    return () => {
      if (socket) {
        socket.close();
      }
      fetchData.cancel(); // Cancel debounced calls
    };
  }, [fetchData, useWebSocket]);

  // Memoize chart components to prevent unnecessary re-renders
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