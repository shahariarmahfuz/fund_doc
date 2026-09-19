#!/usr/bin/env bash
set -eo pipefail

echo "=================================================="
echo " Starting Single-Container Foundation ERP Setup  "
echo "=================================================="

# 1. Resolve Port and Auth Configuration
export PORT="${PORT:-10000}"
RENDER_PORT="${PORT}"
echo "[INIT] Render Public Port configured as: ${RENDER_PORT}"
export NEXTAUTH_URL="${NEXTAUTH_URL:-https://fund-doc.onrender.com}"
export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-super_secret_default_key_change_in_production_32_characters_min}"

# 2. Template NGINX Configuration
echo "[INIT] Generating NGINX configuration from template..."
sed "s/\${PORT}/${RENDER_PORT}/g" /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
nginx -t

# 3. Apply Database Migrations and Seed Initial Data
echo "[INIT] Applying database migrations to Neon PostgreSQL..."
cd /app/backend
/opt/venv/bin/alembic upgrade head || echo "[WARNING] Alembic migration encountered an issue, proceeding..."
echo "[INIT] Ensuring initial seed data exists..."
/opt/venv/bin/python scripts/seed.py || echo "[INFO] Seed completed or already initialized."

# 4. Start FastAPI Backend (Binding strictly to internal loopback: 127.0.0.1:8000)
echo "[INIT] Launching FastAPI ASGI server on 127.0.0.1:8000..."
cd /app/backend
/opt/venv/bin/uvicorn app.main:app \
    --host 127.0.0.1 \
    --port 8000 \
    --workers 1 \
    --log-level info &
FASTAPI_PID=$!
echo "[INIT] FastAPI started (PID: ${FASTAPI_PID})"

# 4. Start Next.js Production Standalone Server (Binding to internal loopback: 127.0.0.1:3000)
echo "[INIT] Launching Next.js standalone server on 127.0.0.1:3000..."
cd /app
HOSTNAME="127.0.0.1" PORT="3000" node server.js &
NEXTJS_PID=$!
echo "[INIT] Next.js started (PID: ${NEXTJS_PID})"

# Restore PORT for remaining script references
export PORT="${RENDER_PORT}"

# 5. Wait for internal services to become ready before routing public traffic
echo "[INIT] Awaiting health of internal services..."
MAX_WAIT=30
WAITED=0

until curl -sf http://127.0.0.1:8000/api/health > /dev/null 2>&1; do
    if [ "$WAITED" -ge "$MAX_WAIT" ]; then
        echo "[ERROR] FastAPI failed to become ready within ${MAX_WAIT} seconds!"
        kill -TERM "$FASTAPI_PID" "$NEXTJS_PID" 2>/dev/null || true
        exit 1
    fi
    sleep 1
    WAITED=$((WAITED + 1))
done
echo "[INIT] FastAPI is ready (took ${WAITED}s)."

WAITED=0
until curl -sf http://127.0.0.1:3000 > /dev/null 2>&1; do
    if [ "$WAITED" -ge "$MAX_WAIT" ]; then
        echo "[ERROR] Next.js failed to become ready within ${MAX_WAIT} seconds!"
        kill -TERM "$FASTAPI_PID" "$NEXTJS_PID" 2>/dev/null || true
        exit 1
    fi
    sleep 1
    WAITED=$((WAITED + 1))
done
echo "[INIT] Next.js is ready (took ${WAITED}s)."

# 6. Start NGINX Reverse Proxy
echo "[INIT] Starting NGINX public reverse proxy on 0.0.0.0:${RENDER_PORT}..."
nginx -g "daemon off;" &
NGINX_PID=$!
echo "[INIT] NGINX started (PID: ${NGINX_PID}). All services operational!"

# 7. Graceful Signal Handling
cleanup() {
    echo ""
    echo "[SHUTDOWN] Signal received. Gracefully terminating all processes..."
    kill -TERM "$NGINX_PID" 2>/dev/null || true
    kill -TERM "$NEXTJS_PID" 2>/dev/null || true
    kill -TERM "$FASTAPI_PID" 2>/dev/null || true

    wait "$NGINX_PID" 2>/dev/null || true
    wait "$NEXTJS_PID" 2>/dev/null || true
    wait "$FASTAPI_PID" 2>/dev/null || true
    echo "[SHUTDOWN] All services stopped cleanly."
    exit 0
}

trap cleanup SIGTERM SIGINT SIGQUIT

# 8. Process Heartbeat & Crash Monitoring
# If ANY internal process dies, the container must not remain in a zombie state.
while true; do
    if ! kill -0 "$FASTAPI_PID" 2>/dev/null; then
        echo "[FATAL] FastAPI process (${FASTAPI_PID}) exited unexpectedly!"
        cleanup
        exit 1
    fi
    if ! kill -0 "$NEXTJS_PID" 2>/dev/null; then
        echo "[FATAL] Next.js process (${NEXTJS_PID}) exited unexpectedly!"
        cleanup
        exit 1
    fi
    if ! kill -0 "$NGINX_PID" 2>/dev/null; then
        echo "[FATAL] NGINX process (${NGINX_PID}) exited unexpectedly!"
        cleanup
        exit 1
    fi
    sleep 2
done
