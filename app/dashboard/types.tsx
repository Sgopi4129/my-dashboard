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
  [key: string]: any;
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

export interface FiltersState {
  end_year?: string;
  topics?: string[];
  sectors?: string[];
  regions?: string[];
  pestles?: string[];
  sources?: string[];
  countries?: string[];
  intensity_min?: string;
  intensity_max?: string;
}