#!/usr/bin/env bash
# Start the Flask backend connected to the Ray head at 127.0.0.1:6379.
# Run scripts/start-ray-head.sh first in another terminal.
#
# Optional: create a .env file in the project root with:
#   AWS_DATABASE_URL=postgresql://user:password@host:5432/dbname
# so the app uses RDS for users/projects (no need to export in this terminal).

set -e
cd "$(dirname "$0")/.."

# Load .env if present (KEY=VALUE lines become exported)
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

echo "Connecting to Ray at 127.0.0.1:6379 (start ./scripts/start-ray-head.sh first if you haven't)."
export RAY_ADDRESS=127.0.0.1:6379
exec python3 -m flask --app backend.app run --host 0.0.0.0 --port 5001 "$@"
