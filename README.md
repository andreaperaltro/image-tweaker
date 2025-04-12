# ImageTweaker

A powerful web-based image editor built with Next.js that allows you to apply various effects to your images.

## Features

- Upload or drag-and-drop images
- Interactive image cropping
  - Multiple aspect ratio presets (1:1, 4:3, 16:9, etc.)
  - Free-form cropping with draggable corners
  - Live preview with applied effects
- Color adjustments (hue, saturation, brightness, contrast)
- Advanced effects:
  - Gradient map with customizable color stops and blend modes
  - Halftone with multiple patterns (circle, square, diamond)
  - Grid effects with rotation and splitting
  - Text dithering with customizable characters
  - Threshold effects with gradient support
  - Comprehensive glitch effects:
    - Pixel sorting
    - RGB channel shifting
    - Scan lines
    - Noise generation
    - Block displacement
- Export options:
  - PNG export
  - Vector SVG export with metadata
  - Timestamp-based filenames
- Mobile-friendly responsive design
- Real-time preview of all effects

## Technologies Used

- Next.js
- React
- TypeScript
- Tailwind CSS
- Tweakpane for UI controls

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the development server:
   ```
   npx next dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## License

MIT

## Author

Created by Andrea Perato 