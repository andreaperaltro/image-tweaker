import React, { useRef, useCallback, useEffect } from 'react';
import { PaintEffectSettings, PaintStroke, PaintPoint } from '../types';

export const applyPaintEffect = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  sourceCanvas: HTMLCanvasElement,
  settings: PaintEffectSettings
) => {
  // Debug: Check if source canvas has content
  const sourceCtx = sourceCanvas.getContext('2d');
  const sourceImageData = sourceCtx?.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const hasSourceContent = sourceImageData && sourceImageData.data.some(pixel => pixel !== 0);
  
  console.log('Paint effect debug:');
  console.log('- Source canvas has content:', hasSourceContent);
  console.log('- Source canvas dimensions:', sourceCanvas.width, 'x', sourceCanvas.height);
  console.log('- Target canvas dimensions:', canvas.width, 'x', canvas.height);
  
  // For paint effects, we want to preserve the current state and add paint on top
  // The canvas should already have the current state from previous effects
  // We don't clear or redraw - we just add paint strokes on top
  
  // Check if the canvas already has content
  const currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const hasCurrentContent = currentImageData.data.some(pixel => pixel !== 0);
  
  if (!hasCurrentContent) {
    // If canvas is empty, try to draw from source canvas
    try {
      ctx.drawImage(sourceCanvas, 0, 0);
      console.log('- Canvas was empty, drew source image');
    } catch (error) {
      console.error('- Error drawing source image:', error);
    }
  } else {
    console.log('- Canvas already has content, preserving current state');
  }

  // If not enabled or no strokes, just return (image is already copied)
  if (!settings.enabled || !settings.strokes || settings.strokes.length === 0) {
    return;
  }

  // Apply each paint stroke
  settings.strokes.forEach((stroke, index) => {
    if (!stroke || !stroke.points || stroke.points.length < 2) {
      return;
    }

    ctx.save();
    ctx.globalCompositeOperation = stroke.blendMode || 'source-over';
    ctx.globalAlpha = stroke.opacity || 1;
    ctx.strokeStyle = stroke.color || '#000000';
    ctx.lineWidth = stroke.brushSize || 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    
    ctx.stroke();
    ctx.restore();
  });
};

export interface PaintCanvasProps {
  canvas: HTMLCanvasElement | null;
  settings: PaintEffectSettings;
  onSettingsChange: (settings: Partial<PaintEffectSettings>) => void;
  enabled: boolean;
}

export const usePaintCanvasInteraction = ({
  canvas,
  settings,
  onSettingsChange,
  enabled
}: PaintCanvasProps) => {
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<PaintPoint[]>([]);

  const getCanvasCoordinates = useCallback((event: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in event) {
      const touch = event.touches[0] || event.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    } else {
      return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
      };
    }
  }, []);

  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (!enabled || !canvas) return;
    
    event.preventDefault();
    isDrawingRef.current = true;
    const coords = getCanvasCoordinates(event, canvas);
    currentStrokeRef.current = [coords];
  }, [enabled, canvas, getCanvasCoordinates]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!enabled || !canvas || !isDrawingRef.current) return;
    
    event.preventDefault();
    const coords = getCanvasCoordinates(event, canvas);
    currentStrokeRef.current.push(coords);
    
    // Draw preview directly on canvas for smooth real-time feedback
    const ctx = canvas.getContext('2d');
    if (ctx && currentStrokeRef.current.length > 1) {
      // Draw the entire current stroke for smooth real-time feedback
      ctx.save();
      ctx.globalCompositeOperation = settings.blendMode || 'source-over';
      ctx.globalAlpha = settings.opacity || 1;
      ctx.strokeStyle = settings.color || '#000000';
      ctx.lineWidth = settings.brushSize || 10;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(currentStrokeRef.current[0].x, currentStrokeRef.current[0].y);
      
      // Draw through all points to create a smooth continuous line
      for (let i = 1; i < currentStrokeRef.current.length; i++) {
        ctx.lineTo(currentStrokeRef.current[i].x, currentStrokeRef.current[i].y);
      }
      
      ctx.stroke();
      ctx.restore();
    }
  }, [enabled, canvas, settings, getCanvasCoordinates]);

  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (!enabled || !canvas || !isDrawingRef.current) return;
    
    event.preventDefault();
    isDrawingRef.current = false;
    
    if (currentStrokeRef.current.length > 1) {
      const newStroke: PaintStroke = {
        points: [...currentStrokeRef.current],
        brushSize: settings.brushSize,
        color: settings.color,
        opacity: settings.opacity,
        blendMode: settings.blendMode
      };
      
      const newStrokes = [...(settings.strokes || []), newStroke];
      onSettingsChange({ strokes: newStrokes });
    }
    
    currentStrokeRef.current = [];
  }, [enabled, canvas, settings, onSettingsChange]);

  // Touch event handlers
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (!enabled || !canvas) return;
    event.preventDefault();
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: event.touches[0].clientX,
      clientY: event.touches[0].clientY
    });
    handleMouseDown(mouseEvent);
  }, [enabled, canvas, handleMouseDown]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!enabled || !canvas) return;
    event.preventDefault();
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: event.touches[0].clientX,
      clientY: event.touches[0].clientY
    });
    handleMouseMove(mouseEvent);
  }, [enabled, canvas, handleMouseMove]);

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (!enabled || !canvas) return;
    event.preventDefault();
    const lastTouch = event.changedTouches[0];
    const mouseEvent = new MouseEvent('mouseup', {
      clientX: lastTouch.clientX,
      clientY: lastTouch.clientY
    });
    handleMouseUp(mouseEvent);
  }, [enabled, canvas, handleMouseUp]);

  useEffect(() => {
    if (!canvas || !enabled) return;

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp); // End drawing when leaving canvas
    
    // Touch events
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Change cursor to indicate paint mode
    canvas.style.cursor = 'crosshair';

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
      
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      
      canvas.style.cursor = 'default';
    };
  }, [canvas, enabled, handleMouseDown, handleMouseMove, handleMouseUp, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return null;
};

export default applyPaintEffect; 