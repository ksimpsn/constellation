#!/usr/bin/env bash
# Start the Flask backend connected to the Ray head at 127.0.0.1:6379.
# Run scripts/start-ray-head.sh first in another terminal.

set -e
cd "$(dirname "$0")/.."

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

echo "Connecting to Ray at ${NODE_IP}:6379 (start ./scripts/start-ray-head.sh first if you haven't)."
export RAY_ADDRESS=${NODE_IP}:6379
exec python3 -m flask --app backend.app run --host 0.0.0.0 --port 5001 "$@"
