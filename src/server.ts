import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, type WebSocket } from 'ws';
import { watch } from 'chokidar';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env['PORT'] ?? 3000);
const DIAGRAMS_DIR = resolve(__dirname, '..', 'diagrams');

const clients = new Set<WebSocket>();
let pendingExport: ((data: string) => void) | null = null;

function broadcast(msg: string) {
  for (const ws of clients) {
    if (ws.readyState === ws.OPEN) ws.send(msg);
  }
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
    broadcast(JSON.stringify({ type: 'export-request', format }));
    try {
      const data = await new Promise<string>((resolve, reject) => {
        pendingExport = resolve;
        setTimeout(() => { pendingExport = null; reject(new Error('timeout')); }, 10_000);
      });
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
const watcher = watch(`${DIAGRAMS_DIR}/**/*.drawio`, { ignoreInitial: true, usePolling: true, interval: 500 });
watcher.on('all', (_event, filePath) => {
  try {
    const xml = readFileSync(filePath, 'utf-8');
    broadcast(JSON.stringify({ type: 'diagram', xml }));
    console.log(`📄 ${filePath} → broadcast`);
  } catch { /* file may have been deleted */ }
});

server.listen(PORT, () => {
  console.log(`🔗 http://localhost:${PORT}`);
});
