# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2025-06-01

### Fixed
- Fixed 3D effect not showing the transformed image
- Improved 3D transformation stability and reliability
- Added robust error handling for edge cases in 3D transformations
- Fixed perspective transform initialization and point mapping
- Added safeguards against invalid transformation values

### Changed
- Enhanced 3D effect with better value clamping for more stable transformations
- Improved perspective projection with proper focal length calculations
- Added fallback to show original image if transformation fails
- Better handling of extreme rotation and perspective values

## [0.5.9] - 2025-05-31

### Added
- New Text effect 
- Font family dropdown for the Text effect, allowing users to select from common web fonts.
- Custom font upload for the Text effect: users can upload .ttf, .otf, .woff, or .woff2 files and use them instantly in their designs.

### Changed
- Improved text alignment and positioning logic for the Text effect, ensuring proper centering and rotation behavior.
- Increased font size slider maximum to 400px.

### Fixed
- Fixed letter spacing and font size rendering issues in the Text effect.
- Fixed custom font upload to reliably load and apply user fonts using the FontFace API and data URLs.

## [0.5.8] - 2025-05-27

### Added
- New Ascii effect
  
## [0.5.7] - 2025-05-26

### Added
- New Linocut effect that creates variable-width line patterns based on image brightness
  - Separate controls for line spacing and stroke width
  - Smooth noise modulation using Perlin noise
  - Center point controls for shifting the pattern
  - Threshold control for fine-tuning the effect
  - Invert and orientation toggles
- New reusable Toggle component for consistent checkbox-style switches across the app
- Overhauled the Noise effect: now uses true Perlin noise (via noisejs) for smooth, organic patterns at any scale.
- Added advanced blend modes to the Noise effect: multiply, screen, overlay, darken, lighten, color-dodge, color-burn, hard-light, soft-light, difference, exclusion.
- Added Monochrome toggle to Noise effect for grayscale noise.
- Added Channel selector to Noise effect (apply noise to all, red, green, or blue channels).
- New Levels effect: adjust black, gamma (mid), and white points for overall image contrast and brightness, similar to Photoshop's Levels adjustment. Available as a standalone effect with interactive sliders.
- Pixel effect: Color variant controls (Classic, Posterized, Grayscale) are now available for all pixel modes (Grid, Radial, Off Grid, Voronoi, Rings, Random), not just Grid.

### Changed
- Improved Noise effect UI with new controls and more descriptive section title ("Noise").
- Enhanced Linocut effect with smoother noise modulation and better brightness-based line thickness control
- Pixel effect: Color variant controls are now shown below the size controls for each mode in the control panel.
- Improved effect section title for Levels effect (now displays "Levels").
- Removed rotationMode and rotationMax controls from the pixel effect case in MobileControls.tsx to fix linter errors.

### Fixed
- Fixed effect section title for Noise effect (was previously showing as generic "Effect").
- Enhanced the "Random Block" pixelation effect: block widths now vary more prominently, and gaps are filled with the average background color for a more cohesive look.
- Improved block placement logic to reduce visible gaps and create a more visually interesting, staggered effect.

## [0.5.6] - 2025-05-20

### Added
- Added export scale control for high-resolution exports up to 500%
- Added dynamic resolution display showing final export dimensions
- Added automatic scale clamping based on GPU capabilities
- Added warning message when export size exceeds GPU limits

### Changed
- Improved export UI with cleaner layout and better feedback
- Enhanced PNG export quality with high-quality image scaling
- Updated export controls to show real-time dimension calculations

### Fixed
- Fixed potential memory issues with large image exports
- Improved error handling for oversized export attempts
- Enhanced export reliability with proper GPU limit detection

## [0.5.5] - 2025-05-09

### Added
- Added animation looping functionality for seamless repeating animations
- Updated help panel with comprehensive animation documentation
- Added information about looping in the animation controls section

### Changed
- Improved help panel organization with better categorization of features
- Enhanced animation documentation with detailed control descriptions

## [0.5.4] - 2025-05-09

### Added
- Added configurable animation duration (5, 10, or 15 seconds)
- Added visual timeline length adjustment when duration changes

### Changed
- Updated animation timeline to dynamically adjust to selected duration
- Improved animation state management to handle duration changes

## [0.5.3] - 2025-05-09

### Fixed
- Fixed an issue where more than 2 layers broke the app flow

## [0.5.2] - 2025-05-08

### Added
- Added direct PayPal donate link in the header for supporting the project
- Styled donate button with yellow accent color for better visibility

## [0.5.1] - 2025-05-08

### Added
- Added timestamp to exported video filenames to match PNG export style
- Improved image preview performance with optimized effect processing

### Changed
- Fixed animation duration to 5 seconds for better performance
- Aligned animation UI colors with the rest of the app's color scheme
- Updated animation controls to match the app's design language

### Fixed
- Fixed original aspect ratio issues with uploaded images
- Improved effect rendering performance using willReadFrequently context option
- Fixed effect processing for smoother UI updates
- Corrected Reset button to reset all effects instead of just glitch settings
- Fixed button hover states for better readability

## [0.5.0] - 2025-05-08

### Added
- Added animation effects

## [0.4.1] - 2025-05-07

### Changed
- Improved UI by hiding internal effect IDs (like "gradient-1") from the interface
- Added automatic effect numbering when multiple instances of the same effect exist
- Changed default development server port to 3001 to avoid common port conflicts

### Fixed
- Fixed port conflict issues when another service is running on port 3000
- Improved effect title display for better usability and cleaner interface

## [0.4.0] - 2025-05-06

### Added
- New Slice Shift filter that creates vertical and horizontal slicing effects
  - Support for vertical, horizontal, or both directions
  - Multiple pattern options: Random, Alternating, Wave, Rearrange, and Repeat
  - Background color option to fill exposed areas when slices are moved
  - Intensity control for random, alternating, and wave patterns
- New Mosaic Shift filter for tile-based displacement effects
  - Customizable cell size with shift amount controls
  - Directional options (horizontal, vertical, or both)
  - Pattern selection (Random, Alternating, Wave)
  - Background color support for exposed areas
- Enhanced help section with comprehensive documentation for all new features

### Changed
- Reorganized dither settings UI to follow a logical order:
  - Dither type (with Floyd-Steinberg as default)
  - Resolution
  - Threshold
  - Color mode
  - Color depth
  - Color pickers for 2-color mode
- Improved Slice Shift effect to dynamically show/hide intensity control based on pattern selection
- Better user experience with context-sensitive controls that only display relevant options

### Fixed
- Fixed favicon issues to ensure proper display across browsers
- Enhanced mobile experience with better touch controls for new effects
- Improved overall performance when applying multiple effects

## [0.3.1] - 2025-05-05

### Added
- Dynamic title animation in browser tab with randomized letter-to-number replacements
- Improved mobile interface for better usability on smaller screens
- Sticky footer implementation to ensure footer stays at bottom of viewport

### Changed
- Enhanced mobile layout with better organization of effect controls
- Improved header layout with effect titles on top line and control buttons on bottom
- Better responsive design for touch-friendly controls on mobile devices

### Fixed
- Fixed layout issues where control buttons would overlap on iPhone
- Resolved mobile layout problems with checkboxes going out of bounds
- Improved overall mobile experience with cleaner, more accessible UI elements
- Fixed footer positioning to always stay at the bottom, even with minimal content

## [0.3.0] - 2025-05-04

### Added
- Advanced effects management system
  - Start with zero effects for a cleaner interface
  - Add effects individually as needed from the "Add New Effect" panel
  - Duplicate existing effects to apply the same effect with different settings
  - Independent enable/disable toggles for each effect instance
- Dynamic effects implementation
  - Each effect instance now operates independently
  - Multiple instances of the same effect type can have different enabled states
  - Full control over the processing chain

### Changed
- Moved "Add New Effect" container to the bottom of the effects list for better workflow
- Improved visual styling for the effects interface
  - Enhanced buttons for adding effects
  - Better visual indicators for expanded/collapsed effect panels
  - Improved spacing and layout for effect controls
- Removed "Controls" title for cleaner interface
- Streamlined UX flow for adding and managing effects

### Fixed
- Fixed issues with effect panels not expanding/collapsing properly
- Resolved problem with duplicate effects sharing the same enabled state
- Improved CSS transitions for smoother interactions
- Enhanced effect rendering to support independent effect states

## [0.2.6.0] - 2025-05-03

### Added
- Custom pixel art favicon and app icons
- Updated all icon sizes (16x16, 32x32, 192x192, 512x512)
- Added SVG version of the icon for better scaling

### Changed
- Updated theme color to match app icon blue background
- Improved icon handling in the app manifest
- Enhanced PWA support with proper icon definitions

## [0.2.5.0] - 2025-05-03

### Added
- Dynamic gradient map color stops allowing unlimited colors
- Add and remove color stops functionality in gradient map
- Interactive gradient preview display
- Position control sliders for precise color stop placement

### Changed
- Improved UI for color controls with more flexible layout
- Enhanced image controls panel width on larger screens (now 35% of width)
- Reorganized halftone settings with shape and pattern options at the top
- Optimized color picker and slider layout for better usability

### Fixed
- Improved button styling consistency throughout the application
- Fixed layout and spacing issues in gradient map controls
- Enhanced gradient color preview rendering
- Made UI more responsive to different screen sizes

## [0.2.4.0] - 2025-05-03

### Added
- Added app icon for mobile home screens

### Changed
- Improved UI in light mode with better readable control labels
- Refactored CSS variables to ensure consistent theming across components
- Enhanced mobile control styles with better contrast in light mode

### Fixed
- Fixed SVG export to create true vector shapes for halftone and dithering effects
- Added dividers between button groups in the toolbar
- Fixed SVG button size to match other buttons
- Removed redundant buttons from the mobile controls
- Fixed various theming issues in mobile controls

## [0.2.3.0] - 2023-05-02

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

## [Unreleased]
- Fixed text effect so it overlays on the image instead of replacing it.
- Text effect now updates live when controls are changed (text, color, size, etc.).
- Fixed text color input in controls so the text is visible.
- Refactored text effect controls to use instance-specific settings for consistency.
- Greatly improved the Snake effect's Corner Radius slider: now supports a range of 0–20 with 0.1 steps for much finer granularity.
- The effect logic now uses the corner radius value as a pixel radius (not percentage), clamped to the cell size, for more precise and flexible control.
- Added Spin Blur (rotational blur) effect: blurs pixels along a circular arc around a movable center.
- Spin Blur now supports a Center Radius (protected area) and Center Gradient (feather/transition) control for smooth transitions from sharp to blurred.
- Fixed Box Blur: now works as a true mean filter.
- Improved Blur effect UI: Spin Blur, Box Blur, and all controls are now more flexible and intuitive.

## [0.5.10] - 2024-06-03

### Changed
- Updated all effect icons to use more visually descriptive Material Design and Feather icons.
- Add Effect buttons are now left-aligned, smaller, and arranged in a grid for a cleaner look.
- Effect section headers now always show the effect icon before the effect name, regardless of enabled state.
- Effect section titles now use only the effect name (e.g., "Halftone", "Blur"), and append a number only if there are multiple instances.
- Improved consistency and clarity of effect labels throughout the UI.

## [0.5.11] - 2025-06-01

### Added
- Background color control for the 3D effect, allowing users to customize the color visible behind rotated images

### Changed
- Simplified 3D effect implementation by removing perspective control for better performance
- Improved 3D rotation handling with proper Z -> Y -> X rotation order
- Enhanced 3D effect integration with the animation system

### Fixed
- Fixed 3D effect to properly handle background colors during rotation
- Improved 3D effect performance by removing complex matrix calculations
- Fixed animation issues with the 3D effect

## [0.5.12] - 2025-06-02

### Added
- Background color control for the 3D effect, allowing users to customize the color visible behind rotated images.

### Changed
- Simplified 3D effect implementation by removing perspective control for better performance.
- Improved 3D rotation handling with proper Z -> Y -> X rotation order.
- Enhanced 3D effect integration with the animation system.

### Fixed
- Fixed 3D effect to properly handle background colors during rotation.
- Improved 3D effect performance by removing complex matrix calculations.
- Fixed animation issues with the 3D effect.
