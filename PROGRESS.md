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

### Build Step 4 — Navbar + WarehouseTabs + DashboardPage + Wiring
- [x] `Navbar.jsx` — two-row UI; avatar dropdown wired to `AuthContext` (name/email + View Profile + Log out); warehouse label wired to `WarehouseContext.activeWarehouse.name`; gear icon (⚙) visible only to admin, navigates to `/admin/users`; action buttons (Create Product, Receive Order, etc.) and filter dropdowns (All Products, Inventory, LIFO, Reports History) are **UI-only — no navigation wired yet**
- [x] `WarehouseTabs.jsx` — reads real warehouse list from `WarehouseContext`; admin sees "All Warehouses" + 3 warehouse tabs, manager sees 1; clicking a tab calls `setActiveWarehouse`; active tab highlighted
- [x] `DashboardPage.jsx` — static layout with 7 hardcoded product rows; `StatusBadge` implemented **inline** (not yet a separate file); no API calls
- [x] `warehouses` migration + `Warehouse` model — 3 permanent warehouses seeded (QC, ALA, MAN)
- [x] `add_role_to_users` migration — `role` enum added to `users` table; `admin@ruriims.com` set to `admin`
- [x] `WarehouseController@index` — `GET /api/warehouses` (auth:sanctum) returns all warehouses
- [x] `WarehouseContext` — fetches from real API; `activeWarehouse` defaults to first warehouse; `null` = All Warehouses
- [x] `App.jsx` — `/admin/users` route wired with `adminOnly` guard but currently renders `DashboardPage` as placeholder (UserManagementPage not built yet)

### Build Step 5 — Shared Components
- [x] `ProfileModal.jsx` (`src/components/modals/`) — collapsible Change Password (chevron toggle, CSS max-height animation); position_title read-only display (shows "—" until backend wired); Change PIN (4-digit numeric, always visible); wired to Navbar avatar dropdown; **user info (name, email, warehouse) is still hardcoded — not yet reading from AuthContext**; Save Changes and PIN/password fields are UI-only (no API calls)
- [x] `ConfirmModal.jsx` (`src/components/modals/`) — reusable dialog; props: `isOpen`, `title`, `message`, `onConfirm`, `onCancel`; Confirm (green) + Cancel (gray) buttons; **not yet used anywhere in the app**
- [x] `DataTable.jsx` (`src/components/ui/`) — basic implementation; props: `columns` (`[{ key, label }]`), `data`; dark green header, "No data available" empty state; **missing from spec: `onRowClick`, `selectedRow`, `onRowSelect`, `render` function, `loading`, `emptyMessage` props — to be added when list pages are built**; **not yet used anywhere in the app**
- [x] `Navbar.jsx` — gear icon (⚙) visible only to admin; opens a dropdown with "Manage Accounts" item → navigates to `/admin/users`; click-outside closes it; avatar dropdown has no admin items (View Profile + Log out only)
- [x] `add_position_title_to_users_table` migration — nullable `position_title` string added to `users` table; `User` model `#[Fillable]` updated; migration run
- [ ] `StatusBadge.jsx` — currently implemented **inline** inside `DashboardPage.jsx`; needs to be extracted to `src/components/ui/StatusBadge.jsx` before Step 6

---

## Not Started

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
