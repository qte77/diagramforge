# diagramforge

Bridge server connecting Claude Code to draw.io in the browser. Claude POSTs XML → server pushes via WebSocket → draw.io iframe renders live.

## API

- `POST /diagram` — XML body → pushes to browser, diagram renders
- `POST /export` — `{"format":"svg"}` → returns `{"data":"<svg>..."}`
- Write to `diagrams/*.drawio` → auto-detected and pushed

## draw.io XML Format

```xml
<mxfile>
  <diagram name="Page-1" id="id1">
    <mxGraphModel>
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        <!-- vertices and edges here -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

- Cells `id="0"` and `id="1" parent="0"` are **mandatory**
- Vertex: `<mxCell id="2" value="Label" vertex="1" parent="1" style="rounded=1;whiteSpace=wrap;html=1;"><mxGeometry x="100" y="100" width="120" height="60" as="geometry"/></mxCell>`
- Edge: `<mxCell id="3" edge="1" source="2" target="4" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell>`
- All IDs unique, edge `source`/`target` must reference existing cells
- Style: `key=value;` pairs (e.g. `rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;`)

## Dev

```bash
npm run dev    # tsx watch
npm run check  # tsc --noEmit
npm run build  # tsc → dist/
npm start      # node dist/server.js
```
