'use client';

import dynamic from 'next/dynamic';
import React, { useState } from 'react';
import { BlurSettings } from '../types';

// Import the AdvancedEditor component with dynamic import to avoid SSR issues
const AdvancedEditor = dynamic(() => import('@/components/AdvancedEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-96">
      <div className="w-12 h-12 mb-2 border-2 border-black"></div>
      <div className="h-4 w-32 bg-black"></div>
      <div className="mt-2 h-3 w-48 bg-gray-700"></div>
    </div>
  ),
});

export default function Home() {
  const [isHelpOpen, setIsHelpOpen] = React.useState(false);
  const [openSection, setOpenSection] = React.useState<string | null>(null);
  const [blurSettings, setBlurSettings] = useState<BlurSettings>({
    enabled: false,
    type: 'gaussian',
    radius: 5
  });
  const [effectsOrder, setEffectsOrder] = useState([
    'color',
    'blur',
    'gradient',
    'threshold',
    'dither',
    'halftone',
    'textDither',
    'glitch',
    'grid'
  ]);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <main className="min-h-screen bg-white">
      <header className="bg-black text-white p-3 border-b-2 border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl md:text-2xl pp-mondwest-font uppercase">ImageTweaker</h1>
              <p className="text-xs pp-mondwest-font">Image manipulation studio</p>
            </div>
            <button
              onClick={() => setIsHelpOpen(!isHelpOpen)}
              className="text-gray-400 hover:text-white transition-colors text-xl"
              aria-label="Help"
              title="View controls guide"
            >
              ?
            </button>
          </div>
          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isHelpOpen ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="text-sm pp-mondwest-font space-y-2 max-h-[400px] overflow-y-auto pr-2">
              <div>
                <h3 className="text-emerald-500 mb-2">Navigation Tips</h3>
                <ul className="list-disc pl-4 space-y-1 text-gray-300">
                  <li>Use the <strong>arrow buttons</strong> to navigate between effects</li>
                  <li>Click the <strong>effect name</strong> to expand/collapse its controls</li>
                  <li>Use the <strong>sliders</strong> to adjust values, or click the - / + buttons for precise control</li>
                  <li>The <strong>Reset</strong> button will restore the original image</li>
                  <li>Click <strong>Export</strong> to save your creation as PNG or SVG</li>
                </ul>
              </div>

              <div>
                <h3 className="text-emerald-500 mb-2">Getting Started</h3>
                <p className="text-gray-300">
                  Image Tweaker is a powerful tool for applying various effects and transformations to your images.
                  Start by uploading an image using the "Upload Image" button or drag and drop an image file.
                </p>
              </div>

              {[
                {
                  title: 'Color Adjustments',
                  content: (
                    <ul className="list-disc pl-4 space-y-1 text-gray-300">
                      <li><strong>Brightness:</strong> Adjust image brightness from 0-200% (100% is original)</li>
                      <li><strong>Contrast:</strong> Control image contrast from 0-200% (100% is original)</li>
                      <li><strong>Saturation:</strong> Modify color intensity from 0-200% (100% is original)</li>
                      <li><strong>Hue Shift:</strong> Rotate colors along the color wheel from -180° to +180°</li>
                      <li><strong>Invert Colors:</strong> Toggle to invert all colors in the image</li>
                    </ul>
                  )
                },
                {
                  title: 'Gradient Map',
                  content: (
                    <ul className="list-disc pl-4 space-y-1 text-gray-300">
                      <li><strong>Blend Mode:</strong> Choose how the gradient overlays the image (16 modes available)</li>
                      <li><strong>Opacity:</strong> Control the strength of the gradient effect (0-100%)</li>
                      <li><strong>Color Stops:</strong> Set colors for dark (0%), mid (50%), and light (100%) tones</li>
                    </ul>
                  )
                },
                {
                  title: 'Threshold',
                  content: (
                    <ul className="list-disc pl-4 space-y-1 text-gray-300">
                      <li><strong>Mode:</strong> Choose between Solid (pure black/white) or Gradient</li>
                      <li><strong>Threshold:</strong> Set the brightness cutoff point (0-255)</li>
                    </ul>
                  )
                },
                {
                  title: 'Dithering',
                  content: (
                    <>
                      <p className="mb-2 text-gray-300">Creates patterns to simulate shading using limited colors.</p>
                      <ul className="list-disc pl-4 space-y-1 text-gray-300">
                        <li><strong>Color Mode:</strong> Choose between Grayscale, Color, or 2-Color Palette</li>
                        <li><strong>Type:</strong> Various dithering algorithms (Ordered, Floyd-Steinberg, etc.)</li>
                        <li><strong>Resolution:</strong> Control pattern size (1-100)</li>
                        <li><strong>Threshold:</strong> Adjust pattern intensity (0-255)</li>
                        <li><strong>Color Depth:</strong> Number of colors used (2-256, not available in 2-Color mode)</li>
                      </ul>
                    </>
                  )
                },
                {
                  title: 'Halftone Effect',
                  content: (
                    <ul className="list-disc pl-4 space-y-1 text-gray-300">
                      <li><strong>Cell Size:</strong> Size of individual dots (2-30px)</li>
                      <li><strong>Dot Scale:</strong> How dots grow with brightness (0.1-1.5)</li>
                      <li><strong>Mix Amount:</strong> Blend with original image (0-100%)</li>
                      <li><strong>Shape:</strong> Choose dot shape (Circle, Square, Diamond, etc.)</li>
                      <li><strong>Pattern:</strong> Arrangement style (Grid, Hexagonal, Spiral, etc.)</li>
                      <li><strong>Colored:</strong> Toggle between monochrome and color</li>
                      <li><strong>Invert:</strong> Reverse the brightness pattern</li>
                    </ul>
                  )
                },
                {
                  title: 'Glitch Effects',
                  content: (
                    <div className="space-y-3 text-gray-300">
                      <div>
                        <h4 className="text-white text-sm font-semibold mb-1">General Glitch</h4>
                        <ul className="list-disc pl-4 space-y-1">
                          <li><strong>Intensity:</strong> Amount of glitch distortion (0-100)</li>
                          <li><strong>Density:</strong> Number of affected areas (0-100)</li>
                          <li><strong>Size:</strong> Size of glitch artifacts (1-50)</li>
                          <li><strong>Direction:</strong> Apply horizontally, vertically, or both</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-white text-sm font-semibold mb-1">Pixel Sorting</h4>
                        <ul className="list-disc pl-4 space-y-1">
                          <li><strong>Threshold:</strong> Brightness level to trigger sorting (0-1)</li>
                          <li><strong>Direction:</strong> Sort horizontally, vertically, or both</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-white text-sm font-semibold mb-1">Channel Shift</h4>
                        <ul className="list-disc pl-4 space-y-1">
                          <li><strong>Amount:</strong> Distance of offset (0-50)</li>
                          <li><strong>Channels:</strong> Choose which colors to shift (RGB, RB, RG, GB)</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-white text-sm font-semibold mb-1">Scan Lines</h4>
                        <ul className="list-disc pl-4 space-y-1">
                          <li><strong>Count:</strong> Number of lines (1-100)</li>
                          <li><strong>Intensity:</strong> Line darkness (0-100)</li>
                          <li><strong>Direction:</strong> Horizontal, vertical, or both</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-white text-sm font-semibold mb-1">Noise</h4>
                        <ul className="list-disc pl-4 space-y-1">
                          <li><strong>Amount:</strong> Intensity of noise (0-100)</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-white text-sm font-semibold mb-1">Blocks</h4>
                        <ul className="list-disc pl-4 space-y-1">
                          <li><strong>Size:</strong> Block dimensions (1-50)</li>
                          <li><strong>Offset:</strong> How far blocks move (0-50)</li>
                          <li><strong>Density:</strong> Number of affected blocks (0-100)</li>
                        </ul>
                      </div>
                    </div>
                  )
                },
                {
                  title: 'Text Dither Effect',
                  content: (
                    <ul className="list-disc pl-4 space-y-1 text-gray-300">
                      <li><strong>Text Pattern:</strong> Characters used for dithering</li>
                      <li><strong>Font Size:</strong> Size of text (6-24)</li>
                      <li><strong>Resolution:</strong> Pattern density (0.5-4)</li>
                      <li><strong>Color Mode:</strong> Monochrome or colored</li>
                      <li><strong>Contrast:</strong> Pattern intensity (0-2)</li>
                    </ul>
                  )
                },
                {
                  title: 'Grid Effects',
                  content: (
                    <ul className="list-disc pl-4 space-y-1 text-gray-300">
                      <li><strong>Columns/Rows:</strong> Grid divisions (1-10)</li>
                      <li><strong>Rotation:</strong> Optional rotation of grid cells (0-45°)</li>
                      <li><strong>Split:</strong> Subdivide grid cells randomly</li>
                      <li><strong>Split Probability:</strong> Chance of splitting (0-1)</li>
                      <li><strong>Max Split Levels:</strong> Maximum subdivisions (1-5)</li>
                      <li><strong>Min Cell Size:</strong> Smallest allowed cell (10-200px)</li>
                    </ul>
                  )
                },
                {
                  title: 'Additional Controls',
                  content: (
                    <ul className="list-disc pl-4 space-y-1 text-gray-300">
                      <li><strong>Crop Image:</strong> Open cropping interface</li>
                      <li><strong>Reset:</strong> Restore original image</li>
                      <li><strong>Export:</strong> Save as PNG or SVG</li>
                    </ul>
                  )
                }
              ].map((section) => (
                <div key={section.title} className="border-t border-gray-700 pt-2">
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="w-full text-left flex items-center justify-between text-emerald-500 hover:text-emerald-400 transition-colors"
                  >
                    <h3 className="font-semibold">{section.title}</h3>
                    <span className="transform transition-transform duration-200" style={{
                      transform: openSection === section.title ? 'rotate(90deg)' : 'rotate(0deg)'
                    }}>
                      ›
                    </span>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-200 ease-in-out ${
                      openSection === section.title ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'
                    }`}
                  >
                    {section.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-4 md:py-6 px-2 md:px-3">
        <div className="border-2 border-black p-2 md:p-3">
          <AdvancedEditor
            blur={blurSettings}
            onBlurChange={setBlurSettings}
          />
        </div>
      </div>

      <footer className="bg-black text-white p-3 mt-4 md:mt-8 border-t-2 border-gray-700">
        <div className="container mx-auto text-center">
          <p className="text-xs pp-mondwest-font uppercase">ImageTweaker | Image manipulation app</p>
          <p className="text-xs text-gray-400 pp-mondwest-font">
            All processing happens on your device
          </p>
          <p className="text-xs text-gray-400 pp-mondwest-font mt-2">
            Created by <a href="https://andreaperato.com" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">Andrea Perato</a> with AI assistance
          </p>
        </div>
      </footer>
    </main>
  );
} 