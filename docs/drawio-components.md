# draw.io Components Reference

Available shapes and styles for use in `.drawio` XML files.

## Shapes (`style=` values)

### Basic
| Shape | Style | Notes |
|-------|-------|-------|
| Rectangle | `rounded=0;whiteSpace=wrap;html=1;` | Default shape |
| Rounded | `rounded=1;whiteSpace=wrap;html=1;` | Rounded corners |
| Ellipse | `ellipse;whiteSpace=wrap;html=1;` | Circle/oval |
| Cylinder | `shape=cylinder3;whiteSpace=wrap;html=1;size=15;` | Database |
| Hexagon | `shape=hexagon;whiteSpace=wrap;html=1;size=0.25;` | |
| Cloud | `ellipse;shape=cloud;whiteSpace=wrap;html=1;` | |

### Technical
| Shape | Style | Notes |
|-------|-------|-------|
| Process | `shape=process;whiteSpace=wrap;html=1;size=0.1;` | Double-sided bar |
| Parallelogram | `shape=parallelogram;whiteSpace=wrap;html=1;size=0.2;` | I/O |
| Diamond | `rhombus;whiteSpace=wrap;html=1;` | Decision |
| Document | `shape=document;whiteSpace=wrap;html=1;size=0.3;` | |
| Folder | `shape=folder;whiteSpace=wrap;html=1;tabWidth=60;tabHeight=15;` | |
| Note | `shape=note;whiteSpace=wrap;html=1;size=14;` | |

### Infrastructure
| Shape | Style | Notes |
|-------|-------|-------|
| Cube | `shape=cube;whiteSpace=wrap;html=1;size=10;` | Server/3D |
| Component | `shape=component;html=1;` | UML component |
| Module | `shape=module;html=1;jetSize=auto;` | UML module |
| Datastore | `shape=datastore;whiteSpace=wrap;html=1;` | |
| Actor | `shape=umlActor;html=1;` | UML stick figure |
| Callout | `shape=callout;whiteSpace=wrap;html=1;size=20;position=0.5;` | |

### Containers
| Shape | Style | Notes |
|-------|-------|-------|
| Swimlane | `swimlane;whiteSpace=wrap;html=1;startSize=25;` | Header + body |
| Container | `rounded=1;dashed=1;container=1;collapsible=0;` | Dashed group |
| Step | `shape=step;whiteSpace=wrap;html=1;size=0.2;perimeter=stepPerimeter;` | Arrow shape |
| Tape | `shape=tape;whiteSpace=wrap;html=1;size=0.3;` | Queue |
| Trapezoid | `shape=trapezoid;whiteSpace=wrap;html=1;size=0.15;perimeter=trapezoidPerimeter;` | |

## Edge Styles

| Style | Key properties |
|-------|---------------|
| Straight | (default) |
| Orthogonal | `edgeStyle=orthogonalEdgeStyle;rounded=1;` |
| Entity relation | `edgeStyle=entityRelationEdgeStyle;` |
| Curved | `curved=1;` |
| Dashed | `dashed=1;` |
| Bidirectional | `startArrow=classic;endArrow=classic;` |
| Open arrow | `endArrow=open;endFill=0;` |

## Common Style Properties

| Property | Values | Notes |
|----------|--------|-------|
| `fillColor` | `#hex` | Background color |
| `strokeColor` | `#hex` | Border color |
| `fontColor` | `#hex` | Text color |
| `fontSize` | number | Font size in pt |
| `fontStyle` | `0`=normal, `1`=bold, `2`=italic, `3`=bold+italic | |
| `strokeWidth` | number | Border thickness |
| `opacity` | `0`-`100` | Transparency |
| `shadow` | `1` | Drop shadow |
| `glass` | `1` | Glass effect |
| `sketch` | `1` | Hand-drawn style |
| `rounded` | `1` | Round corners |
| `dashed` | `1` | Dashed border |
| `verticalAlign` | `top`/`middle`/`bottom` | |
| `align` | `left`/`center`/`right` | |

## draw.io Color Palette

| Color | Fill | Stroke | Use |
|-------|------|--------|-----|
| Blue | `#dae8fc` | `#6c8ebf` | Primary/server |
| Green | `#d5e8d4` | `#82b366` | Success/client |
| Yellow | `#fff2cc` | `#d6b656` | Warning/storage |
| Orange | `#ffe6cc` | `#d79b00` | External/embed |
| Red | `#f8cecc` | `#b85450` | Error/note |
| Purple | `#e1d5e7` | `#9673a6` | Optional/async |
| Grey | `#f5f5f5` | `#666666` | Neutral |

## draw.io Embed postMessage API

The embedded draw.io editor is controlled via `window.postMessage`. There is **no action to list available shapes** — the shape library is baked into the editor JS.

### Actions (host → draw.io iframe)

| Action | Payload | Description |
|--------|---------|-------------|
| `load` | `{action:"load", xml, autosave:1}` | Load diagram XML |
| `export` | `{action:"export", format:"svg"\|"png"\|"xmlpng"}` | Request export |
| `merge` | `{action:"merge", xml}` | Merge XML into current diagram |
| `layout` | `{action:"layout", layouts:[...]}` | Apply auto-layout |
| `configure` | `{action:"configure", config:{...}}` | Set editor config |
| `status` | `{action:"status", message}` | Show status bar text |
| `spinner` | `{action:"spinner", message, show}` | Show/hide spinner |
| `dialog` | `{action:"dialog", title, message, button}` | Show dialog |
| `template` | `{action:"template", callback:true}` | Open template picker |

### Events (draw.io iframe → host)

| Event | Payload | Description |
|-------|---------|-------------|
| `init` | `{event:"init"}` | Editor ready to receive commands |
| `export` | `{event:"export", data, format}` | Export complete (base64/SVG) |
| `autosave` | `{event:"autosave", xml}` | Diagram changed |
| `save` | `{event:"save", xml}` | User clicked Save |
| `exit` | `{event:"exit", modified}` | Editor closed |

### Configure: shape libraries

```json
{action: "configure", config: {
  defaultLibraries: "general;uml;network;aws3;azure;gcp"
}}
```

Available library keys: `general`, `uml`, `er`, `bpmn`, `flowchart`, `mindmap`, `network`, `aws3`, `aws4`, `azure`, `gcp`, `ibm`, `cisco`, `mscae`, `pid`, `electrical`, `floorplan`.

### Limitations

- No introspection: cannot query available shapes at runtime
- No validation action: malformed XML silently fails or shows empty canvas
- Implicit validation: load XML → if `autosave` event fires, it rendered successfully
