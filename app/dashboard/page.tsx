'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import BarChart from './components/BarChart';
import Filters from './components/Filters';
import ScatterPlot from './components/ScatterPlot';
import WorldMap from './components/WorldMap';
import { DataItem, FilterOptions, FiltersState } from './types';

interface DashboardData {
  data: DataItem[];
  filters: FilterOptions;
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const fetchData = useCallback(async (filters: FiltersState = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => query.append(key, String(v)));
        } else if (value !== undefined && value !== null) {
          query.append(key, String(value));
        }
      });
      const response = await fetch(`${API_URL}/api/data?${query.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch data');
      }
      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Fetch data error:', errorMessage);
    }
  }, [API_URL]);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch(`${API_URL}/health`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) throw new Error('Health check failed');
        const data = await response.json();
        setHealthStatus(data.status);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Fetch health error:', errorMessage);
      }
    };

    fetchHealth();
    fetchData();

    // Log all fetch requests to identify /warmup source
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      console.log('Fetch called:', args);
      return originalFetch(...args);
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, [fetchData, API_URL]);

  const handleFilterChange = useCallback((filters: FiltersState) => {
    fetchData(filters);
  }, [fetchData]);

  const handleInsert = async () => {
    const sampleData = [{
      end_year: "2025",
      topic: "Test Topic",
      sector: "Technology",
      insight: "Test insight",
      url: "https://example.com",
      region: "Global",
      country: "World",
      pestle: "Technological",
      source: "Test Source",
      title: "Test Title",
      likelihood: 4,
      intensity: 5,
      relevance: 3
    }];
    try {
      const response = await fetch(`${API_URL}/api/insert`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sampleData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to insert data');
      }
      const data = await response.json();
      alert(data.message);
      fetchData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Insert data error:', errorMessage);
    }
  };

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  if (!healthStatus) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>Checking backend health...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, maxWidth: '1200px', mx: 'auto' }}>
      <Typography variant="h4" align="center" gutterBottom>
        Dashboard
      </Typography>
      <Typography align="center" gutterBottom>
        Backend Health: <strong>{healthStatus}</strong>
      </Typography>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <button
          onClick={handleInsert}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Insert Test Data
        </button>
      </Box>
      <Grid container spacing={4}>
        <Grid component="div" xs={12} md={3}>
          <Filters
            options={dashboardData?.filters || { end_years: [], topics: [], sectors: [], regions: [], pestles: [], sources: [], countries: [] }}
            onFilterChange={handleFilterChange}
          />
        </Grid>
        <Grid component="div" xs={12} md={9}>
          <Grid container spacing={4}>
            <Grid component="div" xs={12}>
              <BarChart data={dashboardData?.data || []} xKey="topic" yKey="intensity" title="Intensity by Topic" />
            </Grid>
            <Grid component="div" xs={12}>
              <ScatterPlot data={dashboardData?.data || []} xKey="intensity" yKey="likelihood" colorKey="relevance" title="Intensity vs Likelihood" />
            </Grid>
            <Grid component="div" xs={12}>
              <WorldMap data={dashboardData?.data || []} />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}