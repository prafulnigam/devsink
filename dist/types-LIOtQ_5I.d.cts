type ConsoleLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';
interface DevSinkOptions {
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
type ResolvedOptions = Required<DevSinkOptions>;
interface ConsoleEntry {
    type: 'console';
    ts: number;
    level: ConsoleLevel;
    args: unknown[];
    source?: string;
}
interface ErrorEntry {
    type: 'error' | 'unhandledrejection';
    ts: number;
    message: string;
    stack?: string;
}
interface NetworkEntry {
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
type SinkEntry = ConsoleEntry | ErrorEntry | NetworkEntry;
/** Minimal logger so adapters can pass Vite's logger or fall back to console. */
interface SinkLogger {
    info(msg: string): void;
    warn(msg: string): void;
    error(msg: string): void;
}
declare function resolveOptions(o?: DevSinkOptions): ResolvedOptions;

export { type ConsoleEntry as C, type DevSinkOptions as D, type ErrorEntry as E, type NetworkEntry as N, type ResolvedOptions as R, type SinkEntry as S, type ConsoleLevel as a, type SinkLogger as b, resolveOptions as r };
