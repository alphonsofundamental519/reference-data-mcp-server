/**
 * @fileoverview Resource for fetching timezone info by IANA ID.
 * @module mcp-server/resources/definitions/ref-timezones
 */

import { resource, z } from '@cyanheads/mcp-ts-core';
import { notFound } from '@cyanheads/mcp-ts-core/errors';
import { getTimezoneService } from '@/services/timezone/timezone-service.js';

export const refTimezonesResource = resource('ref://timezones/{iana_id}', {
  name: 'ref-timezone',
  description:
    'Timezone info by IANA ID (URL-encode slashes as %2F, e.g., ref://timezones/America%2FNew_York). Returns current offset, standard offset, DST status, major cities, and country codes.',
  mimeType: 'application/json',

  params: z.object({
    iana_id: z
      .string()
      .describe(
        'IANA timezone identifier with slashes URL-encoded as %2F (e.g., "America%2FNew_York", "Europe%2FLondon", "UTC").',
      ),
  }),

  output: z.object({
    iana_id: z.string().describe('IANA timezone identifier.'),
    current_offset_hours: z.number().describe('Current UTC offset in hours.'),
    standard_offset_hours: z.number().describe('Standard (non-DST) UTC offset in hours.'),
    dst_active: z.boolean().describe('Whether DST is currently active.'),
    dst_abbreviation: z.string().nullable().describe('DST abbreviation (e.g., "EDT"), or null.'),
    standard_abbreviation: z.string().nullable().describe('Standard abbreviation (e.g., "EST").'),
    major_cities: z.array(z.string()).describe('Major cities in this timezone.'),
    countries: z.array(z.string()).describe('ISO alpha-2 country codes observing this timezone.'),
    evaluated_at: z.string().describe('ISO 8601 UTC datetime at which the offset was evaluated.'),
  }),

  handler(params, ctx) {
    // Decode %2F back to / for IANA IDs
    const ianaId = decodeURIComponent(params.iana_id);

    // Validate that the timezone exists via Intl
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: ianaId });
    } catch {
      throw notFound(
        `Timezone "${ianaId}" is not a valid IANA timezone ID. URL-encode slashes as %2F (e.g., America%2FNew_York).`,
        { iana_id: ianaId },
      );
    }

    const records = getTimezoneService().lookup(ianaId, 'iana', undefined, ctx);
    if (records.length === 0) {
      throw notFound(`No timezone data found for "${ianaId}".`, { iana_id: ianaId });
    }

    // records.length > 0 guaranteed by the guard above
    const record = records[0] as NonNullable<(typeof records)[0]>;
    return {
      ...record,
      evaluated_at: new Date().toISOString(),
    };
  },
});
