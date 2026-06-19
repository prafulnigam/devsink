import http from 'node:http';
import { resolveOptions, consoleLogger } from './core/types';
import type { DevSinkOptions, ResolvedOptions, SinkLogger } from './core/types';
import { generateClientCode } from './core/client';
import { createWriter } from './core/writer';
import { CORS_HEADERS, readBody, ingestBody } from './core/ingest';

export interface SinkServer {
  /** The underlying http.Server. */
  server: http.Server;
  /** Absolute URL of the ingest endpoint. */
  endpointUrl: string;
  /** Absolute URL of the served client script. */
  clientUrl: string;
  /** Ready-to-paste script tag for the consuming page. */
  scriptTag: string;
  /** Resolved output directory. */
  dir: string;
  /** Start listening. Resolves once bound. */
  start(): Promise<SinkServer>;
  /** Stop the server. */
  stop(): Promise<void>;
}

/**
 * Create a self-contained ingest server that BOTH serves the browser client
 * script and receives capture batches, writing them to disk. Works with any
 * setup (CRA, webpack, Parcel, plain HTML, any framework) via a single
 * cross-origin <script> tag.
 */
export function createSinkServer(
  userOptions: DevSinkOptions = {},
  root: string = process.cwd(),
  logger: SinkLogger = consoleLogger,
): SinkServer {
  const o: ResolvedOptions = resolveOptions(userOptions);
  const origin = `http://${o.host === '0.0.0.0' ? 'localhost' : o.host}:${o.port}`;
  const endpointUrl = origin + o.endpoint;
  const clientUrl = origin + o.clientPath;

  const writer = createWriter(root, o, logger);
  const clientCode = generateClientCode(o, endpointUrl);

  const server = http.createServer(async (req, res) => {
    for (const [k, v] of Object.entries(CORS_HEADERS)) res.setHeader(k, v);

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }
    const url = (req.url || '').split('?')[0];

    if (req.method === 'GET' && url === o.clientPath) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.end(clientCode);
      return;
    }
    if (req.method === 'POST' && url === o.endpoint) {
      ingestBody(await readBody(req), writer);
      res.statusCode = 204;
      res.end();
      return;
    }
    res.statusCode = 404;
    res.end();
  });

  const scriptTag = `<script src="${clientUrl}"></script>`;

  const api: SinkServer = {
    server,
    endpointUrl,
    clientUrl,
    scriptTag,
    dir: writer.dir,
    start() {
      return new Promise<SinkServer>((resolve) => {
        server.listen(o.port, o.host, () => {
          logger.info(`[devsink] listening on ${origin}`);
          logger.info(`[devsink] writing → ${writer.dir}`);
          resolve(api);
        });
      });
    },
    stop() {
      return new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
  return api;
}
