#!/usr/bin/env bash
# Start the Flask backend connected to the Ray head at 127.0.0.1:6379.
# Run scripts/start-ray-head.sh first in another terminal.

set -e
cd "$(dirname "$0")/.."

echo "Connecting to Ray at 127.0.0.1:6379 (start ./scripts/start-ray-head.sh first if you haven't)."
export RAY_ADDRESS=127.0.0.1:6379

# Windows often has `python` / `py` but not `python3` on PATH
if command -v python3 >/dev/null 2>&1; then
  exec python3 -m flask --app backend.app run --host 0.0.0.0 --port 5001 "$@"
elif command -v python >/dev/null 2>&1; then
  exec python -m flask --app backend.app run --host 0.0.0.0 --port 5001 "$@"
elif command -v py >/dev/null 2>&1; then
  exec py -3 -m flask --app backend.app run --host 0.0.0.0 --port 5001 "$@"
else
  echo "Error: No Python found. Install Python or add python/python3/py to PATH." >&2
  exit 1
fi
