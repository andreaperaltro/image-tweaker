# Image Tweaker

A powerful web-based image manipulation tool that allows you to apply various effects and transformations to your images.

## Features

- Multiple image effects:
  - Color adjustments (hue, saturation, brightness, contrast)
  - Posterize
  - Find Edges
  - Dithering
  - Halftone
  - Glitch
  - Threshold
  - Gradient Map
  - Grid
  - Mosaic Shift
  - Slice Shift
  - Blur
  - Blob Effect

- Export options:
  - PNG export with embedded metadata
  - Vector SVG export (for compatible effects)
  - Video export (MP4) for animations
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