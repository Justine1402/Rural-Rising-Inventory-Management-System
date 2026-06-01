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
| `PATCH` | `/api/user/password` | `auth:sanctum` | `{ "message": "Password updated successfully." }` — verifies current password via Hash::check; updates own password; 422 on mismatch |
| `PATCH` | `/api/user/pin` | `auth:sanctum` | `{ "message": "PIN updated successfully." }` — verifies current PIN via Hash::check; updates own PIN with Hash::make(); 422 on mismatch |
| `GET` | `/api/users` | `auth:sanctum` (admin) | `{ "users": [...] }` — withTrashed; includes warehouse relation |
| `POST` | `/api/users` | `auth:sanctum` (admin) | `{ "user": {...} }` — creates account; role-conditional warehouse_id |
| `GET` | `/api/users/{user}` | `auth:sanctum` (admin) | `{ "user": {...} }` — withTrashed binding |
| `PUT` | `/api/users/{user}` | `auth:sanctum` (admin) | `{ "user": {...} }` — withTrashed binding |
| `DELETE` | `/api/users/{user}` | `auth:sanctum` (admin) | `{ "message": "..." }` — soft delete |
| `POST` | `/api/users/{user}/reset-password` | `auth:sanctum` (admin) | `{ "message": "..." }` — withTrashed binding |
| `POST` | `/api/users/{user}/reset-pin` | `auth:sanctum` (admin) | `{ "message": "..." }` — withTrashed binding |
| `POST` | `/api/users/{user}/restore` | `auth:sanctum` (admin) | `{ "user": {...}, "message": "..." }` — withTrashed binding; reactivates soft-deleted user |
| `GET` | `/api/warehouses` | `auth:sanctum` | `{ "warehouses": [...] }` |
| `GET` | `/api/products` | `auth:sanctum` | `{ "products": [...], "warehouses": [...] }` — includes real stock per warehouse |
| `POST` | `/api/products` | `auth:sanctum` | `{ "product": {...} }` — validates + PIN check + generates SKU |
| `GET` | `/api/products/{product}` | `auth:sanctum` | `{ "product": {...} }` |
| `POST` | `/api/pin/verify` | `auth:sanctum` | `{ "verified": true }` or 422 |
| `GET` | `/api/stock-in-use` | `auth:sanctum` | `{ "batches": [...] }` — filters by `sku_code` + `warehouse_id`, quantity > 0, FEFO order |
| `GET` | `/api/receive-orders` | `auth:sanctum` | `{ "orders": [...] }` |
| `POST` | `/api/receive-orders` | `auth:sanctum` | `{ "order": { "code": "RO-..." } }` — PIN (same manager) + generates per-warehouse scoped code inside DB transaction |
| `GET` | `/api/receive-orders/{id}` | `auth:sanctum` | `{ "order": { ...with items } }` |
| `POST` | `/api/receive-orders/{id}/complete` | `auth:sanctum` | `{ "message": "Accomplished RO-..." }` — PIN (different manager) + generates StockInUse codes |
| `GET` | `/api/transfer-requests` | `auth:sanctum` | `{ "transfers": [...] }` |
| `POST` | `/api/transfer-requests` | `auth:sanctum` | `{ "transfer": { "code": "TRF-..." } }` — PIN (same manager) + generates per-source-warehouse code |
| `GET` | `/api/transfer-requests/{id}` | `auth:sanctum` | `{ "transfer": { ...with items } }` |
| `POST` | `/api/transfer-requests/{id}/accomplish` | `auth:sanctum` | `{ "message": "Accomplished TRF-..." }` — PIN (different warehouse manager) + moves stock |
| `GET` | `/api/issue-products` | `auth:sanctum` | `{ "issues": [...] }` |
| `POST` | `/api/issue-products` | `auth:sanctum` | `{ "issue": { "code": "ISS-..." } }` — PIN (same manager) + generates per-warehouse code + decrements StockInUse |
| `GET` | `/api/issue-products/{id}` | `auth:sanctum` | `{ "issue": { ...with items } }` |
| `GET` | `/api/temporary-warehouses` | `auth:sanctum` | `{ "temporary_warehouses": [...] }` — optional `?status=active\|closed` filter |
| `POST` | `/api/temporary-warehouses` | `auth:sanctum` | `{ "temporary_warehouse": { id, warehouse_id, transaction_code, name } }` — PIN (same manager) + creates warehouses row + TWH row |
| `GET` | `/api/temporary-warehouses/{id}` | `auth:sanctum` | `{ "temporary_warehouse": { ...with products_transferred_in [+stock_in_use_code, +source_warehouse], products_issued [+stock_in_use_code, +issue_type], products_returned } }` |
| `POST` | `/api/temporary-warehouses/{id}/close` | `auth:sanctum` | `{ "message": "Closed TWH-..." }` — PIN (any authorized manager) + lockForUpdate header + per-batch deduction + dest StockInUse creation |
| `GET` | `/api/reconciliations` | `auth:sanctum` | `{ "reconciliations": [...] }` — optional `?warehouse_id` + `?status` filters; includes products_with_discrepancy count |
| `GET` | `/api/reconciliations/expected-stock` | `auth:sanctum` | `{ "products": [{id, sku_code, name, unit, total_quantity}] }` — required `?warehouse_id`; one row per product, summed across batches |
| `POST` | `/api/reconciliations` | `auth:sanctum` | `{ "reconciliation": { "transaction_code": "RC-..." } }` — PIN (same manager) + snapshot items + RC code; no inventory changes at submit |
| `GET` | `/api/reconciliations/{id}` | `auth:sanctum` | `{ "reconciliation": { ...with items+adjustments } }` |
| `POST` | `/api/reconciliations/{id}/confirm` | `auth:sanctum` | `{ "message": "Reconciliation confirmed: RC-..." }` — PIN (different manager, same branch) + lockForUpdate+refresh+re-check + FIFO deduction or RCB surplus batch creation |

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
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx             ← two-row nav; UIContext for overlay buttons; UIContext + WarehouseContext + AuthContext
│   │   │   │   └── WarehouseTabs.jsx      ← warehouse tab switcher; wired to WarehouseContext
│   │   │   ├── modals/
│   │   │   │   └── ProfileModal.jsx       ← profile overlay (change password + change PIN)
│   │   │   ├── shared/
│   │   │   │   ├── PinVerificationModal.jsx ← 6-digit PIN entry modal (z-[60])
│   │   │   │   ├── AddProductsModal.jsx   ← multi-select master SKU picker (z-[70])
│   │   │   │   ├── StockInUseModal.jsx    ← single-select batch picker (z-[70])
│   │   │   │   ├── CascadePreviewModal.jsx ← per-batch draw breakdown modal (z-[80]); mirrors planBatchCascade output
│   │   │   │   └── ReportsFilterBar.jsx   ← shared filter bar (all reports pages); report-type, warehouse, date-range, search, PDF export
│   │   │   └── ui/
│   │   │       └── StatusBadge.jsx        ← colored pill: green for In Stock/Accomplished/Complete/Active/Reviewed; amber for Pending Review; red for Out of Stock/Incomplete/Closed and fallback
│   │   ├── context/
│   │   │   ├── AuthContext.jsx            ← user session state (user, login, logout)
│   │   │   ├── WarehouseContext.jsx       ← active warehouse; fetches /api/warehouses on user change (auth-safe)
│   │   │   └── UIContext.jsx              ← overlay flags (createProduct/receiveOrder/transferRequest/issueProduct/temporaryWarehouse/reconciliation/userForm); ID-carrying overlay state (closeTemporaryWarehouseOverlayTwhId, temporaryWarehouseDetailOverlayTwhId, userDetailOverlayUserId — null=closed, number=open); productRefreshKey, receiveOrderRefreshKey, transferRequestRefreshKey, reconciliationRefreshKey, userRefreshKey + matching refresh() functions
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── UserManagementPage.jsx ← admin-only; 7-column user list; client-side search; filter stubs; row click → userDetailOverlayUserId; + New User → userFormOpen
│   │   │   │   └── UserFormPage.jsx       ← dual-mode overlay (create + edit + read-only); self-guards on UIContext flags; Reset Password + Reset PIN inline sub-flows; Delete + inline confirm (hidden for self); Restore button in read-only mode
│   │   │   ├── auth/
│   │   │   │   └── LoginPage.jsx          ← sign in form
│   │   │   ├── dashboard/
│   │   │   │   └── DashboardPage.jsx      ← real-time inventory; stock from StockInUse per warehouse; re-fetches on location.key and productRefreshKey
│   │   │   ├── products/
│   │   │   │   └── CreateProductPage.jsx  ← overlay card; PIN-verified product creation; opened via UIContext
│   │   │   ├── receiveOrder/
│   │   │   │   ├── ReceiveOrderListPage.jsx ← standalone page; re-fetches on location.key + receiveOrderRefreshKey; contextual accomplish bar
│   │   │   │   ├── ReceiveOrderFormPage.jsx ← dual-mode: create (UIContext overlay) + accomplish (/receive-orders/:id)
│   │   │   │   └── ReceiveOrderAuditPage.jsx ← read-only audit overlay; /receive-orders/:id/audit
│   │   │   ├── transferRequest/
│   │   │       ├── TransferRequestListPage.jsx ← standalone page; re-fetches on location.key + transferRequestRefreshKey; contextual accomplish bar
│   │   │       ├── TransferRequestFormPage.jsx ← dual-mode: create (UIContext overlay) + accomplish (/transfer-requests/:id); two-step product flow
│   │   │       └── TransferRequestAuditPage.jsx ← read-only audit overlay; /transfer-requests/:id/audit
│   │   │   ├── reconciliation/
│   │   │       ├── ReconciliationListPage.jsx ← standalone page; re-fetches on location.key + reconciliationRefreshKey; selectedId toggle; label-swap button (+ New Reconciliation / + Review & Confirm)
│   │   │       ├── ReconciliationFormPage.jsx ← UIContext overlay (no route); create flow; auto-populates from expectedStock endpoint; three-state discrepancy encoding; same-manager PIN
│   │   │       └── ReconciliationReviewPage.jsx ← standalone full page (/reconciliation/:id/review); read-only review + confirm; status-branched (pending_review shows CONFIRM + PIN modal; reviewed is fully read-only); post-confirm refreshes reconciliations + products, navigates to list after 1.5s
│   │   │   ├── issueProduct/
│   │   │   │   ├── IssueProductFormPage.jsx   ← UIContext overlay (no route); single-stage issue + StockInUse deduction; same-manager PIN
│   │   │   │   └── IssueProductAuditPage.jsx  ← read-only audit overlay; /issue-products/:id/audit
│   │   │   ├── temporaryWarehouse/
│   │   │   │   ├── TemporaryWarehouseFormPage.jsx ← UIContext overlay (no route); creates TWH + warehouses row; same-manager PIN; calls refreshWarehouses(warehouse_id) to auto-select new tab
│   │   │   │   ├── CloseTemporaryWarehousePage.jsx ← UIContext overlay (no route); reads id from closeTemporaryWarehouseOverlayTwhId; fetches remaining stock via stock-in-use API; per-row Return To dropdown; PIN-verified close; closes overlay on success
│   │   │   │   └── TemporaryWarehouseDetailPage.jsx ← UIContext overlay (no route); reads id from temporaryWarehouseDetailOverlayTwhId; metadata block + three sub-tables with enriched columns
│   │   │   └── reports/
│   │   │       ├── ReportsHistoryPage.jsx          ← /reports; "All Reports" union view
│   │   │       ├── ProductReportsPage.jsx          ← /reports/products
│   │   │       ├── ReceiveOrderReportsPage.jsx     ← /reports/receive-orders; PDF export
│   │   │       ├── TransferRequestReportsPage.jsx  ← /reports/transfer-requests; PDF export
│   │   │       ├── IssueProductReportsPage.jsx     ← /reports/issue-products; PDF export
│   │   │       ├── TempWarehouseReportsPage.jsx    ← /reports/temporary-warehouses; row click → detail overlay
│   │   │       └── ReconciliationReportsPage.jsx   ← /reports/reconciliation
│   │   ├── utils/
│   │   │   ├── planBatchCascade.js        ← frontend mirror of PlansBatchCascade trait; nearest-harvest-date cascade planner with FIFO tiebreak
│   │   │   ├── reconciliationFormat.js    ← shared discrepancy formatter (formatDiscrepancy, formatAdjustmentArrow, EPSILON); used by ReconciliationFormPage and ReconciliationReviewPage
│   │   │   ├── formatDate.js              ← shared date formatter (MMM D, YYYY en-US locale; '—' fallback); used by all six report pages, ReconciliationReviewPage, CascadePreviewModal, TemporaryWarehouseDetailPage, and CloseTemporaryWarehousePage (10 consumers); not used by InventorySummaryPage (no date fields to display)
│   │   │   └── exportPdf.js               ← shared PDF export utility (jsPDF v4 named import); used by ReceiveOrder, TransferRequest, IssueProduct, and InventorySummary report pages for client-side PDF generation
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
    │   │       ├── UserController.php          ← index, store, show, update, destroy, restore, resetPassword, resetPin (admin-only; SoftDeletes; role-conditional warehouse_id validation)
    │   │       ├── WarehouseController.php     ← index (returns all warehouses including TWH; is_temporary serialized via model cast)
    │   │       ├── ProductController.php       ← index (with warehouse_stock + harvest_date), store (PIN-verified), show
    │   │       ├── PinController.php           ← verify (standalone PIN check endpoint)
    │   │       ├── StockInUseController.php    ← index (batches by sku_code + warehouse_id, FEFO; includes id in response)
    │   │       ├── ReceiveOrderController.php  ← index, store (per-warehouse RO code via trait), show, complete
    │   │       ├── TransferRequestController.php ← index, store (per-source-warehouse TRF code via trait), show, accomplish
    │   │       ├── IssueProductController.php  ← index, store (same-manager PIN + ISS code via trait + StockInUse decrement), show
    │   │       ├── TemporaryWarehouseController.php ← index (?status filter), store (same-manager PIN + inline TWH code gen + creates warehouses row + TWH row), show (products_transferred_in/issued/returned), close (same-manager PIN + lockForUpdate+refresh+re-check + per-batch deduction + dest StockInUse creation)
    │   │       └── ReconciliationController.php    ← index (?warehouse_id+?status filters, products_with_discrepancy count), expectedStock (per-product totals at warehouse), store (same-manager PIN + RC code + snapshot items), show (with items+adjustments), confirm (different-manager-same-branch PIN + lockForUpdate+refresh+re-check + FIFO deduction + RCB surplus batch creation)
    │   ├── Traits/
    │   │   ├── GeneratesTransactionCode.php    ← per-warehouse scoped code generator; used by RO, TRF, ISS controllers
    │   │   └── PlansBatchCascade.php           ← nearest-harvest-date batch cascade planner with FIFO tiebreak and fallback; used by TRF and ISS controllers
    │   └── Models/
    │       ├── User.php                        ← fillable: name, email, password, role, warehouse_id, position_title, pin; SoftDeletes trait (deleted_at = inactive); belongsTo warehouse()
    │       ├── Warehouse.php                   ← fillable: name, code, is_temporary; cast is_temporary → boolean
    │       ├── Product.php                     ← fillable: sku_code, name, category, unit, shelf_life, created_by; creator() uses withTrashed() so soft-deleted users still resolve in eager loads
    │       ├── StockInUse.php                  ← table: stock_in_use_codes; fillable: code, product_id, warehouse_id, quantity, harvest_date
    │       ├── ReceiveOrder.php                ← fillable; belongsTo warehouse/creator/verifier; hasMany items; User relations use withTrashed() so soft-deleted users still resolve in eager loads
    │       ├── ReceiveOrderItem.php            ← fillable; belongsTo product/receiveOrder
    │       ├── TransferRequest.php             ← fillable; date casts; belongsTo sourceWarehouse/destinationWarehouse/requester/verifier; hasMany items; User relations (requester/verifier) use withTrashed() so soft-deleted users still resolve in eager loads
    │       ├── TransferRequestItem.php         ← fillable; date cast; belongsTo product/transferRequest/stockInUse
    │       ├── TransferRequestBatchDeduction.php ← records per-batch deductions from a TRF item; belongsTo transferRequestItem/stockInUse
    │       ├── IssueProduct.php                ← fillable; cast date_issued; belongsTo warehouse + issuedBy (User); hasMany items; issuedBy() uses withTrashed() so soft-deleted users still resolve in eager loads
    │       ├── IssueProductItem.php            ← fillable; cast harvest_date; belongsTo issueProduct/product/stockInUse
    │       ├── IssueProductBatchDeduction.php  ← records per-batch deductions from an ISS item; belongsTo issueProductItem/stockInUse
    │       ├── TemporaryWarehouse.php          ← fillable; casts event_date/date_closed → date; belongsTo warehouse/creator/closer; hasMany returns; User relations (creator/closer) use withTrashed() so soft-deleted users still resolve in eager loads
    │       ├── TemporaryWarehouseReturn.php    ← fillable; cast harvest_date; belongsTo temporaryWarehouse/product/sourceStockInUse/destinationStockInUse/destinationWarehouse
    │       ├── Reconciliation.php              ← fillable; casts date_reconciled/date_reviewed → date; belongsTo warehouse/reconciledBy/reviewedBy; hasMany items; User relations (reconciledBy/reviewedBy) use withTrashed() so soft-deleted users still resolve in eager loads
    │       ├── ReconciliationItem.php          ← fillable; casts expected_stock/actual_count/discrepancy decimal:3; belongsTo reconciliation/product; hasMany adjustments
    │       └── ReconciliationBatchAdjustment.php ← fillable; cast quantity decimal:3; direction enum (deduction/addition); harvest_date_source nullable enum; belongsTo reconciliationItem/stockInUse
    ├── bootstrap/
    │   └── app.php                            ← routes: api.php + health only; statefulApi() enabled for Sanctum SPA auth
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
    │   │   ├── create_receive_order_items_table
    │   │   ├── add_warehouse_id_to_users_table
    │   │   ├── create_transfer_requests_table
    │   │   ├── create_transfer_request_items_table
    │   │   ├── create_issue_products_table
    │   │   ├── create_issue_product_items_table
    │   │   ├── rename_stock_in_use_id_on_issue_product_items
    │   │   ├── rename_stock_in_use_id_on_transfer_request_items
    │   │   ├── create_issue_product_batch_deductions_table
    │   │   ├── create_transfer_request_batch_deductions_table
    │   │   ├── add_is_temporary_to_warehouses_table
    │   │   ├── create_temporary_warehouses_table
    │   │   ├── create_temporary_warehouse_returns_table
    │   │   ├── create_reconciliations_table
    │   │   ├── create_reconciliation_items_table
    │   │   ├── create_reconciliation_batch_adjustments_table
    │   │   └── add_soft_deletes_to_users_table
    │   └── seeders/
    │       └── UserSeeder.php                 ← seeds 3 warehouses + 2 accounts:
    │                                              admin@ruriims.com (role=admin, PIN=123456)
    │                                              manager@ruriims.com (role=manager, PIN=123456)
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
