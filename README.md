# Foundation ERP

Modern, enterprise-grade Enterprise Resource Planning (ERP) platform tailored for non-profit foundations, charities, and community welfare organizations.

The system features a completely decoupled architecture: a **Next.js TypeScript Frontend** communicating over a REST API with a high-performance **Python FastAPI Backend**, backed by **Supabase PostgreSQL**. Both services are packaged into a **single Docker container** with NGINX reverse proxy for unified deployment.

---

## 1. System Architecture

### Local Development

```
┌─────────────────────────────────────────────────────────┐
│              Next.js 16+ TypeScript Frontend            │
│  - App Router, Tailwind CSS, shadcn/ui components       │
│  - Multi-language (Bengali / English)                   │
│  - NextAuth.js Session & Bearer Token Management        │
│  - ZERO direct database access, ZERO Prisma             │
└────────────────────────────┬────────────────────────────┘
                             │
                             │ REST API (JWT Bearer Auth)
                             │
┌────────────────────────────▼────────────────────────────┐
│                  FastAPI Python Backend                 │
│  - Asynchronous RESTful API Engine                      │
│  - Granular RBAC (Role-Based Access Control)            │
│  - Double-Entry Financial Engine & General Ledger       │
│  - SQLAlchemy 2.0 ORM & Alembic Database Migrations     │
│  - In-memory caching with TTL-based invalidation        │
└────────────────────────────┬────────────────────────────┘
                             │
                             │ Connection Pooling (psycopg)
                             │
┌────────────────────────────▼────────────────────────────┐
│               Supabase PostgreSQL Database              │
│  - Transactional Session Pooler (Port 5432)             │
│  - 31+ Normalized Relational Tables                     │
│  - Single Source of Persistent Truth                    │
└─────────────────────────────────────────────────────────┘
```

### Production (Single-Container Docker)

```
              Internet
                 │
    ┌────────────▼────────────┐
    │   Render Web Service    │
    │   (Single Container)    │
    ├─────────────────────────┤
    │                         │
    │   NGINX (0.0.0.0:$PORT) │
    │         │               │
    │    ┌────┴────┐          │
    │    │         │          │
    │    ▼         ▼          │
    │  Next.js   FastAPI      │
    │  :3000     :8000        │
    │ (127.0.0.1 loopback)    │
    │                         │
    └────────────┬────────────┘
                 │
    ┌────────────▼────────────┐
    │  Supabase PostgreSQL    │
    │  (External Managed DB)  │
    └─────────────────────────┘
```

**NGINX Routing Rules:**

| Pattern | Destination | Purpose |
|---|---|---|
| `/api/auth/*` | Next.js `:3000` | NextAuth.js authentication |
| `/api/backup` | Next.js `:3000` | Database backup API route |
| `/api/upload` | Next.js `:3000` | File upload API route |
| `/api/members/*/registration-form` | Next.js `:3000` | Member registration forms |
| `/api/*` (all other) | FastAPI `:8000` | Backend REST API |
| `/_next/static/*` | Next.js `:3000` | Static assets (1yr cache) |
| `/*` (everything else) | Next.js `:3000` | Frontend pages |

### Architectural Principles & Guarantees

- **Strict Separation of Concerns**: Next.js contains NO direct database drivers, connection strings, or ORM clients. All data queries and mutations flow strictly through the FastAPI REST API.
- **Credential Isolation**: Database credentials strictly reside in `backend/.env`. The frontend only knows the internal loopback URL for server-side API calls.
- **Same-Origin Architecture**: In production, browser API calls use relative URLs (`/api/*`) routed through NGINX. No CORS issues, no public backend exposure.
- **Financial Integrity**: A centralized double-entry bookkeeping engine in FastAPI ensures debit and credit balance integrity for all member contributions, donor funds, loans, and grants.
- **Bilingual Support**: Comprehensive English and Bengali (`bn`) localization across UI labels, navigation, and error feedback.

---

## 2. Core Modules

| Module | Description |
|---|---|
| **Authentication & RBAC** | Multi-factor session handling, granular permission matrices, and activity logging. |
| **Members & Groups** | Member profiles, status transitions, hierarchy, dues tracking, and foundation groups. |
| **Member Requests** | Public registration portal with an administrative review and approval pipeline. |
| **Beneficiaries** | Welfare recipient registration, assistance history, and financial aid logs. |
| **Donors & Donations** | Donor directory, one-time and recurring donation recording with receipt numbers. |
| **Monthly Contributions** | Regular membership fee collection, automated ledger generation, and dues alerts. |
| **Qard Hasan & Repayments** | Microfinance Qard Hasan disbursements, installment schedules, and daily collection tracking. |
| **Sadaqah** | Non-repayable welfare Sadaqah disbursement, approvals, and impact tracking. |
| **Expenses** | Expense name management, transaction recording, and date-wise expense reports. |
| **Centralized Ledger** | Double-entry accounting system with automated transaction logging across all modules. |
| **Dynamic Branding** | Customizable organization name, logo, favicon, theme colors, and invoice metadata. |
| **Audit Logs** | Tamper-evident, user-attributed activity logging for compliance and auditing. |
| **Backup & Restore** | JSON-based relational database export and import archives via FastAPI. |

---

## 3. Technology Stack

### Frontend (`/`)
- **Framework**: Next.js 16 (App Router, Standalone Output)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS & Radix UI primitives (`shadcn/ui`)
- **Authentication**: NextAuth.js v4 (JWT session strategy with FastAPI bearer token exchange)
- **Icons & Charts**: Lucide React, Chart.js

### Backend (`/backend`)
- **Framework**: FastAPI (Python 3.10+)
- **ORM & Migrations**: SQLAlchemy 2.0 & Alembic
- **Database Driver**: psycopg (PostgreSQL 3)
- **Authentication**: Python-JOSE (JWT) with Passlib & Bcrypt
- **Data Validation**: Pydantic v2 Settings & Schemas
- **Caching**: In-memory TTL cache with tag-based invalidation

### Infrastructure
- **Container**: Docker multi-stage build (3 stages)
- **Reverse Proxy**: NGINX with dynamic port templating
- **Database**: Supabase PostgreSQL (Session Pooler, port 5432)

---

## 4. Prerequisites

Ensure you have the following installed locally:
- **Node.js**: v18.x or v20.x+
- **Python**: v3.10+ (tested with Python 3.14)
- **Docker**: v20+ (for containerized deployment)
- **Supabase Account**: An active PostgreSQL database instance

---

## 5. Getting Started (Local Development)

### Step A: Configure & Start the Backend

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   # On Windows: .venv\Scripts\activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Create the environment configuration file:
   ```bash
   cp .env.example .env
   ```
   Open `backend/.env` and update the `DATABASE_URL` with your Supabase session pooler connection string, and specify a secure `SECRET_KEY`:
   ```env
   DATABASE_URL=postgresql+psycopg://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require
   SECRET_KEY=change_this_to_a_secure_random_string_at_least_32_characters_long
   CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   ```

5. Apply database migrations:
   ```bash
   alembic upgrade head
   ```

6. Seed the default Super Admin user, foundation group, and initial roles:
   ```bash
   python scripts/seed.py
   ```

7. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   The backend is now accessible at [http://127.0.0.1:8000](http://127.0.0.1:8000).
   Explore interactive API documentation at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

---

### Step B: Configure & Start the Frontend

1. Open a new terminal window in the project root:
   ```bash
   cd /path/to/fundation_next
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Configure frontend environment variables:
   ```bash
   cp .env.example .env
   ```
   Update `.env` with:
   ```env
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="generate_a_random_32_character_secret"
   ```

4. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   The application will be live at [http://localhost:3000](http://localhost:3000).

5. (Optional) Expose via Cloudflare Quick Tunnel for remote preview:
   ```bash
   cloudflared tunnel --url http://127.0.0.1:3000
   ```

---

## 6. Default Admin Credentials

Upon running `python scripts/seed.py`, the database is initialized with the primary administrator account:

- **Username**: `admin`
- **Password**: `admin123`

> **Security Note**: Log in and immediately change your password and username from **Settings -> Profile** (`/settings/profile`) or via the top-right user menu.

---

## 7. Docker Deployment

### Build the Docker Image

```bash
docker build -t foundation-erp:latest .
```

This performs a 3-stage multi-stage build:
1. **frontend-builder**: Installs npm packages and builds Next.js standalone output
2. **backend-builder**: Creates a Python virtualenv with FastAPI dependencies
3. **runner**: Combines both into a slim Python image with NGINX, Node.js binary, and the entrypoint supervisor

### Test Locally with Docker

```bash
docker run --rm -p 10000:10000 \
  -e DATABASE_URL="postgresql+psycopg://user:pass@host:5432/db?sslmode=require" \
  -e SECRET_KEY="your-secret-key-minimum-32-characters" \
  -e NEXTAUTH_SECRET="your-nextauth-secret-minimum-32-chars" \
  -e NEXTAUTH_URL="http://localhost:10000" \
  -e PORT=10000 \
  foundation-erp:latest
```

Verify:
- Frontend loads at [http://localhost:10000/login](http://localhost:10000/login)
- Health check at [http://localhost:10000/api/health](http://localhost:10000/api/health)
- API docs at [http://localhost:10000/api/docs](http://localhost:10000/api/docs)

### Deploy to Render

1. **Push to Git**: Ensure the `Dockerfile` is committed and pushed.

2. **Create a Render Web Service**:
   - **Environment**: Docker
   - **Dockerfile Path**: `./Dockerfile`
   - **Instance Type**: Standard or higher

3. **Set Environment Variables** on Render:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Your Supabase PostgreSQL connection string |
   | `SECRET_KEY` | Secure JWT signing key (32+ chars) |
   | `NEXTAUTH_SECRET` | Secure NextAuth encryption key (32+ chars) |
   | `NEXTAUTH_URL` | `https://your-app.onrender.com` |
   | `PORT` | Leave unset (Render auto-assigns) |

4. **Deploy**: Render will build the Docker image and start the container. NGINX binds to `$PORT` automatically.

> **Note**: Render dynamically assigns `$PORT`. The entrypoint script reads it and templates the NGINX configuration automatically.

### Container Internal Architecture

```
┌─────────────────────────────────────────────────────┐
│  entrypoint.sh (PID 1 — process supervisor)         │
│                                                     │
│  1. Templates NGINX config with $PORT               │
│  2. Starts FastAPI on 127.0.0.1:8000                │
│  3. Starts Next.js on 127.0.0.1:3000                │
│  4. Waits for health checks to pass                 │
│  5. Starts NGINX on 0.0.0.0:$PORT                   │
│  6. Monitors all processes — restarts on crash       │
│                                                     │
│  Signals: SIGTERM/SIGINT → graceful shutdown all     │
└─────────────────────────────────────────────────────┘
```

---

## 8. Environment Variables Reference

### Frontend (`.env` in repository root)
| Variable | Required | Description | Example |
|---|---|---|---|
| `NEXTAUTH_URL` | Yes | Canonical URL of the Next.js application | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Yes | 32+ character key for encrypting NextAuth session cookies | `openssl rand -base64 32` |
| `FASTAPI_INTERNAL_URL` | No | Internal FastAPI URL for server-side calls (Docker) | `http://127.0.0.1:8000` |
| `CLOUDINARY_CLOUD_NAME` | No | Cloudinary account cloud name (for media uploads) | `your-cloud-name` |
| `CLOUDINARY_API_KEY` | No | Cloudinary API key | `your-api-key` |
| `CLOUDINARY_API_SECRET` | No | Cloudinary API secret | `your-api-secret` |

### Backend (`backend/.env`)
| Variable | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string for Supabase Session Pooler | `postgresql+psycopg://...:5432/postgres?sslmode=require` |
| `SECRET_KEY` | Yes | JWT signing secret key (minimum 32 characters) | `your-random-secret-key` |
| `ALGORITHM` | No | JWT signing algorithm (default `HS256`) | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | JWT token validity window in minutes | `43200` (30 days) |
| `CORS_ORIGINS` | No | Comma-separated allowed origins (not needed in Docker) | `http://localhost:3000` |
| `APP_NAME` | No | Application name in OpenAPI docs | `Foundation ERP API` |
| `DEBUG` | No | Enable debug logs and `/docs` endpoints | `true` |

### Docker / Render
| Variable | Required | Description | Example |
|---|---|---|---|
| `PORT` | No | NGINX listen port (auto-set by Render) | `10000` |

---

## 9. Development & Verification Commands

### Frontend Checks
```bash
# TypeScript strict type checking
npm run typecheck

# Code quality and linting
npm run lint

# Production compilation check
npm run build
```

### Backend Checks
```bash
cd backend

# Run automated test suite
.venv/bin/pytest -v

# Generate a new Alembic migration after model changes
alembic revision --autogenerate -m "describe_changes"

# Apply pending migrations
alembic upgrade head
```

### Docker Checks
```bash
# Build image
docker build -t foundation-erp:latest .

# Run container locally
docker run --rm -p 10000:10000 \
  --env-file .env.docker \
  foundation-erp:latest

# Health check
curl http://localhost:10000/api/health
```

---

## 10. License

This project is licensed under the [MIT License](LICENSE).
