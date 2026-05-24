/**
 * @fileoverview Physical constants service — CODATA 2022 lookup.
 * @module services/constants/constants-service
 */

import type { Context } from '@cyanheads/mcp-ts-core';
import { notFound } from '@cyanheads/mcp-ts-core/errors';
import type { PhysicalConstant } from '../../data/physical-constants.js';
import { constants, DATASET_VERSION } from '../../data/physical-constants.js';

export type { PhysicalConstant };
export { DATASET_VERSION };

export interface ConstantResult {
  codata_id: string | null;
  description: string;
  exact: boolean;
  name: string;
  related: Array<{ name: string; symbol: string }>;
  symbol: string;
  uncertainty: number | null;
  uncertainty_relative: string | null;
  unit: string;
  value: number;
}

export class ConstantsService {
  private readonly all: PhysicalConstant[];
  // Map from alias/name → constant index
  private readonly aliasIndex: Map<string, number>;

  constructor() {
    this.all = constants;
    this.aliasIndex = new Map();

    for (let i = 0; i < constants.length; i++) {
      const c = constants[i] as (typeof constants)[number];
      this.aliasIndex.set(c.name.toLowerCase(), i);
      this.aliasIndex.set(c.symbol.toLowerCase(), i);
      for (const alias of c.aliases) {
        this.aliasIndex.set(alias.toLowerCase(), i);
      }
    }
  }

  lookup(query: string, ctx: Context): ConstantResult {
    ctx.log.debug('Constant lookup', { query });

    const queryLower = query.toLowerCase();

    // Exact match first
    const exactIdx = this.aliasIndex.get(queryLower);
    if (exactIdx != null) {
      return this.buildResult(exactIdx, []);
    }

    // Partial/fuzzy match — find all candidates by scanning names and aliases
    const candidates: Array<{ idx: number; score: number }> = [];
    for (const c of this.all) {
      const allNames = [c.name, c.symbol, ...c.aliases].map((n) => n.toLowerCase());
      // Score: starts-with > contains
      if (allNames.some((n) => n.startsWith(queryLower))) {
        candidates.push({ idx: this.all.indexOf(c), score: 2 });
      } else if (allNames.some((n) => n.includes(queryLower))) {
        candidates.push({ idx: this.all.indexOf(c), score: 1 });
      }
    }

    if (candidates.length === 0) {
      throw notFound(
        `No physical constant matched "${query}". Try common names like "speed of light", "Planck constant", or "Avogadro's number".`,
        { query },
      );
    }

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);
    const primary = (candidates[0] as { idx: number; score: number }).idx;
    const relatedIdxs = candidates.slice(1, 4).map((c) => c.idx);
    return this.buildResult(primary, relatedIdxs);
  }

  private buildResult(idx: number, relatedIdxs: number[]): ConstantResult {
    const c = this.all[idx] as (typeof this.all)[number];
    return {
      name: c.name,
      symbol: c.symbol,
      value: c.value,
      unit: c.unit,
      uncertainty: c.uncertainty,
      uncertainty_relative: c.uncertainty_relative,
      description: c.description,
      codata_id: c.codata_id,
      exact: c.exact,
      related: relatedIdxs
        .map((i) => ({ name: this.all[i]?.name, symbol: this.all[i]?.symbol }))
        .filter((r): r is { name: string; symbol: string } => r.name != null && r.symbol != null),
    };
  }
}

// --- Init/accessor pattern ---

let _service: ConstantsService | undefined;

export function initConstantsService(): void {
  _service = new ConstantsService();
}

export function getConstantsService(): ConstantsService {
  if (!_service)
    throw new Error('ConstantsService not initialized — call initConstantsService() in setup()');
  return _service;
}
