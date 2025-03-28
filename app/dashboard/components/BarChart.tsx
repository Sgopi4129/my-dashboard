// app/dashboard/components/BarChart.tsx
'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface BarChartProps {
  data: any[];
  xKey: string;
  yKey: string;
  title: string;
}

export default function BarChart({ data, xKey, yKey, title }: BarChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data.length || !svgRef.current) return;

    const margin = { top: 20, right: 20, bottom: 50, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .selectAll('g').data([null]).join('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const aggregatedData = d3.rollup(data, v => d3.mean(v, d => d[yKey]), d => d[xKey]);
    const chartData = Array.from(aggregatedData, ([key, value]) => ({ key, value }));

    const x = d3.scaleBand()
      .domain(chartData.map(d => d.key))
      .range([0, width])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(chartData, d => d.value) || 0])
      .nice()
      .range([height, 0]);

    svg.selectAll('.bar')
      .data(chartData)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.key) || 0)
      .attr('y', d => y(d.value))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.value))
      .attr('fill', 'steelblue');

    svg.selectAll('.x-axis')
      .data([null])
      .join('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

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
  }, [data, xKey, yKey, title]);

  return <svg ref={svgRef}></svg>;
}