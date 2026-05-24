/**
 * @fileoverview Units conversion service — wraps convert-units library.
 * @module services/units/units-service
 */

import type { Context } from '@cyanheads/mcp-ts-core';
import { invalidParams } from '@cyanheads/mcp-ts-core/errors';
import convert from 'convert-units';

export interface ConversionResult {
  from_unit: string;
  measure: string;
  result: number;
  result_precision: string;
  to_unit: string;
  value: number;
}

function formatPrecision(n: number): string {
  if (Math.abs(n) >= 1000) return n.toFixed(2);
  if (Math.abs(n) >= 1) return n.toFixed(4);
  if (Math.abs(n) >= 0.001) return n.toFixed(6);
  return n.toExponential(4);
}

function getMeasureForUnit(unitStr: string): string | null {
  try {
    const measures = convert().measures();
    for (const measure of measures) {
      const possibilities = convert().possibilities(
        measure as Parameters<typeof convert>[0] extends undefined ? never : string,
      );
      if (possibilities.includes(unitStr as never)) return measure;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export class UnitsService {
  convert(value: number, from: string, to: string, ctx: Context): ConversionResult {
    ctx.log.debug('Unit convert', { value, from, to });

    // Validate both units exist
    const fromMeasure = getMeasureForUnit(from);
    const toMeasure = getMeasureForUnit(to);

    if (!fromMeasure) {
      const allUnits = convert().possibilities();
      throw invalidParams(
        `Unrecognized unit "${from}". Check supported units or use a standard abbreviation (e.g., "km", "kg", "°C").`,
        { from, sample_units: allUnits.slice(0, 20) },
      );
    }

    if (!toMeasure) {
      const allUnits = convert().possibilities();
      throw invalidParams(
        `Unrecognized unit "${to}". Check supported units or use a standard abbreviation (e.g., "mi", "lb", "°F").`,
        { to, sample_units: allUnits.slice(0, 20) },
      );
    }

    if (fromMeasure !== toMeasure) {
      throw invalidParams(
        `Cannot convert between "${from}" (${fromMeasure}) and "${to}" (${toMeasure}) — they measure different quantities. Ensure both units measure the same physical quantity.`,
        { from, to, from_measure: fromMeasure, to_measure: toMeasure },
      );
    }

    let result: number;
    try {
      result = convert(value)
        .from(from as never)
        .to(to as never);
    } catch (err) {
      throw invalidParams(
        `Unit conversion from "${from}" to "${to}" failed: ${err instanceof Error ? err.message : String(err)}. Ensure both units measure the same quantity.`,
        { from, to, value },
      );
    }

    return {
      value,
      from_unit: from,
      to_unit: to,
      result,
      result_precision: formatPrecision(result),
      measure: fromMeasure,
    };
  }

  getSupportedUnits(): string[] {
    return convert().possibilities();
  }

  getMeasures(): string[] {
    return convert().measures();
  }
}

// --- Init/accessor pattern ---

let _service: UnitsService | undefined;

export function initUnitsService(): void {
  _service = new UnitsService();
}

export function getUnitsService(): UnitsService {
  if (!_service)
    throw new Error('UnitsService not initialized — call initUnitsService() in setup()');
  return _service;
}
