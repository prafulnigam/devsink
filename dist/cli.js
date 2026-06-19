#!/usr/bin/env node
import {
  createSinkServer
} from "./chunk-C2TAR2Y6.js";
import "./chunk-KIWFRUVV.js";

// src/cli.ts
function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case "-h":
      case "--help":
        o.help = true;
        break;
      case "-p":
      case "--port":
        o.port = Number(next());
        break;
      case "--host":
        o.host = next();
        break;
      case "-d":
      case "--dir":
        o.dir = next();
        break;
      case "--bodies":
        o.captureBodies = true;
        break;
      case "--echo":
        o.echoToTerminal = true;
        break;
      case "--no-clear":
        o.clearOnStart = false;
        break;
    }
  }
  return o;
}
var HELP = `devsink \u2014 capture browser console + network into JSONL files

Usage:
  npx devsink [options]

Options:
  -p, --port <n>     Server port (default 9779)
      --host <h>     Bind host (default 127.0.0.1)
  -d, --dir <path>   Output directory (default .devsink)
      --bodies       Capture request/response bodies (truncated)
      --echo         Also print entries to this terminal
      --no-clear     Don't truncate files on start
  -h, --help         Show this help

Then add ONE line to your page's HTML (e.g. CRA's public/index.html):
  <script src="http://localhost:9779/__devsink/client.js"></script>
`;
async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    process.stdout.write(HELP);
    return;
  }
  const sink = createSinkServer(opts);
  await sink.start();
  process.stdout.write(`
Add this to your page's HTML:
  ${sink.scriptTag}

`);
  const shutdown = () => {
    void sink.stop().then(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
void main();
