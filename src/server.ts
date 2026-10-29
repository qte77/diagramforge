import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, type WebSocket } from 'ws';
import { watch } from 'chokidar';
import { loadSnapshotConfig, snapshotPath, writeSnapshot } from './snapshot.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env['PORT'] ?? 3000);
const ROOT_DIR = resolve(__dirname, '..');
const DIAGRAMS_DIR = resolve(ROOT_DIR, 'diagrams');
const snapshot = loadSnapshotConfig(ROOT_DIR);

const clients = new Set<WebSocket>();
let pendingExport: ((data: string) => void) | null = null;
let exportQueue: Promise<unknown> = Promise.resolve();

function broadcast(msg: string) {
  for (const ws of clients) {
    if (ws.readyState === ws.OPEN) ws.send(msg);
  }
}

/** Ask the browser to export the loaded diagram; requests are serialized (one pending slot). */
function requestExport(format: string): Promise<string> {
  const run = () => new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => { pendingExport = null; reject(new Error('timeout')); }, 10_000);
    pendingExport = (data) => { clearTimeout(timer); resolve(data); };
    broadcast(JSON.stringify({ type: 'export-request', format }));
  });
  const result = exportQueue.then(run, run);
  exportQueue = result.catch(() => undefined);
  return result;
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const url = req.url ?? '/';

  if (req.method === 'GET' && url === '/') {
    const html = readFileSync(resolve(__dirname, 'index.html'), 'utf-8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }

  if (req.method === 'GET' && url === '/diagrams') {
    const files = readdirSync(DIAGRAMS_DIR)
      .filter(f => f.endsWith('.drawio'))
      .map(f => basename(f));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(files));
    return;
  }

  if (req.method === 'GET' && url.startsWith('/diagrams/')) {
    const name = decodeURIComponent(url.slice('/diagrams/'.length));
    try {
      const xml = readFileSync(resolve(DIAGRAMS_DIR, name), 'utf-8');
      res.writeHead(200, { 'Content-Type': 'application/xml' });
      res.end(xml);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
    return;
  }

  if (req.method === 'POST' && url === '/diagram') {
    const xml = await readBody(req);
    broadcast(JSON.stringify({ type: 'diagram', xml }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method === 'POST' && url === '/export') {
    const { format = 'svg' } = JSON.parse(await readBody(req)) as { format?: string };
    try {
      const data = await requestExport(format);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, format, data }));
    } catch {
      res.writeHead(504, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Export timeout — is the browser open?' }));
    }
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket) => {
  clients.add(ws);
  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString()) as { type: string; data?: string; format?: string };
      if (msg.type === 'export-result' && pendingExport) {
        pendingExport(msg.data ?? '');
        pendingExport = null;
      }
    } catch { /* ignore non-JSON */ }
  });
  ws.on('close', () => clients.delete(ws));
});

// Watch diagrams/ for .drawio file changes
// usePolling catches atomic writes (temp file + rename) that inotify misses
// chokidar v4 has no glob support: watch the folder and filter files by extension
const watcher = watch(DIAGRAMS_DIR, {
  ignoreInitial: true, usePolling: true, interval: 500,
  ignored: (path, stats) => Boolean(stats?.isFile()) && !path.endsWith('.drawio'),
});
watcher.on('all', (event, filePath) => {
  try {
    const xml = readFileSync(filePath, 'utf-8');
    broadcast(JSON.stringify({ type: 'diagram', xml }));
    console.log(`📄 ${filePath} → broadcast`);
  } catch { return; /* file may have been deleted */ }
  if (event === 'add' || event === 'change') void writeSnapshots(filePath);
});

// Export the just-broadcast diagram via the browser and write it under snapshot.outDir
async function writeSnapshots(filePath: string) {
  if (clients.size === 0) {
    console.log(`⏭️  ${filePath} → no browser connected, snapshot skipped`);
    return;
  }
  for (const format of snapshot.formats) {
    const outPath = snapshotPath(filePath, DIAGRAMS_DIR, snapshot.outDir, format);
    try {
      writeSnapshot(outPath, await requestExport(format));
      console.log(`🖼️  ${filePath} → ${outPath}`);
    } catch (err) {
      console.warn(`⚠️  snapshot ${outPath} failed: ${(err as Error).message}`);
    }
  }
}

server.listen(PORT, () => {
  console.log(`🔗 http://localhost:${PORT}`);
});
