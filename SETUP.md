    # Sweet Distribution - Setup Guide & Learnings

> A comprehensive guide documenting every step, issue, and resolution encountered while setting up the Sweet Distribution B2B Platform.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Project Structure](#2-project-structure)
3. [Java & Maven Setup (Windows)](#3-java--maven-setup-windows)
4. [Backend Project Setup](#4-backend-project-setup)
5. [Supabase Database Setup](#5-supabase-database-setup)
6. [Configuration Deep Dive](#6-configuration-deep-dive)
7. [Flyway Migrations](#7-flyway-migrations)
8. [Build & Run Commands](#8-build--run-commands)
9. [Issues Faced & Resolutions](#9-issues-faced--resolutions)
10. [API Endpoints Reference](#10-api-endpoints-reference)
11. [Tech Stack Summary](#11-tech-stack-summary)

---

## 1. Prerequisites

| Tool | Version | Required |
|------|---------|----------|
| Java JDK | 21+ | ✅ |
| Maven | 3.9+ | ✅ |
| Supabase Account | Free tier | ✅ |
| Docker | Any | ❌ Not needed |
| Local PostgreSQL | Any | ❌ Not needed |
| Node.js | 18+ | For frontend only |

### What We're NOT Using Locally
- **No Docker** — Supabase cloud handles the database
- **No local PostgreSQL** — Connecting directly to Supabase's hosted PostgreSQL
- **No H2 in production** — H2 is only kept for test scope

---

## 2. Project Structure

```
sweet-distribution/
├── backend/                          # Spring Boot Backend
│   ├── src/main/java/com/sweetdistribution/
│   │   ├── config/                   # Security & Swagger config
│   │   │   ├── SecurityConfig.java   # JWT filter, CORS, role-based access
│   │   │   └── SwaggerConfig.java    # OpenAPI documentation
│   │   ├── controller/               # REST API endpoints (8 controllers)
│   │   │   ├── AuthController.java   # POST /api/auth/login, /register
│   │   │   ├── ProductController.java
│   │   │   ├── OrderController.java
│   │   │   ├── AdminController.java  # Admin-only CRUD operations
│   │   │   ├── AddressController.java
│   │   │   ├── CartController.java
│   │   │   ├── PaymentController.java
│   │   │   └── InvoiceController.java
│   │   ├── model/
│   │   │   ├── entity/               # 9 JPA entities
│   │   │   ├── dto/                  # 16 Java records (DTOs)
│   │   │   └── enums/                # Role, OrderStatus, PaymentStatus
│   │   ├── repository/               # 9 Spring Data JPA repositories
│   │   ├── service/                  # 8 service classes (business logic)
│   │   ├── security/                 # JWT provider, filter, UserDetailsService
│   │   ├── exception/                # Global exception handler + custom exceptions
│   │   └── SweetDistributionApplication.java
│   ├── src/main/resources/
│   │   ├── application.yml           # App configuration
│   │   └── db/migration/             # Flyway SQL migrations
│   │       ├── V1__initial_schema.sql
│   │       ├── V2__seed_data.sql
│   │       └── V3__phase2_enhanced_schema.sql
│   └── pom.xml
├── frontend/                         # React + TypeScript + Vite
│   └── app/
├── README.md
├── ARCHITECTURE.md
└── SETUP.md                          # ← You are here
```

---

## 3. Java & Maven Setup (Windows)

### 3.1 Java 21 Installation

Java 21 is installed at:
```
C:\Program Files\Java\jdk-21
```

**Important**: `JAVA_HOME` is NOT set as a system environment variable. Must be set inline before every Maven command.

Verify Java:
```cmd
"C:\Program Files\Java\jdk-21\bin\java" -version
```

### 3.2 Maven Installation

Maven 3.9.9 was downloaded (not installed via installer) to:
```
C:\Users\ykana\apache-maven-3.9.9
```

Maven is NOT on the system PATH. Must be set inline.

### 3.3 The Magic Command Prefix

Since neither JAVA_HOME nor Maven is on PATH, **every Maven command** must start with:
```cmd
set "JAVA_HOME=C:\Program Files\Java\jdk-21" && set "PATH=C:\Users\ykana\apache-maven-3.9.9\bin;%PATH%"
```

**Full example:**
```cmd
set "JAVA_HOME=C:\Program Files\Java\jdk-21" && set "PATH=C:\Users\ykana\apache-maven-3.9.9\bin;%PATH%" && cd /d "c:\Users\ykana\IdeaProjects\sweet-distribution\backend" && mvn clean compile
```

### 3.4 (Optional) Set Permanently

To avoid the inline prefix every time, add these as **System Environment Variables**:

1. Open: `System Properties` → `Environment Variables`
2. Add **JAVA_HOME**: `C:\Program Files\Java\jdk-21`
3. Edit **PATH**, add: `C:\Users\ykana\apache-maven-3.9.9\bin`
4. Restart terminal

---

## 4. Backend Project Setup

### 4.1 Spring Boot Version & Java Version

| Property | Value |
|----------|-------|
| Spring Boot | 3.4.1 |
| Java | 21 |
| Build Tool | Maven |
| Packaging | JAR |

### 4.2 Key Dependencies (pom.xml)

```xml
<!-- Core -->
spring-boot-starter-web          <!-- REST APIs -->
spring-boot-starter-data-jpa     <!-- JPA/Hibernate ORM -->
spring-boot-starter-security     <!-- Spring Security -->
spring-boot-starter-validation   <!-- Bean validation (@NotBlank, etc.) -->

<!-- Database -->
postgresql                        <!-- PostgreSQL JDBC driver (runtime scope) -->
h2                                <!-- H2 in-memory DB (test scope ONLY) -->
flyway-core                       <!-- Database migration tool -->
flyway-database-postgresql        <!-- Flyway PostgreSQL support -->

<!-- JWT Authentication -->
jjwt-api / jjwt-impl / jjwt-jackson   <!-- Version 0.12.5 -->

<!-- API Docs -->
springdoc-openapi-starter-webmvc-ui    <!-- Version 2.5.0, Swagger UI -->

<!-- Utility -->
lombok                            <!-- Reduces boilerplate -->
```

### 4.3 Java 21 Features Used

| Feature | Where Used | Notes |
|---------|-----------|-------|
| **Records** | All 16 DTOs | `public record LoginRequest(String email, String password) {}` |
| **Switch Expressions** | OrderStatus enum | `canTransitionTo()` method |
| **Pattern Matching** | Exception handler | `instanceof` with variable binding |
| **var** | Services | Local variable type inference |
| **String.formatted()** | Various | Template strings |
| **Instant API** | JwtTokenProvider | Instead of legacy Date |

> ⚠️ **Do NOT use unnamed variables (`_`)** — they are a preview feature in Java 21 and cause compilation errors without `--enable-preview` flag.

---

## 5. Supabase Database Setup

### 5.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → Sign in
2. Click **New Project**
3. Choose organization, set project name, **set a strong database password** (save this!)
4. Select region (e.g., `ap-south-1` for India)
5. Wait for project to be provisioned

### 5.2 Get Connection Details

Go to **Project Settings** → **Database** → **Connection string** → **JDBC** tab.

You'll see something like:
```
jdbc:postgresql://db.<PROJECT_REF>.supabase.co:5432/postgres?user=postgres&password=[YOUR-PASSWORD]
```

Key values to note:
| Field | Value |
|-------|-------|
| **Project Reference** | `jwuarrcjjoafxfphianz` (unique per project) |
| **Host (Direct)** | `db.jwuarrcjjoafxfphianz.supabase.co` |
| **Host (Pooler)** | `aws-0-<region>.pooler.supabase.com` |
| **Port (Direct)** | `5432` |
| **Port (Pooler)** | `6543` |
| **Database** | `postgres` |
| **Username (Direct)** | `postgres` |
| **Username (Pooler)** | `postgres.jwuarrcjjoafxfphianz` |

### 5.3 Direct Connection vs Connection Pooler

Supabase offers two connection methods:

| | Direct Connection | Connection Pooler (Supavisor) |
|---|---|---|
| **Host** | `db.<ref>.supabase.co` | `aws-0-<region>.pooler.supabase.com` |
| **Port** | `5432` | `6543` (Session) / `5432` (Transaction) |
| **Username** | `postgres` | `postgres.<project-ref>` |
| **Best for** | Migrations, DDL, long-lived connections | Application connections, serverless |
| **IPv4** | May not resolve (IPv6 only on some networks) | ✅ Always has IPv4 |

> **Recommendation**: Use **Connection Pooler** for the application. If direct host doesn't resolve (IPv6 issue), pooler is the only option.

### 5.4 ⚠️ Common Supabase Issues

#### Issue: Project Paused
Free-tier Supabase projects **pause after 7 days of inactivity**. When paused:
- `db.<ref>.supabase.co` won't resolve (UnknownHostException)
- Go to Dashboard → Click **"Restore"** to unpause

#### Issue: `UnknownHostException` on Direct Host
```
java.net.UnknownHostException: db.jwuarrcjjoafxfphianz.supabase.co
```
**Causes:**
1. Project is paused → Restore it from dashboard
2. DNS returns IPv6 only, and your network/Java doesn't support IPv6
   - **Fix**: Use the Connection Pooler URL instead (has IPv4)

#### Issue: `FATAL: Tenant or user not found`
```
org.postgresql.util.PSQLException: FATAL: Tenant or user not found
```
**Causes:**
1. **Wrong password** — Reset it in Dashboard → Project Settings → Database → "Reset database password"
2. **Wrong username** — Pooler requires `postgres.<project-ref>`, Direct requires `postgres`
3. **Wrong region in pooler URL** — Check your project's region in dashboard

#### Issue: `FATAL: password authentication failed`
- The database password is the one you set when **creating the project**
- It is NOT the Supabase account password
- Reset it: Dashboard → Project Settings → Database → Reset database password

---

## 6. Configuration Deep Dive

### 6.1 application.yml — Correct Configuration

```yaml
server:
  port: 8080

spring:
  application:
    name: sweet-distribution-backend

  datasource:
    # Option A: Direct Connection (if host resolves)
    url: jdbc:postgresql://db.<PROJECT_REF>.supabase.co:5432/postgres
    username: postgres
    
    # Option B: Connection Pooler (if direct doesn't resolve)
    # url: jdbc:postgresql://aws-0-<REGION>.pooler.supabase.com:6543/postgres
    # username: postgres.<PROJECT_REF>
    
    password: <YOUR_SUPABASE_DB_PASSWORD>
    driver-class-name: org.postgresql.Driver    # ← NOT org.h2.Driver!
    hikari:
      maximum-pool-size: 5
      connection-timeout: 30000

  jpa:
    hibernate:
      ddl-auto: none                            # Flyway handles schema
    show-sql: true
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.PostgreSQLDialect  # ← NOT H2Dialect!

  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true

# NO h2.console section — removed for PostgreSQL
```

### 6.2 Common application.yml Mistakes

| ❌ Wrong | ✅ Correct | Why |
|----------|-----------|-----|
| `driver-class-name: org.h2.Driver` | `driver-class-name: org.postgresql.Driver` | H2 driver can't connect to PostgreSQL |
| `dialect: org.hibernate.dialect.H2Dialect` | `dialect: org.hibernate.dialect.PostgreSQLDialect` | Wrong SQL generation |
| `url: jdbc:postgresql://postgres:[PASSWORD]@host:5432/db` | `url: jdbc:postgresql://host:5432/db` + separate `username`/`password` | Don't embed credentials in URL for Spring |
| `username: sweet-distribution` | `username: postgres` | Supabase default user is `postgres` |
| `h2.console.enabled: true` | Remove entirely | Not needed with PostgreSQL |

### 6.3 Security Configuration

When switching from H2 to PostgreSQL, also remove H2 console access from SecurityConfig:

```java
// ❌ REMOVE these lines:
.requestMatchers("/h2-console/**").permitAll()
// and
.headers(headers -> headers.frameOptions(f -> f.sameOrigin()))
```

---

## 7. Flyway Migrations

### 7.1 Migration Naming Convention

```
V<version>__<description>.sql
```
- `V1__initial_schema.sql` — Core tables
- `V2__seed_data.sql` — Sample data
- `V3__phase2_enhanced_schema.sql` — Phase 2 tables

### 7.2 H2 vs PostgreSQL SQL Syntax Differences

| Feature | H2 Syntax | PostgreSQL Syntax |
|---------|-----------|-------------------|
| UUID generation | `RANDOM_UUID()` | `gen_random_uuid()` |
| Large text | `CLOB` | `TEXT` |
| Auto UUID column | `UUID DEFAULT RANDOM_UUID()` | `UUID DEFAULT gen_random_uuid()` |
| Conditional create | `CREATE TABLE IF NOT EXISTS` | `CREATE TABLE IF NOT EXISTS` (same) |
| Upsert/skip | Not standard | `ON CONFLICT DO NOTHING` |
| Safe ALTER TABLE | Not easy | `DO $$ BEGIN ... EXCEPTION WHEN ... END $$;` |
| Boolean | `BOOLEAN` | `BOOLEAN` (same) |

### 7.3 PostgreSQL-Safe ALTER TABLE Pattern

When adding columns that might already exist:
```sql
-- ❌ Will fail if column exists:
ALTER TABLE orders ADD COLUMN payment_id VARCHAR(255);

-- ✅ Safe pattern:
DO $$
BEGIN
    ALTER TABLE orders ADD COLUMN payment_id VARCHAR(255);
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;
```

### 7.4 Idempotent Seed Data

```sql
-- ❌ Will fail on re-run:
INSERT INTO products (name, price) VALUES ('Gulab Jamun', 299.00);

-- ✅ Safe pattern:
INSERT INTO products (id, name, price)
VALUES (gen_random_uuid(), 'Gulab Jamun', 299.00)
ON CONFLICT DO NOTHING;
```

---

## 8. Build & Run Commands

### 8.1 Compile Only
```cmd
set "JAVA_HOME=C:\Program Files\Java\jdk-21" && set "PATH=C:\Users\ykana\apache-maven-3.9.9\bin;%PATH%" && cd /d "c:\Users\ykana\IdeaProjects\sweet-distribution\backend" && mvn clean compile
```

### 8.2 Run the Application
```cmd
set "JAVA_HOME=C:\Program Files\Java\jdk-21" && set "PATH=C:\Users\ykana\apache-maven-3.9.9\bin;%PATH%" && cd /d "c:\Users\ykana\IdeaProjects\sweet-distribution\backend" && mvn spring-boot:run
```

### 8.3 Run with Specific DB Password (env var)
```cmd
set "JAVA_HOME=C:\Program Files\Java\jdk-21" && set "PATH=C:\Users\ykana\apache-maven-3.9.9\bin;%PATH%" && set "SUPABASE_DB_PASSWORD=your_password_here" && cd /d "c:\Users\ykana\IdeaProjects\sweet-distribution\backend" && mvn spring-boot:run
```

### 8.4 Package as JAR
```cmd
set "JAVA_HOME=C:\Program Files\Java\jdk-21" && set "PATH=C:\Users\ykana\apache-maven-3.9.9\bin;%PATH%" && cd /d "c:\Users\ykana\IdeaProjects\sweet-distribution\backend" && mvn clean package -DskipTests
```

### 8.5 Kill Process on Port 8080
If you get "Port 8080 already in use":
```cmd
netstat -ano | findstr :8080
taskkill /PID <PID_NUMBER> /F
```

---

## 9. Issues Faced & Resolutions

### Issue 1: `JAVA_HOME` Not Set
```
Error: JAVA_HOME not found
```
**Resolution**: Set inline before Maven commands:
```cmd
set "JAVA_HOME=C:\Program Files\Java\jdk-21"
```

### Issue 2: Maven Not Found
```
'mvn' is not recognized as an internal or external command
```
**Resolution**: Add Maven to PATH inline:
```cmd
set "PATH=C:\Users\ykana\apache-maven-3.9.9\bin;%PATH%"
```

### Issue 3: Java 21 Unnamed Variables (`_`)
```
error: unnamed variables are a preview feature and are disabled by default
```
**Code that caused it:**
```java
} catch (Exception _) {  // ← preview feature!
    return false;
}
```
**Resolution**: Use a regular variable name:
```java
} catch (Exception e) {
    return false;
}
```

### Issue 4: Port 8080 Already in Use
```
Web server failed to start. Port 8080 was already in use.
```
**Resolution**:
```cmd
netstat -ano | findstr :8080
taskkill /PID 19504 /F
```

### Issue 5: H2 Driver with PostgreSQL URL
```
org.h2.jdbc.JdbcSQLNonTransientConnectionException
```
**Cause**: `application.yml` had `driver-class-name: org.h2.Driver` but URL was `jdbc:postgresql://...`
**Resolution**: Change to `driver-class-name: org.postgresql.Driver`

### Issue 6: H2 Dialect with PostgreSQL
**Cause**: `dialect: org.hibernate.dialect.H2Dialect` generates H2-specific SQL
**Resolution**: Change to `dialect: org.hibernate.dialect.PostgreSQLDialect`

### Issue 7: `UnknownHostException` on Supabase Direct Host
```
java.net.UnknownHostException: db.jwuarrcjjoafxfphianz.supabase.co
```
**Cause**: Supabase project was paused OR DNS returned IPv6 only (no IPv4)
**Resolution**:
1. Unpause project from Supabase Dashboard
2. If still fails, use Connection Pooler URL: `aws-0-<region>.pooler.supabase.com:6543`

### Issue 8: `FATAL: Tenant or user not found` (Supabase Pooler)
```
org.postgresql.util.PSQLException: FATAL: Tenant or user not found
```
**Cause**: Wrong username or password for the Supabase connection pooler
**Resolution**:
1. Pooler username must be `postgres.<project-ref>` (e.g., `postgres.jwuarrcjjoafxfphianz`)
2. Verify password — reset from Dashboard → Project Settings → Database
3. Verify region in pooler URL matches your project's region

### Issue 9: Flyway Migration Fails with H2 Syntax on PostgreSQL
```
ERROR: function RANDOM_UUID() does not exist
```
**Cause**: Migrations written with H2 syntax (`RANDOM_UUID()`, `CLOB`)
**Resolution**: Rewrite all migrations with PostgreSQL syntax (`gen_random_uuid()`, `TEXT`)

---

## 10. API Endpoints Reference

### Authentication (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT token |

### Products (Authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products |
| GET | `/api/products/{id}` | Get product by ID |
| GET | `/api/products/search?query=` | Search products |
| GET | `/api/products/category/{category}` | Filter by category |

### Orders (Authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Place new order |
| GET | `/api/orders` | Get user's orders |
| GET | `/api/orders/{id}` | Get order details |
| GET | `/api/orders/{id}/track` | Track order delivery |

### Cart (Authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get cart items |
| POST | `/api/cart` | Add item to cart |
| PUT | `/api/cart/{id}` | Update cart item quantity |
| DELETE | `/api/cart/{id}` | Remove from cart |
| DELETE | `/api/cart` | Clear entire cart |

### Addresses (Authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/addresses` | Get user's addresses |
| POST | `/api/addresses` | Add new address |
| PUT | `/api/addresses/{id}` | Update address |
| DELETE | `/api/addresses/{id}` | Delete address |

### Payments (Authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/create-order` | Create Razorpay order |
| POST | `/api/payments/verify` | Verify payment signature |
| GET | `/api/payments/order/{orderId}` | Get payment by order |

### Invoices (Authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invoices/order/{orderId}` | Get invoice for order |

### Admin Only (ADMIN role required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/products` | Create product |
| PUT | `/api/admin/products/{id}` | Update product |
| DELETE | `/api/admin/products/{id}` | Delete product |
| GET | `/api/admin/orders` | Get all orders |
| PUT | `/api/admin/orders/{id}/status` | Update order status |
| POST | `/api/admin/orders/{id}/invoice` | Generate invoice |
| POST | `/api/admin/orders/{id}/tracking` | Create tracking |
| PUT | `/api/admin/tracking/{id}` | Update tracking |

### Swagger UI
- **URL**: `http://localhost:8080/swagger-ui.html`
- **API Docs**: `http://localhost:8080/v3/api-docs`

---

## 11. Tech Stack Summary

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│  React 18 + TypeScript + Vite + Tailwind CSS    │
│  Port: 5173                                      │
└──────────────────────┬──────────────────────────┘
                       │ HTTP (REST API)
                       ▼
┌─────────────────────────────────────────────────┐
│                   BACKEND                        │
│  Spring Boot 3.4.1 + Java 21                    │
│  Spring Security + JWT Authentication           │
│  Spring Data JPA + Hibernate                    │
│  Flyway Migrations                              │
│  Swagger/OpenAPI Documentation                  │
│  Port: 8080                                      │
└──────────────────────┬──────────────────────────┘
                       │ JDBC (PostgreSQL)
                       ▼
┌─────────────────────────────────────────────────┐
│                  DATABASE                        │
│  Supabase PostgreSQL (Cloud)                    │
│  Host: db.<ref>.supabase.co:5432                │
│  OR Pooler: aws-0-<region>.pooler.supabase.com  │
└─────────────────────────────────────────────────┘
```

---

## Quick Start Checklist

- [ ] Java 21 installed at `C:\Program Files\Java\jdk-21`
- [ ] Maven 3.9.9 at `C:\Users\ykana\apache-maven-3.9.9`
- [ ] Supabase project created and **active** (not paused)
- [ ] Database password noted from Supabase project creation
- [ ] `application.yml` configured with correct:
  - [ ] PostgreSQL driver (`org.postgresql.Driver`)
  - [ ] PostgreSQL dialect (`PostgreSQLDialect`)
  - [ ] Correct Supabase host URL
  - [ ] Correct username (`postgres` for direct, `postgres.<ref>` for pooler)
  - [ ] Correct password
- [ ] No H2 console config in `application.yml`
- [ ] No H2 references in `SecurityConfig.java`
- [ ] All Flyway migrations use PostgreSQL syntax
- [ ] Port 8080 is free
- [ ] Run: `mvn clean compile` → BUILD SUCCESS
- [ ] Run: `mvn spring-boot:run` → Application started

---

## Current Status

| Item | Status |
|------|--------|
| Backend code | ✅ 63 files compiled successfully |
| Phase 1 (Core) | ✅ Auth, Products, Orders |
| Phase 2 (Enhanced) | ✅ Cart, Address, Payment, Invoice, Delivery Tracking |
| Flyway migrations | ✅ PostgreSQL syntax |
| Supabase connection | ⏳ Pending — need to verify correct password |
| Frontend | ✅ Existing React app (uses Supabase JS client directly) |
| Frontend ↔ Backend integration | 🔜 Phase 3 |

### Next Steps
1. **Fix Supabase connection** — Reset DB password from dashboard and update `application.yml`
2. **Run the app** — Flyway will auto-create all tables in Supabase
3. **Test APIs** — Use Swagger UI at `http://localhost:8080/swagger-ui.html`
4. **Phase 3** — Payment gateway integration (Razorpay)
5. **Phase 4** — Connect React frontend to Spring Boot backend
