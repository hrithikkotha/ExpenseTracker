const fs = require('node:fs');
const path = require('node:path');

const entry = path.join(__dirname, 'server', 'dist', 'server.js');

if (!fs.existsSync(entry)) {
  // eslint-disable-next-line no-console
  console.error('Build artifact missing: server/dist/server.js. Run the build step before start.');
  process.exit(1);
}

require(entry);
