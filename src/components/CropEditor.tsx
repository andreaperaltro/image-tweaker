import React, { useState, useRef, useEffect } from 'react';

export type AspectRatio = 'free' | '1:1' | '4:3' | '16:9' | '3:2' | '5:4' | '2:1' | '3:4' | '9:16' | '2:3' | '4:5' | '1:2';

interface CropEditorProps {
  imageUrl: string;
  modifiedImageUrl: string;
  onCropComplete: (croppedOriginal: string, croppedModified: string) => void;
  onCancel: () => void;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function CropEditor({ imageUrl, modifiedImageUrl, onCropComplete, onCancel }: CropEditorProps) {
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('free');
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const cropBoxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const img = new Image();
    img.src = modifiedImageUrl;
    img.onload = () => {
      // Set up the canvas with the actual image dimensions
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Set canvas dimensions to match the image
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (ctx) {
          // Clear the canvas and draw the modified image
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        }
      }

      // Set the image size state
      setImageSize({ width: img.width, height: img.height });
      
      // Initialize crop area to match the actual image dimensions
      setCropArea({
        x: 0,
        y: 0,
        width: img.width,
        height: img.height
      });
    };
  }, [modifiedImageUrl]);

  const getAspectRatioValue = (ratio: AspectRatio): number | null => {
    if (ratio === 'free') return null;
    const [w, h] = ratio.split(':').map(Number);
    return w / h;
  };

  const updateCropArea = (newArea: Partial<CropArea>) => {
    const updatedArea = { ...cropArea, ...newArea };
    const ratio = getAspectRatioValue(aspectRatio);
    
    if (ratio !== null) {
      if (newArea.width !== undefined) {
        updatedArea.height = newArea.width / ratio;
      } else if (newArea.height !== undefined) {
        updatedArea.width = newArea.height * ratio;
      }
    }

    // Ensure crop area stays within image bounds
    updatedArea.x = Math.max(0, Math.min(updatedArea.x, imageSize.width - updatedArea.width));
    updatedArea.y = Math.max(0, Math.min(updatedArea.y, imageSize.height - updatedArea.height));
    updatedArea.width = Math.min(updatedArea.width, imageSize.width - updatedArea.x);
    updatedArea.height = Math.min(updatedArea.height, imageSize.height - updatedArea.y);

    setCropArea(updatedArea);
  };

  const handleMouseDown = (e: React.MouseEvent, action: 'drag' | 'resize', handle?: string) => {
    e.stopPropagation();
    setIsDragging(action === 'drag');
    setIsResizing(action === 'resize');
    setResizeHandle(handle || null);
    setStartPoint({ x: e.clientX, y: e.clientY });
  };

  const handleTouchStart = (e: React.TouchEvent, action: 'drag' | 'resize', handle?: string) => {
    e.stopPropagation();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(action === 'drag');
      setIsResizing(action === 'resize');
      setResizeHandle(handle || null);
      setStartPoint({ x: touch.clientX, y: touch.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging && !isResizing) return;

    const deltaX = e.clientX - startPoint.x;
    const deltaY = e.clientY - startPoint.y;

    if (isDragging) {
      updateCropArea({
        x: cropArea.x + deltaX,
        y: cropArea.y + deltaY
      });
    } else if (isResizing && resizeHandle) {
      let newArea: Partial<CropArea> = {};
      
      switch (resizeHandle) {
        case 'top-left':
          newArea = {
            x: cropArea.x + deltaX,
            y: cropArea.y + deltaY,
            width: cropArea.width - deltaX,
            height: cropArea.height - deltaY
          };
          break;
        case 'top-right':
          newArea = {
            y: cropArea.y + deltaY,
            width: cropArea.width + deltaX,
            height: cropArea.height - deltaY
          };
          break;
        case 'bottom-left':
          newArea = {
            x: cropArea.x + deltaX,
            width: cropArea.width - deltaX,
            height: cropArea.height + deltaY
          };
          break;
        case 'bottom-right':
          newArea = {
            width: cropArea.width + deltaX,
            height: cropArea.height + deltaY
          };
          break;
      }
      
      updateCropArea(newArea);
    }

    setStartPoint({ x: e.clientX, y: e.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging && !isResizing) return;
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startPoint.x;
    const deltaY = touch.clientY - startPoint.y;

    if (isDragging) {
      updateCropArea({
        x: cropArea.x + deltaX,
        y: cropArea.y + deltaY
      });
    } else if (isResizing && resizeHandle) {
      let newArea: Partial<CropArea> = {};
      
      switch (resizeHandle) {
        case 'top-left':
          newArea = {
            x: cropArea.x + deltaX,
            y: cropArea.y + deltaY,
            width: cropArea.width - deltaX,
            height: cropArea.height - deltaY
          };
          break;
        case 'top-right':
          newArea = {
            y: cropArea.y + deltaY,
            width: cropArea.width + deltaX,
            height: cropArea.height - deltaY
          };
          break;
        case 'bottom-left':
          newArea = {
            x: cropArea.x + deltaX,
            width: cropArea.width - deltaX,
            height: cropArea.height + deltaY
          };
          break;
        case 'bottom-right':
          newArea = {
            width: cropArea.width + deltaX,
            height: cropArea.height + deltaY
          };
          break;
      }
      
      updateCropArea(newArea);
    }

    setStartPoint({ x: touch.clientX, y: touch.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  const handleCrop = () => {
    // Create two canvases - one for original and one for modified
    const originalCanvas = document.createElement('canvas');
    const modifiedCanvas = document.createElement('canvas');
    const originalCtx = originalCanvas.getContext('2d');
    const modifiedCtx = modifiedCanvas.getContext('2d');
    
    if (!originalCtx || !modifiedCtx || !canvasRef.current) return;

    // Set canvas dimensions to match the crop area
    originalCanvas.width = cropArea.width;
    originalCanvas.height = cropArea.height;
    modifiedCanvas.width = cropArea.width;
    modifiedCanvas.height = cropArea.height;

    // Load both images
    const originalImg = new Image();
    const modifiedImg = new Image();
    
    originalImg.onload = () => {
      // Draw the cropped portion of the original image
      originalCtx.drawImage(
        originalImg,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        cropArea.width,
        cropArea.height
      );

      modifiedImg.onload = () => {
        // Draw the cropped portion of the modified image
        modifiedCtx.drawImage(
          modifiedImg,
          cropArea.x,
          cropArea.y,
          cropArea.width,
          cropArea.height,
          0,
          0,
          cropArea.width,
          cropArea.height
        );

        // Return both cropped images
        onCropComplete(originalCanvas.toDataURL(), modifiedCanvas.toDataURL());
      };
      modifiedImg.src = modifiedImageUrl;
    };
    originalImg.src = imageUrl;
  };

  // Add event listeners for mouse move and up
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging || isResizing) {
        handleMouseMove(e as unknown as React.MouseEvent);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging || isResizing) {
        handleMouseUp();
      }
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDragging || isResizing) {
        handleTouchMove(e as unknown as React.TouchEvent);
      }
    };

    const handleGlobalTouchEnd = () => {
      if (isDragging || isResizing) {
        handleTouchEnd();
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchmove', handleGlobalTouchMove);
    window.addEventListener('touchend', handleGlobalTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isDragging, isResizing, cropArea, startPoint, resizeHandle]);

  // Update crop area when aspect ratio changes
  useEffect(() => {
    if (imageSize.width === 0 || imageSize.height === 0) return;
    
    const ratio = getAspectRatioValue(aspectRatio);
    if (ratio === null) return; // Free aspect ratio, no need to adjust
    
    // Calculate new dimensions while maintaining the center point
    const centerX = cropArea.x + cropArea.width / 2;
    const centerY = cropArea.y + cropArea.height / 2;
    
    let newWidth, newHeight;
    
    // Determine if we should adjust width or height based on which is more constrained
    const currentRatio = cropArea.width / cropArea.height;
    
    if (currentRatio > ratio) {
      // Current crop is wider than target ratio, adjust width
      newHeight = cropArea.height;
      newWidth = newHeight * ratio;
    } else {
      // Current crop is taller than target ratio, adjust height
      newWidth = cropArea.width;
      newHeight = newWidth / ratio;
    }
    
    // Ensure the new crop area stays within image bounds
    const newX = Math.max(0, Math.min(centerX - newWidth / 2, imageSize.width - newWidth));
    const newY = Math.max(0, Math.min(centerY - newHeight / 2, imageSize.height - newHeight));
    
    // Update crop area
    setCropArea({
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight
    });
  }, [aspectRatio, imageSize]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[var(--accent-bg)] p-4 rounded-lg shadow-xl max-w-4xl w-full border border-[var(--border-color)]">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-bold font-mono uppercase text-[var(--text-primary)]">Crop Image</h2>
          <div className="space-x-2">
            <button
              onClick={onCancel}
              className="mobile-action-button secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleCrop}
              className="mobile-action-button"
            >
              Apply Crop
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {(['free', '1:1', '4:3', '16:9', '3:2', '5:4', '2:1', '3:4', '9:16', '2:3', '4:5', '1:2'] as AspectRatio[]).map((ratio) => (
            <button
              key={ratio}
              onClick={() => {
                setAspectRatio(ratio);
                // Add a visual feedback effect
                const button = document.activeElement as HTMLElement;
                if (button) {
                  button.classList.add('scale-95');
                  setTimeout(() => button.classList.remove('scale-95'), 150);
                }
              }}
              className={`px-3 py-1 rounded font-mono text-sm transition-all ${
                aspectRatio === ratio
                  ? 'bg-[var(--accent-color)] text-[var(--accent-text)] shadow-md'
                  : 'bg-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--border-color)]/80'
              }`}
            >
              {ratio}
            </button>
          ))}
        </div>

        <div
          ref={containerRef}
          className="relative overflow-hidden border-2 border-[var(--border-color)] rounded-lg"
          style={{
            maxHeight: 'calc(80vh - 200px)',
            maxWidth: '100%',
            margin: '0 auto',
            aspectRatio: `${imageSize.width}/${imageSize.height}`
          }}
        >
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full w-auto h-auto"
            style={{ 
              display: 'block',
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />
          <div
            ref={cropBoxRef}
            className="absolute border-2 border-[var(--accent-color)] shadow-lg"
            style={{
              left: `${(cropArea.x / imageSize.width) * 100}%`,
              top: `${(cropArea.y / imageSize.height) * 100}%`,
              width: `${(cropArea.width / imageSize.width) * 100}%`,
              height: `${(cropArea.height / imageSize.height) * 100}%`,
              cursor: isDragging ? 'grabbing' : 'grab',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)'
            }}
            onMouseDown={(e) => handleMouseDown(e, 'drag')}
            onTouchStart={(e) => handleTouchStart(e, 'drag')}
          >
            {/* Top-left handle */}
            <div
              className="absolute w-4 h-4 bg-[var(--accent-color)] cursor-nw-resize rounded-sm"
              style={{ left: '-8px', top: '-8px' }}
              onMouseDown={(e) => handleMouseDown(e, 'resize', 'top-left')}
              onTouchStart={(e) => handleTouchStart(e, 'resize', 'top-left')}
            />
            {/* Top-right handle */}
            <div
              className="absolute w-4 h-4 bg-[var(--accent-color)] cursor-ne-resize rounded-sm"
              style={{ right: '-8px', top: '-8px' }}
              onMouseDown={(e) => handleMouseDown(e, 'resize', 'top-right')}
              onTouchStart={(e) => handleTouchStart(e, 'resize', 'top-right')}
            />
            {/* Bottom-left handle */}
            <div
              className="absolute w-4 h-4 bg-[var(--accent-color)] cursor-sw-resize rounded-sm"
              style={{ left: '-8px', bottom: '-8px' }}
              onMouseDown={(e) => handleMouseDown(e, 'resize', 'bottom-left')}
              onTouchStart={(e) => handleTouchStart(e, 'resize', 'bottom-left')}
            />
            {/* Bottom-right handle */}
            <div
              className="absolute w-4 h-4 bg-[var(--accent-color)] cursor-se-resize rounded-sm"
              style={{ right: '-8px', bottom: '-8px' }}
              onMouseDown={(e) => handleMouseDown(e, 'resize', 'bottom-right')}
              onTouchStart={(e) => handleTouchStart(e, 'resize', 'bottom-right')}
            />
          </div>
        </div>

        <div className="mt-4 text-sm text-[var(--text-secondary)] font-mono space-y-1">
          <p>Drag the crop area to move it</p>
          <p>Drag any corner to resize</p>
          <p>Use the aspect ratio buttons above to lock the crop area to specific proportions</p>
        </div>
      </div>
    </div>
  );
} 