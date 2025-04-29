const fs = require('fs');
const path = require('path');
const https = require('https');

const fonts = {
  'PPMondwest-Regular.otf': 'https://github.com/andreaperato/imagetweaker/raw/main/public/fonts/PPMondwest-Regular.otf',
  'PPMondwest-Bold.otf': 'https://github.com/andreaperato/imagetweaker/raw/main/public/fonts/PPMondwest-Bold.otf'
};

const fontsDir = path.join(__dirname, '..', 'public', 'fonts');

// Create fonts directory if it doesn't exist
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

// Download each font
Object.entries(fonts).forEach(([filename, url]) => {
  const filePath = path.join(fontsDir, filename);
  const file = fs.createWriteStream(filePath);
  
  https.get(url, (response) => {
    response.pipe(file);
    
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${filename}`);
    });
  }).on('error', (err) => {
    fs.unlink(filePath, () => {});
    console.error(`Error downloading ${filename}:`, err.message);
  });
}); 