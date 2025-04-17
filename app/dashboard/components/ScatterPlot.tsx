// app/dashboard/components/ScatterPlot.tsx
'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { DataItem } from '../types';

type NumericKeys<T> = {
  [K in keyof T]: T[K] extends number ? K : never;
}[keyof T];

interface ScatterPlotProps {
  data: DataItem[];
  xKey: NumericKeys<DataItem>;
  yKey: NumericKeys<DataItem>;
  colorKey: NumericKeys<DataItem>;
  title: string;
}

export default function ScatterPlot({ data, xKey, yKey, colorKey, title }: ScatterPlotProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data.length || !svgRef.current) return;

    const margin = { top: 40, right: 20, bottom: 50, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Create the SVG container
    const svg = d3
      .select<SVGSVGElement, unknown>(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append<SVGGElement>('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d[xKey]) as [number, number])
      .nice()
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d[yKey]) as [number, number])
      .nice()
      .range([height, 0]);

    const color = d3
      .scaleSequential(d3.interpolateBlues)
      .domain(d3.extent(data, (d) => d[colorKey]) as [number, number]);

    svg
      .selectAll('circle')
      .data(data)
      .join('circle')
      .attr('cx', (d) => x(d[xKey]))
      .attr('cy', (d) => y(d[yKey]))
      .attr('r', 5)
      .attr('fill', (d) => color(d[colorKey]));

    // Add x-axis
    svg
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x) as unknown as (selection: d3.Selection<SVGGElement, unknown, null, undefined>) => void);

    // Add y-axis
    svg
      .append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y) as unknown as (selection: d3.Selection<SVGGElement, unknown, null, undefined>) => void);

    // Add title
    svg
      .append('text')
      .attr('class', 'title')
      .attr('x', width / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .text(title);
  }, [data, xKey, yKey, colorKey, title]);

  return <svg ref={svgRef}></svg>;
}