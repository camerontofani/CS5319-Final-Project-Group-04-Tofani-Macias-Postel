#!/usr/bin/env bash
# Run all SmartStudy microservices + API gateway for local demo.
# From repo root:  chmod +x unselected/scripts/run-microservices.sh
#                   ./unselected/scripts/run-microservices.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/backend"
export PYTHONPATH=""
export SECRET_KEY="${SECRET_KEY:-dev-secret-change-in-production}"

if [ -f "$BACKEND/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$BACKEND/.env"
  set +a
fi

pids=()
cleanup() {
  for p in "${pids[@]}"; do
    kill "$p" 2>/dev/null || true
  done
}
trap cleanup EXIT

start() {
  local dir="$1"
  local port="$2"
  shift 2
  (cd "$dir" && exec uvicorn app.main:app --host 127.0.0.1 --port "$port" "$@") &
  pids+=($!)
  sleep 0.3
}

start "$BACKEND/services/auth-service" 8101
start "$BACKEND/services/study-plan-service" 8102
start "$BACKEND/services/progress-service" 8103
start "$BACKEND/services/group-service" 8104
start "$BACKEND/services/notification-service" 8105
start "$BACKEND/services/ai-service" 8106
start "$BACKEND/gateway" 8000

echo "Microservices + gateway running. Gateway: http://127.0.0.1:8000/health"
echo "Press Ctrl+C to stop all."
wait
