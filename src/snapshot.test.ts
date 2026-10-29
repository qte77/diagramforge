import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decodeExport, loadSnapshotConfig, snapshotPath, writeSnapshot } from './snapshot.js';

const tmp = () => mkdtempSync(join(tmpdir(), 'diagramforge-'));

test('loadSnapshotConfig defaults to SVG in docs/diagrams when no config file exists', () => {
  const root = tmp();
  assert.deepEqual(loadSnapshotConfig(root), { outDir: join(root, 'docs', 'diagrams'), formats: ['svg'] });
});

test('loadSnapshotConfig reads outDir and formats from diagramforge.config.json', () => {
  const root = tmp();
  writeFileSync(join(root, 'diagramforge.config.json'), JSON.stringify({ snapshot: { outDir: 'img', formats: ['svg', 'png'] } }));
  assert.deepEqual(loadSnapshotConfig(root), { outDir: join(root, 'img'), formats: ['svg', 'png'] });
});

test('loadSnapshotConfig rejects unknown formats', () => {
  const root = tmp();
  writeFileSync(join(root, 'diagramforge.config.json'), JSON.stringify({ snapshot: { formats: ['gif'] } }));
  assert.throws(() => loadSnapshotConfig(root), /gif/);
});

test('snapshotPath mirrors the path below diagrams/ and swaps the extension', () => {
  assert.equal(snapshotPath('/r/diagrams/sub/flow.drawio', '/r/diagrams', '/r/docs/diagrams', 'svg'), '/r/docs/diagrams/sub/flow.svg');
});

test('decodeExport decodes base64 and URL-encoded data URIs and passes raw SVG through', () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"/>';
  assert.equal(decodeExport(`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`).toString(), svg);
  assert.equal(decodeExport(`data:image/svg+xml,${encodeURIComponent(svg)}`).toString(), svg);
  assert.equal(decodeExport(svg).toString(), svg);
});

test('writeSnapshot creates missing directories and writes the decoded bytes', () => {
  const out = join(tmp(), 'a', 'b.png');
  writeSnapshot(out, `data:image/png;base64,${Buffer.from([0x89, 0x50]).toString('base64')}`);
  assert.deepEqual([...readFileSync(out)], [0x89, 0x50]);
});
