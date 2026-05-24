/**
 * @fileoverview MIME type service — lookup by type string or file extension.
 * @module services/mime/mime-service
 */

import type { Context } from '@cyanheads/mcp-ts-core';
import mimeDb from 'mime-db';

export interface MimeResult {
  alternatives?: Array<{ type: string; source: string | null }>;
  compressible: boolean | null;
  extensions: string[];
  source: string | null;
  type: string;
}

export class MimeService {
  private readonly byExtension: Map<string, string[]>; // ext → [mime types]

  constructor() {
    this.byExtension = new Map();
    for (const [type, info] of Object.entries(mimeDb)) {
      const exts = (info as { extensions?: string[] }).extensions ?? [];
      for (const ext of exts) {
        const existing = this.byExtension.get(ext) ?? [];
        existing.push(type);
        this.byExtension.set(ext, existing);
      }
    }
  }

  lookup(query: string, ctx: Context): MimeResult | undefined {
    ctx.log.debug('MIME lookup', { query });

    // Normalize: strip leading dot
    const normalized = query.startsWith('.') ? query.slice(1) : query;

    // Check if it looks like a MIME type (contains '/')
    if (normalized.includes('/')) {
      const info = (
        mimeDb as Record<string, { extensions?: string[]; compressible?: boolean; source?: string }>
      )[normalized.toLowerCase()];
      if (!info) return;
      return {
        type: normalized.toLowerCase(),
        extensions: info.extensions ?? [],
        compressible: info.compressible ?? null,
        source: info.source ?? null,
      };
    }

    // Extension lookup
    const ext = normalized.toLowerCase();
    const types = this.byExtension.get(ext);
    if (!types || types.length === 0) return;

    // types.length > 0 is guaranteed by the guard above
    const primary = types[0] as string;
    const primaryInfo = (
      mimeDb as Record<string, { extensions?: string[]; compressible?: boolean; source?: string }>
    )[primary];
    const alternatives = types.slice(1).map((t) => ({
      type: t,
      source: (mimeDb as Record<string, { source?: string }>)[t]?.source ?? null,
    }));

    const mimeResult: MimeResult = {
      type: primary,
      extensions: primaryInfo?.extensions ?? [ext],
      compressible: primaryInfo?.compressible ?? null,
      source: primaryInfo?.source ?? null,
    };
    if (alternatives.length > 0) mimeResult.alternatives = alternatives;
    return mimeResult;
  }
}

// --- Init/accessor pattern ---

let _service: MimeService | undefined;

export function initMimeService(): void {
  _service = new MimeService();
}

export function getMimeService(): MimeService {
  if (!_service) throw new Error('MimeService not initialized — call initMimeService() in setup()');
  return _service;
}
