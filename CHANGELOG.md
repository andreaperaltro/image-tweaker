# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.3.0] - 2023-05-27

### Added
- Comprehensive help section update with detailed information on all features
- Added Blur Effects section to the help guide
- Added Export Options section with PNG/SVG metadata information
- Added Settings Management section to the help guide

### Changed
- Reorganized help content for better readability
- Updated feature descriptions to match current functionality
- Improved navigation tips with information about effect reordering
- Enhanced Getting Started guide with more detailed instructions

### Fixed
- Corrected parameter ranges and descriptions in help text
- Fixed outdated information about controls and buttons
- Updated information about the Top Bar Controls

## [0.2.2.0] - 2025-05-02

### Added
- Settings save/load functionality
  - Save current effect settings to JSON file
  - Load previously saved settings
  - Preserve all effect parameters and order
  - Real-time image update when loading settings

### Fixed
- Fixed issue with settings not applying to image after loading
- Removed duplicate blur state in AdvancedEditor component

## [0.2.1.0] - 2025-05-01

### Added
- New slider component with improved interaction and visual feedback
- Integrated help section directly in the header for better accessibility
- Smooth animation for help text visibility toggle

### Changed
- Switched from Unsplash to Picsum.photos for random image service
- Improved error handling in image loading
- Enhanced development server configuration with dynamic port assignment
- Removed modal-based help system in favor of inline help text
- Streamlined mobile controls implementation
- Updated GUI with consistent PP Mondwest font usage
- Improved slider controls across all effect parameters

### Fixed
- Fixed port conflict issues in development server
- Resolved font loading issues with PP Mondwest
- Fixed syntax errors in AdvancedEditor component
- Improved error handling in image processing pipeline
- Fixed help text visibility toggle animation

### Removed
- HelpModal component and related files (replaced with inline help)
- Unused modal-based implementations

## [0.2.0.0] - 2025-04-26

### Added
- Complete mobile UI controls for all effects including:
  - Halftone effects with all parameter controls
  - Text dithering with font size, resolution, and color mode settings
  - Glitch effects with intensity and density controls
  - Grid effects with full control over columns, rows, and splitting
- Dynamic effect reordering functionality in mobile UI
- Visual indicators showing processing order of effects

### Changed
- Improved mobile UI layout for better usability
- Better responsiveness for mobile controls
- Effects rendering order now matches the UI order
- Development server configured to use port 3000 by default

### Fixed
- Fixed syntax error in MobileControls.tsx that caused compilation failures
- Fixed issue where reordering effects would only change the number but not reposition controls
- Improved effects panel organization and visual hierarchy

## [0.1.92] - 2025-04-16

### Added
- New "2 Color Palette" mode for dithering effects
- Custom color pickers for dark and light colors in 2-color mode
- Improved dithering algorithms to support custom color pairs
- Dynamic UI controls that adapt based on selected color mode

### Changed
- Reorganized dithering controls for better usability
- Moved Color Mode control between Resolution and Color Depth
- Moved Threshold control above Color Mode
- Enhanced error diffusion for custom colors to maintain dithering quality

## [0.1.91] - 2025-04-12

### Added
- Fixed gradient stops implementation with a simplified three-stop system
- Improved color conversion with pure JavaScript calculations without DOM manipulation
- Better support for gradient map color selection and visualization

### Changed
- Simplified gradient stops UI to use exactly 3 stops at fixed positions
- Improved state management for gradient color stops to prevent UI issues
- Replaced DOM-based color conversion with pure calculation approach

### Fixed
- Removed direct DOM manipulation for color conversion, improving security and reliability
- Fixed potential memory leaks from temporary DOM elements
- Resolved issues with gradient stops UI updating

## [0.1.9] - 2025-04-11

### Added
- Advanced cropping functionality with interactive preview
- Multiple aspect ratio presets (1:1, 4:3, 16:9, etc.)
- Free-form cropping with draggable corners
- Live preview of modified image in crop interface
- Ability to reset effects after cropping while maintaining crop

### Changed
- Enhanced image processing workflow to separate cropping from effects
- Improved UI feedback during cropping operations
- Better handling of image dimensions and aspect ratios

## [0.1.8] - 2025-04-10

### Added
- Comprehensive Glitch Effects suite with multiple components:
  - Pixel Sorting with threshold and directional controls
  - RGB Channel Shifting for color distortion effects
  - Scan Lines with customizable count and intensity
  - Noise generator with adjustable amount
  - Block displacement with size and offset controls
  - General glitch intensity control for random distortions

### Changed
- Reorganized the UI to accommodate new glitch effects
- Enhanced the processing pipeline to support advanced distortion techniques
- Optimized rendering for real-time preview of complex effects

## [0.1.7] - 2025-04-10

### Added
- New "New Image" button added to the top toolbar for easier access

### Changed
- Streamlined GUI by removing the Canvas Settings section
- Removed Export section from the control panel (buttons already in topbar)
- Removed the Actions section as its functionality is now in the topbar
- Improved overall user interface for a more focused experience

## [0.1.6] - 2025-04-10

### Added
- Responsive mobile-friendly layout for better usability on smaller screens
- Improved touch interactions for controls on mobile devices
- Export buttons directly on the main interface for quicker access
- Sticky header and control panel for better navigation while scrolling

### Changed
- Reorganized UI with more intuitive layout on both desktop and mobile 
- Improved the drag-and-drop interface with better visual feedback
- Enhanced Tweakpane controls with better styling and mobile-optimized dimensions
- Refined canvas presentation with better scaling on different screen sizes

### Fixed
- Fixed reset functionality by completely recreating UI controls on reset
- Improved reliability of export functions with proper null checking
- Enhanced image loading and processing stability
- Better error handling in control panel operations

## [0.1.5] - 2025-04-08

### Added
- Threshold effect with customizable threshold value
- Support for both solid and gradient color modes in threshold effect
- Color pickers for dark and light colors in solid mode
- Gradient color pickers with start/end colors for both dark and light ranges

### Changed
- Improved UI organization with threshold controls
- Optimized threshold slider placement for better usability
- Enhanced color picker integration using Tweakpane's native color picker

### Fixed
- Color picker interaction and update issues
- Real-time preview performance with threshold effect
- Color gradient interpolation in threshold mode

## [0.1.4] - 2025-04-06

### Added
- Text dithering effect that distributes characters based on image brightness
- Character weight mapping for more natural dithering patterns
- Support for both monochrome and colored text dithering modes

### Improved
- Enhanced spiral halftone effect to cover the entire canvas
- Adjusted spiral tightness range (0.001 to 0.01) for better control
- Improved spiral scaling to ensure full canvas coverage
- Fixed spiral center point calculation for more accurate patterns

### Fixed
- Corrected spiral implementation to create proper spiral patterns
- Fixed variable naming inconsistencies in spiral calculations
- Addressed issues with spiral being cut off at canvas edges

## [0.1.3] - 2025-04-02

### Added
- Initial release with basic image editing capabilities
- Support for color adjustments (brightness, contrast, saturation, hue)
- Dithering effects with multiple algorithms (ordered, Floyd-Steinberg, Atkinson)
- Image upload and random image loading
- Real-time preview of effects
- Responsive layout with canvas and controls side by side

### Changed
- Improved UI layout and organization
- Enhanced dithering algorithms for better results
- Optimized performance for real-time preview
- Better error handling and user feedback

### Fixed
- Fixed canvas sizing issues
- Resolved memory leaks in image processing
- Corrected color space handling
- Fixed dithering artifacts in certain cases

## [0.1.2] - 2025-03-20

### Added
- Basic project structure
- Next.js setup with TypeScript
- Initial UI components
- Canvas implementation
- Basic image processing utilities

### Changed
- Project configuration and dependencies
- Development environment setup

### Fixed
- Initial setup issues
- Build configuration
- Development server configuration

## [0.1.1] - 2025-03-19

### Added
- True vector SVG export functionality that uses stored halftone dot information
- Timestamp in SVG filenames to prevent duplicates
- Comprehensive metadata in SVG exports including all halftone parameters

### Changed
- Consolidated multiple SVG export buttons into a single intelligent button
- Improved dot size accuracy in vector SVG exports
- Streamlined export experience with better user feedback

### Fixed
- SVG export now correctly preserves exact dot sizes from canvas rendering
- Shape-specific scaling corrections for consistent appearance across shapes
- Fixed handling of CMYK color channels in vector exports

### Removed
- Cleaned up project by removing backup and temporary files
- Removed unused background feature implementation
- Eliminated redundant export buttons 

## [0.1.0] - 2025-03-XX
- Initial release 
