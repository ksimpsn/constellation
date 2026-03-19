#!/usr/bin/env bash
# Start the Flask backend connected to the Ray head at 127.0.0.1:6379.
# Run scripts/start-ray-head.sh first in another terminal.

set -e
cd "$(dirname "$0")/.."

echo "Connecting to Ray at 127.0.0.1:6379 (start ./scripts/start-ray-head.sh first if you haven't)."
export RAY_ADDRESS=127.0.0.1:6379
exec python3 -m flask --app backend.app run --host 0.0.0.0 --port 5001 "$@"
