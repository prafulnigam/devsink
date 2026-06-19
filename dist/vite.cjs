"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/vite.ts
var vite_exports = {};
__export(vite_exports, {
  default: () => vite_default,
  viteDevSink: () => viteDevSink
});
module.exports = __toCommonJS(vite_exports);

// src/core/types.ts
function resolveOptions(o = {}) {
  return {
    enabled: o.enabled ?? true,
    dir: o.dir ?? ".devsink",
    consoleFile: o.consoleFile ?? "console.jsonl",
    networkFile: o.networkFile ?? "network.jsonl",
    endpoint: o.endpoint ?? "/__devsink/ingest",
    clientPath: o.clientPath ?? "/__devsink/client.js",
    levels: o.levels ?? ["log", "info", "warn", "error", "debug"],
    captureErrors: o.captureErrors ?? true,
    captureFetch: o.captureFetch ?? true,
    captureXHR: o.captureXHR ?? true,
    captureBodies: o.captureBodies ?? false,
    maxBodyLength: o.maxBodyLength ?? 2e3,
    redactHeaders: o.redactHeaders ?? ["authorization", "cookie", "set-cookie", "x-api-key"],
    flushInterval: o.flushInterval ?? 1e3,
    flushThreshold: o.flushThreshold ?? 50,
    echoToTerminal: o.echoToTerminal ?? false,
    clearOnStart: o.clearOnStart ?? true,
    port: o.port ?? 9779,
    host: o.host ?? "127.0.0.1"
  };
}

// src/core/client.ts
function generateClientCode(o, endpoint) {
  const cfg = JSON.stringify({
    endpoint,
    levels: o.levels,
    captureErrors: o.captureErrors,
    captureFetch: o.captureFetch,
    captureXHR: o.captureXHR,
    captureBodies: o.captureBodies,
    maxBodyLength: o.maxBodyLength,
    redactHeaders: o.redactHeaders.map((h) => h.toLowerCase()),
    flushInterval: o.flushInterval,
    flushThreshold: o.flushThreshold
  });
  return `
(function () {
const CFG = ${cfg};
if (window.__devsinkInstalled) return;
window.__devsinkInstalled = true;
const buffer = [];

function send(batch) {
  const body = JSON.stringify(batch);
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'text/plain;charset=UTF-8' });
      if (navigator.sendBeacon(CFG.endpoint, blob)) return;
    }
  } catch (_) {}
  fetch(CFG.endpoint, { method: 'POST', body: body, keepalive: true,
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' } }).catch(() => {});
}
function flush() { if (buffer.length) send(buffer.splice(0, buffer.length)); }
function push(e) { buffer.push(e); if (buffer.length >= CFG.flushThreshold) flush(); }

setInterval(flush, CFG.flushInterval);
addEventListener('beforeunload', flush);
addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(); });

function serialize(value) {
  const seen = new WeakSet();
  function walk(v) {
    if (v === null || typeof v !== 'object') {
      if (typeof v === 'function') return '[Function ' + (v.name || 'anonymous') + ']';
      if (typeof v === 'bigint') return v.toString() + 'n';
      if (typeof v === 'undefined') return '[undefined]';
      return v;
    }
    if (v instanceof Error) return { name: v.name, message: v.message, stack: v.stack };
    if (typeof Node !== 'undefined' && v instanceof Node) return '[' + (v.nodeName || 'Node') + ']';
    if (seen.has(v)) return '[Circular]';
    seen.add(v);
    if (Array.isArray(v)) return v.map(walk);
    const out = {};
    for (const k in v) { try { out[k] = walk(v[k]); } catch (_) { out[k] = '[Unserializable]'; } }
    return out;
  }
  return walk(value);
}

function callerSource() {
  try {
    const lines = (new Error().stack || '').split('\\n');
    for (let i = 2; i < lines.length; i++) {
      const l = lines[i];
      if (l && l.indexOf('__devsink') === -1) {
        const m = l.match(/\\(?(https?:\\/\\/[^\\s)]+|[^\\s)]+:\\d+:\\d+)\\)?$/);
        if (m) return m[1];
      }
    }
  } catch (_) {}
  return undefined;
}

for (let i = 0; i < CFG.levels.length; i++) {
  const level = CFG.levels[i];
  const orig = console[level];
  if (typeof orig !== 'function') continue;
  console[level] = function () {
    const args = Array.prototype.slice.call(arguments);
    try { push({ type: 'console', level: level, ts: Date.now(), args: args.map(serialize), source: callerSource() }); } catch (_) {}
    return orig.apply(console, args);
  };
}

if (CFG.captureErrors) {
  addEventListener('error', function (e) {
    push({ type: 'error', ts: Date.now(), message: e.message || String(e.error), stack: e.error && e.error.stack });
  });
  addEventListener('unhandledrejection', function (e) {
    const r = e.reason;
    push({ type: 'unhandledrejection', ts: Date.now(), message: r && r.message ? r.message : String(r), stack: r && r.stack });
  });
}

function truncate(s) {
  if (typeof s !== 'string') return s;
  return s.length > CFG.maxBodyLength ? s.slice(0, CFG.maxBodyLength) + '\u2026[truncated]' : s;
}
function redact(headers) {
  const out = {};
  try { headers.forEach(function (v, k) { out[k] = CFG.redactHeaders.indexOf(k.toLowerCase()) !== -1 ? '[redacted]' : v; }); } catch (_) {}
  return out;
}

if (CFG.captureFetch && typeof window.fetch === 'function') {
  const origFetch = window.fetch.bind(window);
  window.fetch = async function (input, init) {
    const start = Date.now();
    const url = typeof input === 'string' ? input : (input && input.url) || String(input);
    const method = (init && init.method) || (input && input.method) || 'GET';
    const entry = { type: 'network', api: 'fetch', ts: start, url: url, method: method, duration: 0 };
    if (CFG.captureBodies && init && typeof init.body === 'string') entry.requestBody = truncate(init.body);
    try {
      const res = await origFetch(input, init);
      entry.status = res.status; entry.ok = res.ok; entry.duration = Date.now() - start;
      try { entry.responseHeaders = redact(res.headers); } catch (_) {}
      if (CFG.captureBodies) { try { entry.responseBody = truncate(await res.clone().text()); } catch (_) {} }
      push(entry); return res;
    } catch (err) {
      entry.duration = Date.now() - start; entry.error = String(err); push(entry); throw err;
    }
  };
}

if (CFG.captureXHR && typeof XMLHttpRequest !== 'undefined') {
  const open = XMLHttpRequest.prototype.open;
  const sendXHR = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__devsink = { method: method, url: String(url), start: 0 };
    return open.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function (body) {
    const meta = this.__devsink;
    if (meta) {
      meta.start = Date.now();
      const self = this;
      this.addEventListener('loadend', function () {
        const entry = { type: 'network', api: 'xhr', ts: meta.start, url: meta.url, method: meta.method,
          status: self.status, ok: self.status >= 200 && self.status < 400, duration: Date.now() - meta.start };
        if (CFG.captureBodies) {
          if (typeof body === 'string') entry.requestBody = truncate(body);
          try { if (typeof self.responseText === 'string') entry.responseBody = truncate(self.responseText); } catch (_) {}
        }
        push(entry);
      });
    }
    return sendXHR.apply(this, arguments);
  };
}
})();
`;
}

// src/core/writer.ts
var import_node_fs = __toESM(require("fs"), 1);
var import_node_path = __toESM(require("path"), 1);
function createWriter(root, o, logger) {
  const dir = import_node_path.default.isAbsolute(o.dir) ? o.dir : import_node_path.default.join(root, o.dir);
  const consolePath = import_node_path.default.join(dir, o.consoleFile);
  const networkPath = import_node_path.default.join(dir, o.networkFile);
  import_node_fs.default.mkdirSync(dir, { recursive: true });
  if (o.clearOnStart) {
    for (const f of [consolePath, networkPath]) {
      try {
        import_node_fs.default.writeFileSync(f, "");
      } catch (_) {
      }
    }
  }
  const ignorePath = import_node_path.default.join(dir, ".gitignore");
  if (!import_node_fs.default.existsSync(ignorePath)) {
    try {
      import_node_fs.default.writeFileSync(ignorePath, "*\n");
    } catch (_) {
    }
  }
  function write(entries) {
    let consoleLines = "";
    let networkLines = "";
    for (const e of entries) {
      if (!e || typeof e !== "object") continue;
      if (e.type === "network") networkLines += JSON.stringify(e) + "\n";
      else consoleLines += JSON.stringify(e) + "\n";
      if (o.echoToTerminal) echo(e, logger);
    }
    if (consoleLines) import_node_fs.default.appendFile(consolePath, consoleLines, () => {
    });
    if (networkLines) import_node_fs.default.appendFile(networkPath, networkLines, () => {
    });
  }
  return { write, dir };
}
function echo(e, logger) {
  const tag = "[devsink]";
  if (e.type === "network") {
    const n = e;
    const status = n.error ? `ERR ${n.error}` : n.status;
    logger.info(`${tag} ${n.method} ${n.url} \u2192 ${status} (${n.duration}ms)`);
  } else if (e.type === "console") {
    const c = e;
    const line = `${tag} ${c.level}: ${c.args.map(stringify).join(" ")}`;
    if (c.level === "error") logger.error(line);
    else if (c.level === "warn") logger.warn(line);
    else logger.info(line);
  } else {
    logger.error(`${tag} ${e.type}: ${e.message}`);
  }
}
function stringify(v) {
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

// src/core/ingest.ts
function readBody(req, limit = 5e6) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > limit) req.destroy();
    });
    req.on("end", () => resolve(raw));
    req.on("error", () => resolve(""));
  });
}
function ingestBody(raw, writer) {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) writer.write(parsed);
  } catch (_) {
  }
}
function createIngestHandler(writer) {
  return async (req, res) => {
    if (req.method !== "POST") {
      res.statusCode = 405;
      res.end();
      return;
    }
    ingestBody(await readBody(req), writer);
    res.statusCode = 204;
    res.end();
  };
}

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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  viteDevSink
});
