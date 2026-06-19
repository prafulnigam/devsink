import type { ResolvedOptions } from './types';

/**
 * Returns the JavaScript source string that runs in the browser. `endpoint` may
 * be relative (same-origin Vite/webpack) or absolute (cross-origin standalone).
 * The client sends text/plain so cross-origin POSTs stay CORS-simple (no preflight,
 * which matters for navigator.sendBeacon).
 */
export function generateClientCode(o: ResolvedOptions, endpoint: string): string {
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
    flushThreshold: o.flushThreshold,
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
  return s.length > CFG.maxBodyLength ? s.slice(0, CFG.maxBodyLength) + '…[truncated]' : s;
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
