'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { Box, Typography } from '@mui/material';
import { DataItem } from '../types';
import { FeatureCollection, Geometry } from 'geojson';
import { Topology, GeometryObject } from 'topojson-specification';

interface WorldMapProps {
  data: DataItem[];
}

export default function WorldMap({ data }: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Memoize intensityByCountry calculation
  const intensityByCountry = useMemo(() => {
    if (data.length === 0) return new Map<string, number>();

    return new Map<string, number>(
      d3
        .rollup(
          data.filter((d) => d.country),
          (v) => d3.mean(v, (d) => d.intensity) || 0,
          (d) => d.country!
        )
        .entries()
    );
  }, [data]);

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const parent = svgRef.current.parentElement;
        if (parent) {
          const width = parent.clientWidth || 300;
          const height = Math.min(width * 0.6, 600);
          setDimensions({ width, height });
        }
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !dimensions.width || intensityByCountry.size === 0) return;

    d3.select(svgRef.current).selectAll('*').remove();

    const { width, height } = dimensions;
    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    d3.json<Topology>('https://unpkg.com/world-atlas@2.0.2/countries-110m.json')
      .then((topology) => {
        if (!topology) {
          console.error('Failed to load TopoJSON');
          return;
        }

        const countries = topojson.feature(
          topology,
          topology.objects.countries as GeometryObject
        ) as FeatureCollection<Geometry, { name: string }>;

        const projection = d3
          .geoMercator()
          .fitSize([width, height], countries);
        const path = d3.geoPath().projection(projection);

        const colorScale = d3
          .scaleSequential(d3.interpolateBlues)
          .domain([0, d3.max([...intensityByCountry.values()]) || 10]);

        svg
          .selectAll('path')
          .data(countries.features)
          .enter()
          .append('path')
          .attr('d', (d) => path(d) || '')
          .attr('fill', (d) => {
            const intensity = intensityByCountry.get(d.properties?.name || '') || 0;
            return intensity ? colorScale(intensity) : '#e0e0e0';
          })
          .attr('stroke', '#fff')
          .attr('stroke-width', 0.5)
          .append('title')
          .text((d) => {
            const intensity = intensityByCountry.get(d.properties?.name || '');
            return intensity
              ? `${d.properties?.name || 'Unknown'}: ${intensity.toFixed(2)}`
              : d.properties?.name || 'Unknown';
          });

        const zoom: d3.ZoomBehavior<SVGSVGElement, unknown> = d3
          .zoom<SVGSVGElement, unknown>()
          .scaleExtent([1, 8])
          .on('zoom', (event) => {
            svg.selectAll('path').attr('transform', event.transform);
          });

        svg.call(zoom);
      })
      .catch((err) => {
        console.error('Error loading TopoJSON:', err);
      });
  }, [dimensions, intensityByCountry]);

  if (data.length === 0) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        flex: 1,
      }}
    >
      <Typography
        variant="h6"
        sx={{ mb: 1, fontWeight: 'bold', color: 'text.primary' }}
      >
        World Map
      </Typography>
      <svg ref={svgRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </Box>
  );
}