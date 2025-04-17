'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import { Topology, GeometryCollection } from 'topojson-specification';

interface WorldMapProps {
  data: { country: string; intensity: number }[];
}

interface CountryFeatureProperties {
  name: string;
}

interface WorldJson extends Topology {
  objects: {
    countries: GeometryCollection<CountryFeatureProperties>;
  };
}

export default function WorldMap({ data }: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!data.length || !svgRef.current) return;

    // Create a tooltip div
    const tooltip = d3
      .select('body')
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

    const svg = d3
      .select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .selectAll('g')
      .data([null])
      .join('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Log the country names from the data
    const dataCountries = Array.from(new Set(data.map((d) => d.country)));
    console.log('Countries in data:', dataCountries);

    // Create a mapping for country name discrepancies
    const countryNameMap: { [key: string]: string } = {
      USA: 'United States',
      UK: 'United Kingdom',
      UAE: 'United Arab Emirates',
      'South Korea': 'Korea, South',
      'North Korea': 'Korea, North',
      Russia: 'Russian Federation',
      // Add more mappings as needed based on your data
    };

    // Standardize country names in the data
    const standardizedData = data.map((item) => ({
      ...item,
      country: countryNameMap[item.country] || item.country,
    }));

    // Aggregate intensity by country
    const countryData = d3.rollup(
      standardizedData,
      (v) => d3.mean(v, (d) => d.intensity),
      (d) => d.country
    );
    console.log('Country Data (intensity map):', countryData);

    const maxIntensity = d3.max(Array.from(countryData.values()).filter((d): d is number => d !== undefined)) || 0;

    const color = d3.scaleSequential(d3.interpolateBlues).domain([0, maxIntensity]);

    // Load TopoJSON data from CDN
    d3.json<WorldJson>('https://unpkg.com/world-atlas@2.0.0/countries-110m.json')
      .then((world) => {
        if (!world) {
          console.error('Failed to load world data from CDN');
          return;
        }

        const geoJson = feature(world, world.objects.countries) as GeoJSON.FeatureCollection<
          GeoJSON.Geometry,
          CountryFeatureProperties
        >;

        if (geoJson.type !== 'FeatureCollection') {
          console.error('Expected a FeatureCollection, but got:', geoJson.type);
          return;
        }

        const countries = geoJson;

        if (!countries) {
          console.error('Countries data is undefined');
          return;
        }

        // Log the country names from the TopoJSON data
        const worldCountries = countries.features.map((d) => d.properties.name);
        console.log('Countries in TopoJSON:', worldCountries);

        const projection = d3.geoMercator().fitSize([width, height], countries);
        const path = d3.geoPath().projection(projection);

        svg
          .selectAll('path')
          .data(countries.features)
          .join('path')
          .attr('d', path)
          .attr('fill', (d) => {
            const countryName = d.properties.name;
            const intensity = countryData.get(countryName) || 0;
            return color(intensity);
          })
          .attr('stroke', '#ccc')
          .on(
            'mouseover',
            function (event: MouseEvent, d: GeoJSON.Feature<GeoJSON.Geometry, CountryFeatureProperties>) {
              const countryName = d.properties.name;
              const intensity = countryData.get(countryName);
              d3.select(this).attr('fill', 'orange');
              tooltip
                .style('opacity', 1)
                .html(`${countryName}: ${intensity !== undefined ? intensity.toFixed(2) : 'No data'}`)
                .style('left', `${event.pageX + 10}px`)
                .style('top', `${event.pageY - 10}px`);
            }
          )
          .on('mousemove', function (event: MouseEvent) {
            tooltip
              .style('left', `${event.pageX + 10}px`)
              .style('top', `${event.pageY - 10}px`);
          })
          .on(
            'mouseout',
            function (event: MouseEvent, d: GeoJSON.Feature<GeoJSON.Geometry, CountryFeatureProperties>) {
              const countryName = d.properties.name;
              const intensity = countryData.get(countryName) || 0;
              d3.select(this).attr('fill', color(intensity));
              tooltip.style('opacity', 0);
            }
          );

        svg
          .selectAll('.title')
          .data(['Intensity by Country'])
          .join('text')
          .attr('class', 'title')
          .attr('x', width / 2)
          .attr('y', -10)
          .attr('text-anchor', 'middle')
          .text((d) => d);
      })
      .catch((error) => {
        console.error('Error loading TopoJSON data from CDN:', error);
      });
  }, [data]);

  return (
    <>
      <svg ref={svgRef}></svg>
      <div ref={tooltipRef}></div>
    </>
  );
}