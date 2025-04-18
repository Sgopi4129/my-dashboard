// app/dashboard/components/WorldMap.tsx
'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Box } from '@mui/material';
import { DataItem } from '../types';

interface WorldMapProps {
  data: DataItem[];
}

const WorldMap = ({ data }: WorldMapProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && data.length > 0) {
      const svg = d3.select(svgRef.current);
      // Simplified D3 map rendering (replace with your actual implementation)
      svg.selectAll('*').remove();
      // Example: Aggregate intensity by country
      const countryData = d3.group(data, (d) => d.country);
      console.log('WorldMap country data:', countryData);
      // Add D3 map rendering code here
    }
  }, [data]);

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '40vh' }}>
      <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
    </Box>
  );
};

export default WorldMap;