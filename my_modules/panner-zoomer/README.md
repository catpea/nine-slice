# PannerZoomer Web Component

A lightweight, high-performance panner zoomer container built as a native web component. Zero dependencies, works everywhere, and fundamental to modern web applications.

## Features

- **Pure Web Components** - No framework required, works with vanilla JS, React, Vue, Angular, etc.
- **Accurate Coordinate Transformations** - Precise world-to-screen and screen-to-world conversions
- **Industry-Standard Zoom** - Cursor stays locked to the same point (like Google Maps, Figma)
- **Smooth Panning** - Native pointer events for responsive interaction
- **Programmatic Control** - Full API for controlling pan and zoom
- **Reactive Attributes** - `panx`, `pany`, and `zoom` attributes update in real-time
- **Built-in Controls** - Optional control panel component with customizable placement
- **Comprehensive Tests** - Built-in test suite for mathematical correctness

## Quick Start

### Basic Usage

The simplest way to get started - just wrap your content:

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        panner-zoomer {
            display: block;
            width: 100%;
            height: 100vh;
            background: #f0f0f0;
        }
    </style>
</head>
<body>
    <script type="module" src="panner-zoomer.js"></script>

    <panner-zoomer>
        <img src="your-image.jpg" alt="Zoomable image">
    </panner-zoomer>
</body>
</html>
```

### With Controls

Add the built-in control panel for zoom in, zoom out, and reset:

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        panner-zoomer {
            display: block;
            width: 100%;
            height: 100vh;
            background: #f0f0f0;
        }
    </style>
</head>
<body>
    <script type="module" src="panner-zoomer.js"></script>

    <panner-zoomer-controls target="viewer" placement="ne"></panner-zoomer-controls>

    <panner-zoomer id="viewer">
        <img src="your-image.jpg" alt="Zoomable image">
    </panner-zoomer>
</body>
</html>
```

**Control Placement Options:**
- `ne` - Northeast (top-right) - default
- `nw` - Northwest (top-left)
- `se` - Southeast (bottom-right)
- `sw` - Southwest (bottom-left)

### Interactive Canvas

Make elements draggable within the panner-zoomer space:

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        panner-zoomer {
            display: block;
            width: 100%;
            height: 100vh;
            background: #2a2a2a;
        }

        .draggable-box {
            position: absolute;
            width: 100px;
            height: 100px;
            background: #4a9eff;
            border-radius: 8px;
            cursor: grab;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }

        .draggable-box:active {
            cursor: grabbing;
        }
    </style>
</head>
<body>
    <script type="module" src="panner-zoomer.js"></script>

    <panner-zoomer-controls target="canvas" placement="ne"></panner-zoomer-controls>

    <panner-zoomer id="canvas">
        <div class="draggable-box" style="left: 100px; top: 100px;">Drag me!</div>
    </panner-zoomer>

    <script>
        const pz = document.getElementById('canvas');
        const box = document.querySelector('.draggable-box');

        let isDragging = false;
        let offsetX = 0, offsetY = 0;

        box.addEventListener('pointerdown', e => {
            e.stopPropagation(); // Prevent panner-zoomer from panning
            isDragging = true;

            const currentX = parseFloat(box.style.left) || 0;
            const currentY = parseFloat(box.style.top) || 0;
            const world = pz.toWorld(e.clientX, e.clientY);

            offsetX = world.wx - currentX;
            offsetY = world.wy - currentY;

            box.setPointerCapture(e.pointerId);
        });

        box.addEventListener('pointermove', e => {
            if (!isDragging) return;

            const world = pz.toWorld(e.clientX, e.clientY);
            box.style.left = `${world.wx - offsetX}px`;
            box.style.top = `${world.wy - offsetY}px`;
        });

        box.addEventListener('pointerup', e => {
            isDragging = false;
            box.releasePointerCapture(e.pointerId);
        });
    </script>
</body>
</html>
```

### Programmatic Control

Control pan and zoom via JavaScript:

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        panner-zoomer {
            display: block;
            width: 100%;
            height: 100vh;
            background: #f0f0f0;
        }

        .custom-controls {
            position: fixed;
            top: 20px;
            left: 20px;
            display: flex;
            gap: 10px;
        }

        button {
            padding: 10px 20px;
            background: #4a9eff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <script type="module" src="panner-zoomer.js"></script>

    <div class="custom-controls">
        <button onclick="zoomToCenter()">Zoom to Center</button>
        <button onclick="panToCorner()">Pan to Corner</button>
        <button onclick="resetView()">Reset</button>
    </div>

    <panner-zoomer id="viewer">
        <img src="your-image.jpg" alt="Zoomable image" style="position: absolute;">
    </panner-zoomer>

    <script>
        const pz = document.getElementById('viewer');

        function zoomToCenter() {
            // Zoom to 2x at world coordinates (500, 500)
            pz.zoomToPoint(2, 500, 500);
        }

        function panToCorner() {
            // Pan to show top-left corner
            pz.setPan(0, 0);
        }

        function resetView() {
            // Reset to initial state
            pz.reset();
        }
    </script>
</body>
</html>
```

### Initial State via Attributes

Set initial pan and zoom using HTML attributes:

```html
<panner-zoomer id="viewer" panx="100" pany="-50" zoom="2">
    <img src="your-image.jpg" alt="Zoomable image">
</panner-zoomer>
```

The attributes automatically update as users interact:

```html
<script>
    const pz = document.getElementById('viewer');

    // Watch for changes
    const observer = new MutationObserver(() => {
        console.log('Pan X:', pz.getAttribute('panx'));
        console.log('Pan Y:', pz.getAttribute('pany'));
        console.log('Zoom:', pz.getAttribute('zoom'));
    });

    observer.observe(pz, { attributes: true });
</script>
```

### Listen to Events

React to pan and zoom changes:

```html
<script>
    const pz = document.getElementById('viewer');

    // Listen to all transform changes (pan or zoom)
    pz.addEventListener('panner-zoomer-transform', (e) => {
        console.log('Transform:', e.detail);
        // { scale: 1.5, panX: 100, panY: 50 }
    });

    // Listen to specific events
    pz.addEventListener('panner-zoomer-pointerdown', (e) => {
        console.log('Pan started at:', e.detail.wx, e.detail.wy);
    });

    pz.addEventListener('panner-zoomer-wheel', (e) => {
        console.log('Zoom:', e.detail.oldScale, '->', e.detail.newScale);
    });
</script>
```

## API Reference

### `<panner-zoomer>` Element

#### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `panx` | number | `0` | Horizontal pan offset (updates automatically) |
| `pany` | number | `0` | Vertical pan offset (updates automatically) |
| `zoom` | number | `1` | Zoom level (updates automatically) |

#### Methods

##### `setPan(x, y)`
Set the pan position.

```javascript
pz.setPan(100, 50);
```

**Parameters:**
- `x` (number) - Horizontal pan offset in pixels
- `y` (number) - Vertical pan offset in pixels

---

##### `setZoom(scale)`
Set the zoom level.

```javascript
pz.setZoom(2); // 2x zoom
```

**Parameters:**
- `scale` (number) - Zoom scale (must be between minScale and maxScale)

---

##### `zoomToPoint(scale, worldX, worldY)`
Zoom to a specific world coordinate, centering it in the viewport.

```javascript
pz.zoomToPoint(2, 500, 300);
```

**Parameters:**
- `scale` (number) - Target zoom scale
- `worldX` (number) - World X coordinate to center
- `worldY` (number) - World Y coordinate to center

---

##### `reset()`
Reset to initial state (zoom=1, pan=0,0).

```javascript
pz.reset();
```

---

##### `getTransform()`
Get current transform state.

```javascript
const { scale, panX, panY } = pz.getTransform();
console.log(`Zoom: ${scale}, Pan: (${panX}, ${panY})`);
```

**Returns:** `{ scale: number, panX: number, panY: number }`

---

##### `toWorld(screenX, screenY)`
Convert screen coordinates to world coordinates.

```javascript
const world = pz.toWorld(event.clientX, event.clientY);
console.log(`World position: (${world.wx}, ${world.wy})`);
```

**Parameters:**
- `screenX` (number) - Screen X coordinate (e.g., from clientX)
- `screenY` (number) - Screen Y coordinate (e.g., from clientY)

**Returns:** `{ wx: number, wy: number }`

---

##### `toScreen(worldX, worldY)`
Convert world coordinates to screen coordinates.

```javascript
const screen = pz.toScreen(100, 200);
console.log(`Screen position: (${screen.sx}, ${screen.sy})`);
```

**Parameters:**
- `worldX` (number) - World X coordinate
- `worldY` (number) - World Y coordinate

**Returns:** `{ sx: number, sy: number }`

---

##### `setZoomLimits(min, max)`
Set minimum and maximum zoom levels.

```javascript
pz.setZoomLimits(0.5, 5); // Allow 0.5x to 5x zoom
```

**Parameters:**
- `min` (number) - Minimum zoom scale (default: 0.1)
- `max` (number) - Maximum zoom scale (default: 10)

---

##### `runTests()`
Run built-in test suite to verify mathematical correctness.

```javascript
const allPassed = pz.runTests();
console.log('Tests passed:', allPassed);
```

**Returns:** `boolean` - true if all tests passed

---

#### Events

All events include detailed information in `event.detail`.

##### `panner-zoomer-transform`
Fired whenever the transform changes (pan or zoom).

```javascript
pz.addEventListener('panner-zoomer-transform', (e) => {
    console.log(e.detail.scale);  // Current zoom
    console.log(e.detail.panX);   // Current pan X
    console.log(e.detail.panY);   // Current pan Y
});
```

**Detail:** `{ scale: number, panX: number, panY: number }`

---

##### `panner-zoomer-pointerdown`
Fired when panning starts.

```javascript
pz.addEventListener('panner-zoomer-pointerdown', (e) => {
    console.log('Clicked at world:', e.detail.wx, e.detail.wy);
});
```

**Detail:**
```typescript
{
    wx: number,        // World X coordinate
    wy: number,        // World Y coordinate
    screenX: number,   // Screen X coordinate
    screenY: number,   // Screen Y coordinate
    viewportX: number, // Viewport-relative X
    viewportY: number, // Viewport-relative Y
    scale: number,     // Current zoom
    panX: number,      // Current pan X
    panY: number       // Current pan Y
}
```

---

##### `panner-zoomer-pointermove`
Fired during panning.

```javascript
pz.addEventListener('panner-zoomer-pointermove', (e) => {
    console.log('Panning to:', e.detail.wx, e.detail.wy);
});
```

**Detail:** Same as `panner-zoomer-pointerdown`

---

##### `panner-zoomer-pointerup`
Fired when panning ends.

```javascript
pz.addEventListener('panner-zoomer-pointerup', (e) => {
    console.log('Panning ended');
});
```

**Detail:** Same as `panner-zoomer-pointerdown`

---

##### `panner-zoomer-wheel`
Fired during zoom (mouse wheel).

```javascript
pz.addEventListener('panner-zoomer-wheel', (e) => {
    console.log('Zoomed from', e.detail.oldScale, 'to', e.detail.newScale);
});
```

**Detail:**
```typescript
{
    wx: number,        // World coordinates under cursor
    wy: number,
    screenX: number,   // Screen coordinates
    screenY: number,
    viewportX: number, // Viewport-relative coordinates
    viewportY: number,
    scale: number,     // Current zoom (same as newScale)
    panX: number,      // Current pan
    panY: number,
    oldScale: number,  // Zoom level before
    newScale: number   // Zoom level after
}
```

---

### `<panner-zoomer-controls>` Element

#### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `target` | string | - | ID of the panner-zoomer element to control (required) |
| `placement` | string | `"ne"` | Position: `"ne"`, `"nw"`, `"se"`, or `"sw"` |

#### Example

```html
<!-- Top-right corner (default) -->
<panner-zoomer-controls target="viewer" placement="ne"></panner-zoomer-controls>

<!-- Bottom-left corner -->
<panner-zoomer-controls target="viewer" placement="sw"></panner-zoomer-controls>
```

---

## Use Cases

### Image Viewer
```html
<panner-zoomer id="viewer">
    <img src="large-image.jpg" style="position: absolute;">
</panner-zoomer>
```

### Interactive Map
```html
<panner-zoomer id="map">
    <svg viewBox="0 0 1000 1000" style="position: absolute;">
        <!-- SVG map content -->
    </svg>
</panner-zoomer>
```

### Diagram Editor
```html
<panner-zoomer id="editor">
    <div class="canvas">
        <!-- Draggable nodes, connections, etc. -->
    </div>
</panner-zoomer>
```

### Photo Gallery
```html
<panner-zoomer id="gallery">
    <div style="position: relative; width: 2000px; height: 2000px;">
        <img src="photo1.jpg" style="position: absolute; left: 0; top: 0;">
        <img src="photo2.jpg" style="position: absolute; left: 500px; top: 0;">
        <!-- More photos... -->
    </div>
</panner-zoomer>
```

---

## Browser Support

Works in all modern browsers that support:
- Web Components (Custom Elements v1)
- Shadow DOM v1
- Pointer Events

This includes Chrome, Firefox, Safari, and Edge.

---

## License

ISC

---

## Why PannerZoomer is Fundamental to the Web

Panner and zoomer interactions are core to modern web applications:

- **Image viewers** - View high-resolution images
- **Maps** - Navigate geographic data (Google Maps, OpenStreetMap)
- **Diagrams** - Explore flowcharts, org charts, network graphs
- **Design tools** - Create and edit visual content (Figma, Miro)
- **Data visualization** - Explore large datasets and dashboards
- **CAD/Engineering** - View technical drawings and schematics
- **Games** - Navigate game worlds and strategy maps

This component provides a rock-solid foundation for any panner-zoomer interface, with accurate math and industry-standard behavior.
