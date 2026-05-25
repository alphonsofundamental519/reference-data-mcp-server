/**
 * @fileoverview Tests for the ref_element_search tool.
 * @module tests/tools/ref-element-search.tool.test
 */

import { createMockContext } from '@cyanheads/mcp-ts-core/testing';
import { beforeAll, describe, expect, it } from 'vitest';
import { refElementSearch } from '@/mcp-server/tools/definitions/ref-element-search.tool.js';
import { initElementsService } from '@/services/elements/elements-service.js';

beforeAll(() => {
  initElementsService();
});

describe('refElementSearch', () => {
  it('filters by category', async () => {
    const ctx = createMockContext();
    const input = refElementSearch.input.parse({ category: 'noble gas' });
    const result = await refElementSearch.handler(input, ctx);
    expect(result.total_matches).toBeGreaterThan(0);
    expect(result.results.every((el) => el.category.includes('noble gas'))).toBe(true);
    expect(result.results.length).toBe(result.total_matches);
  });

  it('filters by period', async () => {
    const ctx = createMockContext();
    const input = refElementSearch.input.parse({ period: 1 });
    const result = await refElementSearch.handler(input, ctx);
    // Period 1 = H and He
    expect(result.total_matches).toBe(2);
    expect(result.results.map((el) => el.symbol).sort()).toEqual(['H', 'He']);
  });

  it('filters by group', async () => {
    const ctx = createMockContext();
    const input = refElementSearch.input.parse({ group: 18 });
    const result = await refElementSearch.handler(input, ctx);
    expect(result.total_matches).toBeGreaterThan(0);
    expect(result.results.every((el) => el.category.includes('noble gas'))).toBe(true);
  });

  it('filters by atomic number range', async () => {
    const ctx = createMockContext();
    const input = refElementSearch.input.parse({ atomic_number_range: { min: 1, max: 10 } });
    const result = await refElementSearch.handler(input, ctx);
    expect(result.total_matches).toBe(10);
    expect(result.results.every((el) => el.number >= 1 && el.number <= 10)).toBe(true);
  });

  it('filters by atomic mass range', async () => {
    const ctx = createMockContext();
    const input = refElementSearch.input.parse({ atomic_mass_range: { min: 1, max: 5 } });
    const result = await refElementSearch.handler(input, ctx);
    expect(result.total_matches).toBeGreaterThan(0);
    // All results should have atomic mass in range
    for (const el of result.results) {
      if (el.atomic_mass != null) {
        expect(el.atomic_mass).toBeGreaterThanOrEqual(1);
        expect(el.atomic_mass).toBeLessThanOrEqual(5);
      }
    }
  });

  it('throws when no filter provided', async () => {
    const ctx = createMockContext({ errors: refElementSearch.errors });
    const input = refElementSearch.input.parse({});
    expect(() => refElementSearch.handler(input, ctx)).toThrow(/At least one filter/);
  });

  it('returns message with no results on no match', async () => {
    const ctx = createMockContext();
    // Group 15, period 1 — no element exists there
    const input = refElementSearch.input.parse({ group: 15, period: 1 });
    const result = await refElementSearch.handler(input, ctx);
    expect(result.total_matches).toBe(0);
    expect(result.results).toHaveLength(0);
    expect(result.message).toBeTruthy();
  });

  it('formats results listing each element', () => {
    const output = {
      results: [
        {
          number: 2,
          symbol: 'He',
          name: 'Helium',
          atomic_mass: 4.0026,
          atomic_mass_estimated: false,
          category: 'noble gas',
        },
        {
          number: 10,
          symbol: 'Ne',
          name: 'Neon',
          atomic_mass: 20.18,
          atomic_mass_estimated: false,
          category: 'noble gas',
        },
      ],
      total_matches: 2,
    };
    const blocks = refElementSearch.format!(output);
    const text = blocks[0]!.text as string;
    expect(text).toContain('2');
    expect(text).toContain('He');
    expect(text).toContain('Helium');
    expect(text).toContain('Ne');
    expect(text).toContain('Neon');
    expect(text).toContain('noble gas');
  });

  it('exact category match: "transition metal" does not return post-transition metals', async () => {
    const ctx = createMockContext();
    const input = refElementSearch.input.parse({ category: 'transition metal' });
    const result = await refElementSearch.handler(input, ctx);
    // All results must be transition metals, not post-transition metals
    expect(result.results.every((el) => el.category === 'transition metal')).toBe(true);
    expect(result.results.some((el) => el.category === 'post-transition metal')).toBe(false);
  });

  it('formats message hint when present', () => {
    const output = {
      results: [],
      total_matches: 0,
      message: 'No elements matched filters: group=15, period=1. Try a broader range.',
    };
    const blocks = refElementSearch.format!(output);
    const text = blocks[0]!.text as string;
    expect(text).toContain('No elements matched');
  });
});
