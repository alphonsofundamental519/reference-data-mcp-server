/**
 * @fileoverview Geo service domain types.
 * @module services/geo/types
 */

export interface Currency {
  code: string;
  name: string;
  symbol: string | null;
}

export interface Language {
  code: string;
  name: string;
}

export interface CountryRecord {
  alpha2: string;
  alpha3: string;
  area_km2: number | null;
  borders: string[];
  calling_codes: string[];
  capital: string | null;
  currencies: Currency[];
  flag: string;
  languages: Language[];
  name: string;
  native_name: string;
  population: number | null;
  region: string;
  subregion: string | null;
  timezones: string[];
  tld: string | null;
}

export interface CountrySummary {
  alpha2: string;
  alpha3: string;
  capital: string | null;
  currency_code: string | null;
  flag: string;
  name: string;
  region: string;
}
