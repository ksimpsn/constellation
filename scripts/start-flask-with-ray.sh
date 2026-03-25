#!/usr/bin/env bash
# Start the Flask backend connected to the Ray head at 127.0.0.1:6379.
# Run scripts/start-ray-head.sh first in another terminal.

set -e
cd "$(dirname "$0")/.."

NODE_IP=$(hostname -I | awk '{print $1}')
# NODE_IP="127.0.0.1"
# NODE_IP="44.220.157.184"

echo "Connecting to Ray at ${NODE_IP}:6379 (start ./scripts/start-ray-head.sh first if you haven't)."
export RAY_ADDRESS=${NODE_IP}:6379
exec python3 -m flask --app backend.app run --host 0.0.0.0 --port 5001 "$@"
