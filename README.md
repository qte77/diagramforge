# diagramforge

Bridge server connecting Claude Code to draw.io in the browser. Live diagram rendering.

## Quick Start

```bash
npm install
npm run dev
# → http://localhost:3000
```text

## How It Works

```
Claude Code ── POST /diagram ──→ [server :3000] ── WebSocket ──→ Browser
                                       ↑                           ↓
                              watches diagrams/           draw.io iframe renders
```text

See [diagrams/architecture.drawio](diagrams/architecture.drawio) for the full architecture diagram.

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Browser UI with draw.io editor |
| GET | `/diagrams` | List available `.drawio` files |
| GET | `/diagrams/:name` | Get a `.drawio` file as XML |
| POST | `/diagram` | Push XML → browser renders |
| POST | `/export` | Export diagram as SVG/PNG |

## Docs

- [draw.io Components Reference](docs/drawio-components.md) — shapes, edges, styles, colors, postMessage API

## GitHub Pages

Same `index.html` works at [qte77.github.io/diagramforge](https://qte77.github.io/diagramforge) — WebSocket is optional, degrades to manual XML paste.
