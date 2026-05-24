/**
 * @fileoverview Tool for converting a numeric value between compatible units of measure.
 * @module mcp-server/tools/definitions/ref-unit-convert
 */

import { tool, z } from '@cyanheads/mcp-ts-core';
import { JsonRpcErrorCode } from '@cyanheads/mcp-ts-core/errors';
import { getUnitsService } from '@/services/units/units-service.js';

export const refUnitConvert = tool('ref_unit_convert', {
  title: 'Unit Conversion',
  description:
    'Convert a numeric value between compatible units of measure. Supports: length (mm, cm, m, km, in, ft, yd, mi, etc.), mass (g, kg, lb, oz, stone, ton, etc.), volume (mL, L, fl oz, cup, pt, qt, gal, m³, etc.), temperature (C, F, K, R — non-linear conversions handled), speed (m/s, km/h, mph, knot, ft/s), pressure (Pa, kPa, bar, atm, psi, mmHg, torr), energy (J, kJ, cal, kcal, Wh, kWh, eV, BTU), power (W, kW, MW, hp), frequency (Hz, kHz, MHz, GHz), digital storage (bit, B, KB, MB, GB, TB), and angle (deg, rad, grad). Incompatible units (e.g., km to kg) return an error identifying the quantity mismatch.',
  annotations: { readOnlyHint: true, openWorldHint: false },

  input: z.object({
    value: z.number().describe('Numeric quantity to convert.'),
    from: z.string().describe('Source unit abbreviation (e.g., "km", "C", "mph", "kWh", "kg").'),
    to: z.string().describe('Target unit abbreviation (e.g., "mi", "F", "m/s", "BTU", "lb").'),
  }),

  output: z.object({
    value: z.number().describe('Input value as provided.'),
    from_unit: z.string().describe('Source unit as recognized.'),
    to_unit: z.string().describe('Target unit as recognized.'),
    result: z.number().describe('Converted value (full precision float).'),
    result_precision: z.string().describe('Human-readable rounded form of the result.'),
    measure: z
      .string()
      .describe('Physical quantity being measured (e.g., "length", "mass", "temperature").'),
  }),

  errors: [
    {
      reason: 'incompatible_units',
      code: JsonRpcErrorCode.InvalidParams,
      when: 'The source and target units measure different physical quantities.',
      recovery:
        'Ensure both from and to units measure the same physical quantity (e.g., both length, both mass, both temperature).',
    },
    {
      reason: 'unknown_unit',
      code: JsonRpcErrorCode.InvalidParams,
      when: 'One or both units are not recognized.',
      recovery: 'Use standard unit abbreviations such as km, kg, °C, mph, or kWh. Check for typos.',
    },
  ],

  handler(input, ctx) {
    return getUnitsService().convert(input.value, input.from, input.to, ctx);
  },

  format: (result) => {
    const lines = [
      `**${result.value} ${result.from_unit}** = **${result.result_precision} ${result.to_unit}**`,
      `Full precision: ${result.result}`,
      `Measure: ${result.measure}`,
    ];
    return [{ type: 'text', text: lines.join('\n') }];
  },
});
