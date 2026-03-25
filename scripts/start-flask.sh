#!/usr/bin/env bash
# Start the Flask backend WITHOUT starting Ray.
# Ray will be started lazily when a researcher submits a project
# or when an explicit /api/cluster/start-head request is made.

set -e
cd "$(dirname "$0")/.."

echo "Starting Flask (Ray deferred — will start on project submission)."
exec python3 -m flask --app backend.app run --host 0.0.0.0 --port 5001 "$@"
