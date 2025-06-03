import { ThreeDEffectSettings } from '../types';
// @ts-expect-error: No types for 'perspective-transform'
import PerspT from 'perspective-transform';

// Helper: 3D rotation and projection
function getProjectedCorners(width: number, height: number, settings: ThreeDEffectSettings) {
  // Add robust defaults for all fields
  const rotationX = settings.rotationX ?? 0;
  const rotationY = settings.rotationY ?? 0;
  const rotationZ = settings.rotationZ ?? 0;
  const scale = settings.scale ?? 1;
  const perspective = settings.perspective ?? 45;
  const distance = settings.distance ?? 500;

  // Clamp values to prevent extreme transformations
  const clampedScale = Math.max(0.1, Math.min(2, scale));
  const clampedDistance = Math.max(100, Math.min(2000, distance));
  const clampedPerspective = Math.max(1, Math.min(90, perspective));

  // Convert degrees to radians
  const rx = (rotationX * Math.PI) / 180;
  const ry = (rotationY * Math.PI) / 180;
  const rz = (rotationZ * Math.PI) / 180;

  // 3D points (centered)
  const hw = width / 2, hh = height / 2;
  const points = [
    [-hw, -hh, 0], // TL
    [ hw, -hh, 0], // TR
    [ hw,  hh, 0], // BR
    [-hw,  hh, 0], // BL
  ];

  // Rotation matrices
  function rotate([x, y, z]: number[]) {
    // X
    let y1 = y * Math.cos(rx) - z * Math.sin(rx);
    let z1 = y * Math.sin(rx) + z * Math.cos(rx);
    let x1 = x;
    // Y
    let z2 = z1 * Math.cos(ry) - x1 * Math.sin(ry);
    let x2 = z1 * Math.sin(ry) + x1 * Math.cos(ry);
    let y2 = y1;
    // Z
    let x3 = x2 * Math.cos(rz) - y2 * Math.sin(rz);
    let y3 = x2 * Math.sin(rz) + y2 * Math.cos(rz);
    let z3 = z2;
    return [x3 * clampedScale, y3 * clampedScale, z3 * clampedScale];
  }

  // Perspective projection
  const focal = clampedDistance / Math.tan((clampedPerspective * Math.PI) / 360);
  function project([x, y, z]: number[]) {
    const dz = z + clampedDistance;
    if (dz <= 0) return [0, 0]; // Prevent division by zero
    return [
      (x * focal) / dz,
      (y * focal) / dz
    ];
  }

  // Apply rotation and projection
  return points.map(pt => {
    const r = rotate(pt);
    const [px, py] = project(r);
    // Ensure we return valid numbers
    return [
      isFinite(px) ? px : 0,
      isFinite(py) ? py : 0
    ];
  });
}

export function applyThreeDEffect(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  settings: ThreeDEffectSettings
) {
  if (!settings.enabled) return;
  
  // Add robust default for backgroundColor
  const backgroundColor = settings.backgroundColor ?? '#000000';

  // Compute projected corners
  const dst = getProjectedCorners(width, height, settings);
  
  // Source corners (image)
  const src = [
    [0, 0],
    [width, 0],
    [width, height],
    [0, height]
  ];

  // Defensive check
  if (!Array.isArray(src) || src.length !== 4 || !Array.isArray(dst) || dst.length !== 4) {
    console.error('3D Effect: src or dst is not a valid array of four [x, y] points', { src, dst });
    return;
  }

  if (src.some(pt => !Array.isArray(pt) || pt.length !== 2) || dst.some(pt => !Array.isArray(pt) || pt.length !== 2)) {
    console.error('3D Effect: src or dst contains invalid points', { src, dst });
    return;
  }

  // Center and clamp the dst points to reasonable bounds
  const dstCentered = dst.map(([x, y]) => {
    const px = x + width / 2;
    const py = y + height / 2;
    return [
      Math.max(-width, Math.min(width * 2, px)),
      Math.max(-height, Math.min(height * 2, py))
    ];
  });

  // Check for NaN/undefined in points
  const allPoints = [...src, ...dstCentered];
  for (const pt of allPoints) {
    if (pt.some(v => typeof v !== 'number' || !isFinite(v))) {
      console.error('3D Effect: src or dst contains NaN/undefined/non-finite', { src, dstCentered, pt });
      return;
    }
  }

  // Create a temporary canvas for the transformation
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;

  // Fill background
  tempCtx.fillStyle = backgroundColor;
  tempCtx.fillRect(0, 0, width, height);

  let persp;
  try {
    // Create perspective transform with source and destination points
    persp = PerspT(src.flat(), dstCentered.flat());
    
    if (!persp || typeof persp.transform !== 'function') {
      throw new Error('Invalid perspective transform object');
    }
  } catch (e) {
    console.error('3D Effect: Error creating perspective transform', e, { src, dstCentered });
    // Fallback: just draw the original image
    tempCtx.drawImage(sourceCanvas, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(tempCanvas, 0, 0);
    return;
  }

  // For each pixel in the destination, map back to the source
  const imgData = tempCtx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const srcCtx = sourceCanvas.getContext('2d');
  if (!srcCtx) return;
  const srcData = srcCtx.getImageData(0, 0, width, height);
  const sdata = srcData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let srcPoint;
      try {
        srcPoint = persp.transformInverse(x, y);
        if (!Array.isArray(srcPoint) || srcPoint.length !== 2) continue;
      } catch (e) {
        continue;
      }

      const [u, v] = srcPoint;
      const sx = Math.floor(u);
      const sy = Math.floor(v);
      
      if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
        const si = (sy * width + sx) * 4;
        const di = (y * width + x) * 4;
        data[di] = sdata[si];
        data[di + 1] = sdata[si + 1];
        data[di + 2] = sdata[si + 2];
        data[di + 3] = sdata[si + 3];
      }
    }
  }

  tempCtx.putImageData(imgData, 0, 0);

  // Draw to main canvas
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(tempCanvas, 0, 0);
} 