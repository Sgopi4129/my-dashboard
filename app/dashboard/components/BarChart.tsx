'use client';

import { useEffect, useRef, useMemo } from 'react';
import Chart from 'chart.js/auto';
import { Box, Typography } from '@mui/material';
import { DataItem } from '../types';

interface BarChartProps {
  data: DataItem[];
  xKey: keyof DataItem;
  yKey: keyof DataItem;
  title: string;
}

const BarChart = ({ data, xKey, yKey, title }: BarChartProps) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  // Memoize data processing to avoid recalculating on every render
  const chartData = useMemo(() => {
    if (data.length === 0) return { labels: [], values: [] };

    const labelSet = new Set<string>();
    data.forEach((item) => {
      const label = item[xKey]?.toString() || '';
      if (label) labelSet.add(label);
    });
    const labels = Array.from(labelSet);

    const values = labels.map((label) =>
      data
        .filter((item) => item[xKey]?.toString() === label)
        .reduce((sum, item) => sum + (Number(item[yKey]) || 0), 0)
    );

    return { labels, values };
  }, [data, xKey, yKey]);

  useEffect(() => {
    if (chartRef.current && chartData.labels.length > 0) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstanceRef.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: chartData.labels,
            datasets: [
              {
                label: String(yKey),
                data: chartData.values,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
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
  }, [chartData, xKey, yKey, title]);

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

export default BarChart;