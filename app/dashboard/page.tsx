// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Filters from './components/Filters';
import BarChart from './components/BarChart';
import ScatterPlot from './components/ScatterPlot';
import WorldMap from './components/WorldMap';
import { Box, Typography } from '@mui/material';

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({});

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await axios.get(`http://localhost:5000/api/data?${params}`);
      setData(response.data.data);
      setFilterOptions(response.data.filters);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>Insights Dashboard</Typography>
      <Filters options={filterOptions} onFilterChange={handleFilterChange} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mt: 4 }}>
        <BarChart data={data} xKey="topic" yKey="intensity" title="Intensity by Topic" />
        <ScatterPlot data={data} xKey="likelihood" yKey="relevance" colorKey="intensity" title="Likelihood vs Relevance" />
        <WorldMap data={data} />
      </Box>
    </Box>
  );
}