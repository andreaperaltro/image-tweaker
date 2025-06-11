'use client';

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { ImageParams } from './ImageEditor';
import { 
  drawCoverImage, pseudoNoise, clamp, hexToRgb, rgbToHex, 
  rgbToHsl, hslToRgb, HalftoneArrangement, HalftoneShape, drawHalftoneDot
} from '@/utils/imageUtils';
import { applyDithering } from '@/utils/DitherUtils';

interface ImageCanvasProps {
  image: HTMLImageElement;
  params: ImageParams;
  width: number;
  height: number;
}

const ImageCanvas = forwardRef<HTMLCanvasElement, ImageCanvasProps>(
  ({ image, params, width, height }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const offscreenSourceRef = useRef<HTMLCanvasElement | null>(null);
    
    // Expose the canvas DOM element via the ref
    useImperativeHandle(ref, () => canvasRef.current!);
    
    // Setup offscreen canvases for processing
    useEffect(() => {
      offscreenCanvasRef.current = document.createElement('canvas');
      offscreenSourceRef.current = document.createElement('canvas');
      
      return () => {
        offscreenCanvasRef.current = null;
        offscreenSourceRef.current = null;
      };
    }, []);
    
    // Render the image with all effects applied
    useEffect(() => {
      if (!canvasRef.current || !image || image.naturalWidth === 0) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Also set dimensions for offscreen canvases
      if (offscreenCanvasRef.current) {
        offscreenCanvasRef.current.width = width;
        offscreenCanvasRef.current.height = height;
      }
      
      if (offscreenSourceRef.current) {
        offscreenSourceRef.current.width = width;
        offscreenSourceRef.current.height = height;
      }
      
      // Render background
      renderBackground(ctx, width, height);
      
      // Draw and process the image
      drawProcessedImage(ctx, image);
      
    }, [image, params, width, height]);
    
    // Background rendering function
    const renderBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.save();
      
      if (params.backgroundType === 'solid') {
        ctx.fillStyle = params.backgroundColor;
        ctx.fillRect(0, 0, width, height);
      } else if (params.backgroundType === 'gradient') {
        const cx = width / 2, cy = height / 2;
        const angle = (params.backgroundGradientAngle * Math.PI) / 180;
        const halfWidth = width / 2, halfHeight = height / 2;
        const x1 = cx + Math.cos(angle) * halfWidth;
        const y1 = cy + Math.sin(angle) * halfHeight;
        const x2 = cx - Math.cos(angle) * halfWidth;
        const y2 = cy - Math.sin(angle) * halfHeight;
        
        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, params.backgroundGradientStart);
        grad.addColorStop(1, params.backgroundGradientEnd);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      } else {
        // Clear background
        ctx.clearRect(0, 0, width, height);
      }
      
      ctx.restore();
    };
    
    // Main image processing function
    const drawProcessedImage = (ctx: CanvasRenderingContext2D, image: HTMLImageElement) => {
      if (!offscreenSourceRef.current) return;
      
      const offSrcCtx = offscreenSourceRef.current.getContext('2d', { willReadFrequently: true });
      if (!offSrcCtx) return;
      
      // Draw the original image to offscreen canvas
      offSrcCtx.clearRect(0, 0, width, height);
      drawCoverImage(offSrcCtx, width, height, image);
      
      // Clear the main canvas
      ctx.clearRect(0, 0, width, height);
      
      // Start with the source image
      ctx.drawImage(offscreenSourceRef.current, 0, 0);
      
      // Apply distortion effect if enabled
      if (params.distortSettings.enabled) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const { data } = imageData;
        
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            
            // Calculate distortion based on position
            const displaceX = (x / width - 0.5) * 2;
            const displaceY = (y / height - 0.5) * 2;
            
            const dx = Math.round(displaceX * params.distortSettings.xAmount);
            const dy = Math.round(displaceY * params.distortSettings.yAmount);
            
            // Get source coordinates with displacement
            let srcX = x + dx;
            let srcY = y + dy;
            
            // Clamp to image boundaries
            srcX = Math.max(0, Math.min(width - 1, srcX));
            srcY = Math.max(0, Math.min(height - 1, srcY));
            
            const srcIndex = (srcY * width + srcX) * 4;
            
            // Copy pixels from the displaced position
            data[index] = data[srcIndex];
            data[index + 1] = data[srcIndex + 1];
            data[index + 2] = data[srcIndex + 2];
            data[index + 3] = data[srcIndex + 3];
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
      }
      
      // Apply displacement and color effects
      if (
        params.displaceAmountX !== 0 || 
        params.displaceAmountY !== 0 || 
        params.colorShiftAmount !== 0 ||
        params.saturationVariation !== 0
      ) {
        applyDisplacementAndColorEffects(ctx, ctx, width, height);
      }
      
      // Apply dithering effect if enabled
      if (params.ditherEnabled) {
        const imageData = ctx.getImageData(0, 0, width, height);
        // Create temporary canvas for source image
        const sourceCanvas = document.createElement('canvas');
        sourceCanvas.width = width;
        sourceCanvas.height = height;
        const sourceCtx = sourceCanvas.getContext('2d');
        if (sourceCtx) {
          sourceCtx.putImageData(imageData, 0, 0);
          applyDithering(ctx, sourceCanvas, width, height, {
            enabled: true,
            type: 'ordered',
            threshold: params.ditherThreshold,
            colorMode: 'grayscale',
            resolution: 30,
            colorDepth: 2,
            darkColor: '#000000',
            lightColor: '#FFFFFF'
          });
        }
      }
      
      // Apply halftone effect if enabled
      if (params.halftoneEnabled) {
        renderHalftone(ctx, width, height);
      }
    };
    
    // Apply displacement and color effects
    const applyDisplacementAndColorEffects = (
      destCtx: CanvasRenderingContext2D, 
      srcCtx: CanvasRenderingContext2D,
      width: number,
      height: number
    ) => {
      // Simple version of the displacement mapping for demo
      const srcData = srcCtx.getImageData(0, 0, width, height);
      const srcPixels = srcData.data;
      const output = destCtx.createImageData(width, height);
      const outPixels = output.data;
      
      // Simple grid-based displacement
      const gridSize = 50;
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          
          // Calculate displacement
          const cellX = Math.floor(x / gridSize) * gridSize;
          const cellY = Math.floor(y / gridSize) * gridSize;
          const noise = pseudoNoise(cellX, cellY, params.noiseScale);
          
          // Get source brightness to drive displacement
          const r = srcPixels[idx];
          const g = srcPixels[idx + 1];
          const b = srcPixels[idx + 2];
          const brightness = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
          
          // Calculate displacement amounts
          const dx = (brightness - 0.5) * params.displaceAmountX;
          const dy = (brightness - 0.5) * params.displaceAmountY;
          
          // Get displaced pixel
          const newX = clamp(Math.round(x + dx + noise * 10), 0, width - 1);
          const newY = clamp(Math.round(y + dy + noise * 10), 0, height - 1);
          const newIdx = (newY * width + newX) * 4;
          
          // Color shifting
          const hueShift = (brightness - 0.5) * params.colorShiftAmount;
          let rVal = srcPixels[newIdx];
          let gVal = srcPixels[newIdx + 1];
          let bVal = srcPixels[newIdx + 2];
          let [h, s, l] = rgbToHsl(rVal, gVal, bVal);
          
          if (!params.enableColorization) {
            h = (h + hueShift + 360) % 360;
            s = clamp(s * (1 + params.saturationVariation * (brightness - 0.5) * 2), 0, 1);
          }
          
          const [nr, ng, nb] = hslToRgb(h, s, l);
          
          outPixels[idx] = nr;
          outPixels[idx + 1] = ng;
          outPixels[idx + 2] = nb;
          outPixels[idx + 3] = srcPixels[newIdx + 3];
        }
      }
      
      // Apply posterization if enabled
      if (params.enablePosterization) {
        applyPosterization(outPixels, width, height);
      }
      
      // Apply colorization if enabled
      if (params.enableColorization) {
        applyColorization(outPixels, width, height);
      }
      
      destCtx.putImageData(output, 0, 0);
    };
    
    // Apply posterization effect
    const applyPosterization = (pixels: Uint8ClampedArray, width: number, height: number) => {
      const low = hexToRgb(params.thresholdColorLow);
      const mid = hexToRgb(params.midColor);
      const high = hexToRgb(params.thresholdColorHigh);
      const levels = params.posterizeLevels;
      
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
        const bright = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        const qBright = Math.round(bright * (levels - 1)) / (levels - 1);
        
        let newR, newG, newB;
        if (qBright < 0.5) {
          let t = qBright / 0.5;
          newR = (1 - t) * low.r + t * mid.r;
          newG = (1 - t) * low.g + t * mid.g;
          newB = (1 - t) * low.b + t * mid.b;
        } else {
          let t = (qBright - 0.5) / 0.5;
          newR = (1 - t) * mid.r + t * high.r;
          newG = (1 - t) * mid.g + t * high.g;
          newB = (1 - t) * mid.b + t * high.b;
        }
        
        pixels[i] = clamp(Math.round(newR), 0, 255);
        pixels[i + 1] = clamp(Math.round(newG), 0, 255);
        pixels[i + 2] = clamp(Math.round(newB), 0, 255);
      }
    };
    
    // Apply colorization effect
    const applyColorization = (pixels: Uint8ClampedArray, width: number, height: number) => {
      const low = hexToRgb(params.thresholdColorLow);
      const mid = hexToRgb(params.midColor);
      const high = hexToRgb(params.thresholdColorHigh);
      
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
        const bright = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        
        let newR, newG, newB;
        if (bright < 0.5) {
          let t = bright / 0.5;
          newR = (1 - t) * low.r + t * mid.r;
          newG = (1 - t) * low.g + t * mid.g;
          newB = (1 - t) * low.b + t * mid.b;
        } else {
          let t = (bright - 0.5) / 0.5;
          newR = (1 - t) * mid.r + t * high.r;
          newG = (1 - t) * mid.g + t * high.g;
          newB = (1 - t) * mid.b + t * high.b;
        }
        
        pixels[i] = clamp(Math.round(newR), 0, 255);
        pixels[i + 1] = clamp(Math.round(newG), 0, 255);
        pixels[i + 2] = clamp(Math.round(newB), 0, 255);
      }
    };
    
    // Render halftone effect
    const renderHalftone = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const processed = ctx.getImageData(0, 0, width, height);
      const halftoneCanvas = document.createElement('canvas');
      halftoneCanvas.width = width;
      halftoneCanvas.height = height;
      const hCtx = halftoneCanvas.getContext('2d');
      if (!hCtx) return;
      
      // Fill background
      if (params.backgroundType === 'solid') {
        hCtx.fillStyle = params.backgroundColor;
        hCtx.fillRect(0, 0, width, height);
      } else if (params.backgroundType === 'gradient') {
        const cx = width / 2, cy = height / 2;
        const angle = (params.backgroundGradientAngle * Math.PI) / 180;
        const halfWidth = width / 2, halfHeight = height / 2;
        const x1 = cx + Math.cos(angle) * halfWidth;
        const y1 = cy + Math.sin(angle) * halfHeight;
        const x2 = cx - Math.cos(angle) * halfWidth;
        const y2 = cy - Math.sin(angle) * halfHeight;
        
        const grad = hCtx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, params.backgroundGradientStart);
        grad.addColorStop(1, params.backgroundGradientEnd);
        hCtx.fillStyle = grad;
        hCtx.fillRect(0, 0, width, height);
      } else {
        hCtx.clearRect(0, 0, width, height);
      }
      
      // Apply the selected halftone method
      switch (params.halftoneArrangement) {
        case 'grid':
          renderHalftoneGrid(hCtx, processed, width, height);
          break;
        case 'hexagonal':
          renderHalftoneHex(hCtx, processed, width, height);
          break;
        case 'circular':
          renderHalftoneCircular(hCtx, processed, width, height);
          break;
        default:
          renderHalftoneGrid(hCtx, processed, width, height);
      }
      
      // Copy halftone result back to main canvas
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(halftoneCanvas, 0, 0);
    };
    
    // Grid arrangement halftone
    const renderHalftoneGrid = (
      ctx: CanvasRenderingContext2D, 
      processed: ImageData, 
      width: number, 
      height: number
    ) => {
      for (let y = 0; y < height; y += params.halftoneCellSize) {
        for (let x = 0; x < width; x += params.halftoneCellSize) {
          let sumR = 0, sumG = 0, sumB = 0, sumBright = 0, count = 0;
          
          for (let j = y; j < Math.min(y + params.halftoneCellSize, height); j++) {
            for (let i = x; i < Math.min(x + params.halftoneCellSize, width); i++) {
              const idx = (j * width + i) * 4;
              const r = processed.data[idx],
                    g = processed.data[idx + 1],
                    b = processed.data[idx + 2];
              const brightness = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
              sumR += r; sumG += g; sumB += b; sumBright += brightness;
              count++;
            }
          }
          
          const avgBright = sumBright / count;
          const avgR = sumR / count, avgG = sumG / count, avgB = sumB / count;
          const maxRadius = params.halftoneCellSize / 2;
          const radius = (1 - avgBright) * maxRadius;
          
          const dotColor = params.halftoneColored 
            ? rgbToHex({ r: Math.round(avgR), g: Math.round(avgG), b: Math.round(avgB) }) 
            : '#000000';
            
          ctx.fillStyle = dotColor;
          drawHalftoneDot(
            ctx, 
            x + params.halftoneCellSize / 2, 
            y + params.halftoneCellSize / 2, 
            radius, 
            params.halftoneShape
          );
        }
      }
    };
    
    // Hexagonal arrangement halftone
    const renderHalftoneHex = (
      ctx: CanvasRenderingContext2D, 
      processed: ImageData, 
      width: number, 
      height: number
    ) => {
      const cell = params.halftoneCellSize;
      const horizSpacing = cell;
      const vertSpacing = cell * 0.866; // Height of equilateral triangle
      
      const nRows = Math.ceil(height / vertSpacing);
      const nCols = Math.ceil(width / horizSpacing);
      
      for (let row = 0; row < nRows; row++) {
        const y = row * vertSpacing + cell / 2;
        const offsetX = row % 2 ? cell / 2 : 0;
        
        for (let col = 0; col < nCols; col++) {
          const x = col * horizSpacing + offsetX + cell / 2;
          
          let sumR = 0, sumG = 0, sumB = 0, sumBright = 0, count = 0;
          
          for (let j = Math.floor(y - cell / 2); j < Math.min(y + cell / 2, height); j++) {
            for (let i = Math.floor(x - cell / 2); i < Math.min(x + cell / 2, width); i++) {
              if (i < 0 || j < 0 || i >= width || j >= height) continue;
              
              const idx = (j * width + i) * 4;
              const r = processed.data[idx],
                    g = processed.data[idx + 1],
                    b = processed.data[idx + 2];
              const brightness = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
              sumR += r; sumG += g; sumB += b; sumBright += brightness;
              count++;
            }
          }
          
          if (count === 0) continue;
          
          const avgBright = sumBright / count;
          const avgR = sumR / count, avgG = sumG / count, avgB = sumB / count;
          const maxRadius = cell / 2;
          const radius = (1 - avgBright) * maxRadius;
          
          const dotColor = params.halftoneColored 
            ? rgbToHex({ r: Math.round(avgR), g: Math.round(avgG), b: Math.round(avgB) }) 
            : '#000000';
            
          ctx.fillStyle = dotColor;
          drawHalftoneDot(ctx, x, y, radius, params.halftoneShape);
        }
      }
    };
    
    // Circular arrangement halftone
    const renderHalftoneCircular = (
      ctx: CanvasRenderingContext2D, 
      processed: ImageData, 
      width: number, 
      height: number
    ) => {
      const cx = width / 2, cy = height / 2;
      const maxRadius = Math.hypot(cx, cy);
      const ringStep = params.halftoneCellSize;
      
      for (let r = 0; r < maxRadius; r += ringStep) {
        const circumference = 2 * Math.PI * r;
        const dots = r === 0 ? 1 : Math.ceil(circumference / params.halftoneCellSize);
        
        for (let i = 0; i < dots; i++) {
          const theta = (2 * Math.PI * i) / dots;
          const x = cx + r * Math.cos(theta);
          const y = cy + r * Math.sin(theta);
          
          if (x < 0 || y < 0 || x >= width || y >= height) continue;
          
          let sumR = 0, sumG = 0, sumB = 0, sumBright = 0, count = 0;
          
          for (let j = Math.floor(y - params.halftoneCellSize / 2); j < Math.min(y + params.halftoneCellSize / 2, height); j++) {
            for (let k = Math.floor(x - params.halftoneCellSize / 2); k < Math.min(x + params.halftoneCellSize / 2, width); k++) {
              if (k < 0 || j < 0 || k >= width || j >= height) continue;
              
              const idx = (j * width + k) * 4;
              const r = processed.data[idx],
                    g = processed.data[idx + 1],
                    b = processed.data[idx + 2];
              const brightness = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
              sumR += r; sumG += g; sumB += b; sumBright += brightness;
              count++;
            }
          }
          
          if (count === 0) continue;
          
          const avgBright = sumBright / count;
          const avgR = sumR / count, avgG = sumG / count, avgB = sumB / count;
          const maxDotRadius = params.halftoneCellSize / 2;
          const dotRadius = (1 - avgBright) * maxDotRadius;
          
          const dotColor = params.halftoneColored 
            ? rgbToHex({ r: Math.round(avgR), g: Math.round(avgG), b: Math.round(avgB) }) 
            : '#000000';
            
          ctx.fillStyle = dotColor;
          drawHalftoneDot(ctx, x, y, dotRadius, params.halftoneShape);
        }
      }
    };
    
    return (
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-[60vh] object-contain border border-gray-200 rounded-lg shadow-inner"
        style={{ width: `${width}px`, height: `${height}px` }}
      />
    );
  }
);

ImageCanvas.displayName = 'ImageCanvas';

export default ImageCanvas; 