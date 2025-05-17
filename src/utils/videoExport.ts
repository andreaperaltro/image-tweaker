/**
 * Utilities for exporting canvas animations to video
 */

export interface VideoExportOptions {
  fps: number;
  duration: number;
  width: number;
  height: number;
  quality?: number; // Between 0-1, default 0.95
  format?: 'webm' | 'mp4'; // Video format, default 'webm'
}

// Detect browser support for different video formats
const getSupportedMimeType = (format: 'mp4' | 'webm'): string | null => {
  const mimeTypes = {
    mp4: [
      'video/mp4;codecs=h264',
      'video/mp4;codecs=avc1',
      'video/mp4'
    ],
    webm: [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm'
    ]
  };

  for (const mimeType of mimeTypes[format]) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  
  return null;
};

/**
 * Export a canvas animation to a video blob
 */
export async function exportVideo(
  canvas: HTMLCanvasElement,
  options: VideoExportOptions,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const { fps, duration, width, height, quality = 0.95, format = 'webm' } = options;
  
  // Configure video encoder
  const totalFrames = Math.ceil(fps * duration);
  
  // Try to use the requested format, fallback to WebM if not supported
  let selectedMimeType = getSupportedMimeType(format);
  if (!selectedMimeType) {
    console.warn(`${format.toUpperCase()} format is not supported by this browser. Falling back to WebM.`);
    selectedMimeType = getSupportedMimeType('webm');
    
    if (!selectedMimeType) {
      throw new Error('Neither MP4 nor WebM formats are supported by this browser.');
    }
  }
  
  // Create an offscreen buffer canvas for rendering frames
  const bufferCanvas = document.createElement('canvas');
  bufferCanvas.width = width;
  bufferCanvas.height = height;
  const bufferCtx = bufferCanvas.getContext('2d', { alpha: false });
  
  if (!bufferCtx) {
    throw new Error('Failed to create buffer canvas context');
  }
  
  // Create recorder for the buffer canvas
  const stream = bufferCanvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType: selectedMimeType,
    videoBitsPerSecond: 8000000 // 8 Mbps for higher quality
  });
  
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      chunks.push(e.data);
    }
  };
  
  // Pre-render all frames first to ensure consistency
  const framePromises: Promise<void>[] = [];
  const frames: ImageData[] = [];
  
  // Function to render a single frame at the specified time
  const renderFrame = (time: number): Promise<void> => {
    return new Promise((resolve) => {
      // Dispatch event with the current time
      const event = new CustomEvent('requestframe', { 
        detail: { time: time }
      });
      
      canvas.dispatchEvent(event);
      
      // Give the browser time to render
      setTimeout(() => {
        // Capture the frame from the main canvas
        const frameData = canvas.getContext('2d')?.getImageData(0, 0, width, height);
        if (frameData) {
          frames.push(frameData);
        }
        resolve();
      }, 50); // Small delay to ensure rendering is complete
    });
  };
  
  // Return a promise that resolves when recording is complete
  return new Promise<Blob>(async (resolve, reject) => {
    try {
      // Pre-render all frames
      for (let i = 0; i < totalFrames; i++) {
        const time = (i / totalFrames) * duration;
        await renderFrame(time);
        
        // Report progress of frame rendering
        if (onProgress) {
          onProgress(i / totalFrames * 0.5); // First half of progress is frame rendering
        }
      }
      
      // Setup recorder onStop handler
      recorder.onstop = () => {
        // Determine the correct mime type for the output blob
        const outputMimeType = selectedMimeType?.split(';')[0] || 'video/webm';
        const videoBlob = new Blob(chunks, { type: outputMimeType });
        resolve(videoBlob);
      };
      
      recorder.onerror = (event) => {
        reject(new Error('MediaRecorder error: ' + event));
      };
      
      // Start recording
      recorder.start();
      
      // Now draw each pre-rendered frame to the buffer canvas
      let frameIndex = 0;
      const frameInterval = 1000 / fps;
      
      const drawNextFrame = () => {
        if (frameIndex >= frames.length) {
          recorder.stop();
          return;
        }
        
        // Draw the frame to the buffer canvas
        bufferCtx.putImageData(frames[frameIndex], 0, 0);
        
        // Report progress of video encoding
        if (onProgress) {
          // Second half of progress is video encoding
          onProgress(0.5 + (frameIndex / frames.length * 0.5));
        }
        
        frameIndex++;
        setTimeout(drawNextFrame, frameInterval);
      };
      
      // Start drawing frames
      drawNextFrame();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Save a video blob to the user's device
 */
export function downloadVideo(videoBlob: Blob, filename: string = 'animation.webm'): void {
  // Update filename extension based on mimetype
  if (videoBlob.type.includes('mp4')) {
    filename = filename.replace(/\.\w+$/, '.mp4');
  } else {
    filename = filename.replace(/\.\w+$/, '.webm');
  }
  
  const url = URL.createObjectURL(videoBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
} 