import type { Plugin, ResolvedConfig } from 'vite';
import { resolveOptions } from './core/types';
import type { DevSinkOptions, ResolvedOptions } from './core/types';
import { generateClientCode } from './core/client';
import { createWriter } from './core/writer';
import { createIngestHandler } from './core/ingest';

const VIRTUAL_ID = 'virtual:devsink/client';
const RESOLVED_VIRTUAL_ID = '\0' + VIRTUAL_ID;

/** Vite plugin. Zero-config: auto-injects the client and ingests same-origin. */
export function viteDevSink(userOptions: DevSinkOptions = {}): Plugin {
  const o: ResolvedOptions = resolveOptions(userOptions);
  let config: ResolvedConfig;
  let active = false;

  return {
    name: 'devsink',
    apply: 'serve',

    configResolved(resolved) {
      config = resolved;
      active = o.enabled && config.command === 'serve';
    },

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID;
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_ID) {
        // Same-origin: relative endpoint, no CORS needed.
        return active ? generateClientCode(o, o.endpoint) : 'export {};';
      }
    },

    configureServer(server) {
      if (!active) return;
      const writer = createWriter(config.root, o, server.config.logger);
      server.middlewares.use(o.endpoint, createIngestHandler(writer));
      server.config.logger.info(`[devsink] capturing console + network → ${writer.dir}`);
    },

    transformIndexHtml(html) {
      if (!active) return;
      return {
        html,
        tags: [
          {
            tag: 'script',
            attrs: { type: 'module' },
            children: `import ${JSON.stringify(VIRTUAL_ID)};`,
            injectTo: 'head-prepend',
          },
        ],
      };
    },
  };
}

export default viteDevSink;
