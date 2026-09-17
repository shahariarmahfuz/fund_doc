# ==============================================================================
# Stage 1: Build Next.js Production Standalone Bundle
# ==============================================================================
FROM node:20-bookworm-slim AS frontend-builder
WORKDIR /app

# Install dependencies deterministically
COPY package*.json ./
RUN npm ci

# Copy all application source code
COPY . .

# Set build environment
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Execute standalone production build
RUN npm run build

# ==============================================================================
# Stage 2: Prepare Python Virtual Environment for FastAPI Backend
# ==============================================================================
FROM python:3.12-slim-bookworm AS backend-builder
WORKDIR /app

# Create isolated virtualenv and install dependencies
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ==============================================================================
# Stage 3: Unified Production Runner (NGINX + Next.js + FastAPI)
# ==============================================================================
FROM python:3.12-slim-bookworm AS runner
WORKDIR /app

# Install NGINX reverse proxy and curl for internal health monitoring
RUN apt-get update && \
    apt-get install -y --no-install-recommends nginx curl && \
    rm -rf /var/lib/apt/lists/*

# Copy Node.js binary from frontend-builder stage
COPY --from=frontend-builder /usr/local/bin/node /usr/local/bin/node

# Copy Python virtual environment from backend-builder stage
COPY --from=backend-builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy Next.js standalone server and static assets
COPY --from=frontend-builder /app/.next/standalone /app/
COPY --from=frontend-builder /app/.next/static /app/.next/static
COPY --from=frontend-builder /app/public /app/public

# Copy FastAPI backend code
COPY backend /app/backend

# Copy NGINX configuration template and process entrypoint
COPY docker/nginx.conf.template /etc/nginx/nginx.conf.template
COPY docker/entrypoint.sh /app/docker/entrypoint.sh
RUN chmod +x /app/docker/entrypoint.sh

# Environment settings
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV FASTAPI_INTERNAL_URL="http://127.0.0.1:8000"
ENV PORT=10000

# Render dynamically binds the container to $PORT
EXPOSE 10000

# Launch all supervised services
ENTRYPOINT ["/app/docker/entrypoint.sh"]
