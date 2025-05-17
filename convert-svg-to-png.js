const fs = require('fs');
const sharp = require('sharp');

async function convertSvgToPng() {
  try {
    console.log('Reading SVG file...');
    const svgBuffer = fs.readFileSync('public/icons/icon.svg');
    
    // Define the sizes we want to create
    const sizes = [16, 32, 48, 192, 512];
    
    // Process each size
    for (const size of sizes) {
      console.log(`Converting SVG to ${size}x${size} PNG...`);
      
      // Convert the SVG to PNG at the target size
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(size <= 48 ? `public/favicon-${size}.png` : `public/icons/icon-${size}x${size}.png`);
      
      console.log(`Created ${size}x${size} PNG file`);
    }
    
    // Create the main favicon.png
    fs.copyFileSync('public/favicon-32.png', 'public/favicon.png');
    console.log('Created main favicon.png');
    
    // Clean up temporary files
    [16, 32, 48].forEach(size => {
      if (size !== 32) { // Keep the 32px version for browsers
        fs.unlinkSync(`public/favicon-${size}.png`);
      }
    });
    
    console.log('All icons have been created successfully!');
  } catch (error) {
    console.error('Error converting SVG to PNG:', error);
  }
}

// Install sharp if not already installed
try {
  require.resolve('sharp');
  convertSvgToPng();
} catch (e) {
  console.log('Installing sharp package...');
  const { execSync } = require('child_process');
  execSync('npm install sharp', { stdio: 'inherit' });
  console.log('Sharp installed. Converting images...');
  convertSvgToPng();
} 