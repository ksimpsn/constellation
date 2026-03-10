#!/usr/bin/env python3
"""
Alternative: start a Ray head via ray.init() (GCS uses a random port; workers cannot join).
Preferred: use start-ray-head.sh which runs 'ray start --head' with RAY_NODE_IP=127.0.0.1
so the head listens and advertises 127.0.0.1:6379 and workers can connect.
"""
import os
import sys
import signal
import time

# Must set before importing ray (required for macOS/Windows multi-node).
os.environ["RAY_ENABLE_WINDOWS_OR_OSX_CLUSTER"] = "1"

import ray

def main():
    print("Starting Ray head at 127.0.0.1:6379 ...")
    try:
        ray.init(
            _node_ip_address="127.0.0.1",
            include_dashboard=False,
        )
    except Exception as e:
        print(f"Failed to start Ray head: {e}", file=sys.stderr)
        sys.exit(1)

    print("Ray head is running at 127.0.0.1:6379.")
    print("In another terminal:")
    print("  1. Start Flask: ./scripts/start-flask-with-ray.sh")
    print("  2. Connect a worker: RAY_ENABLE_WINDOWS_OR_OSX_CLUSTER=1 ray start --address=127.0.0.1:6379")
    print("Press Ctrl+C to stop the head.")
    print()

    # Keep process alive so the head stays up.
    try:
        while True:
            time.sleep(60)
    except KeyboardInterrupt:
        print("\nShutting down Ray head...")
        ray.shutdown()
        print("Done.")


if __name__ == "__main__":
    main()
