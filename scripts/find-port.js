const net = require('net');
const fs = require('fs');
const path = require('path');

function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => {
      findAvailablePort(startPort + 1).then(resolve);
    });
    server.listen(startPort, () => {
      server.close(() => {
        resolve(startPort);
      });
    });
  });
}

async function main() {
  const startPort = 3000;
  const port = await findAvailablePort(startPort);
  const portFile = path.join(__dirname, 'port.txt');
  fs.writeFileSync(portFile, port.toString());
  console.log(`Found available port: ${port}`);
}

main(); 