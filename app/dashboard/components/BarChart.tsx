// app/dashboard/components/BarChart.tsx
'use client';

import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { Box } from '@mui/material';
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

  useEffect(() => {
    if (chartRef.current && data.length > 0) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      // Create unique labels without spread operator to avoid TS2802
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

      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstanceRef.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: String(yKey), // Cast yKey to string to fix TS2322
                data: values,
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
              x: { title: { display: true, text: String(xKey) } }, // Cast xKey to string
              y: { title: { display: true, text: String(yKey) } }, // Cast yKey to string
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
  }, [data, xKey, yKey, title]);

  useEffect(() => {
    const handleResize = () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.resize();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '40vh' }}>
      <canvas ref={chartRef} />
    </Box>
  );
};

export default BarChart;