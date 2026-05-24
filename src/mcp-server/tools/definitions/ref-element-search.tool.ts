/**
 * @fileoverview Tool for filtering periodic table elements by category, group, period, or property ranges.
 * @module mcp-server/tools/definitions/ref-element-search
 */

import { tool, z } from '@cyanheads/mcp-ts-core';
import { JsonRpcErrorCode } from '@cyanheads/mcp-ts-core/errors';
import { getElementsService } from '@/services/elements/elements-service.js';

const ElementSummarySchema = z.object({
  number: z.number().int().describe('Atomic number.'),
  symbol: z.string().describe('Chemical symbol.'),
  name: z.string().describe('IUPAC element name.'),
  atomic_mass: z
    .number()
    .nullable()
    .describe('Atomic mass in unified atomic mass units. Null for unstable elements.'),
  atomic_mass_estimated: z.boolean().describe('True when the atomic mass is estimated.'),
  category: z.string().describe('Element category.'),
});

const RangeSchema = z.object({
  min: z.number().describe('Minimum value (inclusive).'),
  max: z.number().describe('Maximum value (inclusive).'),
});

export const refElementSearch = tool('ref_element_search', {
  title: 'Element Search',
  description:
    'Filter periodic table elements by category, group, period, atomic number range, or atomic mass range. At least one filter is required. Returns matching elements as a summary list. Use ref_element_lookup for the full record on a specific element. Valid categories: alkali metal, alkaline earth metal, transition metal, post-transition metal, metalloid, reactive nonmetal, noble gas, lanthanide, actinide.',
  annotations: { readOnlyHint: true, openWorldHint: false },

  input: z.object({
    category: z
      .string()
      .optional()
      .describe(
        'Element category (partial match): alkali metal, alkaline earth metal, transition metal, post-transition metal, metalloid, reactive nonmetal, noble gas, lanthanide, actinide.',
      ),
    group: z
      .number()
      .int()
      .min(1)
      .max(18)
      .optional()
      .describe('Periodic table group number (1–18). Lanthanides and actinides have no group.'),
    period: z.number().int().min(1).max(7).optional().describe('Periodic table period (1–7).'),
    atomic_number_range: RangeSchema.optional().describe(
      'Inclusive range of atomic numbers to include.',
    ),
    atomic_mass_range: RangeSchema.optional().describe(
      'Inclusive range of atomic mass in unified atomic mass units.',
    ),
  }),

  output: z.object({
    results: z
      .array(ElementSummarySchema.describe('Summary for a matching element.'))
      .describe('Matching element summaries.'),
    total_matches: z.number().int().describe('Number of elements matching all filters.'),
    message: z
      .string()
      .optional()
      .describe(
        'Recovery hint when no results found — echoes active filters and suggests how to broaden.',
      ),
  }),

  errors: [
    {
      reason: 'no_filters',
      code: JsonRpcErrorCode.InvalidParams,
      when: 'No filter was provided.',
      recovery:
        'Provide at least one filter: category, group, period, atomic_number_range, or atomic_mass_range.',
    },
  ],

  handler(input, ctx) {
    const searchOpts: Parameters<ReturnType<typeof getElementsService>['search']>[0] = {};
    if (input.category?.trim()) searchOpts.category = input.category;
    if (input.group != null) searchOpts.group = input.group;
    if (input.period != null) searchOpts.period = input.period;
    if (input.atomic_number_range?.min != null && input.atomic_number_range?.max != null) {
      searchOpts.atomic_number_range = {
        min: input.atomic_number_range.min,
        max: input.atomic_number_range.max,
      };
    }
    if (input.atomic_mass_range?.min != null && input.atomic_mass_range?.max != null) {
      searchOpts.atomic_mass_range = {
        min: input.atomic_mass_range.min,
        max: input.atomic_mass_range.max,
      };
    }

    const hasFilter =
      searchOpts.category ||
      searchOpts.group != null ||
      searchOpts.period != null ||
      searchOpts.atomic_number_range ||
      searchOpts.atomic_mass_range;
    if (!hasFilter) {
      throw ctx.fail(
        'no_filters',
        'At least one filter is required. Provide category, group, period, atomic_number_range, or atomic_mass_range.',
      );
    }

    const { results, total_matches } = getElementsService().search(searchOpts, ctx);

    if (total_matches === 0) {
      const filterDesc = [
        input.category && `category="${input.category}"`,
        input.group != null && `group=${input.group}`,
        input.period != null && `period=${input.period}`,
        input.atomic_number_range &&
          `Z=${input.atomic_number_range.min}–${input.atomic_number_range.max}`,
        input.atomic_mass_range &&
          `mass=${input.atomic_mass_range.min}–${input.atomic_mass_range.max}`,
      ]
        .filter(Boolean)
        .join(', ');
      return {
        results: [],
        total_matches: 0,
        message: `No elements matched filters: ${filterDesc}. Try a broader category or wider range.`,
      };
    }

    return { results, total_matches };
  },

  format: (result) => {
    const lines: string[] = [];
    lines.push(`**Total matches:** ${result.total_matches}`);
    if (result.message) lines.push(`\n> ${result.message}`);
    for (const el of result.results) {
      const massStr =
        el.atomic_mass != null
          ? `${el.atomic_mass} u${el.atomic_mass_estimated ? ' (est.)' : ''}`
          : 'N/A';
      lines.push(`**${el.number}. ${el.symbol}** — ${el.name} | Mass: ${massStr} | ${el.category}`);
    }
    return [{ type: 'text', text: lines.join('\n') }];
  },
});
