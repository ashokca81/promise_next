// Minimal server.js for cPanel shared hosting with low memory
// This version uses less memory by avoiding some Next.js features

// Set memory limits BEFORE requiring next
process.env.NODE_OPTIONS = process.env.NODE_OPTIONS || '--max-old-space-size=1024';
process.env.NODE_ENV = 'production';

// Disable Next.js telemetry to save memory
process.env.NEXT_TELEMETRY_DISABLED = '1';

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const port = parseInt(process.env.PORT || '3000', 10);
const hostname = 'localhost';

// Force production mode
const app = next({ 
  dev: false,
  hostname,
  port,
  // Disable some features to reduce memory
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
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error:', err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  server.once('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });

  server.listen(port, hostname, () => {
    console.log(`> Server ready on http://${hostname}:${port}`);
    console.log(`> Memory limit: ${process.env.NODE_OPTIONS}`);
  });
}).catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

