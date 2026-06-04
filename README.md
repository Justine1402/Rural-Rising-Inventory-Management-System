# RURIIMS — Rural Rising Inventory and Information Management System

A full-stack inventory management system built for Rural Rising Philippines. Tracks products across multiple warehouses with support for batch-level stock management, receive orders, transfer requests, issue products, temporary warehouses, and inventory reconciliation.

---

## Features

- **Dashboard** — Real-time inventory view across all warehouses; click any product row for batch-level detail
- **Receive Orders** — Record incoming stock with per-item quantities, harvest dates, and cost tracking; PIN-verified completion generates Stock-In-Use batch codes
- **Transfer Requests** — Move stock between warehouses at the batch level; two-step flow (create → accomplish)
- **Issue Products** — Decrement stock for field distribution; FEFO (First Expired, First Out) batch selection
- **Temporary Warehouses** — Create, track, and close short-term field warehouses; closing returns remaining stock to a selected destination warehouse
- **Inventory Reconciliation** — Snapshot-based physical count with discrepancy detection; two-manager PIN confirmation applies adjustments to live stock
- **Reports** — Per-module report pages with two PDF export modes: (1) full summary table export via "Export as PDF"; (2) per-transaction detail PDF via checkbox row selection + "Export Selected (N)" — exports one full-page detail record per selected transaction. All 5 transaction report pages (Receive Orders, Transfer Requests, Issue Products, Temporary Warehouses, Reconciliation) support both modes. Each audit overlay also has a standalone "Export as PDF" button to print the currently-viewed record.
- **User Management** — Admin-only CRUD with role assignment, soft deletes, password and PIN reset
- **Role-based access** — Admin, Manager (warehouse-scoped), and Staff roles; PIN verification gates all stock-mutating actions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 19.2 + Vite 8 |
| Styling | Tailwind CSS 3.4 |
| Routing | React Router DOM 7 |
| HTTP client | Axios 1.15 |
| PDF generation (client) | jsPDF 4.2 (summary table PDFs + per-transaction detail PDFs) |
| Backend framework | Laravel 13 (PHP 8.3+) |
| Authentication | Laravel Sanctum 4 (SPA cookie-based) |
| Database | MySQL 9 |
| ORM | Eloquent |
| PDF generation (server) | barryvdh/laravel-dompdf 3.1 |

---

## Prerequisites

- PHP 8.3 or higher
- Composer
- MySQL 9 (or compatible MariaDB)
- Node.js + npm

---

## Installation

### 1. Clone the repository

```bash
git clone <repo-url>
cd "Rural Rising Inventory Management System"
```

### 2. Backend setup

```bash
cd ruriims-backend

# Install PHP dependencies
composer install

# Copy environment file and generate app key
cp .env.example .env
php artisan key:generate
```

Edit `.env` with your database credentials:

```env
DB_DATABASE=ruriims_db
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
```

Run migrations and seed initial data:

```bash
php artisan migrate
php artisan db:seed
```

### 3. Frontend setup

```bash
cd ../ruriims-frontend
npm install
```

---

## Running the Project

### All-in-one (recommended)

From the backend directory, the `composer dev` command starts all services concurrently (Laravel server, queue worker, log viewer, and Vite dev server):

```bash
cd ruriims-backend
composer dev
```

### Manually

```bash
# Terminal 1 — Backend API (http://127.0.0.1:8000)
cd ruriims-backend
php artisan serve

# Terminal 2 — Frontend dev server (http://localhost:5173)
cd ruriims-frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> The Vite dev server proxies `/api` and `/sanctum` requests to `http://127.0.0.1:8000`, so no CORS configuration is needed during development.

---

## Project Structure

```
.
├── ruriims-backend/          Laravel API
│   ├── app/
│   │   ├── Http/Controllers/ Feature controllers (one per module)
│   │   └── Models/           Eloquent models
│   ├── database/
│   │   ├── migrations/       Schema definitions
│   │   └── seeders/          Initial data
│   └── routes/
│       └── api.php           All API routes
│
└── ruriims-frontend/         React SPA
    └── src/
        ├── api/              Axios instance + base URL config
        ├── components/
        │   ├── layout/       Navbar, WarehouseTabs
        │   ├── overlays/     Always-mounted global overlays
        │   ├── shared/       PinVerificationModal, reusable components
        │   └── ui/           StatusBadge, small UI primitives
        ├── context/
        │   ├── AuthContext   Authentication state + current user
        │   ├── UIContext      Global overlay state + refresh keys
        │   └── WarehouseContext Active warehouse filter
        ├── pages/            Feature pages (grouped by module)
        │   ├── admin/
        │   ├── auth/
        │   ├── dashboard/
        │   ├── issueProduct/
        │   ├── products/
        │   ├── receiveOrder/
        │   ├── reconciliation/
        │   ├── reports/
        │   ├── temporaryWarehouse/
        │   └── transferRequest/
        ├── routes/           ProtectedRoute wrapper
        └── utils/            formatDate, reconciliationFormat helpers
```

---

## API Overview

All routes below are prefixed with `/api` and require authentication via Sanctum session cookie except where noted.

| Method | Path | Description |
|---|---|---|
| POST | `/login` | Authenticate and start session |
| POST | `/logout` | End session |
| GET | `/user` | Current authenticated user |
| GET | `/warehouses` | All warehouses (permanent + temporary) |
| GET | `/products` | Product list with live warehouse stock |
| POST | `/products` | Create product (PIN-verified) |
| GET | `/products/{product}/batches` | Active Stock-In-Use batches for a product |
| GET | `/receive-orders` | Receive order list |
| POST | `/receive-orders` | Create receive order (PIN-verified) |
| POST | `/receive-orders/{id}/complete` | Complete order — generates batch codes |
| GET | `/transfer-requests` | Transfer request list |
| POST | `/transfer-requests` | Create transfer request (PIN-verified) |
| POST | `/transfer-requests/{id}/accomplish` | Move stock between warehouses |
| GET | `/issue-products` | Issue product list |
| POST | `/issue-products` | Issue stock (PIN-verified, FEFO) |
| GET | `/temporary-warehouses` | Temporary warehouse list |
| POST | `/temporary-warehouses` | Open a temporary warehouse (PIN-verified) |
| POST | `/temporary-warehouses/{id}/close` | Close and return remaining stock |
| GET | `/reconciliations` | Reconciliation list |
| POST | `/reconciliations` | Create reconciliation (PIN-verified snapshot) |
| POST | `/reconciliations/{id}/confirm` | Confirm and apply adjustments (two-manager PIN) |
| GET | `/reports/inventory-summary` | Inventory summary across all warehouses |
| GET | `/users` | User list (admin only) |
| POST | `/users` | Create user (admin only) |
| PUT | `/users/{user}` | Update user (admin only) |
| DELETE | `/users/{user}` | Soft delete user (admin only) |

---

## User Roles

| Role | Access |
|---|---|
| **Admin** | Full access — all modules + user management |
| **Manager** | All inventory modules scoped to their assigned warehouse; can confirm reconciliations |
| **Staff** | Read access + form creation; cannot confirm reconciliations or manage users |

All stock-mutating actions (completing orders, accomplishing transfers, issuing products, closing temporary warehouses, confirming reconciliations) require PIN verification. Reconciliation confirmation requires the PIN of a **different** manager than the one who created the reconciliation.

---

## Environment Variables

### Backend (`ruriims-backend/.env`)

| Variable | Description |
|---|---|
| `APP_KEY` | Laravel application key (generated by `artisan key:generate`) |
| `DB_HOST` | MySQL host (default: `127.0.0.1`) |
| `DB_PORT` | MySQL port (default: `3306`) |
| `DB_DATABASE` | Database name (`ruriims_db`) |
| `DB_USERNAME` | Database user |
| `DB_PASSWORD` | Database password |
| `SANCTUM_STATEFUL_DOMAINS` | SPA origin allowed to use cookie auth (default: `localhost:5173`) |
| `SESSION_DRIVER` | Session storage driver (default: `database`) |
| `SESSION_LIFETIME` | Session lifetime in minutes (default: `120`) |

### Frontend (`ruriims-frontend/.env`)

The frontend uses Vite's proxy, so no base URL needs to be set. If deploying without the proxy, set:

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL (default: `/api`) |

---

## Building for Production

```bash
# Frontend — outputs to ruriims-frontend/dist/
cd ruriims-frontend
npm run build

# Backend — serve the built frontend via Laravel or a web server (nginx/Apache)
cd ruriims-backend
php artisan config:cache
php artisan route:cache
```
