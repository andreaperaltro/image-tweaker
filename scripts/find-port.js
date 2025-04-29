const findPortSync = require('find-port-sync');
const fs = require('fs');
const path = require('path');

// Try to find an available port starting from 3000
const port = findPortSync({ start: 3000, end: 3100 });

// Write the port to a temporary file
fs.writeFileSync(path.join(__dirname, 'port.txt'), port.toString());

console.log(`Found available port: ${port}`); 