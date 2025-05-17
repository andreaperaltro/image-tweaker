/**
 * Slice Shift Effect Utility Functions
 * 
 * This module provides functionality for:
 * 1. Dividing an image into vertical/horizontal slices
 * 2. Shifting each slice horizontally/vertically
 * 3. Creating a sliced/fragmented visual effect
 */

export interface SliceShiftSettings {
  enabled: boolean;
  slices: number;        // Number of slices
  direction: 'vertical' | 'horizontal' | 'both'; // Slicing direction
  maxOffset: number;     // Maximum offset in pixels
  mode: 'random' | 'alternating' | 'wave' | 'rearrange' | 'repeat'; // Shift pattern
  intensity: number;     // Intensity of the shift effect (0-100)
  seed: number;          // Random seed for deterministic shifts
  feathering: boolean;   // Smooth edges between slices
  featherAmount: number; // Amount of edge feathering (0-100)
  rearrangeMode: 'random' | 'reverse' | 'alternate' | 'shuffle'; // Pattern for rearranging slices
  backgroundColor: string; // Background color for exposed areas
  useBackgroundColor: boolean; // Whether to use background color
}

/**
 * Apply the slice shift effect to a canvas
 */
export function applySliceShift(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  settings: SliceShiftSettings
): void {
  if (!settings.enabled) return;
  
  // Create a temporary canvas to work with
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  
  if (!tempCtx) return;
  
  // Draw the original image to the temporary canvas
  tempCtx.drawImage(sourceCanvas, 0, 0, width, height);
  
  // Clear the target canvas and fill with background color if enabled
  ctx.clearRect(0, 0, width, height);
  
  if (settings.useBackgroundColor) {
    ctx.fillStyle = settings.backgroundColor || '#000000';
    ctx.fillRect(0, 0, width, height);
  }
  
  // Apply intensity factor (0-100%)
  const intensityFactor = settings.intensity / 100;
  
  // Seed the random number generator for deterministic output
  const random = seedRandom(settings.seed);
  
  // Process vertical slices (columns)
  if (settings.direction === 'vertical' || settings.direction === 'both') {
    applySlicesInDirection(
      ctx, 
      tempCanvas, 
      width, 
      height, 
      settings, 
      random, 
      intensityFactor, 
      'vertical'
    );
  }
  
  // If direction is both, we need a new temp canvas with the result so far
  if (settings.direction === 'both') {
    const intermediateCanvas = document.createElement('canvas');
    intermediateCanvas.width = width;
    intermediateCanvas.height = height;
    const intermediateCtx = intermediateCanvas.getContext('2d');
    
    if (intermediateCtx) {
      // Copy the current result
      intermediateCtx.drawImage(ctx.canvas, 0, 0);
      
      // Clear the main canvas and refill with background if needed
      ctx.clearRect(0, 0, width, height);
      if (settings.useBackgroundColor) {
        ctx.fillStyle = settings.backgroundColor || '#000000';
        ctx.fillRect(0, 0, width, height);
      }
      
      // Now use the intermediate result as the source
      applySlicesInDirection(
        ctx, 
        intermediateCanvas, 
        width, 
        height, 
        settings, 
        random, 
        intensityFactor, 
        'horizontal'
      );
    }
  } 
  // Process horizontal slices (rows)
  else if (settings.direction === 'horizontal') {
    applySlicesInDirection(
      ctx, 
      tempCanvas, 
      width, 
      height, 
      settings, 
      random, 
      intensityFactor, 
      'horizontal'
    );
  }
}

/**
 * Apply slices in the specified direction
 */
function applySlicesInDirection(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  settings: SliceShiftSettings,
  random: () => number,
  intensityFactor: number,
  direction: 'vertical' | 'horizontal'
): void {
  // Determine if we're slicing vertically (columns) or horizontally (rows)
  const isVertical = direction === 'vertical';
  
  // Calculate slice dimensions
  const sliceSize = isVertical 
    ? width / settings.slices  // Width of each column
    : height / settings.slices; // Height of each row
  
  const totalSlices = settings.slices;
  
  // For rearrange mode, create a map of source to target indices
  let rearrangeMap: number[] = [];
  
  if (settings.mode === 'rearrange') {
    // Create an array of slice indices [0, 1, 2, ..., slices-1]
    const indices = Array.from({ length: totalSlices }, (_, i) => i);
    
    // Rearrange the indices based on the selected mode
    switch (settings.rearrangeMode) {
      case 'reverse':
        // Reverse the order of slices [n-1, n-2, ..., 1, 0]
        rearrangeMap = [...indices].reverse();
        break;
        
      case 'alternate':
        // Alternate odd and even slices [0, 2, 4, ..., 1, 3, 5, ...]
        const evenIndices = indices.filter(i => i % 2 === 0);
        const oddIndices = indices.filter(i => i % 2 === 1);
        rearrangeMap = [...evenIndices, ...oddIndices];
        break;
        
      case 'shuffle':
        // Shuffle the slices using Fisher-Yates algorithm with seeded random
        rearrangeMap = [...indices];
        for (let i = rearrangeMap.length - 1; i > 0; i--) {
          const j = Math.floor(random() * (i + 1));
          [rearrangeMap[i], rearrangeMap[j]] = [rearrangeMap[j], rearrangeMap[i]];
        }
        break;
        
      case 'random':
      default:
        // Generate a random mapping between source and target indices
        rearrangeMap = indices.map(() => Math.floor(random() * totalSlices));
        break;
    }
  }
  
  // Draw each slice
  for (let i = 0; i < totalSlices; i++) {
    // Calculate slice position
    const position = i * sliceSize;
    
    // Calculate actual size (handle the last slice which might be smaller)
    const actualSize = (i === totalSlices - 1) 
      ? (isVertical ? width - position : height - position)  // Handle any remainder
      : sliceSize; // All other slices have equal size
    
    if (actualSize <= 0) continue;
    
    // Calculate source and target positions
    let sourceIndex = i;
    let offset = 0;
    
    // Calculate offset based on the selected mode
    switch (settings.mode) {
      case 'random':
        // Random offset within the range [-maxOffset, maxOffset]
        offset = (random() * 2 - 1) * settings.maxOffset * intensityFactor;
        break;
        
      case 'alternating':
        // Alternating positive and negative offsets
        offset = (i % 2 === 0 ? 1 : -1) * settings.maxOffset * intensityFactor;
        break;
        
      case 'wave':
        // Sinusoidal wave pattern
        offset = Math.sin(i / totalSlices * Math.PI * 6) * settings.maxOffset * intensityFactor;
        break;
        
      case 'rearrange':
        // Use the precomputed rearrangement map
        sourceIndex = rearrangeMap[i];
        break;
        
      case 'repeat':
        // For repeat mode, we alternate between current and adjacent slices
        if (i % 2 === 1) {
          // Determine whether to repeat the previous or next slice
          const repeatPrevious = random() > 0.5;
          if (repeatPrevious && i > 0) {
            sourceIndex = i - 1;
          } else if (!repeatPrevious && i < totalSlices - 1) {
            sourceIndex = i + 1;
          }
        }
        break;
    }
    
    // Round offset to whole pixels for sharper effect
    offset = Math.round(offset);
    
    // Calculate source position
    const sourcePosition = sourceIndex * sliceSize;
    
    // Calculate target position (with offset)
    const targetPosition = position + offset;
    
    // Set up source and target coordinates based on direction
    let sourceX, sourceY, sourceWidth, sourceHeight;
    let targetX, targetY, targetWidth, targetHeight;
    
    if (isVertical) {
      // For vertical slices (columns)
      sourceX = sourcePosition;
      sourceY = 0;
      sourceWidth = actualSize;
      sourceHeight = height;
      
      targetX = targetPosition;
      targetY = 0;
      targetWidth = actualSize;
      targetHeight = height;
    } else {
      // For horizontal slices (rows)
      sourceX = 0;
      sourceY = sourcePosition;
      sourceWidth = width;
      sourceHeight = actualSize;
      
      targetX = 0;
      targetY = targetPosition;
      targetWidth = width;
      targetHeight = actualSize;
    }
    
    // Apply the slice
    if (settings.feathering && settings.featherAmount > 0) {
      // Calculate feather size based on slice size
      const featherSize = settings.featherAmount / 100 * sliceSize / 2;
      
      // Draw with feathering based on direction
      if (isVertical) {
        drawFeatheredVerticalSlice(
          ctx, sourceCanvas, 
          sourceX, sourceY, sourceWidth, sourceHeight,
          targetX, targetY, featherSize
        );
      } else {
        drawFeatheredHorizontalSlice(
          ctx, sourceCanvas, 
          sourceX, sourceY, sourceWidth, sourceHeight,
          targetX, targetY, featherSize
        );
      }
    } else {
      // Draw without feathering (sharp edges)
      ctx.drawImage(
        sourceCanvas,
        sourceX, sourceY, sourceWidth, sourceHeight,
        targetX, targetY, targetWidth, targetHeight
      );
    }
  }
}

/**
 * Draw a vertical slice with feathered edges
 */
function drawFeatheredVerticalSlice(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  sourceX: number,
  sourceY: number,
  width: number,
  height: number,
  targetX: number,
  targetY: number,
  featherSize: number
): void {
  // Draw the main slice
  ctx.drawImage(
    sourceCanvas,
    sourceX, sourceY, width, height,
    targetX, targetY, width, height
  );
  
  // If feather size is too small, skip feathering
  if (featherSize < 1) return;
  
  // Create a separate canvas for the feathered edges
  const featherCanvas = document.createElement('canvas');
  featherCanvas.width = width;
  featherCanvas.height = height;
  const featherCtx = featherCanvas.getContext('2d');
  
  if (!featherCtx) return;
  
  // Draw the slice to the feather canvas
  featherCtx.drawImage(
    sourceCanvas,
    sourceX, sourceY, width, height,
    0, 0, width, height
  );
  
  // Create a gradient for the left edge
  const leftGradient = featherCtx.createLinearGradient(0, 0, featherSize, 0);
  leftGradient.addColorStop(0, 'rgba(0,0,0,0)');
  leftGradient.addColorStop(1, 'rgba(0,0,0,1)');
  
  // Create a gradient for the right edge
  const rightGradient = featherCtx.createLinearGradient(width - featherSize, 0, width, 0);
  rightGradient.addColorStop(0, 'rgba(0,0,0,1)');
  rightGradient.addColorStop(1, 'rgba(0,0,0,0)');
  
  // Apply the gradients as masks
  featherCtx.globalCompositeOperation = 'destination-in';
  
  // Apply left gradient if not at the left edge of the canvas
  if (sourceX > 0) {
    featherCtx.fillStyle = leftGradient;
    featherCtx.fillRect(0, 0, featherSize, height);
  }
  
  // Apply right gradient if not at the right edge of the canvas
  if (sourceX + width < sourceCanvas.width) {
    featherCtx.fillStyle = rightGradient;
    featherCtx.fillRect(width - featherSize, 0, featherSize, height);
  }
  
  // Draw the feathered slice to the main canvas
  ctx.drawImage(featherCanvas, 0, 0, width, height, targetX, targetY, width, height);
}

/**
 * Draw a horizontal slice with feathered edges
 */
function drawFeatheredHorizontalSlice(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  sourceX: number,
  sourceY: number,
  width: number,
  height: number,
  targetX: number,
  targetY: number,
  featherSize: number
): void {
  // Draw the main slice
  ctx.drawImage(
    sourceCanvas,
    sourceX, sourceY, width, height,
    targetX, targetY, width, height
  );
  
  // If feather size is too small, skip feathering
  if (featherSize < 1) return;
  
  // Create a separate canvas for the feathered edges
  const featherCanvas = document.createElement('canvas');
  featherCanvas.width = width;
  featherCanvas.height = height;
  const featherCtx = featherCanvas.getContext('2d');
  
  if (!featherCtx) return;
  
  // Draw the slice to the feather canvas
  featherCtx.drawImage(
    sourceCanvas,
    sourceX, sourceY, width, height,
    0, 0, width, height
  );
  
  // Create a gradient for the top edge
  const topGradient = featherCtx.createLinearGradient(0, 0, 0, featherSize);
  topGradient.addColorStop(0, 'rgba(0,0,0,0)');
  topGradient.addColorStop(1, 'rgba(0,0,0,1)');
  
  // Create a gradient for the bottom edge
  const bottomGradient = featherCtx.createLinearGradient(0, height - featherSize, 0, height);
  bottomGradient.addColorStop(0, 'rgba(0,0,0,1)');
  bottomGradient.addColorStop(1, 'rgba(0,0,0,0)');
  
  // Apply the gradients as masks
  featherCtx.globalCompositeOperation = 'destination-in';
  
  // Apply top gradient if not at the top edge of the canvas
  if (sourceY > 0) {
    featherCtx.fillStyle = topGradient;
    featherCtx.fillRect(0, 0, width, featherSize);
  }
  
  // Apply bottom gradient if not at the bottom edge of the canvas
  if (sourceY + height < sourceCanvas.height) {
    featherCtx.fillStyle = bottomGradient;
    featherCtx.fillRect(0, height - featherSize, width, featherSize);
  }
  
  // Draw the feathered slice to the main canvas
  ctx.drawImage(featherCanvas, 0, 0, width, height, targetX, targetY, width, height);
}

/**
 * Create a deterministic random number generator with a seed
 */
function seedRandom(seed: number): () => number {
  return () => {
    // Simple xorshift-based PRNG
    seed = (seed ^ (seed << 13)) ^ (seed >>> 17) ^ (seed << 5);
    return (seed < 0 ? ~seed + 1 : seed) % 1000 / 1000;
  };
} 