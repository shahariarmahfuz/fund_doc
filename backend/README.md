# Foundation ERP - FastAPI Backend

Modern, high-performance REST API backend for the Foundation ERP platform built with FastAPI, SQLAlchemy 2.0, Alembic, and Supabase PostgreSQL.

---

## 1. Architecture Overview

```
┌─────────────────────────────────┐
│     Next.js Frontend (3000)     │
└───────────────┬─────────────────┘
                │ HTTPS / REST (JWT Bearer Auth)
                ▼
┌─────────────────────────────────┐
│      FastAPI Backend (8000)     │
│   ┌─────────────────────────┐   │
│   │ Routers / Controllers   │   │
│   ├─────────────────────────┤   │
│   │ Business Logic / Engine │   │
│   ├─────────────────────────┤   │
│   │ SQLAlchemy 2.0 ORM      │   │
│   └───────────┬─────────────┘   │
└───────────────┼─────────────────┘
                │ Connection Pooling (psycopg)
                ▼
┌─────────────────────────────────┐
│  Supabase PostgreSQL (Pooler)   │
│     Session Pooler (Port 5432)  │
└─────────────────────────────────┘
```

The backend is completely decoupled from the frontend:
- **Authentication**: JWT Bearer token authentication with bcrypt password hashing.
- **Authorization**: Granular RBAC (Role-Based Access Control) with module-level permissions.
- **Double-Entry Financial Engine**: Centralized transaction ledger ensuring debit/credit parity.
- **Single Source of Truth**: Supabase PostgreSQL session pooler managing all persistent data.

---

## 2. Directory Structure

```
backend/
├── alembic/              # Database migration scripts & environments
│   ├── versions/         # Migration versions (31 models)
│   └── env.py
├── alembic.ini           # Alembic configuration
├── app/
│   ├── api/v1/           # REST API v1 endpoints
│   │   ├── endpoints/    # Feature routers (auth, members, donors, etc.)
│   │   └── router.py     # Aggregated v1 API router
│   ├── core/             # Configuration, database session, security, logging
│   │   ├── config.py     # Pydantic Settings (.env loader)
│   │   ├── database.py   # SQLAlchemy Engine & SessionLocal
│   │   ├── security.py   # JWT & password hashing (bcrypt)
│   │   └── exceptions.py # Standardized API exception handlers
│   ├── dependencies/     # Dependency injection (auth, db, permissions)
│   ├── models/           # SQLAlchemy 2.0 database models
│   ├── schemas/          # Pydantic v2 request & response schemas
│   ├── services/         # Business logic & financial ledger engine
│   └── main.py           # FastAPI application entry point
├── scripts/
│   └── seed.py           # Database seeder (admin, foundation, roles)
├── tests/                # Automated pytest suite
│   ├── conftest.py
│   └── test_api.py
├── requirements.txt      # Python dependencies
├── .env.example          # Environment variable template
└── .env                  # Environment variables (ignored by git)
```

---

## 3. Setup & Installation

### Prerequisites
- Python 3.10+ (tested with Python 3.14)
- Supabase PostgreSQL instance (Session Pooler recommended)

### Step 1: Create Virtual Environment
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Configure Environment
Copy `.env.example` to `.env` and fill in your Supabase connection string:
```bash
cp .env.example .env
```

Key environment variables:
```env
APP_NAME=Foundation ERP API
APP_ENV=development
DEBUG=true
PORT=8000

# Supabase PostgreSQL Session Pooler (port 5432, sslmode=require)
DATABASE_URL=postgresql+psycopg://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require

# JWT Secret (minimum 32 characters)
SECRET_KEY=your-secure-random-secret-key-at-least-32-chars-long
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# CORS Allowed Origins
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Step 4: Run Database Migrations
Apply all schema tables to Supabase:
```bash
alembic upgrade head
```

### Step 5: Seed Initial Data
Seed the Super Admin user, default roles, permissions, and foundation group:
```bash
python scripts/seed.py
```
Default Administrator credentials:
- **Username**: `admin`
- **Password**: `admin123`

### Step 6: Start Server
```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The API server will run at `http://127.0.0.1:8000`.

---

## 4. Interactive API Documentation

Once the server is running, visit:
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Health Check**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

## 5. Running Automated Tests

Run the test suite with pytest:
```bash
cd backend
.venv/bin/pytest -v
```

---

## 6. API Modules Overview

All endpoints are prefixed under `/api/v1`:

| Module | Route Prefix | Description |
|---|---|---|
| **Auth** | `/auth` | Login, current user, password change, token verify |
| **Dashboard** | `/dashboard` | Executive KPI stats and recent activity stream |
| **Members** | `/members` | Member directory, profile details, dues calculation |
| **Member Requests** | `/member-requests` | Member application review & approval workflow |
| **Groups** | `/groups` | Foundation groups and group membership hierarchy |
| **Beneficiaries** | `/beneficiaries` | Beneficiary registration and assistance history |
| **Donors** | `/donors` | Donor records and donation transaction logs |
| **Contributions** | `/contributions` | Recurring membership monthly contributions |
| **Loans** | `/loans` | Loan disbursement, repayment tracking, installments |
| **Grants** | `/grants` | Non-repayable grants disbursement and records |
| **Ledger** | `/ledger` | Double-entry journal entries and general ledger |
| **Documents** | `/documents` | File attachments & document metadata |
| **Reports** | `/reports` | Financial and operational report aggregations |
| **Settings** | `/settings` | System branding, backup export/import |
| **Users** | `/users` | User management and account status |
| **Roles** | `/roles` | Role permissions and access level assignment |
| **Audit Logs** | `/audit-logs` | Tamper-evident system activity logging |
| **Profile** | `/profile` | Current user profile and settings |
