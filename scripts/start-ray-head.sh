#!/usr/bin/env bash
# Start a Ray head node for same-machine testing (researcher + volunteer on one Mac).
# RAY_NODE_IP=127.0.0.1 forces the head to advertise 127.0.0.1 so workers can connect.
# Run this in one terminal, then run scripts/start-flask-with-ray.sh in another.
# For multi-machine: use your LAN IP instead of 127.0.0.1 and do not set RAY_NODE_IP.

set -e
cd "$(dirname "$0")/.."

export RAY_ENABLE_WINDOWS_OR_OSX_CLUSTER=1
export RAY_NODE_IP=127.0.0.1

cleanup() {
    echo ""
    echo "Stopping Ray head..."
    ray stop
    echo "Done."
    exit 0
}
trap cleanup SIGINT SIGTERM

echo "Starting Ray head at 127.0.0.1:6379 (RAY_NODE_IP=127.0.0.1)."
echo "In another terminal:"
echo "  1. Start Flask: ./scripts/start-flask-with-ray.sh"
echo "  2. Connect a worker: RAY_ENABLE_WINDOWS_OR_OSX_CLUSTER=1 ray start --address=127.0.0.1:6379"
echo "Press Ctrl+C to stop the head."
echo ""

exec ray start --head --port=6379 --node-ip-address=127.0.0.1 --block
