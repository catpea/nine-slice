
const container = document.getElementById('container');
const image = document.getElementById('main-image');
const pannerZoomer = image.closest('panner-zoomer');

const loadImageBtn = document.getElementById('load-image');
const loadWidgetsBtn = document.getElementById('load-widgets');
const saveWidgetsBtn = document.getElementById('save-widgets');
const imageInput = document.getElementById('image-input');
const widgetsInput = document.getElementById('widgets-input');
const addBtn = document.getElementById('add-widget');
const clearWidgetsBtn = document.getElementById('clear-widgets');
const generateBtn = document.getElementById('generate-spritesheet');
const saveSpriteBtn = document.getElementById('save-spritesheet');
const saveStyleBtn = document.getElementById('save-stylesheet');
const saveShellBtn = document.getElementById('save-shell');
const saveJsonBtn = document.getElementById('save-json');
const copyBtn = document.getElementById('copy-css');
const output = document.getElementById('output');
const previewContainer = document.getElementById('preview-container');
const spritesheetCanvas = document.getElementById('spritesheet');
const spritesheetCtx = spritesheetCanvas.getContext('2d', { willReadFrequently: true });

setTimeout(()=>{
console.log('panner-zoomer transform:', pannerZoomer.getTransform())

}, 1000)

// Disable image smoothing for pixel-perfect rendering
spritesheetCtx.imageSmoothingEnabled = false;
spritesheetCtx.webkitImageSmoothingEnabled = false;
spritesheetCtx.mozImageSmoothingEnabled = false;
spritesheetCtx.msImageSmoothingEnabled = false;

let widgetId = 0;
let dragState = null;
let selectedWidget = null; // Track most recently clicked widget
const widgets = [];
const PADDING = 2; // padding between inner and outer (globally configurable)
const OUTER_BORDER = 1; // outer box border width in pixels
const INNER_BORDER = 1; // inner box border width in pixels

// Ensure image is shown at natural size
image.style.width = 'auto';
image.style.height = 'auto';

// Log image dimensions when loaded
image.addEventListener('load', () => {
  console.log('Source image loaded:', {
    naturalSize: `${image.naturalWidth}x${image.naturalHeight}`,
    displaySize: `${image.width}x${image.height}`,
  });
});

// -----------------------------------------------------------------
// Add resize handles
// -----------------------------------------------------------------
function addResizeHandles(element) {
  const positions = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];
  positions.forEach((pos) => {
    const handle = document.createElement('div');
    handle.className = `resize-handle ${pos}`;
    handle.dataset.position = pos;
    element.appendChild(handle);
  });
}

// -----------------------------------------------------------------
// Add widget - coordinates are for content area, borders handled internally
// -----------------------------------------------------------------
function addWidget({ outerLeft = 50, outerTop = 50, outerWidth = 200, outerHeight = 200, innerLeft = 50, innerTop = 50, innerWidth = 100, innerHeight = 100 } = {}) {
  widgetId++;
  const wid = `w${widgetId}`;

  // Outer widget (red) - draggable and resizable
  const outer = document.createElement('div');
  outer.className = 'widget';
  outer.id = `${wid}-outer`;
  outer.style.left = outerLeft - OUTER_BORDER + 'px';
  outer.style.top = outerTop - OUTER_BORDER + 'px';
  outer.style.width = outerWidth + 2 * OUTER_BORDER + 'px';
  outer.style.height = outerHeight + 2 * OUTER_BORDER + 'px';

  // Label
  const label = document.createElement('div');
  label.className = 'widget-label';
  label.textContent = `Widget ${widgetId}`;
  outer.appendChild(label);

  // Add resize handles to outer
  addResizeHandles(outer);

  // Inner widget (blue) - draggable and resizable
  const inner = document.createElement('div');
  inner.className = 'inner';
  inner.id = `${wid}-inner`;
  inner.style.left = innerLeft - INNER_BORDER + 'px';
  inner.style.top = innerTop - INNER_BORDER + 'px';
  inner.style.width = innerWidth + 2 * INNER_BORDER + 'px';
  inner.style.height = innerHeight + 2 * INNER_BORDER + 'px';

  // Add resize handles to inner
  addResizeHandles(inner);

  outer.appendChild(inner);
  container.appendChild(outer);

  // Store widget data
  widgets.push({
    id: wid,
    outer: outer,
    inner: inner,
  });

  // Setup interactions
  setupDragOuter(outer, inner);
  setupDragInner(inner, outer);
  setupResize(outer, inner);
}

// -----------------------------------------------------------------
// Setup drag for outer (red) - moves entire widget
// -----------------------------------------------------------------
function setupDragOuter(outer, inner) {
  outer.addEventListener('pointerdown', (e) => {
    // Select this widget
    selectWidget(outer);

    // Only drag if clicking on the widget itself, not handles or inner
    if (e.target.classList.contains('resize-handle')) return;
    if (e.target !== outer) return;

    e.preventDefault();
    e.stopPropagation();

    // Convert screen coordinates to world coordinates
    const world = pannerZoomer.toWorld(e.clientX, e.clientY);
    const rect = outer.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Calculate offset in world coordinates
    const worldRect = pannerZoomer.toWorld(rect.left, rect.top);

    dragState = {
      type: 'drag-outer',
      element: outer,
      inner: inner,
      offsetX: world.wx - worldRect.wx,
      offsetY: world.wy - worldRect.wy,
      containerWidth: containerRect.width,
      containerHeight: containerRect.height,
    };

    outer.classList.add('dragging');
  });
}

// -----------------------------------------------------------------
// Setup drag for inner (blue) - moves only blue within red
// -----------------------------------------------------------------
function setupDragInner(inner, outer) {
  inner.addEventListener('pointerdown', (e) => {
    // Only drag if clicking on the inner itself, not handles
    if (e.target.classList.contains('resize-handle')) return;
    if (e.target !== inner) return;

    e.preventDefault();
    e.stopPropagation();

    // Convert screen coordinates to world coordinates
    const world = pannerZoomer.toWorld(e.clientX, e.clientY);
    const innerRect = inner.getBoundingClientRect();
    const outerRect = outer.getBoundingClientRect();

    // Calculate offset in world coordinates
    const worldInnerRect = pannerZoomer.toWorld(innerRect.left, innerRect.top);
    const worldOuterRect = pannerZoomer.toWorld(outerRect.left, outerRect.top);

    dragState = {
      type: 'drag-inner',
      element: inner,
      outer: outer,
      offsetX: world.wx - worldInnerRect.wx,
      offsetY: world.wy - worldInnerRect.wy,
      outerLeft: worldOuterRect.wx,
      outerTop: worldOuterRect.wy,
      outerWidth: outerRect.width,
      outerHeight: outerRect.height,
    };

    inner.classList.add('dragging');
  });
}

// -----------------------------------------------------------------
// Setup resize
// -----------------------------------------------------------------
function setupResize(outer, inner) {
  // Setup outer resize handles
  outer.querySelectorAll('.resize-handle').forEach((handle) => {
    handle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Convert screen coordinates to world coordinates
      const world = pannerZoomer.toWorld(e.clientX, e.clientY);
      const outerRect = outer.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      dragState = {
        type: 'resize-outer',
        element: outer,
        inner: inner,
        position: handle.dataset.position,
        startWorldX: world.wx,
        startWorldY: world.wy,
        startLeft: parseFloat(outer.style.left),
        startTop: parseFloat(outer.style.top),
        startWidth: outerRect.width,
        startHeight: outerRect.height,
        containerWidth: containerRect.width,
        containerHeight: containerRect.height,
        // Store inner's absolute position to keep it still
        innerLeft: parseFloat(inner.style.left),
        innerTop: parseFloat(inner.style.top),
      };
    });
  });

  // Setup inner resize handles
  inner.querySelectorAll('.resize-handle').forEach((handle) => {
    handle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Convert screen coordinates to world coordinates
      const world = pannerZoomer.toWorld(e.clientX, e.clientY);
      const innerRect = inner.getBoundingClientRect();
      const outerRect = outer.getBoundingClientRect();

      dragState = {
        type: 'resize-inner',
        element: inner,
        outer: outer,
        position: handle.dataset.position,
        startWorldX: world.wx,
        startWorldY: world.wy,
        startLeft: parseFloat(inner.style.left),
        startTop: parseFloat(inner.style.top),
        startWidth: innerRect.width,
        startHeight: innerRect.height,
        outerWidth: outerRect.width,
        outerHeight: outerRect.height,
      };
    });
  });
}

// -----------------------------------------------------------------
// Pointer move handler
// -----------------------------------------------------------------
document.addEventListener('pointermove', (e) => {
  if (!dragState) return;

  e.preventDefault();

  if (dragState.type === 'drag-outer') {
    handleDragOuter(e);
  } else if (dragState.type === 'drag-inner') {
    handleDragInner(e);
  } else if (dragState.type === 'resize-outer') {
    handleResizeOuter(e);
  } else if (dragState.type === 'resize-inner') {
    handleResizeInner(e);
  }
});

// -----------------------------------------------------------------
// Pointer up handler
// -----------------------------------------------------------------
document.addEventListener('pointerup', () => {
  if (dragState && dragState.element) {
    dragState.element.classList.remove('dragging');
  }
  dragState = null;
});

// -----------------------------------------------------------------
// Handle drag outer (moves entire widget)
// -----------------------------------------------------------------
function handleDragOuter(e) {
  // Convert current pointer position to world coordinates
  const world = pannerZoomer.toWorld(e.clientX, e.clientY);

  // Calculate new position in world coordinates (which map to container pixels)
  const newLeft = world.wx - dragState.offsetX;
  const newTop = world.wy - dragState.offsetY;

  // Get element dimensions from getBoundingClientRect and convert to world space
  const rect = dragState.element.getBoundingClientRect();
  const transform = pannerZoomer.getTransform();
  const worldWidth = rect.width / transform.scale;
  const worldHeight = rect.height / transform.scale;
  const worldContainerWidth = dragState.containerWidth / transform.scale;
  const worldContainerHeight = dragState.containerHeight / transform.scale;

  // Constrain to container and round to pixels
  const constrainedLeft = Math.round(Math.max(0, Math.min(newLeft, worldContainerWidth - worldWidth)));
  const constrainedTop = Math.round(Math.max(0, Math.min(newTop, worldContainerHeight - worldHeight)));

  dragState.element.style.left = constrainedLeft + 'px';
  dragState.element.style.top = constrainedTop + 'px';
}

// -----------------------------------------------------------------
// Handle drag inner (moves blue within red)
// -----------------------------------------------------------------
function handleDragInner(e) {
  // Convert current pointer position to world coordinates
  const world = pannerZoomer.toWorld(e.clientX, e.clientY);

  // Calculate new position relative to outer element
  const newLeft = world.wx - dragState.outerLeft - dragState.offsetX;
  const newTop = world.wy - dragState.outerTop - dragState.offsetY;

  // Get element dimensions from getBoundingClientRect and convert to world space
  const innerRect = dragState.element.getBoundingClientRect();
  const transform = pannerZoomer.getTransform();
  const worldInnerWidth = innerRect.width / transform.scale;
  const worldInnerHeight = innerRect.height / transform.scale;
  const worldOuterWidth = dragState.outerWidth / transform.scale;
  const worldOuterHeight = dragState.outerHeight / transform.scale;

  // Constrain to outer bounds with padding (account for outer border)
  // Available space = outerWidth - 2*OUTER_BORDER (for left and right borders)
  const maxLeft = worldOuterWidth - 2 * OUTER_BORDER - worldInnerWidth - PADDING;
  const maxTop = worldOuterHeight - 2 * OUTER_BORDER - worldInnerHeight - PADDING;

  const constrainedLeft = Math.round(Math.max(PADDING, Math.min(newLeft, maxLeft)));
  const constrainedTop = Math.round(Math.max(PADDING, Math.min(newTop, maxTop)));

  dragState.element.style.left = constrainedLeft + 'px';
  dragState.element.style.top = constrainedTop + 'px';
}

// -----------------------------------------------------------------
// Handle resize outer (blue stays in absolute position)
// -----------------------------------------------------------------
function handleResizeOuter(e) {
  // Convert current pointer position to world coordinates
  const world = pannerZoomer.toWorld(e.clientX, e.clientY);
  const transform = pannerZoomer.getTransform();

  // Calculate delta in world coordinates
  const deltaX = world.wx - dragState.startWorldX;
  const deltaY = world.wy - dragState.startWorldY;
  const pos = dragState.position;

  // Convert screen-space dimensions to world space
  const startWidth = dragState.startWidth / transform.scale;
  const startHeight = dragState.startHeight / transform.scale;

  let newLeft = dragState.startLeft;
  let newTop = dragState.startTop;
  let newWidth = startWidth;
  let newHeight = startHeight;

  // Calculate based on handle position
  if (pos.includes('w')) {
    newWidth = startWidth - deltaX;
    newLeft = dragState.startLeft + deltaX;
  } else if (pos.includes('e')) {
    newWidth = startWidth + deltaX;
  }

  if (pos.includes('n')) {
    newHeight = startHeight - deltaY;
    newTop = dragState.startTop + deltaY;
  } else if (pos.includes('s')) {
    newHeight = startHeight + deltaY;
  }

  // Get inner dimensions with padding
  const innerRect = dragState.inner.getBoundingClientRect();
  const worldInnerWidth = innerRect.width / transform.scale;
  const worldInnerHeight = innerRect.height / transform.scale;
  const innerLeft = parseFloat(dragState.inner.style.left);
  const innerTop = parseFloat(dragState.inner.style.top);
  // Minimum outer size = inner position + inner size + padding + outer borders
  const minWidth = innerLeft + worldInnerWidth + PADDING + 2 * OUTER_BORDER;
  const minHeight = innerTop + worldInnerHeight + PADDING + 2 * OUTER_BORDER;

  // Apply constraints
  if (newWidth < minWidth) {
    if (pos.includes('w')) {
      newLeft = dragState.startLeft + startWidth - minWidth;
    }
    newWidth = minWidth;
  }

  if (newHeight < minHeight) {
    if (pos.includes('n')) {
      newTop = dragState.startTop + startHeight - minHeight;
    }
    newHeight = minHeight;
  }

  // Constrain to container (convert container dimensions to world space)
  const worldContainerWidth = dragState.containerWidth / transform.scale;
  const worldContainerHeight = dragState.containerHeight / transform.scale;

  if (newLeft < 0) {
    newWidth += newLeft;
    newLeft = 0;
  }
  if (newTop < 0) {
    newHeight += newTop;
    newTop = 0;
  }
  if (newLeft + newWidth > worldContainerWidth) {
    newWidth = worldContainerWidth - newLeft;
  }
  if (newTop + newHeight > worldContainerHeight) {
    newHeight = worldContainerHeight - newTop;
  }

  // Apply to outer - round everything to pixels
  dragState.element.style.left = Math.round(newLeft) + 'px';
  dragState.element.style.top = Math.round(newTop) + 'px';
  dragState.element.style.width = Math.round(newWidth) + 'px';
  dragState.element.style.height = Math.round(newHeight) + 'px';

  // Calculate how much the outer box moved from its start position
  const leftDelta = dragState.startLeft - Math.round(newLeft);
  const topDelta = dragState.startTop - Math.round(newTop);

  // Adjust inner position to keep it in the same absolute position
  // When outer moves left (leftDelta > 0), inner needs to move right relatively
  const newInnerLeft = dragState.innerLeft + leftDelta;
  const newInnerTop = dragState.innerTop + topDelta;

  // Ensure inner stays within bounds with padding on all sides (account for outer border)
  const maxInnerLeft = Math.round(newWidth) - 2 * OUTER_BORDER - worldInnerWidth - PADDING;
  const maxInnerTop = Math.round(newHeight) - 2 * OUTER_BORDER - worldInnerHeight - PADDING;

  dragState.inner.style.left = Math.round(Math.max(PADDING, Math.min(newInnerLeft, maxInnerLeft))) + 'px';
  dragState.inner.style.top = Math.round(Math.max(PADDING, Math.min(newInnerTop, maxInnerTop))) + 'px';
}

// -----------------------------------------------------------------
// Handle resize inner
// -----------------------------------------------------------------
function handleResizeInner(e) {
  // Convert current pointer position to world coordinates
  const world = pannerZoomer.toWorld(e.clientX, e.clientY);
  const transform = pannerZoomer.getTransform();

  // Calculate delta in world coordinates
  const deltaX = world.wx - dragState.startWorldX;
  const deltaY = world.wy - dragState.startWorldY;
  const pos = dragState.position;

  // Convert screen-space dimensions to world space
  const startWidth = dragState.startWidth / transform.scale;
  const startHeight = dragState.startHeight / transform.scale;

  let newLeft = dragState.startLeft;
  let newTop = dragState.startTop;
  let newWidth = startWidth;
  let newHeight = startHeight;

  // Calculate based on handle position
  if (pos.includes('w')) {
    newWidth = startWidth - deltaX;
    newLeft = dragState.startLeft + deltaX;
  } else if (pos.includes('e')) {
    newWidth = startWidth + deltaX;
  }

  if (pos.includes('n')) {
    newHeight = startHeight - deltaY;
    newTop = dragState.startTop + deltaY;
  } else if (pos.includes('s')) {
    newHeight = startHeight + deltaY;
  }

  // Minimum size
  const minWidth = 20;
  const minHeight = 20;

  if (newWidth < minWidth) {
    if (pos.includes('w')) {
      newLeft = dragState.startLeft + startWidth - minWidth;
    }
    newWidth = minWidth;
  }

  if (newHeight < minHeight) {
    if (pos.includes('n')) {
      newTop = dragState.startTop + startHeight - minHeight;
    }
    newHeight = minHeight;
  }

  // Convert outer dimensions to world space
  const worldOuterWidth = dragState.outerWidth / transform.scale;
  const worldOuterHeight = dragState.outerHeight / transform.scale;

  // Constrain to outer bounds with padding (account for outer border)
  if (newLeft < PADDING) {
    newWidth += newLeft - PADDING;
    newLeft = PADDING;
  }
  if (newTop < PADDING) {
    newHeight += newTop - PADDING;
    newTop = PADDING;
  }
  // Available space = outerWidth - 2*OUTER_BORDER
  if (newLeft + newWidth > worldOuterWidth - 2 * OUTER_BORDER - PADDING) {
    newWidth = worldOuterWidth - 2 * OUTER_BORDER - PADDING - newLeft;
  }
  if (newTop + newHeight > worldOuterHeight - 2 * OUTER_BORDER - PADDING) {
    newHeight = worldOuterHeight - 2 * OUTER_BORDER - PADDING - newTop;
  }

  // Apply - round everything to pixels
  dragState.element.style.left = Math.round(newLeft) + 'px';
  dragState.element.style.top = Math.round(newTop) + 'px';
  dragState.element.style.width = Math.round(newWidth) + 'px';
  dragState.element.style.height = Math.round(newHeight) + 'px';
}

// -----------------------------------------------------------------
// Generate spritesheet
// -----------------------------------------------------------------
function generateSpritesheet() {
  if (widgets.length === 0) {
    alert('Please add at least one widget first!');
    return;
  }

  // CRITICAL: Hide all resize handles to prevent them from affecting getBoundingClientRect()
  // Handles extend 5px beyond box edges and would cause 3-5px offset in measurements
  const allHandles = document.querySelectorAll('.resize-handle');
  allHandles.forEach((handle) => (handle.style.visibility = 'hidden'));

  // Create temporary canvas for extraction
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

  // Disable image smoothing for pixel-perfect rendering
  tempCtx.imageSmoothingEnabled = false;
  tempCtx.webkitImageSmoothingEnabled = false;
  tempCtx.mozImageSmoothingEnabled = false;
  tempCtx.msImageSmoothingEnabled = false;

  // Extract all widget images
  const extractedData = [];

  widgets.forEach((widget, index) => {
    const outerRect = widget.outer.getBoundingClientRect();
    const innerRect = widget.inner.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const transform = pannerZoomer.getTransform();

    // Account for container's border
    const containerStyle = window.getComputedStyle(container);
    const containerBorderLeft = parseFloat(containerStyle.borderLeftWidth);
    const containerBorderTop = parseFloat(containerStyle.borderTopWidth);
    const containerLeft = containerRect.left + containerBorderLeft;
    const containerTop = containerRect.top + containerBorderTop;

    // Convert screen coordinates to world coordinates (container pixels)
    const worldOuterTopLeft = pannerZoomer.toWorld(outerRect.left, outerRect.top);
    const worldContainerTopLeft = pannerZoomer.toWorld(containerLeft, containerTop);

    // Get positions in pixels - add OUTER_BORDER to skip the widget border itself
    const left = Math.round(worldOuterTopLeft.wx - worldContainerTopLeft.wx + OUTER_BORDER);
    const top = Math.round(worldOuterTopLeft.wy - worldContainerTopLeft.wy + OUTER_BORDER);
    // Convert dimensions to world space and subtract borders to get content area only
    const width = Math.round(outerRect.width / transform.scale - 2 * OUTER_BORDER);
    const height = Math.round(outerRect.height / transform.scale - 2 * OUTER_BORDER);

    // Extract image data
    tempCanvas.width = width;
    tempCanvas.height = height;
    tempCtx.clearRect(0, 0, width, height);
    tempCtx.drawImage(image, left, top, width, height, 0, 0, width, height);

    // Calculate 9-slice values relative to the extracted content
    // CSS positions were adjusted for borders in addWidget, so we need to account for that
    // inner.style.left = content position - INNER_BORDER, so add it back
    const innerLeft = parseFloat(widget.inner.style.left) + INNER_BORDER;
    const innerTop = parseFloat(widget.inner.style.top) + INNER_BORDER;
    // Convert dimensions to world space and subtract borders for content size
    const innerWidth = Math.round(innerRect.width / transform.scale - 2 * INNER_BORDER);
    const innerHeight = Math.round(innerRect.height / transform.scale - 2 * INNER_BORDER);

    // The extraction excluded outer borders, so:
    // - topSlice = where inner content starts in the extracted image
    // - leftSlice = where inner content starts in the extracted image
    // - rightSlice = distance from inner content's right edge to extracted image's right edge
    // - bottomSlice = distance from inner content's bottom edge to extracted image's bottom edge
    const topSlice = Math.round(innerTop);
    const leftSlice = Math.round(innerLeft);
    const rightSlice = Math.round(width - innerLeft - innerWidth);
    const bottomSlice = Math.round(height - innerTop - innerHeight);

    console.log(`Widget ${index + 1} - Extraction:`, {
      extractedSize: `${width}x${height}`,
      innerPos: `(${innerLeft}, ${innerTop})`,
      innerSize: `${innerWidth}x${innerHeight}`,
      slices: `${topSlice} ${rightSlice} ${bottomSlice} ${leftSlice}`,
      sourceRect: `left=${left} top=${top} width=${width} height=${height}`,
    });

    extractedData.push({
      id: widget.id,
      imageData: tempCtx.getImageData(0, 0, width, height),
      width: width,
      height: height,
      slices: { top: topSlice, right: rightSlice, bottom: bottomSlice, left: leftSlice },
    });
  });

  // Calculate spritesheet layout
  let currentY = 10;
  let maxWidth = 0;
  const padding = 10;

  extractedData.forEach((data) => {
    maxWidth = Math.max(maxWidth, data.width);
  });

  const totalHeight = extractedData.reduce((sum, data) => sum + data.height + padding, padding);

  // Setup spritesheet canvas
  spritesheetCanvas.width = maxWidth + padding * 2;
  spritesheetCanvas.height = totalHeight;
  spritesheetCtx.fillStyle = '#ffffff';
  spritesheetCtx.fillRect(0, 0, spritesheetCanvas.width, spritesheetCanvas.height);

  // Draw to spritesheet and generate CSS
  currentY = padding;
  let css = '/* 9-Slice Spritesheet CSS */\n';
  css += '/* Use these classes on any div element */\n\n';

  extractedData.forEach((data, index) => {
    // Draw to spritesheet
    const x = padding;
    const y = currentY;

    tempCanvas.width = data.width;
    tempCanvas.height = data.height;
    tempCtx.putImageData(data.imageData, 0, 0);
    spritesheetCtx.drawImage(tempCanvas, x, y);

    // Draw border guides
    spritesheetCtx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    spritesheetCtx.lineWidth = 1;
    spritesheetCtx.strokeRect(x, y, data.width, data.height);

    // Store position for CSS generation (we need final spritesheet dimensions)
    data.spritesheetX = x;
    data.spritesheetY = y;

    currentY += data.height + padding;
  });

  // Get final spritesheet dimensions
  const spritesheetWidth = spritesheetCanvas.width;
  const spritesheetHeight = spritesheetCanvas.height;

  // Generate CSS for each widget (using individual image files)
  extractedData.forEach((data, index) => {
    const widgetNum = index + 1;

    css += `/* Widget ${widgetNum}: ${data.id} */\n`;
    css += `.ui-widget-${widgetNum} {\n`;
    css += `  border-width: ${data.slices.top}px ${data.slices.right}px ${data.slices.bottom}px ${data.slices.left}px;\n`;
    css += `  border-style: solid;\n`;
    css += `  border-color: transparent;\n`;
    css += `  border-image-source: url('ui-widget-${widgetNum}.png');\n`;
    css += `  border-image-slice: ${data.slices.top} ${data.slices.right} ${data.slices.bottom} ${data.slices.left};\n`;
    css += `  border-image-repeat: round;\n`;
    css += `}\n\n`;
  });

  // Store data for other exports
  window.generatedCSS = css;
  window.spritesheetData = {
    spritesheet: {
      width: spritesheetWidth,
      height: spritesheetHeight,
    },
    widgets: extractedData.map((data, index) => ({
      id: index + 1,
      name: `ui-widget-${index + 1}`,
      x: data.spritesheetX,
      y: data.spritesheetY,
      width: data.width,
      height: data.height,
      slices: data.slices,
    })),
  };

  output.textContent = css;

  // Create widget previews
  createWidgetPreviews(extractedData);

  // Restore resize handles visibility
  allHandles.forEach((handle) => (handle.style.visibility = 'visible'));

  console.log('Spritesheet generated successfully!');
}

// -----------------------------------------------------------------
// Create widget previews with resizable borders
// -----------------------------------------------------------------
function createWidgetPreviews(extractedData) {
  // Clear existing previews
  previewContainer.innerHTML = '';

  // Create temporary canvas for generating individual widget images
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

  // Disable image smoothing for pixel-perfect rendering
  tempCtx.imageSmoothingEnabled = false;
  tempCtx.webkitImageSmoothingEnabled = false;
  tempCtx.mozImageSmoothingEnabled = false;
  tempCtx.msImageSmoothingEnabled = false;

  extractedData.forEach((data, index) => {
    const widgetNum = index + 1;

    // Create canvas for this widget
    tempCanvas.width = data.width;
    tempCanvas.height = data.height;
    tempCtx.putImageData(data.imageData, 0, 0);

    // Convert to data URL
    const imageDataUrl = tempCanvas.toDataURL('image/png');

    // Create preview element
    const preview = document.createElement('div');
    preview.className = `ui-widget-${widgetNum} widget-preview`;

    // Apply border-image styles
    preview.style.borderWidth = `${data.slices.top}px ${data.slices.right}px ${data.slices.bottom}px ${data.slices.left}px`;
    preview.style.borderStyle = 'solid';
    preview.style.borderColor = 'transparent';
    preview.style.borderImageSource = `url('${imageDataUrl}')`;
    preview.style.borderImageSlice = `${data.slices.top} ${data.slices.right} ${data.slices.bottom} ${data.slices.left}`;
    preview.style.borderImageRepeat = 'round';

    // Add label
    const label = document.createElement('div');
    label.className = 'preview-label';
    label.textContent = `Widget ${widgetNum}`;
    preview.appendChild(label);

    // Add sample content
    const content = document.createElement('div');
    content.textContent = `Resize me! Drag the bottom-right corner to test the 9-slice scaling.`;
    preview.appendChild(content);

    previewContainer.appendChild(preview);

    console.log(`Created preview for Widget ${widgetNum}`);
  });
}

// -----------------------------------------------------------------
// Save functions
// -----------------------------------------------------------------
function saveSpritesheet() {
  if (!window.generatedCSS) {
    alert('Please generate the spritesheet first!');
    return;
  }
  spritesheetCanvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spritesheet.png';
    a.click();
    URL.revokeObjectURL(url);
  });
}

function saveStylesheet() {
  if (!window.generatedCSS) {
    alert('Please generate the spritesheet first!');
    return;
  }
  const blob = new Blob([window.generatedCSS], { type: 'text/css' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'spritesheet.css';
  a.click();
  URL.revokeObjectURL(url);
}

function saveShellScript() {
  if (!window.spritesheetData) {
    alert('Please generate the spritesheet first!');
    return;
  }

  const data = window.spritesheetData;
  let script = '#!/bin/bash\n';
  script += '# Spritesheet Cutter - Generated by 9-Slice Builder\n';
  script += '# Usage: ./spritesheet.sh cut\n\n';

  script += '# Widget data\n';
  script += 'declare -A WIDGETS\n';
  data.widgets.forEach((w) => {
    script += `WIDGETS[${w.id}]="${w.x},${w.y},${w.width},${w.height}"\n`;
  });
  script += '\n';

  script += 'cut_sprites() {\n';
  script += '  if [ ! -f "spritesheet.png" ]; then\n';
  script += '    echo "Error: spritesheet.png not found"\n';
  script += '    exit 1\n';
  script += '  fi\n\n';

  data.widgets.forEach((w) => {
    script += `  # Widget ${w.id}: ${w.width}x${w.height} at (${w.x},${w.y})\n`;
    script += `  convert spritesheet.png -crop ${w.width}x${w.height}+${w.x}+${w.y} +repage ui-widget-${w.id}.png\n`;
    script += `  echo "Created ui-widget-${w.id}.png"\n\n`;
  });

  script += '  echo "Done! Created ${#WIDGETS[@]} widget images."\n';
  script += '}\n\n';

  script += '# Main\n';
  script += 'case "$1" in\n';
  script += '  cut)\n';
  script += '    cut_sprites\n';
  script += '    ;;\n';
  script += '  *)\n';
  script += '    echo "Usage: $0 cut"\n';
  script += '    echo "  cut - Cut spritesheet.png into individual widget images"\n';
  script += '    exit 1\n';
  script += '    ;;\n';
  script += 'esac\n';

  const blob = new Blob([script], { type: 'text/x-shellscript' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'spritesheet.sh';
  a.click();
  URL.revokeObjectURL(url);
}

function saveJson() {
  if (!window.spritesheetData) {
    alert('Please generate the spritesheet first!');
    return;
  }

  const json = JSON.stringify(window.spritesheetData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'spritesheet.json';
  a.click();
  URL.revokeObjectURL(url);
}

// -----------------------------------------------------------------
// Load image from file
// -----------------------------------------------------------------
function loadImage(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    image.src = e.target.result;
    console.log('Image loaded:', file.name);
  };
  reader.readAsDataURL(file);
}

// -----------------------------------------------------------------
// Save widgets JSON (positions on source image)
// -----------------------------------------------------------------
function saveWidgets() {
  if (widgets.length === 0) {
    alert('Please add at least one widget first!');
    return;
  }

  const widgetsData = {
    widgets: widgets.map((widget, index) => {
      const outerRect = widget.outer.getBoundingClientRect();
      const innerRect = widget.inner.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const transform = pannerZoomer.getTransform();

      // Convert screen coordinates to world coordinates
      const worldOuterTopLeft = pannerZoomer.toWorld(outerRect.left, outerRect.top);
      const worldContainerTopLeft = pannerZoomer.toWorld(containerRect.left, containerRect.top);

      // Get outer position relative to container content area
      const outerLeft = Math.round(worldOuterTopLeft.wx - worldContainerTopLeft.wx - 2 + OUTER_BORDER); // -2 for container border
      const outerTop = Math.round(worldOuterTopLeft.wy - worldContainerTopLeft.wy - 2 + OUTER_BORDER);
      const outerWidth = Math.round(outerRect.width / transform.scale - 2 * OUTER_BORDER);
      const outerHeight = Math.round(outerRect.height / transform.scale - 2 * OUTER_BORDER);

      // Get inner position and size (content area)
      const innerLeft = parseFloat(widget.inner.style.left) + INNER_BORDER;
      const innerTop = parseFloat(widget.inner.style.top) + INNER_BORDER;
      const innerWidth = Math.round(innerRect.width / transform.scale - 2 * INNER_BORDER);
      const innerHeight = Math.round(innerRect.height / transform.scale - 2 * INNER_BORDER);

      return {
        id: index + 1,
        outer: {
          x: outerLeft,
          y: outerTop,
          width: outerWidth,
          height: outerHeight,
        },
        inner: {
          x: innerLeft,
          y: innerTop,
          width: innerWidth,
          height: innerHeight,
        },
      };
    }),
  };

  const json = JSON.stringify(widgetsData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'widgets.json';
  a.click();
  URL.revokeObjectURL(url);
}

// -----------------------------------------------------------------
// Load widgets from JSON file
// -----------------------------------------------------------------
function loadWidgets(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);

      // Clear existing widgets
      widgets.forEach((w) => {
        w.outer.remove();
      });
      widgets.length = 0;
      widgetId = 0;

      // Recreate widgets from JSON
      data.widgets.forEach((w) => {
        addWidget({
          outerLeft: w.outer.x,
          outerTop: w.outer.y,
          outerWidth: w.outer.width,
          outerHeight: w.outer.height,
          innerLeft: w.inner.x,
          innerTop: w.inner.y,
          innerWidth: w.inner.width,
          innerHeight: w.inner.height,
        });
      });

      console.log(`Loaded ${data.widgets.length} widgets from file`);
    } catch (err) {
      alert('Error loading widgets file: ' + err.message);
      console.error(err);
    }
  };
  reader.readAsText(file);
}

// -----------------------------------------------------------------
// Select a widget (for DEL key deletion)
// -----------------------------------------------------------------
function selectWidget(outer) {
  // Remove selection from previous widget
  if (selectedWidget) {
    selectedWidget.classList.remove('selected');
  }

  // Select new widget
  selectedWidget = outer;
  outer.classList.add('selected');
}

// -----------------------------------------------------------------
// Clear all widgets
// -----------------------------------------------------------------
function clearWidgets() {
  if (widgets.length === 0) return;

  if (confirm(`Remove all ${widgets.length} widgets?`)) {
    widgets.forEach((w) => {
      w.outer.remove();
    });
    widgets.length = 0;
    widgetId = 0;
    selectedWidget = null;
    console.log('All widgets cleared');
  }
}

// -----------------------------------------------------------------
// Delete the selected widget
// -----------------------------------------------------------------
function deleteSelectedWidget() {
  if (!selectedWidget) return;

  // Find the widget in the array
  const index = widgets.findIndex((w) => w.outer === selectedWidget);
  if (index === -1) return;

  // Remove from DOM
  selectedWidget.remove();

  // Remove from array
  widgets.splice(index, 1);

  console.log(`Deleted widget ${index + 1}`);
  selectedWidget = null;
}

// -----------------------------------------------------------------
// Keyboard handler for DEL key
// -----------------------------------------------------------------
document.addEventListener('keydown', (e) => {
  if (e.key === 'Delete' || e.key === 'Backspace') {
    // Don't delete if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    e.preventDefault();
    deleteSelectedWidget();
  }
});

// -----------------------------------------------------------------
// Event listeners
// -----------------------------------------------------------------
loadImageBtn.addEventListener('click', () => imageInput.click());
loadWidgetsBtn.addEventListener('click', () => widgetsInput.click());
saveWidgetsBtn.addEventListener('click', saveWidgets);

imageInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    loadImage(e.target.files[0]);
  }
});

widgetsInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    loadWidgets(e.target.files[0]);
  }
});

addBtn.addEventListener('click', addWidget);
clearWidgetsBtn.addEventListener('click', clearWidgets);
generateBtn.addEventListener('click', generateSpritesheet);
saveSpriteBtn.addEventListener('click', saveSpritesheet);
saveStyleBtn.addEventListener('click', saveStylesheet);
saveShellBtn.addEventListener('click', saveShellScript);
saveJsonBtn.addEventListener('click', saveJson);
copyBtn.addEventListener('click', () => {
  if (!window.generatedCSS) {
    alert('Please generate the spritesheet first!');
    return;
  }
  navigator.clipboard.writeText(window.generatedCSS).then(() => {
    copyBtn.textContent = '✓ Copied!';
    setTimeout(() => (copyBtn.textContent = '📋 Copy CSS'), 1500);
  });
});

// Wait for image to load before adding first widget
if (image.complete) {
  addWidget();
} else {
  image.addEventListener('load', () => {
    addWidget();
  });
}
