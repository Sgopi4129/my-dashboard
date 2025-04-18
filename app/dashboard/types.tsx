// app/dashboard/types.tsx
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
  [key: string]: string | number | undefined;
}

// Define LocalDataItem to match local data structure (adjust based on localData.json)
export interface LocalDataItem {
  intensity: number;
  likelihood: number;
  relevance: number;
  year: string;
  topic: string;
  // Add missing fields to match DataItem
  country?: string;
  region?: string;
  sector?: string;
  pestle?: string;
  source?: string;
  [key: string]: string | number | undefined;
}

export interface FilterOptions {
  end_years: string[];
  topics: string[];
  sectors: string[];
  regions: string[];
  pestles: string[];
  sources: string[];
  countries: string[];
}

export type FiltersState = {
  end_years?: string[];
  topics?: string[];
  sectors?: string[];
  regions?: string[];
  pestles?: string[];
  sources?: string[];
  countries?: string[];
  intensity_min?: number;
  intensity_max?: number;
  [key: string]: string | string[] | number | undefined;
};