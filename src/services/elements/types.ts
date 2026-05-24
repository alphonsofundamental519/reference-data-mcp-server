/**
 * @fileoverview Elements service domain types.
 * @module services/elements/types
 */

export interface ElementRecord {
  appearance: string | null;
  atomic_mass: number | null;
  atomic_mass_estimated: boolean;
  block: string;
  boiling_point_k: number | null;
  category: string;
  density_g_per_cm3: number | null;
  discovery_scientists: string | null;
  discovery_year: number | null;
  electron_configuration: string;
  electronegativity_pauling: number | null;
  group: number | null;
  melting_point_k: number | null;
  name: string;
  natural: boolean;
  number: number;
  period: number;
  phase_at_stp: string;
  radioactive: boolean;
  symbol: string;
}

export interface ElementSummary {
  atomic_mass: number | null;
  atomic_mass_estimated: boolean;
  category: string;
  name: string;
  number: number;
  symbol: string;
}
