// app/dashboard/components/WorldMap.tsx
'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

interface WorldMapProps {
  data: any[];
}

export default function WorldMap({ data }: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!data.length || !svgRef.current) return;

    // Create a tooltip div
    const tooltip = d3.select('body')
      .selectAll('.tooltip')
      .data([null])
      .join('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '5px 10px')
      .style('border-radius', '4px')
      .style('pointer-events', 'none')
      .style('opacity', 0);

    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .selectAll('g')
      .data([null])
      .join('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Log the country names from the data
    const dataCountries = [...new Set(data.map(d => d.country))];
    console.log('Countries in data:', dataCountries);

    // Create a mapping for country name discrepancies
    const countryNameMap: { [key: string]: string } = {
      'USA': 'United States',
      'UK': 'United Kingdom',
      'UAE': 'United Arab Emirates',
      'South Korea': 'Korea, South',
      'North Korea': 'Korea, North',
      'Russia': 'Russian Federation',
      // Add more mappings as needed based on your data
    };

    // Standardize country names in the data
    const standardizedData = data.map(item => ({
      ...item,
      country: countryNameMap[item.country] || item.country
    }));

    // Aggregate intensity by country
    const countryData = d3.rollup(standardizedData, v => d3.mean(v, d => d.intensity), d => d.country);
    console.log('Country Data (intensity map):', countryData);

    const maxIntensity = d3.max(Array.from(countryData.values())) || 0;

    const color = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, maxIntensity]);

    d3.json('/world.json').then((world: any) => {
      const countries = topojson.feature(world, world.objects.countries).features;

      // Log the country names from world.json
      const worldCountries = countries.map((d: any) => d.properties.name);
      console.log('Countries in world.json:', worldCountries);

      const projection = d3.geoMercator()
        .scale(100)
        .translate([width / 2, height / 2]);

      const path = d3.geoPath().projection(projection);

      svg.selectAll('path')
        .data(countries)
        .join('path')
        .attr('d', path)
        .attr('fill', d => {
          const countryName = d.properties.name;
          const intensity = countryData.get(countryName) || 0;
          return color(intensity);
        })
        .attr('stroke', '#ccc')
        .on('mouseover', function (event, d) {
          const countryName = d.properties.name;
          const intensity = countryData.get(countryName);
          d3.select(this).attr('fill', 'orange');
          tooltip
            .style('opacity', 1)
            .html(`${countryName}: ${intensity !== undefined ? intensity.toFixed(2) : 'No data'}`)
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 10}px`);
        })
        .on('mousemove', function (event) {
          tooltip
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 10}px`);
        })
        .on('mouseout', function (event, d) {
          const countryName = d.properties.name;
          const intensity = countryData.get(countryName) || 0;
          d3.select(this).attr('fill', color(intensity));
          tooltip.style('opacity', 0);
        });

      svg.selectAll('.title')
        .data(['Intensity by Country'])
        .join('text')
        .attr('class', 'title')
        .attr('x', width / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .text(d => d);
    });
  }, [data]);

  return (
    <>
      <svg ref={svgRef}></svg>
      <div ref={tooltipRef}></div>
    </>
  );
}