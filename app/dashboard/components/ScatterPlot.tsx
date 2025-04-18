// app/dashboard/components/ScatterPlot.tsx
'use client';

import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { Box } from '@mui/material';
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

  useEffect(() => {
    if (chartRef.current && data.length > 0) {
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
                data: data.map((item) => ({
                  x: Number(item[xKey]),
                  y: Number(item[yKey]),
                  backgroundColor: `rgba(255, 99, 132, ${Number(item[colorKey]) / 100})`,
                })),
                pointRadius: 5,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { title: { display: true, text: String(xKey) } }, // Cast to string
              y: { title: { display: true, text: String(yKey) } }, // Cast to string
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
  }, [data, xKey, yKey, colorKey, title]);

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

export default ScatterPlot;