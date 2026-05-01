# Rural Rising IMS — Development Progress

## Completed

### Infrastructure & Config
- [x] Project setup (React + Laravel)
- [x] CORS configured (`config/cors.php` — allows `localhost:5173` with credentials)
- [x] `SANCTUM_STATEFUL_DOMAINS=localhost:5173` set in `.env`
- [x] `statefulApi()` middleware added to `bootstrap/app.php` (fixes session on API routes)
- [x] Vite dev proxy configured (`/api` + `/sanctum` → `127.0.0.1:8000`) — resolves CSRF cookie cross-origin issue
- [x] `VITE_API_URL=/api` (relative — routes through Vite proxy)
- [x] MySQL database `ruriims_db` created + all default migrations run
- [x] `UserSeeder` — test account: `admin@ruriims.com` / `password`

### Build Step 1 — Routing Scaffold
- [x] `react-router-dom` installed (`^7.14.2`)
- [x] `App.jsx` — `BrowserRouter` + `AuthProvider` + `WarehouseProvider` + `AppRoutes`
- [x] Routes stubbed: `/login`, `/`, `/admin/users`, catch-all

### Build Step 2 — Contexts + Route Guards
- [x] `src/context/AuthContext.jsx` — `user`, `login()`, `logout()`, `isAuthenticated`, `loading`
- [x] `src/context/WarehouseContext.jsx` — `activeWarehouse`, `warehouses`, `setActiveWarehouse` (awaits `WarehouseController`)
- [x] `src/routes/ProtectedRoute.jsx` — redirects unauthenticated to `/login`; supports `adminOnly` prop (redirects non-admin to `/`)

### Build Step 3 — LoginPage + AuthController
- [x] `LoginPage.jsx` — prototype-matched UI: email + password with show/hide toggle, remember me, forgot password link, brand logo
- [x] `AuthController.php` — `login`, `logout`, `user`
- [x] `routes/api.php` — `POST /login`, `POST /logout` (auth-guarded), `GET /user` (auth-guarded)

### Build Step 4 — Navbar + WarehouseTabs + DashboardPage (static UI only)
- [x] `Navbar.jsx` — two-row UI: brand row + action buttons + filter controls; avatar circle wired to `AuthContext` — dropdown shows user name/email + Log out button (calls `logout()` → redirects to `/login`)
- [x] `WarehouseTabs.jsx` — static tabs with hardcoded `isAdmin = true`; admin sees 4 tabs, manager sees 1
- [x] `DashboardPage.jsx` — static inventory table with hardcoded rows and `StatusBadge`

---

## In Progress
- [ ] Build Step 4 (cont.) — wire `Navbar`, `WarehouseTabs`, and `DashboardPage` to real API data via `AuthContext` and `WarehouseContext`

---

## Not Started

- [ ] Step 5 — `ProfileModal` + `StatusBadge` + `DataTable` + `ConfirmModal`
- [ ] Step 6 — `CreateProductPage` + `ProductController` + `PinVerificationModal`
- [ ] Step 7 — `AddProductsModal` + `StockInUseModal`
- [ ] Step 8 — `ReceiveOrderListPage` + `ReceiveOrderFormPage` + `ReceiveOrderController`
- [ ] Step 9 — `TransferRequestListPage` + `TransferRequestFormPage` + `TransferRequestController`
- [ ] Step 10 — `IssueProductFormPage` + `IssueProductController`
- [ ] Step 11 — Temporary Warehouse pages + `TemporaryWarehouseController`
- [ ] Step 12 — Reconciliation pages + `ReconciliationController`
- [ ] Step 13 — `UserManagementPage` + `UserController`
- [ ] Step 14 — All Reports pages + `ReportController`
- [ ] Step 15 — `InventorySummaryPage` + PDF export
