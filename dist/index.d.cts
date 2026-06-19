export { default, default as viteDevSink } from './vite.cjs';
export { WebpackDevSink } from './webpack.cjs';
export { SinkServer, createSinkServer } from './standalone.cjs';
import { R as ResolvedOptions } from './types-LIOtQ_5I.cjs';
export { C as ConsoleEntry, a as ConsoleLevel, D as DevSinkOptions, E as ErrorEntry, N as NetworkEntry, S as SinkEntry, b as SinkLogger, r as resolveOptions } from './types-LIOtQ_5I.cjs';
import 'vite';
import 'node:http';

/**
 * Returns the JavaScript source string that runs in the browser. `endpoint` may
 * be relative (same-origin Vite/webpack) or absolute (cross-origin standalone).
 * The client sends text/plain so cross-origin POSTs stay CORS-simple (no preflight,
 * which matters for navigator.sendBeacon).
 */
declare function generateClientCode(o: ResolvedOptions, endpoint: string): string;

export { ResolvedOptions, generateClientCode };
