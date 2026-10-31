import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

export const SNAPSHOT_FORMATS = ['svg', 'png'] as const;
export type SnapshotFormat = (typeof SNAPSHOT_FORMATS)[number];

export interface SnapshotConfig {
  outDir: string;
  formats: SnapshotFormat[];
}

const CONFIG_FILE = 'diagramforge.config.json';

/** Read the `snapshot` block of diagramforge.config.json; defaults to SVG in docs/diagrams/. */
export function loadSnapshotConfig(rootDir: string): SnapshotConfig {
  const file = join(rootDir, CONFIG_FILE);
  const raw = existsSync(file)
    ? (JSON.parse(readFileSync(file, 'utf-8')) as { snapshot?: { outDir?: string; formats?: string[] } }).snapshot ?? {}
    : {};
  const formats = raw.formats ?? ['svg'];
  for (const f of formats) {
    if (!(SNAPSHOT_FORMATS as readonly string[]).includes(f)) {
      throw new Error(`${CONFIG_FILE}: unsupported snapshot format "${f}" (use ${SNAPSHOT_FORMATS.join(', ')})`);
    }
  }
  return { outDir: resolve(rootDir, raw.outDir ?? 'docs/diagrams'), formats: formats as SnapshotFormat[] };
}

/** diagrams/sub/flow.drawio → <outDir>/sub/flow.<format> */
export function snapshotPath(filePath: string, diagramsDir: string, outDir: string, format: SnapshotFormat): string {
  return join(outDir, relative(diagramsDir, filePath).replace(/\.drawio$/, `.${format}`));
}

/** draw.io export events carry a data URI (base64 or URL-encoded) or raw SVG text. */
export function decodeExport(data: string): Buffer {
  const match = /^data:[^,]*?(;base64)?,/.exec(data);
  if (!match) return Buffer.from(data, 'utf-8');
  const payload = data.slice(match[0].length);
  return match[1] ? Buffer.from(payload, 'base64') : Buffer.from(decodeURIComponent(payload), 'utf-8');
}

export function writeSnapshot(outPath: string, data: string): void {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, decodeExport(data));
}
