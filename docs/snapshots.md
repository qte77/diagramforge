# Snapshots

Saving a `diagrams/*.drawio` file while a browser is connected writes an image snapshot of it,
so README images stay in sync with the source diagram — no manual export step.

1. The file watcher picks up the save and pushes the XML to the browser (as before).
2. The server asks the browser for an export (the same path as `POST /export`).
3. The result is written to `docs/diagrams/`, mirroring subfolders:
   `diagrams/sub/flow.drawio` → `docs/diagrams/sub/flow.svg`.

With no browser connected, the snapshot is skipped and logged.

## Config

Optional `diagramforge.config.json` in the repo root:

```json
{ "snapshot": { "outDir": "docs/diagrams", "formats": ["svg", "png"] } }
```

| Key | Default | Notes |
|-----|---------|-------|
| `snapshot.outDir` | `docs/diagrams` | Relative to the repo root |
| `snapshot.formats` | `["svg"]` | `svg` and/or `png`; `[]` disables snapshots |

The config is read at server start; an unknown format stops the server with an error.
