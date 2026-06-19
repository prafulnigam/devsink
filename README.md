<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/devsink-lockup-dark.svg">
    <img src="assets/devsink-lockup.svg" alt="devsink" width="360">
  </picture>
</p>

Capture browser **console logs** and **network requests** into plain JSONL files inside your codebase during development. Open `.devsink/console.jsonl` and `.devsink/network.jsonl` in your editor, grep them, or feed them to a coding agent.

Works with **Vite, webpack, Create React App, Parcel/Rspack, any framework, and plain HTML** via three adapters that share one portable capture core. Dev-only by design — nothing is injected into production builds.

## Install

```bash
npm i -D devsink
```

## Pick your adapter

| Your setup | Use | Why |
| --- | --- | --- |
| Vite (React/Vue/Svelte/vanilla) | `devsink/vite` plugin | Zero-config, auto-injects, same-origin ingest |
| Custom webpack / Rspack / CRA + CRACO / ejected | `devsink/webpack` plugin | Auto-injects + runs its own ingest server |
| **Create React App (no eject)**, Parcel, plain HTML, anything else | standalone CLI + `<script>` | Universal, requires no build-config access |

---

### Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import devSink from 'devsink/vite';

export default defineConfig({
  plugins: [devSink()],
});
```

Run `vite`. Done.

### Webpack (config you can edit)

```js
// webpack.config.js
const { WebpackDevSink } = require('devsink/webpack');

module.exports = {
  mode: 'development',
  plugins: [new WebpackDevSink()],
};
```

For **CRA via CRACO** (`craco.config.js`):

```js
const { WebpackDevSink } = require('devsink/webpack');
module.exports = {
  webpack: { plugins: { add: [new WebpackDevSink()] } },
};
```

The plugin requires webpack 5 (it uses `EntryPlugin`). It starts a local ingest server automatically — no manual script tag.

### Standalone — the universal one (works with plain CRA, anything)

Run the server alongside your app:

```bash
npx devsink            # listens on http://localhost:9779
```

Add **one line** to your page's HTML (for CRA that's `public/index.html`, in `<head>`):

```html
<script src="http://localhost:9779/__devsink/client.js"></script>
```

That's it — no eject, no config changes, framework-independent. CLI flags: `--port`, `--host`, `--dir`, `--bodies`, `--echo`, `--no-clear` (run `npx devsink --help`).

You can also run it programmatically:

```js
import { createSinkServer } from 'devsink/standalone';
const sink = createSinkServer({ port: 9779, dir: '.devsink' });
await sink.start();
console.log(sink.scriptTag); // <script ...> to paste into your page
```

---

## Output

```
.devsink/
  console.jsonl   # console.* + uncaught errors + unhandled rejections
  network.jsonl   # fetch + XMLHttpRequest
  .gitignore      # auto-created so captures are never committed
```

One JSON object per line:

```json
{"type":"console","ts":1718700000000,"level":"warn","args":["slow render",{"ms":812}]}
{"type":"network","ts":1718700000100,"api":"fetch","url":"/api/users","method":"GET","status":200,"ok":true,"duration":53}
```

## How it works

A small client patches `console.*`, `window.onerror`, `unhandledrejection`, `fetch`, and `XMLHttpRequest`, buffers entries, and POSTs them in batches (via `sendBeacon`, falling back to `keepalive` fetch) to an ingest endpoint that appends them to the JSONL files. Because it patches runtime globals, it's agnostic to framework and to whether your source is TypeScript or JavaScript. The standalone server sends data as CORS-simple `text/plain` so cross-origin capture works without preflight.

## Options

All adapters accept the same options object. Defaults: `dir: '.devsink'`, `levels: all`, `captureErrors/Fetch/XHR: true`, `captureBodies: false`, `maxBodyLength: 2000`, `redactHeaders: [authorization, cookie, set-cookie, x-api-key]`, `flushInterval: 1000`, `flushThreshold: 50`, `echoToTerminal: false`, `clearOnStart: true`, `port: 9779`, `host: '127.0.0.1'`. See the TypeScript types (`DevSinkOptions`) for the full list.

## Notes & limitations

- In-page capture sees `fetch`/XHR metadata (and bodies if enabled) but not DevTools-grade timing waterfalls, WebSocket/SSE frames, or browser-initiated requests (favicon, preloads). For those, use the Chrome DevTools Protocol via Playwright/Puppeteer.
- Bodies are off by default; enable `captureBodies` deliberately. `redactHeaders` scrubs common secret headers.
- The webpack adapter needs webpack 5 and editable config — plain CRA users should use the standalone CLI.

## License

MIT
