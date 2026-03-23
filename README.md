# 🍬 B2B Sweet Distribution Platform

A full-stack B2B sweet ordering platform with React frontend and Spring Boot backend. Supports **Customer** and **Admin** roles with distinct workflows including persistent cart, payments (Razorpay), invoicing, and delivery tracking.

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React 18, TypeScript, Vite, Tailwind CSS        |
| Backend    | Spring Boot 3.4.1, Java 21, Spring Security     |
| Database   | PostgreSQL (Supabase-hosted)                     |
| ORM        | Spring Data JPA, Hibernate, Flyway migrations    |
| Auth       | JWT (jjwt 0.12.5)                                |
| Payments   | Razorpay                                         |
| API Docs   | Swagger / SpringDoc OpenAPI                      |

---

## Project Structure

```
sweet-distribution/
├── backend/
│   ├── src/main/java/com/sweetdistribution/
│   │   ├── config/
│   │   │   ├── CorsConfig.java
│   │   │   ├── SecurityConfig.java
│   │   │   └── SwaggerConfig.java
│   │   ├── controller/
│   │   │   ├── AuthController.java
│   │   │   ├── ProductController.java
│   │   │   ├── OrderController.java
│   │   │   ├── CartController.java
│   │   │   ├── PaymentController.java
│   │   │   ├── InvoiceController.java
│   │   │   ├── AddressController.java
│   │   │   └── AdminController.java
│   │   ├── service/
│   │   │   ├── AuthService.java
│   │   │   ├── ProductService.java
│   │   │   ├── OrderService.java
│   │   │   ├── CartService.java
│   │   │   ├── PaymentService.java
│   │   │   ├── InvoiceService.java
│   │   │   ├── AddressService.java
│   │   │   └── DeliveryTrackingService.java
│   │   ├── repository/          # 9 Spring Data JPA repositories
│   │   ├── model/
│   │   │   ├── entity/          # User, Product, Order, OrderItem, CartItem,
│   │   │   │                    # Payment, Invoice, Address, DeliveryTracking
│   │   │   ├── dto/             # 16 request/response DTOs (Java records)
│   │   │   └── enums/           # Role, OrderStatus, PaymentStatus
│   │   ├── security/
│   │   │   ├── JwtTokenProvider.java
│   │   │   ├── JwtAuthenticationFilter.java
│   │   │   └── CustomUserDetailsService.java
│   │   ├── exception/
│   │   │   ├── GlobalExceptionHandler.java
│   │   │   ├── ResourceNotFoundException.java
│   │   │   ├── PaymentFailedException.java
│   │   │   └── InsufficientStockException.java
│   │   └── SweetDistributionApplication.java
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── db/migration/
│   │       ├── V1__initial_schema.sql
│   │       ├── V2__seed_data.sql
│   │       └── V3__phase2_enhanced_schema.sql
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx        # JWT-based auth state management
│   │   ├── lib/
│   │   │   └── api.ts                 # Axios HTTP client (all API calls)
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── admin/
│   │   │   │   ├── ProductManagement.tsx
│   │   │   │   └── OrderManagement.tsx
│   │   │   └── customer/
│   │   │       ├── Products.tsx
│   │   │       ├── Cart.tsx
│   │   │       ├── Checkout.tsx
│   │   │       └── OrderTracking.tsx
│   │   ├── types/
│   │   │   └── razorpay.d.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── README.md
├── ARCHITECTURE.md
└── SETUP.md
```

---

## Database Schema

9 tables managed by Flyway migrations:

```
users ──┬── addresses (1:N)
        ├── cart_items (1:N) ──── products
        └── orders (1:N) ──┬── order_items (1:N) ── products
                           ├── payments (1:1)
                           ├── invoices (1:1)
                           └── delivery_tracking (1:N)
```

- **users** — email, password (BCrypt), role (`CUSTOMER` | `ADMIN`), company name
- **products** — name, price, category, stock, min order qty, active flag
- **orders** — customer ref, status, total, delivery address, notes
- **order_items** — links orders to products with quantity and price snapshot
- **cart_items** — persistent server-side cart (per user, unique product)
- **addresses** — multiple saved addresses per user
- **payments** — Razorpay gateway order/payment IDs, status, amount
- **invoices** — invoice number, GST, total with tax, PDF URL
- **delivery_tracking** — status history with location and notes

Order status lifecycle: `PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED` (or `CANCELLED`)

---

## Application Flow

### Authentication
```
User opens app
    │
    ├── No JWT in localStorage → Login / Register page
    │       │
    │       ├── Login:  POST /api/auth/login → JWT token + profile → stored in localStorage
    │       └── Register: POST /api/auth/register → JWT token + profile → stored in localStorage
    │
    └── JWT exists → AuthContext loads profile from localStorage
            │
            ├── role = "CUSTOMER" → Customer pages
            └── role = "ADMIN"    → Admin pages
```

- JWT token is attached to all API requests via Axios interceptor
- 401 responses auto-clear token and reload the page

### Customer Flow
```
Products Page → Browse/search by category → Add to Cart (server-side, persistent)
      │
      ▼
  Cart Page → Adjust quantities / Remove items (API calls)
      │
      ▼
 Checkout Page → Select address + notes → Place Order → Razorpay Payment
      │
      ▼
 Order Tracking → View all past orders with status, items, delivery info
```

### Admin Flow
```
Product Management → Add / Edit / Delete products (name, price, category, stock, etc.)
      │
      ▼
Order Management → View all orders → Filter by status → Update order status
                 → Generate invoices → Add delivery tracking
```

---

## API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |

### Customer (Authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products (paginated, filterable) |
| GET | `/api/products/{id}` | Product details |
| GET | `/api/products/search?q=` | Search products |
| GET | `/api/products/categories` | List categories |
| GET/POST/PUT/DELETE | `/api/cart` | Cart CRUD |
| POST | `/api/orders` | Place order |
| GET | `/api/orders` | My orders |
| GET | `/api/orders/{id}` | Order details |
| GET | `/api/orders/{id}/track` | Delivery tracking |
| POST | `/api/payments/create-order` | Create Razorpay order |
| POST | `/api/payments/verify` | Verify payment |
| GET/POST/PUT/DELETE | `/api/addresses` | Address CRUD |

### Admin Only
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST/PUT/DELETE | `/api/admin/products/{id}` | Product CRUD |
| GET | `/api/admin/orders` | All orders |
| PUT | `/api/admin/orders/{id}/status` | Update order status |
| POST | `/api/admin/orders/{id}/invoice` | Generate invoice |
| POST/PUT | `/api/admin/orders/{id}/tracking` | Delivery tracking |

Swagger UI: `http://localhost:8080/swagger-ui.html`

---

## Running Locally

### Prerequisites
- Java 21
- Maven 3.9+
- Node.js 18+
- PostgreSQL (Supabase cloud or local)

### 1. Backend
```bash
cd backend

# Configure database in src/main/resources/application.yml
# Update datasource url, username, password

# Build and run (Flyway auto-creates tables + seeds data)
mvn clean spring-boot:run
```

Backend starts at `http://localhost:8080`

### 2. Frontend
```bash
cd frontend

# Create .env file
VITE_API_BASE_URL=http://localhost:8080

# Install and start
npm install
npm run dev
```

Frontend starts at `http://localhost:5173`

### Default Admin Account (from seed data)
- Email: `admin@sweetdistribution.com`
- Password: `admin123`

---

## Deployment Guide

### Option A: Railway (Recommended for quick demo)

Railway handles both backend + database with minimal config.

**1. Deploy Backend:**
```bash
# From project root, push to GitHub first
cd backend
```
- Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
- Set root directory to `backend`
- Add a **PostgreSQL** plugin (Railway provisions it automatically)
- Set environment variables:
  ```
  SPRING_DATASOURCE_URL=jdbc:postgresql://${PGHOST}:${PGPORT}/${PGDATABASE}
  SPRING_DATASOURCE_USERNAME=${PGUSER}
  SPRING_DATASOURCE_PASSWORD=${PGPASSWORD}
  JWT_SECRET=<your-256-bit-secret>
  RAZORPAY_KEY_ID=<your-razorpay-key>
  RAZORPAY_KEY_SECRET=<your-razorpay-secret>
  ```
- Railway auto-detects Maven, builds the JAR, and runs it

**2. Deploy Frontend:**
- Add another service in the same Railway project → Deploy from GitHub
- Set root directory to `frontend`
- Set environment variable:
  ```
  VITE_API_BASE_URL=https://<your-backend>.railway.app
  ```
- Set build command: `npm run build`
- Set start command: `npx serve dist -s -l 3000`

### Option B: Render (Free tier available)

**1. Backend (Web Service):**
- Go to [render.com](https://render.com) → New Web Service → Connect GitHub repo
- Root directory: `backend`
- Build command: `mvn clean package -DskipTests`
- Start command: `java -jar target/sweet-distribution-backend-1.0.0.jar`
- Add a **PostgreSQL** database from Render dashboard
- Set environment variables:
  ```
  SPRING_DATASOURCE_URL=<render-postgres-internal-url>
  SPRING_DATASOURCE_USERNAME=<db-user>
  SPRING_DATASOURCE_PASSWORD=<db-password>
  JWT_SECRET=<your-secret>
  RAZORPAY_KEY_ID=<key>
  RAZORPAY_KEY_SECRET=<secret>
  ```

**2. Frontend (Static Site):**
- New Static Site → Connect GitHub repo
- Root directory: `frontend`
- Build command: `npm run build`
- Publish directory: `dist`
- Set environment variable: `VITE_API_BASE_URL=https://<your-backend>.onrender.com`
- Add rewrite rule: `/*` → `/index.html` (for SPA routing)

### Option C: AWS (Production-grade)

**1. Backend → AWS Elastic Beanstalk or ECS:**
```bash
cd backend
mvn clean package -DskipTests
# Upload target/sweet-distribution-backend-1.0.0.jar to Elastic Beanstalk
# Or build Docker image and push to ECR → deploy on ECS Fargate
```

**2. Database → Amazon RDS PostgreSQL**

**3. Frontend → S3 + CloudFront:**
```bash
cd frontend
npm run build
aws s3 sync dist/ s3://<your-bucket> --delete
# Create CloudFront distribution pointing to S3
```

### Option D: Docker Compose (Self-hosted / VPS)

Create a `docker-compose.yml` at project root:

```yaml
version: '3.8'
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: sweet_distribution
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/sweet_distribution
      SPRING_DATASOURCE_USERNAME: postgres
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      RAZORPAY_KEY_ID: ${RAZORPAY_KEY_ID}
      RAZORPAY_KEY_SECRET: ${RAZORPAY_KEY_SECRET}
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"

volumes:
  pgdata:
```

Add `backend/Dockerfile`:
```dockerfile
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY pom.xml mvnw ./
COPY .mvn .mvn
RUN ./mvnw dependency:go-offline
COPY src src
RUN ./mvnw package -DskipTests

FROM eclipse-temurin:21-jre
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

Add `frontend/Dockerfile`:
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM node:18-alpine
RUN npm i -g serve
COPY --from=build /app/dist /app
EXPOSE 3000
CMD ["serve", "/app", "-s", "-l", "3000"]
```

Deploy on any VPS:
```bash
DB_PASSWORD=secure123 JWT_SECRET=your-secret docker-compose up -d
```

---

## Pre-Deployment Checklist

- [ ] Remove hardcoded credentials from `application.yml` — use environment variables
- [ ] Set a strong `jwt.secret` (at least 256 bits)
- [ ] Configure Razorpay live keys (replace test keys)
- [ ] Update frontend `.env` with production backend URL
- [ ] Ensure CORS config allows your frontend domain
- [ ] Test Flyway migrations run cleanly on a fresh database
- [ ] Verify admin seed account works
