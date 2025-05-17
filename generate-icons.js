const fs = require('fs');
const { createCanvas } = require('canvas');

// Function to create a pixel art icon
function createPixelArtIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#0000FF';
  ctx.fillRect(0, 0, size, size);
  
  const pixelSize = size / 32; // Our source art is 32x32 pixels
  
  // White pixels for the central shape (T-like shape)
  const whitePixels = [
    [11, 6], [12, 6],
    [10, 7], [11, 7],
    [9, 8], [10, 8],
    [9, 9], [10, 9],
    [9, 10], [10, 10],
    [8, 11], [9, 11], [10, 11],
    [8, 12], [9, 12], [10, 12],
    [8, 13], [9, 13], [10, 13],
    [10, 14], [11, 14],
    [11, 15], [12, 15],
    [12, 16], [13, 16],
    [13, 17], [14, 17],
    [14, 18], [15, 18],
    [15, 19], [16, 19],
    [15, 20], [16, 20],
    [14, 21], [15, 21],
    [13, 22], [14, 22],
    [12, 23], [13, 23], [14, 23],
    [11, 24], [12, 24], [13, 24], [14, 24],
    [10, 25], [11, 25], [12, 25], [13, 25], [14, 25]
  ];
  
  ctx.fillStyle = '#FFFFFF';
  whitePixels.forEach(([x, y]) => {
    ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
  });
  
  // Green pixels scattered around
  const greenPixels = [
    [5, 7], [13, 9], [18, 11], [4, 14], [21, 15],
    [24, 18], [6, 21], [19, 24], [26, 26], [3, 28]
  ];
  
  ctx.fillStyle = '#00FF00';
  greenPixels.forEach(([x, y]) => {
    ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
  });
  
  // Additional white pixels scattered around
  const additionalWhitePixels = [
    [2, 5], [17, 4], [23, 6], [28, 9], [7, 16],
    [22, 21], [27, 23], [4, 24], [29, 28]
  ];
  
  ctx.fillStyle = '#FFFFFF';
  additionalWhitePixels.forEach(([x, y]) => {
    ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
  });
  
  return canvas.toBuffer('image/png');
}

// Generate icons in different sizes
const sizes = [192, 512];
sizes.forEach(size => {
  const iconBuffer = createPixelArtIcon(size);
  fs.writeFileSync(`public/icons/icon-${size}x${size}.png`, iconBuffer);
  console.log(`Created icon-${size}x${size}.png`);
});

console.log('Icon generation complete!'); 