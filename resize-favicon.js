const fs = require('fs');
const sharp = require('sharp');

async function resizeFavicon() {
  try {
    console.log('Reading original PNG...');
    const inputBuffer = fs.readFileSync('temp_upload/imagetweaker-2025-05-03T15-17-31.png');
    
    // Standard favicon sizes
    const sizes = [16, 32, 48, 64];
    
    // Process each size
    for (const size of sizes) {
      console.log(`Resizing to ${size}x${size}...`);
      
      await sharp(inputBuffer)
        .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toFile(`public/favicon-${size}.png`);
    }
    
    // Create main favicon.png (32x32 is standard)
    fs.copyFileSync('public/favicon-32.png', 'public/favicon.png');
    console.log('Created main favicon.png (32x32)');
    
    // Create favicon.ico from the 32x32 version
    fs.copyFileSync('public/favicon-32.png', 'public/favicon.ico');
    console.log('Created favicon.ico from 32x32 PNG');
    
    console.log('Favicon resizing complete!');
  } catch (error) {
    console.error('Error resizing favicon:', error);
  }
}

resizeFavicon(); 