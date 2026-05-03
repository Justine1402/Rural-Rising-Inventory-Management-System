# Rural Rising IMS — Tech Stack

## 1. Frontend

| Item | Detail |
|---|---|
| **Framework** | React 19.2.4 |
| **Build Tool** | Vite 8.0.4 |
| **Language** | JavaScript (ESM) |
| **Dev Port** | `5173` (Vite default) |

### Dependencies

| Package | Version | Purpose |
|---|---|---|
| `react` | ^19.2.4 | UI framework |
| `react-dom` | ^19.2.4 | DOM rendering |
| `react-router-dom` | ^7.14.2 | Client-side routing (v6-compatible API) |
| `axios` | ^1.15.0 | HTTP client for API calls |
| `jspdf` | ^4.2.1 | PDF generation (reports) |

### Dev Dependencies

| Package | Version | Purpose |
|---|---|---|
| `vite` | ^8.0.4 | Dev server and bundler |
| `@vitejs/plugin-react` | ^6.0.1 | React fast refresh support |
| `tailwindcss` | ^3.4.19 | Utility-first CSS framework |
| `postcss` | ^8.5.9 | CSS processing (required by Tailwind) |
| `autoprefixer` | ^10.5.0 | CSS vendor prefix automation |
| `eslint` | ^9.39.4 | JavaScript linter |
| `eslint-plugin-react-hooks` | ^7.0.1 | Lint rules for React hooks |
| `eslint-plugin-react-refresh` | ^0.5.2 | Lint rules for fast refresh |
| `@types/react` | ^19.2.14 | React type definitions |
| `@types/react-dom` | ^19.2.3 | React DOM type definitions |
| `globals` | ^17.4.0 | Global variable definitions for ESLint |
| `@eslint/js` | ^9.39.4 | ESLint core JS rules |

### Key Config Files (Frontend)

| File | Purpose |
|---|---|
| `vite.config.js` | Vite build and dev server config; includes proxy (`/api` + `/sanctum` → `http://127.0.0.1:8000`) |
| `tailwind.config.js` | Tailwind CSS theme and content paths |
| `postcss.config.js` | PostCSS plugin chain |
| `eslint.config.js` | ESLint rules and parser config |
| `.env` | Environment variables (gitignored) — `VITE_API_URL=/api` (relative, proxied through Vite) |
| `.gitignore` | Excludes `node_modules`, `dist`, `.env`, `.env.local` |

---

## 2. Backend

| Item | Detail |
|---|---|
| **Framework** | Laravel 13.x |
| **Language** | PHP 8.5.5 |
| **Dev Port** | `8000` (`php artisan serve`) |
| **Entry Point** | `public/index.php` |

### Production Packages

| Package | Version | Purpose |
|---|---|---|
| `laravel/framework` | ^13.0 | Core framework |
| `laravel/sanctum` | ^4.0 | SPA authentication via cookies/tokens |
| `laravel/tinker` | ^3.0 | Interactive REPL for Artisan |
| `barryvdh/laravel-dompdf` | ^3.1 | Server-side PDF generation |

### Dev Packages

| Package | Version | Purpose |
|---|---|---|
| `phpunit/phpunit` | ^12.5.12 | Unit and feature testing |
| `fakerphp/faker` | ^1.23 | Fake data generation for seeders |
| `laravel/pint` | ^1.27 | PHP code style fixer |
| `laravel/pail` | ^1.2.5 | Real-time log viewer |
| `nunomaduro/collision` | ^8.6 | Pretty error reporting in CLI |
| `mockery/mockery` | ^1.6 | Object mocking for tests |

### Key Config Files (Backend)

| File | Purpose |
|---|---|
| `config/cors.php` | CORS allowed origins, credentials, methods |
| `config/sanctum.php` | Stateful domains for SPA cookie auth |
| `config/session.php` | Session driver, lifetime, cookie settings |
| `config/auth.php` | Auth guards and providers |
| `config/database.php` | Database connection definitions |
| `routes/api.php` | All `/api/*` route definitions |
| `routes/web.php` | Web (non-API) routes |
| `.env` | Environment config — DB, app URL, session, mail |
| `bootstrap/app.php` | Application bootstrapping and middleware binding; `statefulApi()` enabled for Sanctum SPA auth |

---

## 3. Database

| Item | Detail |
|---|---|
| **Type** | MySQL 9.6.0 (Homebrew, Apple Silicon) |
| **ORM** | Eloquent (built into Laravel) |
| **Connection** | `127.0.0.1:3306` |
| **Database name** | `ruriims_db` |
| **Username** | `root` |
| **Migration tool** | `php artisan migrate` |
| **Seeding tool** | `php artisan db:seed` |

> Password is set locally in `.env` and is not tracked in version control.

---

## 4. Authentication

| Item | Detail |
|---|---|
| **Package** | Laravel Sanctum 4.0 |
| **Method** | SPA cookie-based authentication |
| **CSRF flow** | `GET /sanctum/csrf-cookie` must be called before login |
| **Stateful domains** | `localhost:5173` (explicitly set via `SANCTUM_STATEFUL_DOMAINS` in `.env`) |
| **Session driver** | Database (`SESSION_DRIVER=database`) |

> `SANCTUM_STATEFUL_DOMAINS=localhost:5173` is set in `.env`. Sanctum will recognize the React dev server as a stateful domain.

### How it works

1. React calls `getCsrfCookie()` → `GET /sanctum/csrf-cookie`
2. Laravel sets a `XSRF-TOKEN` cookie
3. React calls `POST /api/login` — Sanctum reads the CSRF token and issues a session cookie
4. All subsequent requests use that session cookie (sent automatically via `withCredentials: true` in axios)

---

## 5. API Routes

Routes defined in `ruriims-backend/routes/api.php`:

| Method | Path | Auth | Response |
|---|---|---|---|
| `GET` | `/api/test` | None | `{ "message": "Laravel is connected!" }` |
| `POST` | `/api/login` | None | `{ "user": {...} }` |
| `GET` | `/api/user` | `auth:sanctum` | `{ "user": {...} }` |
| `POST` | `/api/logout` | `auth:sanctum` | `{ "message": "Logged out" }` |
| `GET` | `/api/warehouses` | `auth:sanctum` | `{ "warehouses": [...] }` |
| `GET` | `/api/products` | `auth:sanctum` | `{ "products": [...], "warehouses": [...] }` — includes real stock per warehouse |
| `POST` | `/api/products` | `auth:sanctum` | `{ "product": {...} }` — validates + PIN check + generates SKU |
| `GET` | `/api/products/{product}` | `auth:sanctum` | `{ "product": {...} }` |
| `POST` | `/api/pin/verify` | `auth:sanctum` | `{ "verified": true }` or 422 |
| `GET` | `/api/stock-in-use` | `auth:sanctum` | `{ "batches": [...] }` — filters by `sku_code` + `warehouse_id`, quantity > 0, FEFO order |
| `GET` | `/api/receive-orders` | `auth:sanctum` | `{ "orders": [...] }` |
| `POST` | `/api/receive-orders` | `auth:sanctum` | `{ "order": { "code": "RO-..." } }` — PIN (same manager) + generates code |
| `GET` | `/api/receive-orders/{id}` | `auth:sanctum` | `{ "order": { ...with items } }` |
| `POST` | `/api/receive-orders/{id}/complete` | `auth:sanctum` | `{ "message": "Accomplished RO-..." }` — PIN (different manager) + generates StockInUse codes |

---

## 6. Project Structure

```
Rural Rising Inventory Management System/   ← project root
├── TECHSTACK.md                            ← this file
├── PROGRESS.md                             ← feature development tracker
├── STRUCTURE.md                            ← frontend architecture spec
├── DESIGN.md                               ← brand colors and styling rules
├── ruriims-frontend/                       ← React app
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js                   ← axios client + getCsrfCookie()
│   │   ├── assets/                         ← images and SVGs
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx             ← two-row nav; UIContext for overlay buttons; UIContext + WarehouseContext + AuthContext
│   │   │   │   └── WarehouseTabs.jsx      ← warehouse tab switcher; wired to WarehouseContext
│   │   │   ├── modals/
│   │   │   │   └── ProfileModal.jsx       ← profile overlay (change password + change PIN)
│   │   │   ├── shared/
│   │   │   │   ├── PinVerificationModal.jsx ← 6-digit PIN entry modal (z-[60])
│   │   │   │   ├── AddProductsModal.jsx   ← multi-select master SKU picker (z-[70])
│   │   │   │   └── StockInUseModal.jsx    ← single-select batch picker (z-[70])
│   │   │   └── ui/
│   │   │       └── StatusBadge.jsx        ← colored pill: green for In Stock/Accomplished, red otherwise
│   │   ├── context/
│   │   │   ├── AuthContext.jsx            ← user session state (user, login, logout)
│   │   │   ├── WarehouseContext.jsx       ← active warehouse; fetches from /api/warehouses
│   │   │   └── UIContext.jsx              ← overlay open/close flags (no URL navigation)
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   └── LoginPage.jsx          ← sign in form
│   │   │   ├── dashboard/
│   │   │   │   └── DashboardPage.jsx      ← real-time inventory; stock from StockInUse per warehouse; re-fetches on location.key
│   │   │   ├── products/
│   │   │   │   └── CreateProductPage.jsx  ← overlay card; PIN-verified product creation; opened via UIContext
│   │   │   └── receiveOrder/
│   │   │       ├── ReceiveOrderListPage.jsx ← standalone page; re-fetches on location.key; contextual accomplish bar
│   │   │       └── ReceiveOrderFormPage.jsx ← dual-mode: create (UIContext overlay) + accomplish (/receive-orders/:id)
│   │   ├── routes/
│   │   │   └── ProtectedRoute.jsx         ← auth + adminOnly route guard
│   │   ├── App.jsx                        ← BrowserRouter + providers + AppRoutes + GlobalOverlays
│   │   └── main.jsx                       ← React DOM entry point
│   ├── .env                               ← VITE_API_URL=/api (gitignored)
│   ├── vite.config.js                     ← includes proxy (/api + /sanctum → 127.0.0.1:8000)
│   ├── tailwind.config.js
│   └── package.json
│
└── ruriims-backend/                        ← Laravel app
    ├── app/
    │   ├── Http/
    │   │   └── Controllers/
    │   │       ├── AuthController.php          ← login, logout, user
    │   │       ├── WarehouseController.php     ← index (returns all warehouses)
    │   │       ├── ProductController.php       ← index (with warehouse_stock + harvest_date), store (PIN-verified), show
    │   │       ├── PinController.php           ← verify (standalone PIN check endpoint)
    │   │       ├── StockInUseController.php    ← index (batches by sku_code + warehouse_id, FEFO)
    │   │       └── ReceiveOrderController.php  ← index, store, show, complete
    │   └── Models/
    │       ├── User.php                        ← fillable: name, email, password, role, position_title, pin
    │       ├── Warehouse.php                   ← fillable: name, code
    │       ├── Product.php                     ← fillable: sku_code, name, category, unit, shelf_life, created_by
    │       ├── StockInUse.php                  ← table: stock_in_use_codes; fillable: code, product_id, warehouse_id, quantity, harvest_date
    │       ├── ReceiveOrder.php                ← fillable; belongsTo warehouse/creator/verifier; hasMany items
    │       └── ReceiveOrderItem.php            ← fillable; belongsTo product/receiveOrder
    ├── bootstrap/
    │   └── app.php                            ← statefulApi() enabled for Sanctum SPA auth
    ├── config/                                 ← cors, sanctum, session, database, etc.
    ├── database/
    │   ├── migrations/
    │   │   ├── (default Laravel migrations)
    │   │   ├── create_warehouses_table
    │   │   ├── add_role_to_users_table
    │   │   ├── add_position_title_to_users_table
    │   │   ├── add_pin_to_users_table
    │   │   ├── create_products_table
    │   │   ├── create_stock_in_use_codes_table
    │   │   ├── create_receive_orders_table
    │   │   └── create_receive_order_items_table
    │   └── seeders/
    │       └── UserSeeder.php                 ← seeds 3 warehouses + 2 accounts:
    │                                              admin@ruriims.com (role=admin, PIN=123456)
    │                                              manager@ruriims.com (role=admin, PIN=123456)
    ├── routes/
    │   └── api.php                            ← all API routes (see §5 above)
    ├── .env                                   ← environment config (gitignored)
    └── composer.json
```

---

## 7. Environment

| Item | Detail |
|---|---|
| **OS** | macOS (Darwin 25.2.0, Apple Silicon arm64) |
| **PHP** | 8.5.5 (CLI, NTS) |
| **MySQL** | 9.6.0 (Homebrew) |
| **Node** | Managed via local install |
| **Package manager (JS)** | npm |
| **Package manager (PHP)** | Composer |

### Running the project locally

```bash
# All-in-one (backend + frontend + queue + log watcher)
cd ruriims-backend
composer dev

# Or manually:

# Backend
cd ruriims-backend
php artisan serve          # starts on http://127.0.0.1:8000

# Frontend
cd ruriims-frontend
npm run dev                # starts on http://localhost:5173
```

> `composer dev` uses `concurrently` to run `php artisan serve`, `php artisan queue:listen`, `php artisan pail`, and `npm run dev` in parallel.

### First-time database setup

```bash
cd ruriims-backend
php artisan migrate        # creates all tables in ruriims_db
php artisan db:seed        # optional: seed with sample data
```
