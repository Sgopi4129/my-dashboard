'use client';

import { useEffect, useRef, useMemo } from 'react';
import Chart from 'chart.js/auto';
import { Box, Typography } from '@mui/material';
import { DataItem } from '../types';

interface ScatterPlotProps {
  data: DataItem[];
  xKey: keyof DataItem;
  yKey: keyof DataItem;
  colorKey: keyof DataItem;
  title: string;
}

const ScatterPlot = ({ data, xKey, yKey, colorKey, title }: ScatterPlotProps) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  // Memoize scatter plot data
  const scatterData = useMemo(() => {
    if (data.length === 0) return [];

    return data.map((item) => ({
      x: Number(item[xKey]),
      y: Number(item[yKey]),
      backgroundColor: `rgba(255, 99, 132, ${Number(item[colorKey]) / 100})`,
    }));
  }, [data, xKey, yKey, colorKey]);

  useEffect(() => {
    if (chartRef.current && scatterData.length > 0) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstanceRef.current = new Chart(ctx, {
          type: 'scatter',
          data: {
            datasets: [
              {
                label: title,
                data: scatterData,
                pointRadius: 5,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { title: { display: true, text: String(xKey) } },
              y: { title: { display: true, text: String(yKey) } },
            },
            plugins: {
              title: { display: true, text: title },
            },
          },
        });
      }
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [scatterData, xKey, yKey, title]);

  useEffect(() => {
    const handleResize = () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.resize();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (data.length === 0) {
    return (
      <Box sx={{ position: 'relative', width: '100%', height: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '40vh' }}>
      <canvas ref={chartRef} />
    </Box>
  );
};

export default ScatterPlot;