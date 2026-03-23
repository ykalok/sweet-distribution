# Sweet Distribution — Setup Guide

> Step-by-step guide to set up and run the B2B Sweet Distribution Platform locally.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Database Setup](#2-database-setup)
3. [Backend Setup](#3-backend-setup)
4. [Frontend Setup](#4-frontend-setup)
5. [Configuration Reference](#5-configuration-reference)
6. [Build & Run Commands](#6-build--run-commands)
7. [Flyway Migrations](#7-flyway-migrations)
8. [Troubleshooting](#8-troubleshooting)
9. [Tech Stack Summary](#9-tech-stack-summary)

---

## 1. Prerequisites

| Tool | Version | Required |
|------|---------|----------|
| Java JDK | 21+ | ✅ |
| Maven | 3.9+ | ✅ |
| Node.js | 18+ | ✅ |
| PostgreSQL | 14+ | ✅ (local or cloud-hosted) |

### Database Options (pick one)
- **Local PostgreSQL** — install directly or via Docker
- **Supabase** — free-tier cloud PostgreSQL (used as a plain database, no Supabase SDK)
- **Any PostgreSQL host** — Neon, Railway, Render, Amazon RDS, etc.

> The backend connects to PostgreSQL via JDBC. No Supabase-specific features (Auth, Edge Functions, RLS) are used — it's just a hosted PostgreSQL database.

---

## 2. Database Setup

### Option A: Local PostgreSQL (Docker)
```bash
docker run -d --name sweet-db -p 5432:5432 \
  -e POSTGRES_DB=sweet-distribution \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=testing123 \
  postgres:16
```

No further setup needed — Flyway will create all tables on first backend startup.

### Option B: Supabase (Cloud PostgreSQL)

1. Go to [supabase.com](https://supabase.com) → New Project
2. Set project name and **database password** (save this!)
3. Select region
4. Once provisioned, go to **Project Settings → Database → Connection string → JDBC**

Connection details:

| Field | Direct Connection | Connection Pooler |
|-------|-------------------|-------------------|
| Host | `db.<ref>.supabase.co` | `aws-0-<region>.pooler.supabase.com` |
| Port | `5432` | `6543` |
| Database | `postgres` | `postgres` |
| Username | `postgres` | `postgres.<project-ref>` |

> Use **Connection Pooler** if the direct host doesn't resolve (IPv6 issue on some networks).

> ⚠️ Free-tier Supabase projects **pause after 7 days of inactivity**. Restore from dashboard if connection fails.

---

## 3. Backend Setup

### 3.1 Java & Maven (Windows)

Java 21 installed at:
```
C:\Program Files\Java\jdk-21
```

Maven 3.9.9 at:
```
C:\Users\ykana\apache-maven-3.9.9
```

Since neither is on system PATH, prefix every Maven command with:
```cmd
set "JAVA_HOME=C:\Program Files\Java\jdk-21" && set "PATH=C:\Users\ykana\apache-maven-3.9.9\bin;%PATH%"
```

Or set them permanently:
1. System Properties → Environment Variables
2. Add `JAVA_HOME`: `C:\Program Files\Java\jdk-21`
3. Add to `PATH`: `C:\Users\ykana\apache-maven-3.9.9\bin`

### 3.2 Configure Database Connection

Edit `backend/src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5432/sweet-distribution}
    username: ${SPRING_DATASOURCE_USERNAME:postgres}
    password: ${SPRING_DATASOURCE_PASSWORD:testing123}
```

You can either:
- Edit the default values directly in the file (for local dev)
- Set environment variables to override them

### 3.3 Run the Backend

```cmd
cd backend
mvn clean spring-boot:run
```

On first run, Flyway automatically:
- Creates all 9 database tables
- Seeds an admin user and sample products

Backend starts at: `http://localhost:8080`
Swagger UI: `http://localhost:8080/swagger-ui.html`

### 3.4 Default Admin Account

| Field | Value |
|-------|-------|
| Email | `admin@sweetdistribution.com` |
| Password | `admin123` |

---

## 4. Frontend Setup

### 4.1 Configure API URL

Create/edit `frontend/.env`:
```
VITE_API_BASE_URL=http://localhost:8080
```

### 4.2 Install & Run

```bash
cd frontend
npm install
npm run dev
```

Frontend starts at: `http://localhost:5173`

### 4.3 How It Works

- All API calls go through `src/lib/api.ts` (Axios HTTP client)
- JWT token is stored in `localStorage` and auto-attached to requests via Axios interceptor
- Auth state is managed in `src/contexts/AuthContext.tsx`
- No Supabase SDK — the frontend talks only to the Spring Boot backend

---

## 5. Configuration Reference

### Backend (application.yml)

| Property | Env Variable | Default | Description |
|----------|-------------|---------|-------------|
| DB URL | `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/sweet-distribution` | PostgreSQL JDBC URL |
| DB Username | `SPRING_DATASOURCE_USERNAME` | `postgres` | Database user |
| DB Password | `SPRING_DATASOURCE_PASSWORD` | `testing123` | Database password |
| JWT Secret | `JWT_SECRET` | (fallback in yml) | Must be ≥256 bits for production |
| JWT Expiry | — | `86400000` (24h) | Token lifetime in ms |
| Razorpay Key | `RAZORPAY_KEY_ID` | `rzp_test_placeholder` | Razorpay API key |
| Razorpay Secret | `RAZORPAY_KEY_SECRET` | `test_secret_placeholder` | Razorpay API secret |

### Frontend (.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8080` | Backend API base URL |

---

## 6. Build & Run Commands

All commands assume you're in the project root. On Windows, prefix Maven commands with the JAVA_HOME/PATH setup if not set globally.

### Backend

```bash
# Compile
cd backend && mvn clean compile

# Run (dev)
cd backend && mvn spring-boot:run

# Run with env vars
SPRING_DATASOURCE_PASSWORD=mypassword JWT_SECRET=mysecret mvn spring-boot:run

# Package as JAR
cd backend && mvn clean package -DskipTests

# Run the JAR
java -jar backend/target/sweet-distribution-backend-1.0.0.jar
```

### Frontend

```bash
# Dev server
cd frontend && npm run dev

# Production build
cd frontend && npm run build

# Preview production build
cd frontend && npm run preview

# Type check
cd frontend && npm run typecheck
```

### Utility

```cmd
# Kill process on port 8080 (Windows)
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

---

## 7. Flyway Migrations

Migrations run automatically on backend startup. Located in `backend/src/main/resources/db/migration/`:

| File | Description |
|------|-------------|
| `V1__initial_schema.sql` | Core tables: users, products, orders, order_items + indexes |
| `V2__seed_data.sql` | Admin user (admin@sweetdistribution.com) + 10 sample products |
| `V3__phase2_enhanced_schema.sql` | addresses, payments, invoices, cart_items, delivery_tracking + enhanced orders columns |

### Naming Convention
```
V<version>__<description>.sql
```

### PostgreSQL Patterns Used

Safe column addition (idempotent):
```sql
DO $$
BEGIN
    ALTER TABLE orders ADD COLUMN payment_id UUID;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;
```

Safe seed data (idempotent):
```sql
INSERT INTO products (id, name, price)
VALUES (gen_random_uuid(), 'Gulab Jamun', 12.99)
ON CONFLICT DO NOTHING;
```

---

## 8. Troubleshooting

### `JAVA_HOME not found` / `mvn not recognized`
Set inline before Maven commands:
```cmd
set "JAVA_HOME=C:\Program Files\Java\jdk-21" && set "PATH=C:\Users\ykana\apache-maven-3.9.9\bin;%PATH%"
```

### `Port 8080 already in use`
```cmd
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### `UnknownHostException` on Supabase host
- Project may be paused → Restore from Supabase dashboard
- DNS may return IPv6 only → Use Connection Pooler URL instead

### `FATAL: Tenant or user not found` (Supabase Pooler)
- Pooler username must be `postgres.<project-ref>` (not just `postgres`)
- Verify password — reset from Dashboard → Project Settings → Database

### `FATAL: password authentication failed`
- Database password is the one set during Supabase project creation (not your account password)
- Reset: Dashboard → Project Settings → Database → Reset database password

### Flyway migration fails
- Ensure all SQL uses PostgreSQL syntax (`gen_random_uuid()`, not `RANDOM_UUID()`)
- Ensure `TEXT` type instead of `CLOB`

### Java 21 unnamed variables error
```
error: unnamed variables are a preview feature
```
Use `e` instead of `_` in catch blocks:
```java
} catch (Exception e) { // not Exception _
    return false;
}
```

### Frontend can't reach backend
- Verify backend is running on port 8080
- Check `VITE_API_BASE_URL` in `frontend/.env`
- Check CORS config in `CorsConfig.java` allows `http://localhost:5173`

---

## 9. Tech Stack Summary

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│  React 18 + TypeScript + Vite + Tailwind CSS    │
│  Axios HTTP Client + JWT Auth                   │
│  Razorpay JS SDK (payments)                     │
│  Port: 5173                                      │
└──────────────────────┬──────────────────────────┘
                       │ REST API (JSON)
                       ▼
┌─────────────────────────────────────────────────┐
│                   BACKEND                        │
│  Spring Boot 3.4.1 + Java 21                    │
│  Spring Security + JWT (jjwt 0.12.5)            │
│  Spring Data JPA + Hibernate                    │
│  Flyway Migrations                              │
│  Razorpay Java SDK (1.4.6)                      │
│  Swagger/OpenAPI (springdoc 2.5.0)              │
│  Port: 8080                                      │
└──────────────────────┬──────────────────────────┘
                       │ JDBC (PostgreSQL)
                       ▼
┌─────────────────────────────────────────────────┐
│                  DATABASE                        │
│  PostgreSQL 14+                                  │
│  9 tables, 3 Flyway migrations                  │
│  (Local, Supabase, or any PostgreSQL host)      │
└─────────────────────────────────────────────────┘
```

---

## Quick Start Checklist

- [ ] Java 21 installed
- [ ] Maven 3.9+ installed
- [ ] Node.js 18+ installed
- [ ] PostgreSQL running (local or cloud)
- [ ] `application.yml` — database URL, username, password configured
- [ ] `frontend/.env` — `VITE_API_BASE_URL=http://localhost:8080`
- [ ] Backend: `mvn spring-boot:run` → starts on :8080
- [ ] Frontend: `npm run dev` → starts on :5173
- [ ] Swagger UI accessible at `http://localhost:8080/swagger-ui.html`
- [ ] Login with `admin@sweetdistribution.com` / `admin123`
