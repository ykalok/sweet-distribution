# 🍬 B2B Sweet Distribution — Full End-to-End Architecture Plan

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                            │
│  React 18 + TypeScript + Vite + Tailwind CSS                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐             │
│  │   Auth    │ │ Products │ │  Orders  │ │  Payment  │             │
│  │  Pages    │ │  Pages   │ │  Pages   │ │  Pages    │             │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬─────┘             │
│       └─────────────┴────────────┴─────────────┘                    │
│                         Axios HTTP Client                           │
└─────────────────────────────┬───────────────────────────────────────┘
                              │ REST API (JSON)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    API GATEWAY / NGINX                               │
│              (Rate Limiting, SSL, Load Balancing)                    │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   SPRING BOOT BACKEND                                │
│                                                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────────┐  │
│  │    Auth     │  │  Product   │  │   Order    │  │   Payment    │  │
│  │  Service    │  │  Service   │  │  Service   │  │   Service    │  │
│  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘  └──────┬───────┘  │
│         │               │               │               │           │
│  ┌──────┴─────┐  ┌──────┴─────┐  ┌──────┴─────┐  ┌─────┴────────┐ │
│  │ Inventory  │  │Notification│  │  Invoice   │  │   Delivery   │  │
│  │  Service   │  │  Service   │  │  Service   │  │   Service    │  │
│  └────────────┘  └────────────┘  └────────────┘  └──────────────┘  │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  Spring Security (JWT) │ Spring Data JPA │ Spring Validation   │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────┬──────────────────────┬───────────────────────────────┘
               │                      │
               ▼                      ▼
┌──────────────────────┐  ┌───────────────────────┐
│   PostgreSQL DB      │  │   External Services   │
│   (Primary + Read    │  │  ┌─────────────────┐  │
│    Replica)          │  │  │ Razorpay/Stripe │  │
│                      │  │  │ (Payment)       │  │
│                      │  │  ├─────────────────┤  │
│   Redis Cache        │  │  │ AWS SES / SMTP  │  │
│                      │  │  │ (Email)         │  │
│                      │  │  ├─────────────────┤  │
│   AWS S3             │  │  │ Twilio / SNS    │  │
│   (File Storage)     │  │  │ (SMS)           │  │
│                      │  │  ├─────────────────┤  │
│                      │  │  │ AWS S3          │  │
│                      │  │  │ (File Upload)   │  │
│                      │  │  └─────────────────┘  │
└──────────────────────┘  └───────────────────────┘
```

---

## Phase-wise Implementation Plan

### Phase 1 — Spring Boot Backend Setup (Replace Supabase)

**Goal**: Migrate from Supabase to a self-managed Spring Boot backend.

```
backend/
├── src/main/java/com/sweetdistribution/
│   ├── SweetDistributionApplication.java
│   ├── config/
│   │   ├── SecurityConfig.java          # JWT + Spring Security
│   │   ├── CorsConfig.java
│   │   ├── RedisConfig.java
│   │   └── SwaggerConfig.java           # API documentation
│   ├── controller/
│   │   ├── AuthController.java
│   │   ├── ProductController.java
│   │   ├── OrderController.java
│   │   ├── PaymentController.java
│   │   ├── InvoiceController.java
│   │   └── AdminController.java
│   ├── service/
│   │   ├── AuthService.java
│   │   ├── ProductService.java
│   │   ├── OrderService.java
│   │   ├── PaymentService.java
│   │   ├── InventoryService.java
│   │   ├── InvoiceService.java
│   │   ├── NotificationService.java
│   │   └── DeliveryService.java
│   ├── repository/
│   │   ├── UserRepository.java
│   │   ├── ProductRepository.java
│   │   ├── OrderRepository.java
│   │   ├── OrderItemRepository.java
│   │   ├── PaymentRepository.java
│   │   └── InvoiceRepository.java
│   ├── model/
│   │   ├── entity/
│   │   │   ├── User.java
│   │   │   ├── Product.java
│   │   │   ├── Order.java
│   │   │   ├── OrderItem.java
│   │   │   ├── Payment.java
│   │   │   ├── Invoice.java
│   │   │   ├── Address.java
│   │   │   └── CartItem.java
│   │   ├── dto/
│   │   │   ├── LoginRequest.java
│   │   │   ├── RegisterRequest.java
│   │   │   ├── OrderRequest.java
│   │   │   ├── PaymentRequest.java
│   │   │   └── ProductDTO.java
│   │   └── enums/
│   │       ├── Role.java
│   │       ├── OrderStatus.java
│   │       └── PaymentStatus.java
│   ├── security/
│   │   ├── JwtTokenProvider.java
│   │   ├── JwtAuthenticationFilter.java
│   │   └── CustomUserDetailsService.java
│   ├── exception/
│   │   ├── GlobalExceptionHandler.java
│   │   ├── ResourceNotFoundException.java
│   │   ├── PaymentFailedException.java
│   │   └── InsufficientStockException.java
│   └── util/
│       ├── InvoicePdfGenerator.java
│       └── SlugGenerator.java
├── src/main/resources/
│   ├── application.yml
│   ├── application-dev.yml
│   └── application-prod.yml
├── src/test/java/com/sweetdistribution/
│   ├── service/
│   ├── controller/
│   └── repository/
└── pom.xml
```

**Key Dependencies** (`pom.xml`):
```xml
<dependencies>
    <!-- Core -->
    <dependency>spring-boot-starter-web</dependency>
    <dependency>spring-boot-starter-data-jpa</dependency>
    <dependency>spring-boot-starter-security</dependency>
    <dependency>spring-boot-starter-validation</dependency>

    <!-- Database -->
    <dependency>postgresql</dependency>
    <dependency>spring-boot-starter-data-redis</dependency>
    <dependency>flyway-core</dependency>

    <!-- JWT -->
    <dependency>jjwt-api</dependency>
    <dependency>jjwt-impl</dependency>

    <!-- Payment -->
    <dependency>razorpay-java (or stripe-java)</dependency>

    <!-- PDF Invoice -->
    <dependency>itext7-core</dependency>

    <!-- Email -->
    <dependency>spring-boot-starter-mail</dependency>

    <!-- File Upload -->
    <dependency>aws-java-sdk-s3</dependency>

    <!-- API Docs -->
    <dependency>springdoc-openapi-starter-webmvc-ui</dependency>

    <!-- Testing -->
    <dependency>spring-boot-starter-test</dependency>
    <dependency>h2 (test scope)</dependency>
</dependencies>
```

---

### Phase 2 — Enhanced Database Schema

```sql
-- Existing tables (migrated from Supabase)
-- users, products, orders, order_items

-- NEW: Addresses table
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    label VARCHAR(50),              -- "Office", "Warehouse"
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now()
);

-- NEW: Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    gateway_order_id VARCHAR(255),   -- Razorpay/Stripe order ID
    gateway_payment_id VARCHAR(255), -- Razorpay/Stripe payment ID
    gateway_signature VARCHAR(255),  -- For verification
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    method VARCHAR(50),              -- UPI, card, netbanking
    failure_reason TEXT,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- NEW: Invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    pdf_url TEXT,
    gst_amount NUMERIC(10,2),
    total_with_tax NUMERIC(10,2) NOT NULL,
    generated_at TIMESTAMP DEFAULT now()
);

-- NEW: Cart table (persistent cart)
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- NEW: Delivery tracking
CREATE TABLE delivery_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    status VARCHAR(50) NOT NULL,
    location VARCHAR(255),
    notes TEXT,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT now()
);

-- Enhanced orders table (add columns)
ALTER TABLE orders ADD COLUMN payment_id UUID REFERENCES payments(id);
ALTER TABLE orders ADD COLUMN invoice_id UUID REFERENCES invoices(id);
ALTER TABLE orders ADD COLUMN address_id UUID REFERENCES addresses(id);
ALTER TABLE orders ADD COLUMN estimated_delivery DATE;
ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(100);
```

**Entity Relationship:**
```
users ──┬── addresses (1:N)
        ├── cart_items (1:N) ──── products
        └── orders (1:N) ──┬── order_items (1:N) ── products
                           ├── payments (1:1)
                           ├── invoices (1:1)
                           └── delivery_tracking (1:N)
```

---

### Phase 3 — Payment Gateway Integration (Razorpay)

**Flow:**
```
Customer clicks "Pay"
        │
        ▼
Frontend ──POST /api/payments/create-order──→ Spring Boot
        │                                        │
        │                              Creates Razorpay order
        │                              Saves payment (PENDING)
        │                                        │
        ◄──── Returns razorpay_order_id ─────────┘
        │
        ▼
Opens Razorpay Checkout (JS SDK)
        │
        ▼
Customer completes payment
        │
        ▼
Frontend ──POST /api/payments/verify──→ Spring Boot
        │                                   │
        │                         Verifies signature
        │                         Updates payment (SUCCESS)
        │                         Updates order (CONFIRMED)
        │                         Deducts inventory
        │                         Generates invoice
        │                         Sends email notification
        │                                   │
        ◄──── Returns order confirmation ───┘
```

---

### Phase 4 — Additional Features Roadmap

| Feature | Description | Priority |
|---|---|---|
| **Persistent Cart** | Cart saved in DB, survives refresh/logout | High |
| **Payment Gateway** | Razorpay/Stripe integration | High |
| **Invoice Generation** | Auto-generate PDF invoices with GST | High |
| **Email Notifications** | Order confirmation, status updates, payment receipts | High |
| **Inventory Management** | Auto-deduct stock on order, low stock alerts | High |
| **Address Management** | Multiple saved addresses per customer | Medium |
| **Delivery Tracking** | Real-time order tracking with status history | Medium |
| **Product Search** | Full-text search with filters (price, category) | Medium |
| **Image Upload** | Product images via AWS S3 | Medium |
| **Dashboard Analytics** | Admin dashboard — revenue, top products, order trends | Medium |
| **Bulk Ordering** | CSV upload for bulk orders | Medium |
| **Discount/Coupons** | Coupon codes, bulk discounts, loyalty pricing | Low |
| **SMS Notifications** | Order updates via SMS (Twilio/SNS) | Low |
| **Export Reports** | Export orders/invoices as CSV/Excel | Low |
| **Audit Logs** | Track all admin actions | Low |
| **Rate Limiting** | API rate limiting per user | Low |
| **Webhook Support** | Notify external systems on order events | Low |

---

### Phase 5 — API Design

```
AUTH
  POST   /api/auth/register          # Register new customer
  POST   /api/auth/login              # Login, returns JWT
  POST   /api/auth/refresh            # Refresh JWT token
  POST   /api/auth/forgot-password    # Send reset email
  POST   /api/auth/reset-password     # Reset with token

PRODUCTS
  GET    /api/products                # List products (paginated, filterable)
  GET    /api/products/{id}           # Get product details
  GET    /api/products/search?q=      # Search products
  POST   /api/admin/products          # [ADMIN] Create product
  PUT    /api/admin/products/{id}     # [ADMIN] Update product
  DELETE /api/admin/products/{id}     # [ADMIN] Delete product
  POST   /api/admin/products/{id}/image  # [ADMIN] Upload image

CART
  GET    /api/cart                    # Get user's cart
  POST   /api/cart                    # Add item to cart
  PUT    /api/cart/{itemId}           # Update quantity
  DELETE /api/cart/{itemId}           # Remove item
  DELETE /api/cart                    # Clear cart

ORDERS
  POST   /api/orders                  # Place order (from cart)
  GET    /api/orders                  # List user's orders
  GET    /api/orders/{id}             # Get order details
  GET    /api/orders/{id}/track       # Get delivery tracking
  POST   /api/orders/{id}/cancel      # Cancel order
  GET    /api/admin/orders            # [ADMIN] List all orders
  PUT    /api/admin/orders/{id}/status  # [ADMIN] Update status

PAYMENTS
  POST   /api/payments/create-order   # Create Razorpay order
  POST   /api/payments/verify         # Verify payment signature
  GET    /api/payments/{orderId}      # Get payment status
  POST   /api/payments/webhook        # Razorpay webhook callback

INVOICES
  GET    /api/invoices/{orderId}      # Get invoice details
  GET    /api/invoices/{orderId}/pdf  # Download invoice PDF

ADDRESSES
  GET    /api/addresses               # List user's addresses
  POST   /api/addresses               # Add address
  PUT    /api/addresses/{id}          # Update address
  DELETE /api/addresses/{id}          # Delete address

ADMIN DASHBOARD
  GET    /api/admin/dashboard/stats   # Revenue, order count, etc.
  GET    /api/admin/dashboard/top-products  # Best sellers
  GET    /api/admin/inventory/low-stock     # Low stock alerts
```

---

### Phase 6 — Deployment Architecture (AWS)

```
                    ┌──────────────┐
                    │  Route 53    │
                    │  (DNS)       │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ CloudFront   │
                    │ (CDN)        │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              │                         │
       ┌──────▼───────┐         ┌──────▼───────┐
       │  S3 Bucket   │         │     ALB      │
       │  (React App) │         │ (Load Bal.)  │
       └──────────────┘         └──────┬───────┘
                                       │
                                ┌──────▼───────┐
                                │  ECS Fargate │
                                │  (Spring     │
                                │   Boot)      │
                                └──────┬───────┘
                                       │
                        ┌──────────────┼──────────────┐
                        │              │              │
                 ┌──────▼──────┐ ┌────▼─────┐ ┌─────▼──────┐
                 │  RDS        │ │ElastiCache│ │  S3        │
                 │  PostgreSQL │ │  (Redis)  │ │  (Images)  │
                 └─────────────┘ └──────────┘ └────────────┘
```

**Alternative (simpler)**: Deploy on a single EC2 instance with Docker Compose for dev/staging.

---

## Getting Started — Step-by-Step

### Step 1: Initialize Spring Boot
```bash
cd c:\Users\ykana\IdeaProjects\sweet-distribution\backend
# Use Spring Initializr or create manually
```

### Step 2: Set up PostgreSQL locally
```bash
# Using Docker
docker run -d --name sweet-db -p 5432:5432 \
  -e POSTGRES_DB=sweet_distribution \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=admin123 \
  postgres:16
```

### Step 3: Set up Redis locally
```bash
docker run -d --name sweet-redis -p 6379:6379 redis:7
```

### Step 4: Configure application.yml
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/sweet_distribution
    username: admin
    password: admin123
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: true
  flyway:
    enabled: true

jwt:
  secret: your-256-bit-secret-key
  expiration: 86400000

razorpay:
  key-id: your-razorpay-key
  key-secret: your-razorpay-secret

aws:
  s3:
    bucket: sweet-distribution-images
    region: ap-south-1
```

### Step 5: Update React frontend
- Replace Supabase client with Axios HTTP client
- Point API calls to `http://localhost:8080/api/`
- Add Razorpay JS SDK for payment checkout

---

## Summary

| Current (Supabase)         | Target (Spring Boot)                    |
|----------------------------|-----------------------------------------|
| Supabase Auth              | Spring Security + JWT                   |
| Supabase DB (direct)       | Spring Data JPA + PostgreSQL            |
| Supabase Edge Functions    | REST Controllers + Services             |
| Supabase RLS               | @PreAuthorize + Role-based security     |
| In-memory cart             | Persistent cart in DB + Redis cache     |
| No payments                | Razorpay/Stripe integration             |
| No invoices                | Auto-generated PDF invoices             |
| No notifications           | Email + SMS notifications               |
| No file upload             | AWS S3 image upload                     |

This gives you a production-grade, scalable B2B platform. Want me to start implementing any specific phase?
