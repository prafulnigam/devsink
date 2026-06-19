import http from 'node:http';
import { D as DevSinkOptions, b as SinkLogger } from './types-LIOtQ_5I.js';

interface SinkServer {
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
declare function createSinkServer(userOptions?: DevSinkOptions, root?: string, logger?: SinkLogger): SinkServer;

export { type SinkServer, createSinkServer };
