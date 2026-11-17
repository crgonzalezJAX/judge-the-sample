#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
if [ ! -d node_modules ]; then
  npm install
fi
echo "Open the address Vite prints below (usually http://127.0.0.1:5173/). Stop with Ctrl+C."
npm run dev
