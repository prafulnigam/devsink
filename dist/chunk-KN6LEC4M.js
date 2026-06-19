import {
  createIngestHandler,
  createWriter,
  generateClientCode,
  resolveOptions
} from "./chunk-KIWFRUVV.js";

// src/vite.ts
var VIRTUAL_ID = "virtual:devsink/client";
var RESOLVED_VIRTUAL_ID = "\0" + VIRTUAL_ID;
function viteDevSink(userOptions = {}) {
  const o = resolveOptions(userOptions);
  let config;
  let active = false;
  return {
    name: "devsink",
    apply: "serve",
    configResolved(resolved) {
      config = resolved;
      active = o.enabled && config.command === "serve";
    },
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID;
    },
    load(id) {
      if (id === RESOLVED_VIRTUAL_ID) {
        return active ? generateClientCode(o, o.endpoint) : "export {};";
      }
    },
    configureServer(server) {
      if (!active) return;
      const writer = createWriter(config.root, o, server.config.logger);
      server.middlewares.use(o.endpoint, createIngestHandler(writer));
      server.config.logger.info(`[devsink] capturing console + network \u2192 ${writer.dir}`);
    },
    transformIndexHtml(html) {
      if (!active) return;
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: { type: "module" },
            children: `import ${JSON.stringify(VIRTUAL_ID)};`,
            injectTo: "head-prepend"
          }
        ]
      };
    }
  };
}
var vite_default = viteDevSink;

export {
  viteDevSink,
  vite_default
};
