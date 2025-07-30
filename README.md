# Image Tweaker

A powerful web-based image manipulation tool that allows you to apply various effects and transformations to your images.

## Features

- Multiple image effects:
  - **Paint Effect** (interactive drawing directly on canvas)
    - Real-time brush strokes with smooth drawing feedback
    - Customizable brush size (1-100px)
    - Color picker for paint color selection
    - Opacity control (0-100%)
    - Blend mode selection (Normal, Multiply, Screen, Overlay, etc.)
    - Undo and Clear All functionality
  - Color adjustments (hue, saturation, brightness, contrast)
  - Posterize (with adjustable levels)
  - Find Edges (edge detection with customizable threshold)
  - Dithering (Floyd-Steinberg and other algorithms)
    - Multiple dither types
    - Adjustable resolution and threshold
    - Color modes: grayscale, 2-color, full color
    - Custom color selection for 2-color mode
  - Halftone
    - Multiple patterns: grid, spiral, concentric
    - Shape options: circles, squares, lines
    - CMYK color separation with angle control
    - Size and mix adjustments
  - Linocut (variable-width line patterns with noise modulation)
    - Line spacing and stroke width controls
    - Perlin noise modulation
    - Center point adjustment
    - Threshold and orientation controls
  - Glitch (digital distortion effects)
  - Threshold
    - Multiple modes: solid, gradient
    - Custom colors for dark and light areas
  - Gradient Map
    - Unlimited color stops
    - Interactive gradient preview
    - Multiple blend modes
  - Grid (image subdivision and manipulation)
    - Row and column controls
    - Rotation options
    - Recursive splitting
  - Mosaic Shift (tile-based displacement)
    - Multiple patterns: Random, Alternating, Wave
    - Directional controls
    - Background color options
  - Slice Shift (vertical/horizontal slicing)
    - Multiple patterns: Random, Wave, Rearrange
    - Direction controls
    - Background fill options
  - Blur (Gaussian blur effect)
  - Blob Effect (organic shape distortion)
  - 3D Transform
    - Rotation on all axes
    - Perspective control
    - Distance adjustment
  - ASCII Art
    - Character set selection
    - Size and resolution controls
  - Text Effect
    - Custom font support
    - Size and position controls
    - Multiple font options
  - LCD Effect (simulated LCD screen)
  - Snake Effect (snake-like pattern generation)
  - Shape Grid Effect (geometric pattern overlay)
  - Truchet Tiles
    - Multiple tile types (diagonal, quarter-circles, triangles)
    - Size and density controls
    - Custom colors
    - Pattern density adjustment
    - Line width customization

- Export options:
  - PNG export with embedded metadata
  - Vector SVG export (for compatible effects)
  - Video export (MP4) for animations
  - High-resolution export up to 500%
  - Save/load effect settings

- Animation support:
  - Create animated transitions between effect states
  - Adjustable keyframes with effect parameters
  - Configurable animation duration (5, 10, or 15 seconds)
  - Dynamic timeline visualization
  - Seamless looping functionality
  - Export animations as MP4 videos

- User-friendly interface:
  - Drag and drop image upload
  - Real-time effect preview
  - Mobile-responsive design
  - Effect stacking and ordering
  - Independent effect instances
  - Duplicate effect feature
  - Proper aspect ratio preservation
  - Comprehensive help panel
  - Dark/light theme support

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/andreaperato/image-tweaker.git
cd image-tweaker
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3001](http://localhost:3001) in your browser.

## Usage

1. Upload an image by dragging and dropping it onto the canvas or using the upload button
2. Add effects from the control panel
3. Adjust effect settings in real-time
4. Enable animation mode to create keyframe-based animations
5. Export your modified image as PNG or SVG
6. Export animations as MP4 videos
7. Save your effect settings for later use

## Development

The project is built with:
- Next.js 14
- React
- TypeScript
- Tailwind CSS
- Canvas API for image processing

## Support

If you find this tool useful, consider supporting its development:
- [Donate via PayPal](https://www.paypal.com/donate/?hosted_button_id=BNU8J2MRNS4D4)

## License

This project is licensed under the MIT License - see the LICENSE file for details. 