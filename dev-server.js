const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

// Run the favicon fix script first
require('./favicon-fix');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3001;

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    const { pathname } = parsedUrl;
    
    // Handle favicon.ico requests directly
    if (pathname === '/favicon.ico') {
      try {
        const faviconPath = path.join(__dirname, 'public', 'favicon.ico');
        const stat = fs.statSync(faviconPath);
        
        res.writeHead(200, {
          'Content-Type': 'image/x-icon',
          'Content-Length': stat.size,
          'Cache-Control': 'public, max-age=86400'
        });
        
        const readStream = fs.createReadStream(faviconPath);
        readStream.pipe(res);
      } catch (err) {
        console.error('Error serving favicon:', err);
        res.statusCode = 404;
        res.end('Not found');
      }
      return;
    }
    
    // For all other requests, let Next.js handle it
    handle(req, res, parsedUrl);
  }).listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
}); 