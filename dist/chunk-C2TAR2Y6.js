import {
  CORS_HEADERS,
  consoleLogger,
  createWriter,
  generateClientCode,
  ingestBody,
  readBody,
  resolveOptions
} from "./chunk-KIWFRUVV.js";

// src/standalone.ts
import http from "http";
function createSinkServer(userOptions = {}, root = process.cwd(), logger = consoleLogger) {
  const o = resolveOptions(userOptions);
  const origin = `http://${o.host === "0.0.0.0" ? "localhost" : o.host}:${o.port}`;
  const endpointUrl = origin + o.endpoint;
  const clientUrl = origin + o.clientPath;
  const writer = createWriter(root, o, logger);
  const clientCode = generateClientCode(o, endpointUrl);
  const server = http.createServer(async (req, res) => {
    for (const [k, v] of Object.entries(CORS_HEADERS)) res.setHeader(k, v);
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }
    const url = (req.url || "").split("?")[0];
    if (req.method === "GET" && url === o.clientPath) {
      res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      res.end(clientCode);
      return;
    }
    if (req.method === "POST" && url === o.endpoint) {
      ingestBody(await readBody(req), writer);
      res.statusCode = 204;
      res.end();
      return;
    }
    res.statusCode = 404;
    res.end();
  });
  const scriptTag = `<script src="${clientUrl}"></script>`;
  const api = {
    server,
    endpointUrl,
    clientUrl,
    scriptTag,
    dir: writer.dir,
    start() {
      return new Promise((resolve) => {
        server.listen(o.port, o.host, () => {
          logger.info(`[devsink] listening on ${origin}`);
          logger.info(`[devsink] writing \u2192 ${writer.dir}`);
          resolve(api);
        });
      });
    },
    stop() {
      return new Promise((resolve) => server.close(() => resolve()));
    }
  };
  return api;
}

export {
  createSinkServer
};
