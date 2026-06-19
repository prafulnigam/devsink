import { Plugin } from 'vite';
import { D as DevSinkOptions } from './types-LIOtQ_5I.cjs';

/** Vite plugin. Zero-config: auto-injects the client and ingests same-origin. */
declare function viteDevSink(userOptions?: DevSinkOptions): Plugin;

export { viteDevSink as default, viteDevSink };
