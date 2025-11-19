# 9-Slice Spritesheet Builder

A visual tool for creating scalable UI components from pixel art using [9-slice scaling](https://en.wikipedia.org/wiki/9-slice_scaling).

## What is 9-Slice Scaling?

9-slice scaling (also called 9-patch) is a brilliant technique that lets you resize images—especially UI elements like buttons, panels, and windows—without distorting the corners and edges. It's a lifesaver for pixel artists and UI designers!

### How It Works

Imagine slicing a button image like a tic-tac-toe board into 9 pieces:

```
┌───┬─────────┬───┐
│ 1 │    2    │ 3 │  ← Top (corners stay fixed)
├───┼─────────┼───┤
│ 4 │    5    │ 6 │  ← Middle (stretches/tiles)
├───┼─────────┼───┤
│ 7 │    8    │ 9 │  ← Bottom (corners stay fixed)
└───┴─────────┴───┘
```

When you resize:
- **Corners (1,3,7,9)**: Stay exactly the same - no stretching!
- **Edges (2,4,6,8)**: Stretch or tile in one direction
- **Center (5)**: Stretches in both directions

This means your beautiful pixel-perfect corners and borders stay crisp no matter how big or small you make the element. Perfect for retro games, pixel art UIs, and any interface where you want that handcrafted look at any size!

## Why This Tool is Brilliant

Manually creating 9-slice assets is tedious:
1. You'd need to carefully measure slice positions
2. Calculate border widths by hand
3. Write CSS for each UI element
4. Extract individual images from spritesheets
5. Hope you didn't make any math errors!

**This tool does all of that automatically** with a visual interface. Just draw boxes on your image and get ready-to-use CSS, spritesheets, and coordinate data. It saves hours of work!

## Features

- **Visual Editor**: Draw boxes directly on your source image to define 9-slice regions
- **Pan & Zoom**: Navigate large images easily with the built-in panner-zoomer
- **Multiple Widgets**: Extract several UI elements from one source image
- **Auto-Generated CSS**: Get ready-to-use `border-image` CSS for each widget
- **Spritesheet Export**: Combine all widgets into one optimized spritesheet
- **Shell Script**: Auto-generate ImageMagick commands to split sprites
- **JSON Export**: Save widget positions for reuse or programmatic access
- **Pixel-Perfect**: Designed for pixel art with no interpolation/smoothing

## Quick Start

### Installation

```bash
npm install nine-slice
```

Or clone and open `index.html` in a browser:

```bash
git clone https://github.com/catpea/nine-slice.git
cd nine-slice
npm install
open index.html
```

### Basic Usage

1. **Load Your Image**
   - Click "🖼️ Load Image" to upload your pixel art or UI mockup
   - Or replace `example.png` with your own image

2. **Create Selection Boxes**
   - Click "➕ Add Widget" to create a selection
   - **Red box**: The area to extract from your source image
   - **Blue box**: The "safe zone" that can stretch (defines slice borders)

3. **Position Your Slices**
   - **Drag red box**: Move the entire selection
   - **Drag blue box**: Reposition the stretchable area
   - **Resize red**: Change what gets extracted
   - **Resize blue**: Adjust the 9-slice borders

4. **Generate Output**
   - Click "🎯 Generate Spritesheet" to process all widgets
   - Review the generated CSS in the output panel

5. **Export Everything**
   - **💾 Spritesheet (PNG)**: Combined sprite image
   - **📄 Stylesheet (CSS)**: Ready-to-use CSS classes
   - **🔧 Shell Script (SH)**: ImageMagick commands to split the spritesheet
   - **📋 Coordinates (JSON)**: Widget positions and slice data

### Example Output

The tool generates CSS like this:

```css
/* Widget 1: w1 */
.ui-widget-1 {
  border-width: 8px 8px 8px 8px;
  border-style: solid;
  border-color: transparent;
  border-image-source: url('ui-widget-1.png');
  border-image-slice: 8 8 8 8;
  border-image-repeat: round;
}
```

Use it on any `<div>`:

```html
<div class="ui-widget-1" style="width: 200px; height: 100px;">
  Button content here!
</div>
```

The corners stay crisp, edges tile perfectly, and you can make it any size you want!

## Use Cases

### Pixel Art Games
Create retro game UIs with dialog boxes, health bars, and inventory panels that scale to any resolution while keeping that authentic pixel look.

### Responsive Web Design
Build unique, branded UI components (buttons, panels, tooltips) that resize gracefully without complex CSS or SVG.

### Design Systems
Maintain consistent, scalable UI elements across your app without needing separate assets for every possible size.

### Rapid Prototyping
Sketch your UI in any image editor, then instantly convert it to working HTML/CSS components.

## Tips for Best Results

1. **Start with pixel art**: 9-slice works best with crisp, non-anti-aliased images
2. **Keep borders consistent**: Make sure your decorative borders are the same width all around
3. **Test the blue box**: The area inside the blue box should be tile-able or stretchable
4. **Save your widgets**: Use "💾 Save Widgets" to preserve your selections for later editing
5. **Use the shell script**: Run `bash spritesheet.sh cut` to automatically split your spritesheet into individual images

## Keyboard Shortcuts

- **Delete/Backspace**: Remove the selected widget (click a red box to select it)

## Technical Details

- Built with vanilla JavaScript (ES6 modules)
- Uses HTML5 Canvas for pixel-perfect rendering
- Leverages CSS `border-image` for 9-slice scaling
- Zero image smoothing for pristine pixel art
- Integrates [panner-zoomer](https://www.npmjs.com/package/panner-zoomer) for navigation

## Browser Support

Works in all modern browsers that support:
- ES6 modules
- Custom elements
- Canvas API with `imageSmoothingEnabled`

## Contributing

Found a bug? Have a feature idea? Contributions are welcome!

- Report issues: https://github.com/catpea/nine-slice/issues
- Submit pull requests
- Share your creations!

## License

MIT License - See LICENSE file for details

## Author

**catpea** - [GitHub](https://github.com/catpea) | [Sponsor](https://github.com/sponsors/catpea)

## Acknowledgments

- Inspired by Unity's 9-slice sprite editor and Android's 9-patch tool
- Thanks to the pixel art community for keeping retro aesthetics alive!
- Built with love for developers who appreciate tools that just work

---

**Save yourself hours of tedious work.** Try it now at https://catpea.github.io/nine-slice

Happy slicing! ✂️
