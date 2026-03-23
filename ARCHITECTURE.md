# 🍬 B2B Sweet Distribution — Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                            │
│  React 18 + TypeScript + Vite + Tailwind CSS                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐             │
│  │   Auth    │ │ Products │ │  Orders  │ │  Payment  │             │
│  │  Pages    │ │  Pages   │ │  Pages   │ │  (Razorpay)│            │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬─────┘             │
│       └─────────────┴────────────┴─────────────┘                    │
│                     Axios HTTP Client (api.ts)                      │
│              JWT stored in localStorage, auto-attached              │
└─────────────────────────────┬───────────────────────────────────────┘
                              │ REST API (JSON) — Port 5173 → 8080
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   SPRING BOOT BACKEND (Port 8080)                    │
│                                                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────────┐  │
│  │    Auth     │  │  Product   │  │   Order    │  │   Payment    │  │
│  │  Controller │  │ Controller │  │ Controller │  │  Controller  │  │
│  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘  └──────┬───────┘  │
│  ┌──────┴─────┐  ┌──────┴─────┐  ┌──────┴─────┐  ┌─────┴────────┐ │
│  │    Auth     │  │  Product   │  │   Order    │  │   Payment    │  │
│  │  Service    │  │  Service   │  │  Service   │  │   Service    │  │
│  └────────────┘  └────────────┘  └────────────┘  └──────────────┘  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────────┐  │
│  │    Cart     │  │  Address   │  │  Invoice   │  │  Delivery    │  │
│  │  Service    │  │  Service   │  │  Service   │  │  Tracking    │  │
│  └────────────┘  └────────────┘  └────────────┘  └──────────────┘  │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  Spring Security (JWT) │ Spring Data JPA │ Flyway │ Swagger    │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ JDBC
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                              │
│  9 tables: users, products, orders, order_items, cart_items,         │
│            addresses, payments, invoices, delivery_tracking           │
│  Managed by Flyway migrations (V1 → V2 → V3)                        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
sweet-distribution/
├── backend/                              # Spring Boot 3.4.1 + Java 21
│   ├── src/main/java/com/sweetdistribution/
│   │   ├── config/
│   │   │   ├── CorsConfig.java           # CORS for frontend origin
│   │   │   ├── SecurityConfig.java       # JWT filter chain, role-based access
│   │   │   └── SwaggerConfig.java        # OpenAPI 3 documentation
│   │   ├── controller/                   # 8 REST controllers
│   │   │   ├── AuthController.java       # /api/auth/login, /register
│   │   │   ├── ProductController.java    # /api/products (public read)
│   │   │   ├── OrderController.java      # /api/orders (customer)
│   │   │   ├── CartController.java       # /api/cart (persistent, server-side)
│   │   │   ├── PaymentController.java    # /api/payments (Razorpay)
│   │   │   ├── InvoiceController.java    # /api/invoices
│   │   │   ├── AddressController.java    # /api/addresses
│   │   │   └── AdminController.java      # /api/admin/* (admin-only)
│   │   ├── service/                      # 8 service classes
│   │   │   ├── AuthService.java          # Registration, login, JWT generation
│   │   │   ├── ProductService.java       # Product CRUD + search
│   │   │   ├── OrderService.java         # Order creation, status management
│   │   │   ├── CartService.java          # Persistent cart operations
│   │   │   ├── PaymentService.java       # Razorpay order creation + verification
│   │   │   ├── InvoiceService.java       # Invoice generation
│   │   │   ├── AddressService.java       # Address CRUD
│   │   │   └── DeliveryTrackingService.java
│   │   ├── repository/                   # 9 Spring Data JPA repositories
│   │   ├── model/
│   │   │   ├── entity/                   # 9 JPA entities
│   │   │   │   ├── User.java
│   │   │   │   ├── Product.java
│   │   │   │   ├── Order.java
│   │   │   │   ├── OrderItem.java
│   │   │   │   ├── CartItem.java
│   │   │   │   ├── Address.java
│   │   │   │   ├── Payment.java
│   │   │   │   ├── Invoice.java
│   │   │   │   └── DeliveryTracking.java
│   │   │   ├── dto/                      # 16 Java records
│   │   │   └── enums/                    # Role, OrderStatus, PaymentStatus
│   │   ├── security/
│   │   │   ├── JwtTokenProvider.java     # JWT creation + validation
│   │   │   ├── JwtAuthenticationFilter.java  # Extracts JWT from Authorization header
│   │   │   └── CustomUserDetailsService.java
│   │   └── exception/
│   │       ├── GlobalExceptionHandler.java
│   │       ├── ResourceNotFoundException.java
│   │       ├── PaymentFailedException.java
│   │       └── InsufficientStockException.java
│   ├── src/main/resources/
│   │   ├── application.yml               # Config with env var placeholders
│   │   └── db/migration/
│   │       ├── V1__initial_schema.sql    # users, products, orders, order_items
│   │       ├── V2__seed_data.sql         # Admin user + sample products
│   │       └── V3__phase2_enhanced_schema.sql  # addresses, payments, invoices, cart_items, delivery_tracking
│   └── pom.xml
│
├── frontend/                             # React 18 + TypeScript + Vite
│   ├── src/
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx           # JWT auth state, login/register/logout
│   │   ├── lib/
│   │   │   └── api.ts                   # Axios client with JWT interceptor
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── admin/
│   │   │   │   ├── ProductManagement.tsx # CRUD products
│   │   │   │   └── OrderManagement.tsx  # View/update all orders
│   │   │   └── customer/
│   │   │       ├── Products.tsx         # Browse + add to cart
│   │   │       ├── Cart.tsx             # Server-side persistent cart
│   │   │       ├── Checkout.tsx         # Place order + Razorpay payment
│   │   │       └── OrderTracking.tsx    # Track past orders
│   │   ├── types/
│   │   │   └── razorpay.d.ts
│   │   ├── App.tsx                      # Root component, routing, nav
│   │   └── main.tsx
│   ├── .env                             # VITE_API_BASE_URL
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── README.md
├── ARCHITECTURE.md                       # ← You are here
└── SETUP.md
```

---

## Database Schema

9 tables, all managed by Flyway migrations (PostgreSQL):

```
users ──┬── addresses (1:N)
        ├── cart_items (1:N) ──── products
        └── orders (1:N) ──┬── order_items (1:N) ── products
                           ├── payments (1:1)
                           ├── invoices (1:1)
                           └── delivery_tracking (1:N)
```

| Table | Key Columns |
|-------|-------------|
| users | email, password (BCrypt), full_name, role (CUSTOMER/ADMIN), company_name |
| products | name, description, price, category, stock_quantity, min_order_quantity, is_active |
| orders | customer_id, status, total_amount, delivery_address, payment_id, address_id |
| order_items | order_id, product_id, quantity, price_at_time |
| cart_items | user_id, product_id, quantity (UNIQUE per user+product) |
| addresses | user_id, label, address_line1/2, city, state, pincode, is_default |
| payments | order_id, gateway_order_id, gateway_payment_id, amount, status, method |
| invoices | order_id, invoice_number, gst_amount, total_with_tax, pdf_url |
| delivery_tracking | order_id, status, location, notes, updated_by |

Order status lifecycle: `PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED` (or `CANCELLED`)

---

## Authentication Flow

```
Frontend                                    Backend
   │                                           │
   ├── POST /api/auth/login ──────────────────►│
   │   { email, password }                     │── Validates credentials (BCrypt)
   │                                           │── Generates JWT (24h expiry)
   │◄── { token, userId, email, role } ────────│
   │                                           │
   │── Stores JWT + profile in localStorage    │
   │                                           │
   │── All subsequent requests ────────────────►│
   │   Authorization: Bearer <jwt>             │── JwtAuthenticationFilter extracts token
   │                                           │── Validates + sets SecurityContext
   │                                           │── Role-based access via SecurityConfig
```

- JWT secret and expiry configured via environment variables
- 401 responses trigger auto-logout on frontend (Axios interceptor)

---

## Customer Flow

```
Products Page ──► Browse/search by category ──► Add to Cart
      │                                          (POST /api/cart)
      │                                          Server-side persistent cart
      ▼
  Cart Page ──► Adjust quantities / Remove items
      │          (PUT/DELETE /api/cart/{id})
      ▼
 Checkout Page ──► Select address + notes ──► Place Order (POST /api/orders)
      │                                              │
      ▼                                              ▼
 Razorpay Payment                            Order created (PENDING)
      │                                              │
      ├── POST /api/payments/create-order            │
      │   → Returns razorpay_order_id                │
      ├── Razorpay JS Checkout opens                 │
      ├── Customer pays                              │
      ├── POST /api/payments/verify                  │
      │   → Verifies signature                       │
      │   → Updates payment (SUCCESS)                │
      │   → Updates order (CONFIRMED)                │
      ▼                                              ▼
 Order Tracking ──► View all orders with status, items, delivery info
      (GET /api/orders)
```

---

## Admin Flow

```
Product Management ──► Add / Edit / Delete products
      │                 POST/PUT/DELETE /api/admin/products
      │                 (name, price, category, stock, min qty, active toggle)
      ▼
Order Management ──► View all orders (GET /api/admin/orders)
      │               Filter by status
      │               Update order status (PUT /api/admin/orders/{id}/status)
      │               Generate invoice (POST /api/admin/orders/{id}/invoice)
      │               Add delivery tracking (POST /api/admin/orders/{id}/tracking)
```

---

## Security

| Layer | Implementation |
|-------|---------------|
| Authentication | JWT tokens (jjwt 0.12.5), 24h expiry |
| Password storage | BCrypt hashing |
| Authorization | Spring Security filter chain, role-based (CUSTOMER/ADMIN) |
| CORS | CorsConfig.java — allows frontend origin |
| Input validation | Spring Validation (@NotBlank, @Email, etc.) |
| Error handling | GlobalExceptionHandler — consistent API error responses |
| Credentials | Environment variables with fallback defaults in application.yml |

---

## API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register (returns JWT) |
| POST | `/api/auth/login` | Login (returns JWT) |

### Customer (Authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products (paginated, filterable by category) |
| GET | `/api/products/{id}` | Product details |
| GET | `/api/products/search?q=` | Search products |
| GET | `/api/products/categories` | List all categories |
| GET/POST/PUT/DELETE | `/api/cart` | Persistent cart CRUD |
| POST | `/api/orders` | Place order |
| GET | `/api/orders` | My orders (paginated) |
| GET | `/api/orders/{id}` | Order details |
| POST | `/api/orders/{id}/cancel` | Cancel order |
| GET | `/api/orders/{id}/track` | Delivery tracking |
| POST | `/api/payments/create-order` | Create Razorpay order |
| POST | `/api/payments/verify` | Verify Razorpay payment |
| GET | `/api/payments/{orderId}` | Payment status |
| GET | `/api/invoices/{orderId}` | Invoice details |
| GET/POST/PUT/DELETE | `/api/addresses` | Address CRUD |

### Admin Only
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/products` | Create product |
| PUT | `/api/admin/products/{id}` | Update product |
| DELETE | `/api/admin/products/{id}` | Delete product |
| GET | `/api/admin/orders` | All orders (filterable by status) |
| PUT | `/api/admin/orders/{id}/status` | Update order status |
| POST | `/api/admin/orders/{id}/invoice` | Generate invoice |
| POST | `/api/admin/orders/{id}/tracking` | Add tracking entry |

Swagger UI: `http://localhost:8080/swagger-ui.html`

---

## Key Dependencies

### Backend (pom.xml)
| Dependency | Purpose |
|-----------|---------|
| spring-boot-starter-web | REST APIs |
| spring-boot-starter-data-jpa | JPA/Hibernate ORM |
| spring-boot-starter-security | Spring Security |
| spring-boot-starter-validation | Bean validation |
| postgresql | PostgreSQL JDBC driver |
| flyway-core + flyway-database-postgresql | Database migrations |
| jjwt-api / jjwt-impl / jjwt-jackson (0.12.5) | JWT tokens |
| razorpay-java (1.4.6) | Payment gateway |
| springdoc-openapi-starter-webmvc-ui (2.5.0) | Swagger UI |
| lombok | Boilerplate reduction |
| h2 (test scope only) | In-memory DB for tests |

### Frontend (package.json)
| Dependency | Purpose |
|-----------|---------|
| react / react-dom (18.3) | UI framework |
| axios (1.13) | HTTP client |
| lucide-react | Icons |
| tailwindcss (3.4) | Styling |
| typescript (5.5) | Type safety |
| vite (5.4) | Build tool |

---

## Deployment Architecture

### Simple (Demo/Testing)
```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Vercel/Netlify  │────►│  Railway/Render   │────►│  PostgreSQL  │
│  (React SPA)     │     │  (Spring Boot)    │     │  (Managed)   │
└─────────────────┘     └──────────────────┘     └──────────────┘
```

### Production (AWS)
```
                    ┌──────────────┐
                    │  Route 53    │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  CloudFront  │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              │                         │
       ┌──────▼───────┐         ┌──────▼───────┐
       │  S3 Bucket   │         │     ALB      │
       │  (React SPA) │         │              │
       └──────────────┘         └──────┬───────┘
                                       │
                                ┌──────▼───────┐
                                │  ECS Fargate │
                                │  (Spring     │
                                │   Boot JAR)  │
                                └──────┬───────┘
                                       │
                                ┌──────▼───────┐
                                │  RDS         │
                                │  PostgreSQL  │
                                └──────────────┘
```

---

## Future Roadmap

| Feature | Priority |
|---------|----------|
| Email notifications (order confirmation, status updates) | High |
| Product image upload (AWS S3) | Medium |
| Admin dashboard analytics (revenue, top products) | Medium |
| Full-text product search with filters | Medium |
| Bulk ordering (CSV upload) | Medium |
| Discount/coupon codes | Low |
| SMS notifications (Twilio/SNS) | Low |
| Export reports (CSV/Excel) | Low |
| Redis caching for products | Low |
| Rate limiting | Low |
