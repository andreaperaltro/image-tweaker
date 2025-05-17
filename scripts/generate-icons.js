const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const sizes = [192, 512];
const inputFile = path.join(__dirname, '../public/icons/icon.svg');
const outputDir = path.join(__dirname, '../public/icons');

async function generateIcons() {
  try {
    // Ensure the output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Read the SVG file
    const svgBuffer = fs.readFileSync(inputFile);

    // Generate icons for each size
    for (const size of sizes) {
      const outputFile = path.join(outputDir, `icon-${size}x${size}.png`);
      console.log(`Generating ${outputFile}...`);

      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputFile);
    }

    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons(); 