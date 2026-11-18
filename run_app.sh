#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
if [ ! -d node_modules ]; then
  npm install
fi
echo "Open the Local address Vite prints below (usually http://127.0.0.1:5173/judge-the-sample/). Stop with Ctrl+C."
npm run dev
