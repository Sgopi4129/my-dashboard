// app/dashboard/components/ScatterPlot.tsx
'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface ScatterPlotProps {
  data: any[];
  xKey: string;
  yKey: string;
  colorKey: string;
  title: string;
}

export default function ScatterPlot({ data, xKey, yKey, colorKey, title }: ScatterPlotProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data.length || !svgRef.current) return;

    const margin = { top: 20, right: 50, bottom: 50, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .selectAll('g').data([null]).join('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
      .domain(d3.extent(data, d => d[xKey]) as [number, number]).nice()
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain(d3.extent(data, d => d[yKey]) as [number, number]).nice()
      .range([height, 0]);

    const color = d3.scaleSequential(d3.interpolateViridis)
      .domain(d3.extent(data, d => d[colorKey] || 0) as [number, number]);

    svg.selectAll('circle')
      .data(data)
      .join('circle')
      .attr('cx', d => x(d[xKey]))
      .attr('cy', d => y(d[yKey]))
      .attr('r', 5)
      .attr('fill', d => color(d[colorKey] || 0))
      .attr('opacity', 0.7);

    svg.selectAll('.x-axis')
      .data([null])
      .join('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    svg.selectAll('.y-axis')
      .data([null])
      .join('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y));

    svg.selectAll('.title')
      .data([title])
      .join('text')
      .attr('class', 'title')
      .attr('x', width / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .text(d => d);

    const legend = svg.selectAll('.legend')
      .data([null])
      .join('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width + 10}, 0)`);

    const legendScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d[colorKey] || 0) as [number, number])
      .range([height, 0]);

    legend.call(d3.axisRight(legendScale).ticks(5));
  }, [data, xKey, yKey, colorKey, title]);

  return <svg ref={svgRef}></svg>;
}