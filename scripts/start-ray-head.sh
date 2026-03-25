#!/usr/bin/env bash
# Start a Ray head node for same-machine testing (researcher + volunteer on one Mac).
# RAY_NODE_IP=127.0.0.1 forces the head to advertise 127.0.0.1 so workers can connect.
# Run this in one terminal, then run scripts/start-flask-with-ray.sh in another.
# For multi-machine: use your LAN IP instead of 127.0.0.1 and do not set RAY_NODE_IP.

set -e
cd "$(dirname "$0")/.."

export RAY_ENABLE_WINDOWS_OR_OSX_CLUSTER=1

detect_node_ip() {
    local ip=""

    # Linux path
    ip=$(hostname -I 2>/dev/null | awk '{print $1}')
    if [ -n "$ip" ]; then
        echo "$ip"
        return
    fi

    # macOS common interfaces
    for iface in en0 en1; do
        ip=$(ipconfig getifaddr "$iface" 2>/dev/null || true)
        if [ -n "$ip" ]; then
            echo "$ip"
            return
        fi
    done

    # Safe fallback for same-machine demos
    echo "127.0.0.1"
}

# Allow manual override, otherwise auto-detect.
NODE_IP="${RAY_NODE_IP:-$(detect_node_ip)}"

# Clear any leftover Ray session (avoids "Session name ... does not match persisted value")
ray stop 2>/dev/null || true

cleanup() {
    echo ""
    echo "Stopping Ray head..."
    ray stop
    echo "Done."
    exit 0
}
trap cleanup SIGINT SIGTERM

echo "Starting Ray head at ${NODE_IP}:6379."
echo "In another terminal:"
echo "  1. Start Flask: ./scripts/start-flask-with-ray.sh"
echo "  2. Connect a worker: RAY_ENABLE_WINDOWS_OR_OSX_CLUSTER=1 ray start --address=${NODE_IP}:6379"
echo "Press Ctrl+C to stop the head."
echo ""

exec ray start --head --port=6379 --node-ip-address="${NODE_IP}" \
  --num-cpus=0 \
  --min-worker-port=20000 --max-worker-port=20020 \
  --block
