# ImageTweaker

A modern web application for real-time image processing and manipulation, featuring a robust set of image effects and filters that run entirely in your browser.

## Live Demo

Visit [https://image-tweaker.vercel.app/](https://image-tweaker.vercel.app/) to try the application.

## Features

- **Color Adjustments**
  - Hue shift (-180° to +180°)
  - Saturation (0-200%)
  - Brightness (0-200%)
  - Contrast (0-200%)
  - Invert colors

- **Blur Effects**
  - Gaussian blur with adjustable radius
  - Radial blur with customizable center point
  - Motion blur with angle control
  - Tilt-shift blur with focus point, width, and gradient controls
  - Optimized kernel calculations for smooth results

- **Gradient Map**
  - Dynamic color stops (add and remove as many colors as needed)
  - 16 blend modes
  - Opacity control
  - Interactive gradient preview
  - Position control for each color stop

- **Threshold Effects**
  - Solid and gradient modes
  - Customizable threshold levels (0-255)
  - Custom color selection for both modes

- **Dithering**
  - Multiple algorithms (Ordered, Floyd-Steinberg, Atkinson)
  - Adjustable resolution
  - Color depth control (2-256 colors)
  - Grayscale, Color, and 2-Color Palette modes
  - Custom color selection in 2-Color mode

- **Halftone**
  - Multiple arrangements (Grid, Spiral, Concentric)
  - Various shapes (Circle, Square, Diamond, Line, Cross, Ellipse, Triangle, Hexagon)
  - CMYK mode with independent channel control
  - Size variation and dot scaling
  - Monochrome or color options

- **Text Dither**
  - Custom character patterns
  - Adjustable font size and resolution
  - Monochrome and color modes
  - Contrast and brightness controls

- **Glitch Effects**
  - Pixel sorting with threshold and direction controls
  - RGB channel shifting
  - Scan lines with customizable count and intensity
  - Noise generation
  - Block displacement
  - General glitch distortion

- **Grid Effects**
  - Customizable columns and rows
  - Rotation control
  - Recursive splitting with probability controls
  - Minimum cell size protection

- **Export Options**
  - PNG export with embedded metadata
  - True vector SVG export for halftone and dithering effects (not just embedded raster images)
  - Timestamp naming to prevent overwriting previous exports

- **Settings Management**
  - Save effect settings to JSON file
  - Load previously saved settings
  - Preserve all effect parameters and their processing order

- **Advanced Effects Management**
  - Add, remove, and duplicate effects
  - Reorder effects to control processing sequence
  - Enable/disable individual effect instances independently
  - Apply the same effect multiple times with different settings

- **Advanced UI**
  - Dark/light mode toggle for better viewing in different environments
  - Responsive design that works on both desktop and mobile devices
  - Consistent theming with a visually pleasing color scheme
  - Custom app icon for mobile home screens

- **Advanced Image Manipulation**
  - Interactive cropping with aspect ratio presets
  - Real-time preview for all adjustments
  - Clean starting interface with ability to add effects as needed

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

1. Upload an image by dragging and dropping or clicking the upload button
2. Alternatively, click "Random" to load a placeholder image
3. Add effects from the "Add New Effect" section at the bottom
4. Use the control panels to adjust each effect's settings
5. Effects are applied in real-time as you adjust the settings
6. Reorder effects using the arrow buttons to change the processing sequence
7. Duplicate effects to apply the same effect multiple times with different settings
8. Enable/disable effects individually using the toggle switch
9. Save your settings to a JSON file for later use
10. Load previously saved settings to restore your configuration
11. Export your result as PNG or SVG with embedded metadata

## Help Section

The application includes a comprehensive help section accessible by clicking the "?" button in the top-right corner. This provides detailed information about:

- Navigation tips
- Getting started guide
- Description of all top bar controls
- Detailed explanation of each effect and its parameters
- Export options
- Settings management

## Technical Details

- Built with Next.js and TypeScript
- Responsive design with Tailwind CSS
- All processing happens client-side (no server uploads)
- Pure JavaScript implementation for image processing
- Custom PNG metadata implementation
- SVG export with RDF metadata
- PP Mondwest font for a distinctive UI

## License

MIT License

## Author

Created by [Andrea Perato](https://andreaperato.com) with AI assistance 