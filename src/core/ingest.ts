import type { IncomingMessage, ServerResponse } from 'node:http';
import type { SinkEntry } from './types';
import type { Writer } from './writer';

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function readBody(req: IncomingMessage, limit = 5_000_000): Promise<string> {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk: Buffer) => {
      raw += chunk;
      if (raw.length > limit) req.destroy();
    });
    req.on('end', () => resolve(raw));
    req.on('error', () => resolve(''));
  });
}

export function ingestBody(raw: string, writer: Writer): void {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) writer.write(parsed as SinkEntry[]);
  } catch (_) {
    /* ignore malformed batch */
  }
}

/**
 * Connect/Vite-style middleware for same-origin ingest. Mounted at the endpoint
 * path, so any method other than POST is rejected.
 */
export function createIngestHandler(writer: Writer) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end();
      return;
    }
    ingestBody(await readBody(req), writer);
    res.statusCode = 204;
    res.end();
  };
}
