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
- [x] `Navbar.jsx` — two-row UI; avatar dropdown wired to `AuthContext` (name/email + View Profile + Log out); warehouse label wired to `WarehouseContext.activeWarehouse.name`; gear icon (⚙) visible only to admin, opens dropdown with "Manage Accounts" → `/admin/users`; `+ Create Product` button wired to `/products/create`; all other action buttons and filter dropdowns (Receive Order, Issue Product, Transfer Request, Create Temp Warehouse, All Products, Inventory, LIFO, Reports History) are **UI-only — no navigation wired yet**
- [x] `WarehouseTabs.jsx` — reads real warehouse list from `WarehouseContext`; admin sees "All Warehouses" + 3 warehouse tabs, manager sees 1; clicking a tab calls `setActiveWarehouse`; active tab highlighted
- [x] `DashboardPage.jsx` — static layout with 7 hardcoded product rows; `StatusBadge` implemented **inline** (not yet a separate file); no API calls
- [x] `warehouses` migration + `Warehouse` model — 3 permanent warehouses seeded (QC, ALA, MAN)
- [x] `add_role_to_users` migration — `role` enum added to `users` table; `admin@ruriims.com` set to `admin`
- [x] `WarehouseController@index` — `GET /api/warehouses` (auth:sanctum) returns all warehouses
- [x] `WarehouseContext` — fetches from real API; `activeWarehouse` defaults to first warehouse; `null` = All Warehouses
- [x] `App.jsx` — `/admin/users` route wired with `adminOnly` guard but currently renders `DashboardPage` as placeholder (UserManagementPage not built yet)

### Build Step 5 — Shared Components
- [x] `ProfileModal.jsx` (`src/components/modals/`) — collapsible Change Password (chevron toggle, CSS max-height animation); position_title read-only display (shows "—" until backend wired); Change PIN (6-digit numeric, always visible); wired to Navbar avatar dropdown; **user info (name, email, warehouse) is still hardcoded — not yet reading from AuthContext**; Save Changes and PIN/password fields are UI-only (no API calls)
- [x] `ConfirmModal.jsx` (`src/components/modals/`) — reusable dialog; props: `isOpen`, `title`, `message`, `onConfirm`, `onCancel`; Confirm (green) + Cancel (gray) buttons; **not yet used anywhere in the app**
- [x] `DataTable.jsx` (`src/components/ui/`) — basic implementation; props: `columns` (`[{ key, label }]`), `data`; dark green header, "No data available" empty state; **missing from spec: `onRowClick`, `selectedRow`, `onRowSelect`, `render` function, `loading`, `emptyMessage` props — to be added when list pages are built**; **not yet used anywhere in the app**
- [x] `Navbar.jsx` — gear icon (⚙) visible only to admin; opens a dropdown with "Manage Accounts" item → navigates to `/admin/users`; click-outside closes it; avatar dropdown has no admin items (View Profile + Log out only)
- [x] `add_position_title_to_users_table` migration — nullable `position_title` string added to `users` table; `User` model `#[Fillable]` updated; migration run
- [x] `StatusBadge.jsx` (`src/components/ui/`) — extracted from `DashboardPage.jsx`; props: `status` (string); green badge for "In Stock", red for all others

---

### Build Step 6 — PinVerificationModal + CreateProductPage + ProductController
- [x] `PinVerificationModal.jsx` (`src/components/shared/`) — 6 individual digit inputs; auto-advance on entry; backspace clears current digit or moves back; CLEAR resets all; VERIFY calls `onVerify(pin)`; parent handles API call; props: `isOpen`, `onVerify`, `onClose`; z-[60] so it renders above form panels
- [x] `CreateProductPage.jsx` (`src/pages/products/`) — centered card panel (`fixed top-[115px] left-1/2 -translate-x-1/2 w-[900px]`, content-height so it shrinks to fit its fields); blur overlay behind (`bg-black/20 backdrop-blur-sm z-40`) blocks all interaction with the dashboard, table, and navbar buttons beneath it; fields: Product Name, Category (dropdown), Unit of Measure (dropdown with "Other (specify)" option — selecting it swaps the dropdown for a free-text input with a "← Use dropdown instead" toggle), Shelf Life (days); `created_by` set server-side from authenticated user — no visible field; opens PinVerificationModal on CREATE; on verify → `POST /api/products` with form data + PIN; shows `"Created SKU-XXX"` label on success; CREATE button disabled after success; shows inline error on failure
- [x] `add_pin_to_users_table` migration — nullable `pin` string column added to `users` table; run
- [x] `create_products_table` migration — columns: `sku_code` (unique), `name`, `category`, `unit`, `shelf_life`, `created_by` (FK → users); run
- [x] `Product` model — fillable: sku_code, name, category, unit, shelf_life, created_by; `creator()` belongsTo User
- [x] `ProductController` — `index` (all products), `store` (validate → verify PIN via Hash::check → generate SKU-XXX → save), `show`
- [x] `PinController` — `verify(pin)` standalone endpoint; returns 422 with `{ message: 'Incorrect PIN.' }` on failure
- [x] `UserSeeder` — updated to seed default PIN `123456` (hashed) for `admin@ruriims.com`; reseeded
- [x] `User` model — `pin` added to fillable and hidden
- [x] `routes/api.php` — added `GET/POST /products`, `GET /products/{product}`, `POST /pin/verify` under `auth:sanctum`
- [x] `Navbar.jsx` — `+ Create Product` button wired to navigate `/products/create`
- [x] `App.jsx` — `/products/create` route renders `DashboardPage` + `CreateProductPage` together (dashboard stays visible dimmed behind the panel)

## Not Started

- [ ] Step 7 — `AddProductsModal` + `StockInUseModal`
- [ ] Step 8 — `ReceiveOrderListPage` + `ReceiveOrderFormPage` + `ReceiveOrderController`
- [ ] Step 9 — `TransferRequestListPage` + `TransferRequestFormPage` + `TransferRequestController`
- [ ] Step 10 — `IssueProductFormPage` + `IssueProductController`
- [ ] Step 11 — Temporary Warehouse pages + `TemporaryWarehouseController`
- [ ] Step 12 — Reconciliation pages + `ReconciliationController`
- [ ] Step 13 — `UserManagementPage` + `UserController`
- [ ] Step 14 — All Reports pages + `ReportController`
- [ ] Step 15 — `InventorySummaryPage` + PDF export
