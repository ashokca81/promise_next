#!/bin/bash
# cPanel Server Start Script with Memory Limits

# Set memory limits
export NODE_OPTIONS='--max-old-space-size=2048 --wasm-memory-max=512mb'

# Force production mode
export NODE_ENV=production

# Start server
node server.js

