# ImageTweaker

A modern web application for real-time image processing and manipulation.

## Features

- **Color Adjustments**
  - Hue shift
  - Saturation
  - Brightness
  - Contrast
  - Posterize
  - Invert colors

- **Blur Effects**
  - Gaussian blur with adjustable radius
  - Radial blur with customizable center point
  - Motion blur with angle control
  - Tilt-shift blur with focus point, width, and gradient controls
  - Optimized kernel calculations for smooth results

- **Gradient Map**
  - Custom color stops
  - Multiple blend modes
  - Opacity control

- **Threshold Effects**
  - Solid and gradient modes
  - Customizable threshold levels
  - Color selection

- **Dithering**
  - Ordered dithering
  - Custom resolution
  - Color depth control
  - Grayscale and color modes

- **Halftone**
  - Grid and spiral arrangements
  - Circle and square shapes
  - CMYK support
  - Size variation

- **Text Dither**
  - Custom text input
  - Font size control
  - Monochrome and color modes

- **Glitch Effects**
  - Pixel sorting
  - Channel shift
  - Scan lines
  - Noise
  - Blocks

- **Grid**
  - Customizable columns and rows
  - Rotation control
  - Split cells
  - Minimum cell size

- **Settings Management**
  - Save effect settings to JSON file
  - Load previously saved settings
  - Preserve all effect parameters and order

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Upload an image by dragging and dropping or clicking the upload area
2. Use the controls panel to adjust various effects
3. Effects are applied in real-time as you adjust the settings
4. Save your settings to a JSON file for later use
5. Load previously saved settings to restore your configuration
6. Export your result as PNG or SVG

## Controls

The application features a mobile-friendly interface with intuitive controls:

- **Color Section**: Adjust basic color properties
- **Blur Section**: Control various blur effects including Gaussian, radial, motion, and tilt-shift
- **Gradient Section**: Create and edit gradient maps
- **Threshold Section**: Set threshold levels and colors
- **Dither Section**: Configure dithering parameters
- **Halftone Section**: Customize halftone patterns
- **Text Dither Section**: Set up text-based dithering
- **Glitch Section**: Apply various glitch effects
- **Grid Section**: Create and modify grid layouts

## Export Options

- **PNG Export**: Save your processed image as a PNG file
- **SVG Export**: Export your image as an SVG file

## License

MIT License

## Author

Created by Andrea Perato 