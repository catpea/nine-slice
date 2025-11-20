# Nine-Slice Builder Style Guide

This document describes the code conventions, patterns, and best practices used in the nine-slice.js codebase.

## Table of Contents
- [Naming Conventions](#naming-conventions)
- [Code Organization](#code-organization)
- [DOM Interfacing](#dom-interfacing)
- [Solution Patterns](#solution-patterns)
- [Event Handling](#event-handling)
- [Canvas Techniques](#canvas-techniques)

## Naming Conventions

### Variables and Functions
- **camelCase** for all variables and functions
  ```javascript
  let widgetId = 0;
  let dragState = null;
  function addWidget() { ... }
  function generateSpritesheet() { ... }
  ```

### Constants
- **UPPER_CASE** with underscores for global configuration constants
  ```javascript
  const PADDING = 2;
  const OUTER_BORDER = 1;
  const INNER_BORDER = 1;
  ```

### DOM Element References
- Suffix with element type for clarity
  ```javascript
  const loadImageBtn = document.getElementById('load-image');
  const imageInput = document.getElementById('image-input');
  const spritesheetCanvas = document.getElementById('spritesheet');
  const spritesheetCtx = spritesheetCanvas.getContext('2d');
  ```
- Common suffixes: `Btn`, `Input`, `Canvas`, `Ctx`, `Container`

### CSS Classes
- **kebab-case** for all CSS class names
  ```javascript
  element.className = 'resize-handle';
  handle.className = `resize-handle ${pos}`;
  ```

### IDs and Prefixes
- Widget IDs prefixed with 'w': `w1`, `w2`, etc.
- Element IDs use descriptive suffixes: `w1-outer`, `w1-inner`
  ```javascript
  const wid = `w${widgetId}`;
  outer.id = `${wid}-outer`;
  inner.id = `${wid}-inner`;
  ```

## Code Organization

### File Structure
1. **DOM References** - Cache all element references at the top
2. **Configuration Constants** - Global settings and magic numbers
3. **State Variables** - Mutable application state
4. **Initialization** - One-time setup code
5. **Function Definitions** - Grouped by feature/concern
6. **Event Listeners** - Registered at the bottom

### Section Dividers
Use clear comment blocks to separate logical sections:
```javascript
// -----------------------------------------------------------------
// Add widget - coordinates are for content area, borders handled internally
// -----------------------------------------------------------------
function addWidget() {
  // Implementation
}
```

### Feature Grouping
Group related functions together:
```javascript
// Drag functions
function setupDragOuter() { ... }
function setupDragInner() { ... }
function handleDragOuter() { ... }
function handleDragInner() { ... }

// Resize functions
function setupResize() { ... }
function handleResizeOuter() { ... }
function handleResizeInner() { ... }
```

## DOM Interfacing

### Element Access
- **Cache DOM references** at module initialization
- Access elements once, store references
  ```javascript
  // Good - cached at top
  const container = document.getElementById('container');
  const image = document.getElementById('main-image');

  // Avoid - repeated queries
  function doSomething() {
    document.getElementById('container').style.left = '0px';
    document.getElementById('container').style.top = '0px';
  }
  ```

### Element Creation
- Create elements programmatically for dynamic content
- Set properties immediately after creation
  ```javascript
  const outer = document.createElement('div');
  outer.className = 'widget';
  outer.id = `${wid}-outer`;
  outer.style.left = outerLeft - OUTER_BORDER + 'px';
  outer.style.top = outerTop - OUTER_BORDER + 'px';
  ```

### Style Manipulation
- Use `style` properties for positioning and sizing
- Always include units (usually `'px'`)
- Round pixel values for crisp rendering
  ```javascript
  element.style.left = Math.round(newLeft) + 'px';
  element.style.top = Math.round(newTop) + 'px';
  element.style.width = Math.round(newWidth) + 'px';
  element.style.height = Math.round(newHeight) + 'px';
  ```

### Data Attributes
- Use `dataset` for element metadata
  ```javascript
  handle.dataset.position = pos;
  // Access: handle.dataset.position
  ```

### Class Manipulation
- Use `classList` API for adding/removing classes
  ```javascript
  outer.classList.add('dragging');
  selectedWidget.classList.remove('selected');
  element.classList.contains('resize-handle')
  ```

### Measurements
- Use `getBoundingClientRect()` for accurate position/size
- Account for borders and transforms
  ```javascript
  const outerRect = outer.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const containerStyle = window.getComputedStyle(container);
  const containerBorderLeft = parseFloat(containerStyle.borderLeftWidth);
  ```

## Solution Patterns

### State Management
- Use a single state object for complex interactions
- Clear state when interaction ends
  ```javascript
  let dragState = null;

  // Set state
  dragState = {
    type: 'drag-outer',
    element: outer,
    offsetX: world.wx - worldRect.wx,
    offsetY: world.wy - worldRect.wy,
  };

  // Clear state
  dragState = null;
  ```

### Coordinate System Transformation
- Convert between screen coordinates and world coordinates
- Use helper functions from external libraries (panner-zoomer)
  ```javascript
  const world = pannerZoomer.toWorld(e.clientX, e.clientY);
  const transform = pannerZoomer.getTransform();
  const worldWidth = rect.width / transform.scale;
  ```

### Pixel-Perfect Rendering
- Always round coordinates and dimensions
- Prevents blurry rendering on canvas and DOM
  ```javascript
  const constrainedLeft = Math.round(Math.max(0, Math.min(newLeft, maxLeft)));
  const constrainedTop = Math.round(Math.max(0, Math.min(newTop, maxTop)));
  ```

### Constraint-Based Positioning
- Use `Math.max()` and `Math.min()` for bounds checking
- Apply multiple constraints in sequence
  ```javascript
  // Constrain to range [min, max]
  const constrained = Math.max(minValue, Math.min(value, maxValue));

  // Constrain inner to outer bounds
  const maxLeft = worldOuterWidth - 2 * OUTER_BORDER - worldInnerWidth - PADDING;
  const constrainedLeft = Math.round(Math.max(PADDING, Math.min(newLeft, maxLeft)));
  ```

### Object Pool Pattern
- Maintain array of active objects
- Store both DOM references and metadata
  ```javascript
  const widgets = [];

  widgets.push({
    id: wid,
    outer: outer,
    inner: inner,
  });
  ```

### Temporary Element Hiding
- Hide elements that interfere with measurements
- Restore visibility after measurement
  ```javascript
  const allHandles = document.querySelectorAll('.resize-handle');
  allHandles.forEach(handle => handle.style.visibility = 'hidden');

  // ... perform measurements ...

  allHandles.forEach(handle => handle.style.visibility = 'visible');
  ```

### File Download Pattern
- Use Blob API with temporary URLs
- Clean up URLs after download
  ```javascript
  spritesheetCanvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spritesheet.png';
    a.click();
    URL.revokeObjectURL(url);
  });
  ```

### File Loading Pattern
- Use FileReader API for local files
- Handle both binary and text data
  ```javascript
  function loadImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      image.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
  ```

## Event Handling

### Pointer Events
- Use pointer events instead of mouse events
- Better cross-device compatibility (mouse, touch, pen)
  ```javascript
  element.addEventListener('pointerdown', (e) => { ... });
  document.addEventListener('pointermove', (e) => { ... });
  document.addEventListener('pointerup', () => { ... });
  ```

### Event Propagation Control
- Use `preventDefault()` to stop default behavior
- Use `stopPropagation()` to prevent event bubbling
- Apply both when handling drag/resize operations
  ```javascript
  element.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    // ... handle event
  });
  ```

### Event Delegation
- Check event target before handling
- Allows events on dynamically created elements
  ```javascript
  outer.addEventListener('pointerdown', (e) => {
    // Only drag if clicking on the widget itself
    if (e.target.classList.contains('resize-handle')) return;
    if (e.target !== outer) return;
    // ... handle drag
  });
  ```

### Event Registration Timing
- Register global event listeners at module level
- Register element-specific listeners after element creation
- Use conditional checks for events that fire before state is ready
  ```javascript
  document.addEventListener('pointermove', (e) => {
    if (!dragState) return;
    // ... handle move
  });
  ```

### Keyboard Events
- Check for focused input elements before handling
- Prevent default only when actually handling the event
  ```javascript
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      e.preventDefault();
      deleteSelectedWidget();
    }
  });
  ```

## Canvas Techniques

### Context Configuration
- Specify options at context creation
- Disable image smoothing for pixel art
  ```javascript
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  ctx.imageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;
  ```

### Temporary Canvas Pattern
- Create temporary canvases for intermediate operations
- Prevents contaminating the main canvas
  ```javascript
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

  tempCanvas.width = width;
  tempCanvas.height = height;
  tempCtx.drawImage(image, sourceX, sourceY, width, height, 0, 0, width, height);
  ```

### ImageData Extraction
- Use `getImageData()` to extract pixel data
- Use `putImageData()` to write pixel data
  ```javascript
  const imageData = ctx.getImageData(0, 0, width, height);
  // ... store or process imageData ...
  ctx.putImageData(imageData, x, y);
  ```

### Pixel-Perfect Canvas Drawing
- Clear before drawing to prevent artifacts
- Use integer coordinates
  ```javascript
  canvas.width = Math.round(width);
  canvas.height = Math.round(height);
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(source, Math.round(x), Math.round(y));
  ```

## Additional Best Practices

### Defensive Coding
- Validate state before operations
  ```javascript
  if (widgets.length === 0) {
    alert('Please add at least one widget first!');
    return;
  }
  ```

### Console Logging
- Log significant events with structured data
- Include context and measurements for debugging
  ```javascript
  console.log(`Widget ${index + 1} - Extraction:`, {
    extractedSize: `${width}x${height}`,
    innerPos: `(${innerLeft}, ${innerTop})`,
    slices: `${topSlice} ${rightSlice} ${bottomSlice} ${leftSlice}`,
  });
  ```

### Comments
- Section headers explain purpose
- Inline comments explain non-obvious calculations
- CRITICAL warnings for important gotchas
  ```javascript
  // CRITICAL: Hide all resize handles to prevent them from affecting getBoundingClientRect()
  // Handles extend 5px beyond box edges and would cause 3-5px offset in measurements
  ```

### Magic Numbers
- Extract to named constants
- Document units and purpose
  ```javascript
  const PADDING = 2;        // padding between inner and outer (globally configurable)
  const OUTER_BORDER = 1;   // outer box border width in pixels
  const INNER_BORDER = 1;   // inner box border width in pixels
  ```
