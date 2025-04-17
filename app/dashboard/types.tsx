// app/dashboard/types.ts
// Define the shape of a single data item
export interface DataItem {
    intensity: number;
    likelihood: number;
    relevance: number;
    year: string;
    country: string;
    topic: string;
    region: string;
    sector: string;
    pestle: string;
    source: string;
  }
  
  // Define the shape of the filter options
  export interface FilterOptions {
    end_years: string[];
    topics: string[];
    sectors: string[];
    regions: string[];
    pestles: string[];
    sources: string[];
    countries: string[];
  }
  
  // Define the shape of the filters state
  export interface FiltersState {
    [key: string]: string | string[] | number | undefined;
  }