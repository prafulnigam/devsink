import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolveOptions, consoleLogger } from './core/types';
import type { DevSinkOptions } from './core/types';
import { generateClientCode } from './core/client';
import { createSinkServer, type SinkServer } from './standalone';

// Loose structural types so webpack is not a hard build/runtime dependency.
interface WebpackEntryPlugin {
  new (context: string, entry: string, options: { name?: string }): { apply(compiler: WebpackCompiler): void };
}
interface WebpackCompiler {
  context: string;
  options: { mode?: string };
  webpack?: { EntryPlugin?: WebpackEntryPlugin };
  hooks?: { watchClose?: { tap(name: string, fn: () => void): void } };
}

/**
 * Webpack plugin for setups where you can edit the webpack config (custom
 * webpack, Rspack, or CRA via CRACO / react-app-rewired). It injects the
 * capture client as a global entry and starts a local ingest server
 * automatically — one extra background process, no manual script tag.
 *
 * For Create React App WITHOUT ejecting/CRACO, use the standalone CLI instead.
 */
export class WebpackDevSink {
  private options: DevSinkOptions;
  private started = false;
  private sink?: SinkServer;

  constructor(options: DevSinkOptions = {}) {
    this.options = options;
  }

  apply(compiler: WebpackCompiler): void {
    const o = resolveOptions(this.options);
    const isDev = (compiler.options.mode ?? 'production') !== 'production';
    if (!o.enabled || !isDev) return;

    if (!this.started) {
      this.started = true;
      this.sink = createSinkServer(this.options, compiler.context, consoleLogger);
      void this.sink.start();

      // Bake the absolute ingest URL into the bundled client.
      const clientCode = generateClientCode(o, this.sink.endpointUrl);
      const file = path.join(os.tmpdir(), `devsink-client-${process.pid}.js`);
      try { fs.writeFileSync(file, clientCode); } catch { /* ignore */ }

      const EntryPlugin = compiler.webpack?.EntryPlugin;
      if (EntryPlugin) {
        new EntryPlugin(compiler.context, file, { name: undefined }).apply(compiler);
      } else {
        consoleLogger.warn(
          '[devsink] webpack 5 EntryPlugin not found. Add ' + file + ' to your entry manually, ' +
            'or use the standalone CLI + <script> tag instead.',
        );
      }

      compiler.hooks?.watchClose?.tap('devsink', () => { void this.sink?.stop(); });
    }
  }
}

export default WebpackDevSink;
