export type ConsoleLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

export interface DevSinkOptions {
  /** Master switch. Adapters additionally gate to dev mode. @default true */
  enabled?: boolean;

  /** Output directory (relative to project root). @default '.devsink' */
  dir?: string;
  /** Console/error file name. @default 'console.jsonl' */
  consoleFile?: string;
  /** Network file name. @default 'network.jsonl' */
  networkFile?: string;

  /** Ingest path the client POSTs to. @default '/__devsink/ingest' */
  endpoint?: string;
  /** Path the standalone server serves the client script from. @default '/__devsink/client.js' */
  clientPath?: string;

  /** Console levels to capture. @default all */
  levels?: ConsoleLevel[];
  /** Capture window.onerror + unhandledrejection. @default true */
  captureErrors?: boolean;
  /** Wrap fetch(). @default true */
  captureFetch?: boolean;
  /** Wrap XMLHttpRequest. @default true */
  captureXHR?: boolean;
  /** Include request/response bodies (truncated). @default false */
  captureBodies?: boolean;
  /** Max body characters before truncation. @default 2000 */
  maxBodyLength?: number;
  /** Header values replaced with "[redacted]". @default ['authorization','cookie','set-cookie','x-api-key'] */
  redactHeaders?: string[];

  /** Batch flush interval (ms). @default 1000 */
  flushInterval?: number;
  /** Flush early at this buffer size. @default 50 */
  flushThreshold?: number;

  /** Also print entries to the dev terminal. @default false */
  echoToTerminal?: boolean;
  /** Truncate files when the server starts. @default true */
  clearOnStart?: boolean;

  /** Port for the standalone / webpack ingest server. @default 9779 */
  port?: number;
  /** Host for the standalone / webpack ingest server. @default '127.0.0.1' */
  host?: string;
}

export type ResolvedOptions = Required<DevSinkOptions>;

export interface ConsoleEntry {
  type: 'console';
  ts: number;
  level: ConsoleLevel;
  args: unknown[];
  source?: string;
}
export interface ErrorEntry {
  type: 'error' | 'unhandledrejection';
  ts: number;
  message: string;
  stack?: string;
}
export interface NetworkEntry {
  type: 'network';
  ts: number;
  api: 'fetch' | 'xhr';
  url: string;
  method: string;
  status?: number;
  ok?: boolean;
  duration: number;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: string;
  responseBody?: string;
  error?: string;
}
export type SinkEntry = ConsoleEntry | ErrorEntry | NetworkEntry;

/** Minimal logger so adapters can pass Vite's logger or fall back to console. */
export interface SinkLogger {
  info(msg: string): void;
  warn(msg: string): void;
  error(msg: string): void;
}

export function resolveOptions(o: DevSinkOptions = {}): ResolvedOptions {
  return {
    enabled: o.enabled ?? true,
    dir: o.dir ?? '.devsink',
    consoleFile: o.consoleFile ?? 'console.jsonl',
    networkFile: o.networkFile ?? 'network.jsonl',
    endpoint: o.endpoint ?? '/__devsink/ingest',
    clientPath: o.clientPath ?? '/__devsink/client.js',
    levels: o.levels ?? ['log', 'info', 'warn', 'error', 'debug'],
    captureErrors: o.captureErrors ?? true,
    captureFetch: o.captureFetch ?? true,
    captureXHR: o.captureXHR ?? true,
    captureBodies: o.captureBodies ?? false,
    maxBodyLength: o.maxBodyLength ?? 2000,
    redactHeaders: o.redactHeaders ?? ['authorization', 'cookie', 'set-cookie', 'x-api-key'],
    flushInterval: o.flushInterval ?? 1000,
    flushThreshold: o.flushThreshold ?? 50,
    echoToTerminal: o.echoToTerminal ?? false,
    clearOnStart: o.clearOnStart ?? true,
    port: o.port ?? 9779,
    host: o.host ?? '127.0.0.1',
  };
}

export const consoleLogger: SinkLogger = {
  info: (m) => console.log(m),
  warn: (m) => console.warn(m),
  error: (m) => console.error(m),
};
