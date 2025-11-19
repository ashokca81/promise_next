// cPanel Node.js server.js
// This file is needed for cPanel Node.js hosting

// Set memory options for Node.js (must be set before requiring next)
// Use lower memory for shared hosting
if (!process.env.NODE_OPTIONS) {
  process.env.NODE_OPTIONS = '--max-old-space-size=1024';
}

// Disable Next.js telemetry to save memory
process.env.NEXT_TELEMETRY_DISABLED = '1';

// Try to increase heap if possible
try {
  const v8 = require('v8');
  v8.setFlagsFromString('--max-old-space-size=1024');
} catch (e) {
  // Ignore if not available
}

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Get port from environment or use default
const port = parseInt(process.env.PORT || '3000', 10);
// Force production mode for server
const dev = false; // Always use production mode on server
const hostname = process.env.HOSTNAME || 'localhost';

// Initialize Next.js app with minimal config for shared hosting
const app = next({ 
  dev: false, // Always production
  hostname, 
  port,
  // Minimal config to reduce memory
  conf: {
    reactStrictMode: true,
    swcMinify: true,
    compress: true,
    productionBrowserSourceMaps: false,
    poweredByHeader: false,
  }
});
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      // Parse the request URL
      const parsedUrl = parse(req.url, true);
      const { pathname, query } = parsedUrl;

      // Handle Next.js routes
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Environment: ${process.env.NODE_ENV || 'development'}`);
    });
});

