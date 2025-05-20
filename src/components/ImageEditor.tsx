'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { saveAs } from 'file-saver';
import ControlPanel from './ControlPanel';
import ImageCanvas from './ImageCanvas';
import { HalftoneArrangement, HalftoneShape } from '@/utils/imageUtils';
import { exportCanvasAsSvg } from './ExportUtils';

// Default parameters for image manipulation, derived from the original code
const defaultParams = {
  // Canvas dimensions & ratio controls
  canvasWidth: 1080,
  canvasHeight: 1080,
  lockRatio: true,
  selectedRatio: '1:1',
  orientation: 'landscape',
  autoCanvasSize: true,
  exportScale: 100,
  
  // Displacement / Split / Effects
  noiseScale: 0,
  splitProbability: 0,
  furtherSplitProbability: 0,
  maxSplitDepth: 1,
  hueIncrement: 0,
  displaceAmountX: 0,
  displaceAmountY: 0,
  colorShiftAmount: 0,
  saturationVariation: 0,
  threshold: 0.5,
  transitionWidth: 0,
  thresholdColorLow: '#000000',
  thresholdColorHigh: '#ffffff',
  midColor: '#808080',
  invertGradientAngle: 0,
  invertMix: 0,
  posterizeLevels: 2,
  enablePosterization: false,
  glitchIntensity: 0,
  glitchWaveScale: 0,
  glitchInterpolateColors: false,
  glitchBlendMode: 'linear',
  glitchBlendFactor: 0,
  
  // Halftone options
  halftoneEnabled: false,
  halftoneCellSize: 5,
  halftoneMix: 0,
  halftoneColored: false,
  halftoneArrangement: 'grid' as HalftoneArrangement,
  halftoneShape: 'circle' as HalftoneShape,
  bezierCurveStrength: 0,
  curvedGridCurveStrength: 0,
  spiralSpireSize: 0,
  
  // Background options
  backgroundType: 'none',
  backgroundColor: '#ffffff',
  backgroundGradientStart: '#ffffff',
  backgroundGradientEnd: '#000000',
  backgroundGradientAngle: 0,
  
  // Colorization
  enableColorization: false
};

export type ImageParams = typeof defaultParams;

type FilterType = 'normal' | 'grayscale' | 'sepia' | 'invert' | 'blur' | 'brightness' | 'contrast'

export default function ImageEditor() {
  const [params, setParams] = useState<ImageParams>(defaultParams);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const [filter, setFilter] = useState<FilterType>('normal');
  const [filterValue, setFilterValue] = useState(100);

  // Handle image drops
  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          const img = new Image();
          img.onload = () => {
            if (params.autoCanvasSize) {
              setParams(prev => ({
                ...prev,
                canvasWidth: img.naturalWidth,
                canvasHeight: img.naturalHeight
              }));
            }
            setImage(img);
          };
          img.src = URL.createObjectURL(file);
        }
      };
      
      reader.readAsDataURL(file);
    }
  }, [params.autoCanvasSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1
  });

  // Load a random image
  const loadRandomImage = () => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      if (params.autoCanvasSize) {
        setParams(prev => ({
          ...prev,
          canvasWidth: img.naturalWidth,
          canvasHeight: img.naturalHeight
        }));
      }
      setImage(img);
    };
    const width = params.canvasWidth;
    const height = params.canvasHeight;
    img.src = `https://picsum.photos/${width}/${height}?random&t=${Date.now()}`;
  };

  // Export the image
  const exportImage = () => {
    if (canvasRef.current) {
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const dateStr = new Date().toISOString().split('T')[0];
          saveAs(blob, `imagetweaker_${dateStr}.png`);
        }
      });
    }
  };

  // Export as SVG if the last effect was halftone or dithering
  const exportAsSvg = () => {
    if (!canvasRef.current) return;
    exportCanvasAsSvg(canvasRef.current, params.exportScale / 100);
  };

  // Update parameters
  const updateParams = (newParams: Partial<ImageParams>) => {
    setParams(prev => {
      const updated = { ...prev, ...newParams };
      
      // Handle aspect ratio locks if needed
      if (updated.lockRatio && 'canvasWidth' in newParams) {
        const [a, b] = updated.selectedRatio.split(':').map(Number);
        const ratio = updated.orientation === 'landscape' ? a / b : b / a;
        updated.canvasHeight = Math.round(updated.canvasWidth / ratio);
      } else if (updated.lockRatio && 'canvasHeight' in newParams) {
        const [a, b] = updated.selectedRatio.split(':').map(Number);
        const ratio = updated.orientation === 'landscape' ? a / b : b / a;
        updated.canvasWidth = Math.round(updated.canvasHeight * ratio);
      }
      
      return updated;
    });
  };

  // Initialize with a random image
  useEffect(() => {
    loadRandomImage();
  }, []);

  // Apply filter to canvas
  useEffect(() => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Load image if not already loaded
    if (!originalImageRef.current) {
      const img = new Image();
      img.onload = () => {
        originalImageRef.current = img;
        
        // Set canvas dimensions to match image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Apply filter
        applyFilter(ctx, img);
      };
      img.src = image.src;
    } else {
      // Just apply the filter to the already loaded image
      applyFilter(ctx, originalImageRef.current);
    }
  }, [image, filter, filterValue]);

  // Function to apply the selected filter
  const applyFilter = (ctx: CanvasRenderingContext2D, img: HTMLImageElement) => {
    // Clear canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Reset filters
    ctx.filter = 'none';
    
    // Apply the selected filter
    switch (filter) {
      case 'grayscale':
        ctx.filter = `grayscale(${filterValue}%)`;
        break;
      case 'sepia':
        ctx.filter = `sepia(${filterValue}%)`;
        break;
      case 'invert':
        ctx.filter = `invert(${filterValue}%)`;
        break;
      case 'blur':
        ctx.filter = `blur(${filterValue / 10}px)`;
        break;
      case 'brightness':
        ctx.filter = `brightness(${filterValue}%)`;
        break;
      case 'contrast':
        ctx.filter = `contrast(${filterValue}%)`;
        break;
      default:
        ctx.filter = 'none';
    }
    
    // Draw the image with the filter applied
    ctx.drawImage(img, 0, 0);
  };

  // Download the edited image
  const downloadImage = () => {
    if (!canvasRef.current) return;
    
    // Create a temporary canvas for the scaled export
    const tempCanvas = document.createElement('canvas');
    const scale = params.exportScale / 100;
    tempCanvas.width = canvasRef.current.width * scale;
    tempCanvas.height = canvasRef.current.height * scale;
    
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    // Draw the original canvas scaled up
    tempCtx.drawImage(canvasRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
    
    // Create download link
    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
  };

  // Reset the image and filters
  const resetImage = () => {
    if (!canvasRef.current || !originalImageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    setFilter('normal');
    setFilterValue(100);
    
    ctx.filter = 'none';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImageRef.current, 0, 0);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
      <div className="md:col-span-2">
        <div 
          {...getRootProps()} 
          className={`relative bg-white rounded-lg shadow-lg p-4 mb-4 border-2 border-dashed transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
        >
          <input {...getInputProps()} />
          
          {!image && (
            <div className="flex flex-col items-center justify-center h-48 text-center text-gray-500">
              <p>Drag & drop an image here, or click to select one</p>
              <button 
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition" 
                onClick={(e) => { e.stopPropagation(); loadRandomImage(); }}
              >
                Load Random Image
              </button>
            </div>
          )}
          
          {image && (
            <div className="flex justify-center">
              <ImageCanvas 
                ref={canvasRef}
                image={image} 
                params={params} 
                width={params.canvasWidth} 
                height={params.canvasHeight} 
              />
            </div>
          )}
        </div>
        
        <div className="flex gap-2 justify-center">
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            onClick={loadRandomImage}
          >
            Random Image
          </button>
          <button 
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
            onClick={exportImage}
            disabled={!image}
          >
            Export PNG
          </button>
          <button 
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
            onClick={exportAsSvg}
            disabled={!image}
          >
            Export SVG
          </button>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-lg h-[70vh] overflow-y-auto">
        <ControlPanel params={params} onChange={updateParams} />
      </div>
    </div>
  );
} 