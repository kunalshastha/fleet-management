#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
echo "Starting TITAN FLEET COMMAND Web Application..."
echo "Directory: $DIR"

# Launch in default browser directly
open "$DIR/public/index.html"

echo "Application opened in browser."
echo "To run with local API server on port 8080: ruby $DIR/server.rb"
