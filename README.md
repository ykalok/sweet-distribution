# 🍬 B2B Sweet Distribution Platform

A full-stack B2B sweet ordering platform built with React, TypeScript, Supabase, and Tailwind CSS. It supports two roles — **Customer** and **Admin** — each with distinct workflows.

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, TypeScript, Vite          |
| Styling    | Tailwind CSS, Lucide React (icons)  |
| Backend    | Supabase (Auth, Database, Edge Functions) |
| Database   | PostgreSQL (via Supabase)           |

---

## Project Structure

```
sweet-distribution/
└── frontend/app/
    ├── src/
    │   ├── contexts/
    │   │   └── AuthContext.tsx        # Auth state management (login, signup, session)
    │   ├── lib/
    │   │   └── supabase.ts           # Supabase client + TypeScript interfaces
    │   ├── pages/
    │   │   ├── Login.tsx              # Login page
    │   │   ├── Register.tsx           # Registration page
    │   │   ├── admin/
    │   │   │   ├── ProductManagement.tsx  # CRUD for products
    │   │   │   └── OrderManagement.tsx   # View & update order statuses
    │   │   └── customer/
    │   │       ├── Products.tsx       # Browse & add to cart
    │   │       ├── Cart.tsx           # View/edit cart
    │   │       ├── Checkout.tsx       # Place order
    │   │       └── OrderTracking.tsx  # Track past orders
    │   ├── supabase/
    │   │   ├── functions/
    │   │   │   ├── auth-login/        # Edge function: authenticate user
    │   │   │   ├── orders/            # Edge function: create/get orders
    │   │   │   └── products/          # Edge function: list products
    │   │   └── migrations/
    │   │       └── create_initial_schema.sql  # DB schema + RLS policies
    │   ├── App.tsx                    # Root component, routing, nav bar
    │   └── main.tsx                   # React entry point
    └── package.json
```

---

## Database Schema

Four tables with Row Level Security (RLS) enabled:

```
profiles ──┐
           │ 1:N
           ▼
        orders ──┐
                 │ 1:N
                 ▼
           order_items
                 │ N:1
                 ▼
            products
```

- **profiles** — user info, role (`customer` | `admin`), company name
- **products** — name, price, category, stock, min order qty, active flag
- **orders** — customer reference, status, total, delivery address, notes
- **order_items** — links orders to products with quantity and price snapshot

Order status lifecycle: `pending → confirmed → processing → shipped → delivered` (or `cancelled`)

---

## Application Flow

### 1. Authentication

```
User opens app
    │
    ├── Not logged in ──→ Login / Register page
    │       │
    │       ├── Login: email + password → Supabase Auth → fetch profile → redirect
    │       └── Register: name + company + email + password → Supabase Auth
    │               → insert into profiles (role: customer) → redirect
    │
    └── Logged in ──→ AuthContext loads session + profile
            │
            ├── role = "customer" → Customer Dashboard
            └── role = "admin"    → Admin Dashboard
```

- AuthContext wraps the entire app, providing user/profile/session state
- On mount, it checks for an existing Supabase session and subscribes to auth state changes
- Profile is fetched from the `profiles` table after authentication

### 2. Customer Flow

```
Products Page ──→ Browse by category ──→ Add to Cart (respects min order qty)
      │
      ▼
  Cart Page ──→ Adjust quantities / Remove items
      │
      ▼
 Checkout Page ──→ Enter delivery address + notes ──→ Place Order
      │                                                    │
      │              ┌─────────────────────────────────────┘
      │              │
      │              ▼
      │     Insert into "orders" table
      │     Insert items into "order_items" table
      │     Cart is cleared
      │
      ▼
 Order Tracking ──→ View all past orders with status, items, and delivery info
```

- Cart state is managed in-memory via React useState in App.tsx (not persisted)
- Products are fetched directly from Supabase (`products` table, `is_active = true`)
- Orders are created by inserting into `orders` then `order_items` via the Supabase JS client
- Order tracking fetches orders with nested `order_items → products` joins

### 3. Admin Flow

```
Product Management ──→ Add / Edit / Delete products
      │                    (name, price, category, stock, min qty, active toggle)
      │
      ▼
Order Management ──→ View all orders (with customer info)
      │                    Filter by status
      │                    Update order status via dropdown
```

- Admins see all products (including inactive) and all orders (with customer profile info)
- Status updates are direct Supabase updates to the `orders` table

---

## Supabase Edge Functions

| Function       | Method | Purpose                                      |
|----------------|--------|----------------------------------------------|
| `auth-login`   | POST   | Authenticate user, return session + profile   |
| `orders`       | GET    | Fetch a specific order by ID with items       |
| `orders`       | POST   | Create a new order with items (with rollback) |
| `products`     | GET    | List all products                             |

> Note: The frontend primarily uses the Supabase JS client directly for data operations. The edge functions serve as an alternative API layer.

---

## Security (Row Level Security)

| Table        | Customer Access                        | Admin Access       |
|--------------|----------------------------------------|--------------------|
| profiles     | Read/update own profile                | Read all profiles  |
| products     | Read active products only              | Full CRUD          |
| orders       | Read/create own orders                 | Read/update all    |
| order_items  | Read/create own (via order ownership)  | Read all           |

---

## Running Locally

1. Set up a Supabase project and run the migration in `supabase/migrations/create_initial_schema.sql`
2. Create a `.env` file in `frontend/app/`:
   ```
   VITE_SUPABASE_URL=<your-supabase-url>
   VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   ```
3. Install and start:
   ```bash
   cd frontend/app
   npm install
   npm run dev
   ```
