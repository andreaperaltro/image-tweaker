const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Script to ensure favicon files are available and properly formatted

function fixFavicon() {
  console.log('Starting enhanced favicon fix...');
  
  const publicDir = path.join(__dirname, 'public');
  
  // Check if favicon.png exists
  const faviconPngPath = path.join(publicDir, 'favicon.png');
  const favicon32Path = path.join(publicDir, 'favicon-32.png');
  
  // If favicon-32.png exists but favicon.png doesn't, create it
  if (fs.existsSync(favicon32Path) && !fs.existsSync(faviconPngPath)) {
    fs.copyFileSync(favicon32Path, faviconPngPath);
    console.log('Created favicon.png from favicon-32.png');
  }
  
  // Ensure the favicon.ico exists and is valid
  const faviconIcoPath = path.join(publicDir, 'favicon.ico');
  
  // First, try to see if we have the proper tools to create a real ICO file
  let isImageMagickAvailable = false;
  try {
    execSync('convert -version', { stdio: 'ignore' });
    isImageMagickAvailable = true;
    console.log('ImageMagick is available, will use it to create proper ICO file');
  } catch (error) {
    console.log('ImageMagick not available, will use PNG as ICO');
  }
  
  try {
    if (isImageMagickAvailable) {
      // Use ImageMagick to create a proper favicon.ico from multiple sizes
      const favicon16Path = path.join(publicDir, 'favicon-16.png');
      const favicon48Path = path.join(publicDir, 'favicon-48.png');
      
      if (fs.existsSync(favicon16Path) && fs.existsSync(favicon32Path) && fs.existsSync(favicon48Path)) {
        try {
          execSync(`convert ${favicon16Path} ${favicon32Path} ${favicon48Path} ${faviconIcoPath}`);
          console.log('Created proper multi-size favicon.ico using ImageMagick');
        } catch (error) {
          console.error('Error creating favicon.ico with ImageMagick:', error);
          if (fs.existsSync(favicon32Path)) {
            fs.copyFileSync(favicon32Path, faviconIcoPath);
            console.log('Fallback: Created favicon.ico by copying favicon-32.png');
          }
        }
      } else {
        if (fs.existsSync(favicon32Path)) {
          execSync(`convert ${favicon32Path} ${faviconIcoPath}`);
          console.log('Created favicon.ico using ImageMagick with just 32px');
        }
      }
    } else {
      // Just copy the PNG as ICO if ImageMagick is not available
      if (fs.existsSync(favicon32Path) && (!fs.existsSync(faviconIcoPath) || fs.statSync(faviconIcoPath).size === 0)) {
        fs.copyFileSync(favicon32Path, faviconIcoPath);
        console.log('Created simple favicon.ico by copying favicon-32.png');
      }
    }
  } catch (error) {
    console.error('Error with favicon operations:', error);
  }
  
  // Verify that favicon.ico exists and has content
  if (!fs.existsSync(faviconIcoPath) || fs.statSync(faviconIcoPath).size === 0) {
    // Last resort - create a simple favicon from any available PNG
    const availablePngs = ['favicon-32.png', 'favicon.png', 'favicon-16.png', 'favicon-48.png']
      .map(file => path.join(publicDir, file))
      .filter(file => fs.existsSync(file));
    
    if (availablePngs.length > 0) {
      fs.copyFileSync(availablePngs[0], faviconIcoPath);
      console.log(`Last resort: Created favicon.ico from ${path.basename(availablePngs[0])}`);
    } else {
      console.error('No favicon source files found! Unable to create favicon.ico');
    }
  }
  
  console.log('Favicon fix complete!');
}

fixFavicon(); 