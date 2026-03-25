#!/usr/bin/env bash
# Start the Flask backend WITHOUT starting Ray.
# Ray will be started lazily when a researcher submits a project
# or when an explicit /api/cluster/start-head request is made.

set -e
cd "$(dirname "$0")/.."

# Auto-load local env vars for Flask (e.g., AWS_DATABASE_URL).
if [ -f ".env" ]; then
  set -a
  # shellcheck disable=SC1091
  source ".env"
  set +a
fi

echo "Starting Flask (Ray deferred — will start on project submission)."
exec python3 -m flask --app backend.app run --host 0.0.0.0 --port 5001 "$@"
