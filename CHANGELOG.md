# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.3] - 2024-04-02

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

## [0.1.2] - 2024-03-20

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

## [0.1.1] - 2024-03-19

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
