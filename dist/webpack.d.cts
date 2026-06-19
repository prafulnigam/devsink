import { D as DevSinkOptions } from './types-LIOtQ_5I.cjs';

interface WebpackEntryPlugin {
    new (context: string, entry: string, options: {
        name?: string;
    }): {
        apply(compiler: WebpackCompiler): void;
    };
}
interface WebpackCompiler {
    context: string;
    options: {
        mode?: string;
    };
    webpack?: {
        EntryPlugin?: WebpackEntryPlugin;
    };
    hooks?: {
        watchClose?: {
            tap(name: string, fn: () => void): void;
        };
    };
}
/**
 * Webpack plugin for setups where you can edit the webpack config (custom
 * webpack, Rspack, or CRA via CRACO / react-app-rewired). It injects the
 * capture client as a global entry and starts a local ingest server
 * automatically — one extra background process, no manual script tag.
 *
 * For Create React App WITHOUT ejecting/CRACO, use the standalone CLI instead.
 */
declare class WebpackDevSink {
    private options;
    private started;
    private sink?;
    constructor(options?: DevSinkOptions);
    apply(compiler: WebpackCompiler): void;
}

export { WebpackDevSink, WebpackDevSink as default };
