import fs from 'node:fs';
import path from 'node:path';
import type { ResolvedOptions, SinkEntry, NetworkEntry, ConsoleEntry, SinkLogger } from './types';

export interface Writer {
  write(entries: SinkEntry[]): void;
  dir: string;
}

export function createWriter(root: string, o: ResolvedOptions, logger: SinkLogger): Writer {
  const dir = path.isAbsolute(o.dir) ? o.dir : path.join(root, o.dir);
  const consolePath = path.join(dir, o.consoleFile);
  const networkPath = path.join(dir, o.networkFile);

  fs.mkdirSync(dir, { recursive: true });
  if (o.clearOnStart) {
    for (const f of [consolePath, networkPath]) {
      try { fs.writeFileSync(f, ''); } catch (_) { /* ignore */ }
    }
  }
  const ignorePath = path.join(dir, '.gitignore');
  if (!fs.existsSync(ignorePath)) {
    try { fs.writeFileSync(ignorePath, '*\n'); } catch (_) { /* ignore */ }
  }

  function write(entries: SinkEntry[]): void {
    let consoleLines = '';
    let networkLines = '';
    for (const e of entries) {
      if (!e || typeof e !== 'object') continue;
      if (e.type === 'network') networkLines += JSON.stringify(e) + '\n';
      else consoleLines += JSON.stringify(e) + '\n';
      if (o.echoToTerminal) echo(e, logger);
    }
    if (consoleLines) fs.appendFile(consolePath, consoleLines, () => {});
    if (networkLines) fs.appendFile(networkPath, networkLines, () => {});
  }

  return { write, dir };
}

function echo(e: SinkEntry, logger: SinkLogger): void {
  const tag = '[devsink]';
  if (e.type === 'network') {
    const n = e as NetworkEntry;
    const status = n.error ? `ERR ${n.error}` : n.status;
    logger.info(`${tag} ${n.method} ${n.url} → ${status} (${n.duration}ms)`);
  } else if (e.type === 'console') {
    const c = e as ConsoleEntry;
    const line = `${tag} ${c.level}: ${c.args.map(stringify).join(' ')}`;
    if (c.level === 'error') logger.error(line);
    else if (c.level === 'warn') logger.warn(line);
    else logger.info(line);
  } else {
    logger.error(`${tag} ${e.type}: ${e.message}`);
  }
}

function stringify(v: unknown): string {
  if (typeof v === 'string') return v;
  try { return JSON.stringify(v); } catch { return String(v); }
}
