'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button } from '@mui/material';
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

  // Use relative path for proxy or direct backend URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'; // Fallback to proxy

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
      const response = await fetch(`${API_URL}/data?${query.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Remove if credentials are not needed
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
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Remove if credentials are not needed
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
      const response = await fetch(`${API_URL}/insert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Remove if credentials are not needed
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
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Typography color="error" variant="h6">
          Error: {error}
        </Typography>
      </Box>
    );
  }

  if (!healthStatus) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Typography variant="h6">Checking backend health...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxWidth: '1400px',
        mx: 'auto',
        p: { xs: 2, sm: 3, md: 4 },
        bgcolor: 'background.paper',
        minHeight: '100vh',
      }}
    >
      <Typography
        variant="h3"
        align="center"
        gutterBottom
        sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}
      >
        Dashboard
      </Typography>
      <Typography
        align="center"
        gutterBottom
        sx={{ mb: 3, color: 'text.secondary' }}
      >
        Backend Health: <strong>{healthStatus}</strong>
      </Typography>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Button
          onClick={handleInsert}
          variant="contained"
          color="primary"
          sx={{
            px: 4,
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '1rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            '&:hover': {
              boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
              transform: 'translateY(-2px)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          Insert Test Data
        </Button>
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <Box
          sx={{
            flex: { xs: '1 1 100%', md: '1 1 25%' },
            maxWidth: { xs: '100%', md: '300px' },
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            p: 2,
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
            },
          }}
        >
          <Filters
            options={
              dashboardData?.filters || {
                end_years: [],
                topics: [],
                sectors: [],
                regions: [],
                pestles: [],
                sources: [],
                countries: [],
              }
            }
            onFilterChange={handleFilterChange}
          />
        </Box>
        <Box
          sx={{
            flex: { xs: '1 1 100%', md: '1 1 75%' },
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: { xs: 2, sm: 3, md: 4 },
          }}
        >
          <Box
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              p: 2,
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
              },
            }}
          >
            <BarChart
              data={dashboardData?.data || []}
              xKey="topic"
              yKey="intensity"
              title="Intensity by Topic"
            />
          </Box>
          <Box
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              p: 2,
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
              },
            }}
          >
            <ScatterPlot
              data={dashboardData?.data || []}
              xKey="intensity"
              yKey="likelihood"
              colorKey="relevance"
              title="Intensity vs Likelihood"
            />
          </Box>
          <Box
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              p: 2,
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
              },
            }}
          >
            <WorldMap data={dashboardData?.data || []} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}