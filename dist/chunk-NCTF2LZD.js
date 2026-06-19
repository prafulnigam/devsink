import {
  createSinkServer
} from "./chunk-C2TAR2Y6.js";
import {
  consoleLogger,
  generateClientCode,
  resolveOptions
} from "./chunk-KIWFRUVV.js";

// src/webpack.ts
import fs from "fs";
import os from "os";
import path from "path";
var WebpackDevSink = class {
  constructor(options = {}) {
    this.started = false;
    this.options = options;
  }
  apply(compiler) {
    const o = resolveOptions(this.options);
    const isDev = (compiler.options.mode ?? "production") !== "production";
    if (!o.enabled || !isDev) return;
    if (!this.started) {
      this.started = true;
      this.sink = createSinkServer(this.options, compiler.context, consoleLogger);
      void this.sink.start();
      const clientCode = generateClientCode(o, this.sink.endpointUrl);
      const file = path.join(os.tmpdir(), `devsink-client-${process.pid}.js`);
      try {
        fs.writeFileSync(file, clientCode);
      } catch {
      }
      const EntryPlugin = compiler.webpack?.EntryPlugin;
      if (EntryPlugin) {
        new EntryPlugin(compiler.context, file, { name: void 0 }).apply(compiler);
      } else {
        consoleLogger.warn(
          "[devsink] webpack 5 EntryPlugin not found. Add " + file + " to your entry manually, or use the standalone CLI + <script> tag instead."
        );
      }
      compiler.hooks?.watchClose?.tap("devsink", () => {
        void this.sink?.stop();
      });
    }
  }
};
var webpack_default = WebpackDevSink;

export {
  WebpackDevSink,
  webpack_default
};
