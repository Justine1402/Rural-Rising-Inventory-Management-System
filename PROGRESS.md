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
- [x] `UserSeeder` — two accounts seeded:
  - `admin@ruriims.com` / password: `password` / PIN: `123456` (role: admin)
  - `manager@ruriims.com` / password: `password` / PIN: `123456` (role: manager) — used to accomplish orders created by admin

### Build Step 1 — Routing Scaffold
- [x] `react-router-dom` installed (`^7.14.2`)
- [x] `App.jsx` — `BrowserRouter` + `AuthProvider` + `WarehouseProvider` + `UIProvider` + `AppRoutes` + `GlobalOverlays`
- [x] Routes: `/login`, `/`, `/receive-orders`, `/receive-orders/:id`, `/transfer-requests`, `/transfer-requests/:id`, `/admin/users`, catch-all

### Build Step 2 — Contexts + Route Guards
- [x] `src/context/AuthContext.jsx` — `user`, `login()`, `logout()`, `isAuthenticated`, `loading`
- [x] `src/context/WarehouseContext.jsx` — `activeWarehouse`, `warehouses`, `setActiveWarehouse`; fetches `/warehouses` on `user` change (not on mount) so it fires only after auth is confirmed
- [x] `src/context/UIContext.jsx` — `receiveOrderFormOpen`, `createProductFormOpen` and their setters; `productRefreshKey` (counter) + `refreshProducts()` (increments counter) — triggers dashboard re-fetch after product creation without URL navigation
- [x] `src/routes/ProtectedRoute.jsx` — redirects unauthenticated to `/login`; supports `adminOnly` prop

### Build Step 3 — LoginPage + AuthController
- [x] `LoginPage.jsx` — email + password with show/hide toggle, remember me checkbox (UI-only placeholder), forgot password link, brand logo
- [x] `AuthController.php` — `login`, `logout`, `user`
- [x] `routes/api.php` — `POST /login`, `POST /logout` (auth-guarded), `GET /user` (auth-guarded)

### Build Step 4 — Navbar + WarehouseTabs + DashboardPage + Wiring
- [x] `Navbar.jsx` — two-row UI; avatar dropdown wired to `AuthContext`; warehouse label wired to `WarehouseContext`; gear icon (⚙) visible only to admin → "Manage Accounts" → `/admin/users`; `+ Create Product` opens `CreateProductPage` overlay via `UIContext` (no URL change); `+ Receive Order` opens `ReceiveOrderFormPage` overlay via `UIContext` (no URL change); `+ Transfer Request` opens `TransferRequestFormPage` overlay via `UIContext` (no URL change — wired in Step 9); button order: Create Product | Receive Order | Transfer Request | Issue Product | Create Temporary Warehouse; Inventory dropdown: "Inventory" → `/`, "Receive Orders" → `/receive-orders`, "Transfer Requests" → `/transfer-requests` (added in Step 9); `inventoryLabel` dynamically shows "Receive Orders" on `/receive-orders*`, "Transfer Requests" on `/transfer-requests*`, else "Inventory"
- [x] `WarehouseTabs.jsx` — reads real warehouse list from `WarehouseContext`; admin sees "All Warehouses" + 3 warehouse tabs; all users currently see all warehouse tabs (manager single-warehouse restriction deferred to Step 13); clicking a tab calls `setActiveWarehouse`; active tab highlighted
- [x] `DashboardPage.jsx` — fetches `GET /api/products` on `location.key` change (re-fetches after navigation) AND on `productRefreshKey` change (re-fetches instantly after product creation without navigation); shows real stock quantities per warehouse from `StockInUse`; warehouse columns are dynamic (driven by API response); harvest date from latest batch; "In Stock" / "Out of Stock" status from real quantities; loading/empty/error states
- [x] `warehouses` migration + `Warehouse` model — 3 permanent warehouses seeded (QC, ALA, MAN)
- [x] `add_role_to_users_table` migration — `role` enum added to `users` table
- [x] `WarehouseController@index` — `GET /api/warehouses` returns all warehouses
- [x] `App.jsx` — `GlobalOverlays` component renders `CreateProductPage` and `ReceiveOrderFormPage` as context-controlled overlays; no URL change on open; `/admin/users` renders `DashboardPage` as placeholder

### Build Step 5 — Shared Components
- [x] `ProfileModal.jsx` (`src/components/modals/`) — collapsible Change Password (chevron toggle, CSS max-height animation); Change PIN (6-digit numeric); wired to Navbar avatar dropdown
- [x] `StatusBadge.jsx` (`src/components/ui/`) — green badge for `"In Stock"`, `"Accomplished"`, and `"Complete"`; red for all others (Incomplete, Out of Stock)

### Build Step 6 — PinVerificationModal + CreateProductPage + ProductController
- [x] `PinVerificationModal.jsx` (`src/components/shared/`) — 6 individual digit inputs; auto-advance on entry; backspace support; CLEAR + VERIFY; z-[60]
- [x] `CreateProductPage.jsx` (`src/pages/products/`) — opens as overlay via `UIContext` (no routing); blur overlay z-40 + card z-50; fields: Name, Category, Unit (dropdown + "Other (specify)" free-text with revert link), Shelf Life; PIN-verified; shows `"Created SKU-XXX"` on success; CREATE disabled after success; calls `onSuccess()` prop on success to trigger dashboard re-fetch via `UIContext.refreshProducts`
- [x] `add_pin_to_users_table` migration + `create_products_table` migration — run
- [x] `Product` model — fillable: sku_code, name, category, unit, shelf_life, created_by
- [x] `ProductController` — `index` (returns all products with real `warehouse_stock` per warehouse, `harvest_date` from latest batch, `status`; also returns `warehouses` list in same response), `store` (PIN-verified, generates SKU-XXX), `show`
- [x] `PinController` — `verify` standalone endpoint
- [x] `UserSeeder` — PIN `123456` (hashed) seeded for both accounts

### Build Step 7 — AddProductsModal + StockInUseModal + StockInUseController
- [x] `create_stock_in_use_codes_table` migration — columns: code (unique), product_id, warehouse_id, quantity (decimal 10,3), harvest_date; run
- [x] `StockInUse` model — table: `stock_in_use_codes`; fillable: code, product_id, warehouse_id, quantity, harvest_date
- [x] `StockInUseController` — `index`: filters by sku_code + warehouse_id; returns batches where quantity > 0, ordered by harvest_date (FEFO)
- [x] `routes/api.php` — `GET /stock-in-use` added
- [x] `AddProductsModal.jsx` (`src/components/shared/`) — multi-select product picker; fetches `GET /api/products` on open; returns `[{ productCode, productName, unit, category }]` via `onSelect`; z-[70]
- [x] `StockInUseModal.jsx` (`src/components/shared/`) — single-select batch picker; fetches `GET /api/stock-in-use?sku_code&warehouse_id`; returns selected batch via `onSelect`; z-[70]; planned for Transfer and Issue flows

### Build Step 8 — ReceiveOrderListPage + ReceiveOrderFormPage + ReceiveOrderController
- [x] `create_receive_orders_table` migration — code, warehouse_id, supplier_name, delivery_fee, order_cost, total, date_ordered, date_arrived (nullable), status (incomplete/accomplished), created_by, verified_by (nullable); run
- [x] `create_receive_order_items_table` migration — receive_order_id, product_id, quantity_ordered, quantity_arrived (default 0), harvest_date (nullable), product_cost; run
- [x] `ReceiveOrder` model — fillable; date casts; belongsTo warehouse/creator/verifier; hasMany items
- [x] `ReceiveOrderItem` model — fillable; date casts; belongsTo product/receiveOrder
- [x] `ReceiveOrderController` — `index` (all orders with warehouse/user names), `store` (same-manager PIN + generates `RO-[WH]-000-[SEQ]` scoped per warehouse with `lockForUpdate()` inside DB transaction + TODO comment to extract into trait when TRF/ISS/TWH are built), `show` (order + items + product details), `complete` (different-manager PIN enforced + updates order + generates `SKU-[WH]-[SKU_SEQ]-[BATCH_SEQ]` StockInUse records for arrived quantities)
- [x] `routes/api.php` — `GET/POST /receive-orders`, `GET /receive-orders/{receiveOrder}`, `POST /receive-orders/{receiveOrder}/complete`
- [x] `ReceiveOrderListPage.jsx` — standalone full page (Navbar + WarehouseTabs); fetches on `location.key` (re-fetches after accomplishing); clears selection on re-fetch; single-select on Incomplete rows; contextual action bar appears when a row is selected showing order code + "ACCOMPLISH ORDER" button → navigates to `/receive-orders/:id`
- [x] `ReceiveOrderFormPage.jsx` — dual-mode overlay (create = no route, UIContext-controlled; accomplish = `/receive-orders/:id`); RETURN closes overlay in create mode, navigates to `/receive-orders` in accomplish mode; warehouse dropdown in Product Details header (pre-fills from `activeWarehouse`, drives `warehouse_id` in API call); unit label shown beside Qty Ordered and Qty Arrived inputs; Qty Ordered step=1; Qty Arrived step=1; `quantity_arrived` parsed to float on load (no trailing zeros); order cost and total auto-computed
- [x] `App.jsx` — routes: `/receive-orders` (list), `/receive-orders/:id` (list + form overlay); no `/receive-orders/new` route (create form opens via UIContext)

### Code Audit & Cleanup
- [x] `ConfirmModal.jsx` — deleted (never imported anywhere)
- [x] `DataTable.jsx` — deleted (never imported anywhere; all tables use inline markup)

### Bug Fixes & Patches
- [x] **WarehouseContext — missing warehouse tabs on fresh login** (`WarehouseContext.jsx`): `useEffect` was using `[]` dependency (fired once on mount, before auth was confirmed); changed dependency to `[user]` so the fetch only runs when authenticated; clears warehouses on logout
- [x] **ReceiveOrder code — global sequence instead of per-warehouse** (`ReceiveOrderController@store`): `ReceiveOrder::count()` was counting all orders globally; changed to `ReceiveOrder::where('warehouse_id', $warehouse->id)->lockForUpdate()->count()` inside the DB transaction to scope the sequence per warehouse and prevent race conditions
- [x] **Dashboard products not updating after Create Product** (`DashboardPage`, `UIContext`, `CreateProductPage`, `App.jsx`): dashboard only re-fetched on `location.key` change; added `productRefreshKey` counter to `UIContext`; `CreateProductPage` calls `onSuccess()` on successful create; `GlobalOverlays` passes `refreshProducts` as `onSuccess`; dashboard depends on `[location.key, productRefreshKey]`

### Build Step 9 — TransferRequestListPage + TransferRequestFormPage + TransferRequestController
- [x] `add_warehouse_id_to_users_table` migration — nullable `warehouse_id` FK on users (needed for Transfer Request cross-warehouse PIN rule; assigned via Step 13 `UserManagementPage`)
- [x] `create_transfer_requests_table` migration — columns: code (unique), source_warehouse_id, destination_warehouse_id, date_requested, date_received (nullable), status (incomplete/complete), requested_by, verified_by (nullable); run
- [x] `create_transfer_request_items_table` migration — columns: transfer_request_id (cascadeOnDelete), product_id, stock_in_use_id, quantity_requested (decimal 10,3), quantity_received (decimal 10,3 default 0), harvest_date (nullable); run
- [x] `TransferRequest` model — fillable; date casts on date_requested/date_received; relationships: belongsTo sourceWarehouse, destinationWarehouse, requester, verifier; hasMany items
- [x] `TransferRequestItem` model — fillable; date cast on harvest_date; relationships: belongsTo product, transferRequest, stockInUse
- [x] `TransferRequestController` — `index` (all transfers with warehouse/user names, date_accomplished from date_received), `store` (same-manager PIN + generates `TRF-[WH]-000-[SEQ]` per-source-warehouse with `lockForUpdate()` inside DB transaction + TODO comment), `show` (transfer + items + product/batch details), `accomplish` (different-user PIN + warehouse check if warehouse_id set + decrements source StockInUse + generates `SKU-[DEST_WH]-[SKU_SEQ]-[BATCH_SEQ]` with harvest_date carried over)
- [x] `routes/api.php` — `GET/POST /transfer-requests`, `GET /transfer-requests/{transferRequest}`, `POST /transfer-requests/{transferRequest}/accomplish`
- [x] `StockInUseController@index` — updated to include `id` in batch response (needed for `stock_in_use_id` in Transfer Request store)
- [x] `UIContext.jsx` — added `transferRequestFormOpen`, `setTransferRequestFormOpen`, `transferRequestRefreshKey`, `refreshTransferRequests`
- [x] `App.jsx` — `GlobalOverlays` renders `TransferRequestFormPage` (create mode) when `transferRequestFormOpen` is true (calls both `refreshProducts` + `refreshTransferRequests` via `onSuccess`); routes: `/transfer-requests` (list), `/transfer-requests/:id` (list + form overlay)
- [x] `Navbar.jsx` — `+ Transfer Request` button wired to `setTransferRequestFormOpen(true)` (no navigate); "Transfer Requests" added to Inventory dropdown → `/transfer-requests`; `inventoryLabel` dynamically shows "Transfer Requests" on `/transfer-requests*`
- [x] `TransferRequestListPage.jsx` (`src/pages/transferRequest/`) — standalone full page (Navbar + WarehouseTabs); fetches on `[location.key, transferRequestRefreshKey]`; single-select on Incomplete rows; contextual action bar with ACCOMPLISH TRANSFER button → `/transfer-requests/:id`; loading/empty/error states mirror `ReceiveOrderListPage`
- [x] `TransferRequestFormPage.jsx` (`src/pages/transferRequest/`) — dual-mode (create = UIContext overlay, accomplish = `/transfer-requests/:id`); create mode: Source/Destination warehouse dropdowns with mutual-disable logic, two-step product flow (AddProductsModal → StockInUseModal per row), source warehouse required before batch selection; accomplish mode: pre-filled read-only fields, Qty Received input with unit label, `quantity_received` parsed to float on load (no trailing zeros); PIN rules: same manager (create), different manager (accomplish); success label "Created TRF-..." / navigate to list on accomplish; calls `refreshProducts` + `refreshTransferRequests` on accomplish

### Root Folder Cleanup — 2026-05-13

#### Files removed
- `ruriims-frontend/src/App.css` — 0-byte empty file; not imported anywhere
- `ruriims-frontend/src/assets/react.svg` — Vite default template asset; no inbound imports
- `ruriims-frontend/src/assets/vite.svg` — Vite default template asset; no inbound imports
- `ruriims-frontend/src/assets/hero.png` — not imported anywhere
- `ruriims-frontend/public/icons.svg` — Vite default SVG sprite (Bluesky/social icons); not referenced in any source file or HTML
- `ruriims-backend/tests/Feature/ExampleTest.php` — scaffold placeholder; only tested `GET /` (welcome page), no project logic
- `ruriims-backend/tests/Unit/ExampleTest.php` — scaffold placeholder; body was `assertTrue(true)`
- `ruriims-backend/tests/TestCase.php` — orphaned base class after ExampleTests removed; no remaining subclasses
- `ruriims-backend/resources/css/app.css` — Laravel frontend scaffold; unused by the React SPA
- `ruriims-backend/resources/js/app.js` — Laravel frontend scaffold; unused by the React SPA
- `ruriims-backend/resources/js/bootstrap.js` — Laravel frontend scaffold; unused by the React SPA
- `ruriims-backend/resources/views/welcome.blade.php` — Laravel default welcome view; not served in production
- `ruriims-backend/routes/web.php` — only served `welcome.blade.php` at `GET /`; backend is pure API
- `ruriims-backend/routes/console.php` — only defined the default `inspire` artisan command; unused
- `ruriims-backend/vite.config.js` — Laravel Vite plugin config for compiling blade assets; unused
- `ruriims-backend/package.json` — npm scripts for Laravel Vite build; unused

#### In-file dead code removed
- `ruriims-backend/app/Models/Product.php` — removed `use Illuminate\Database\Eloquent\Factories\HasFactory` import and `use HasFactory` trait; no `ProductFactory` exists and `Product::factory()` is never called

#### Coordinated code edit
- `ruriims-backend/bootstrap/app.php` — removed `web:` and `commands:` lines from `->withRouting()`; only `api:` and `health:` remain

### Trait Extraction — Step 10

- [x] `app/Traits/GeneratesTransactionCode.php` — protected method `generateTransactionCode(prefix, warehouseId, warehousePrefix, modelClass, codeColumn='code', warehouseColumn='warehouse_id')`: scopes `lockForUpdate()->count()` to the warehouse column, pads sequence to 3 digits, returns `{PREFIX}-{WH}-000-{SEQ}`
- [x] `ReceiveOrderController` — added `use GeneratesTransactionCode`; replaced inline `count()/str_pad` block with `$this->generateTransactionCode('RO', ...)` call; removed TODO comment
- [x] `TransferRequestController` — added `use GeneratesTransactionCode`; replaced inline block with `$this->generateTransactionCode('TRF', ..., 'code', 'source_warehouse_id')` call; removed TODO comment

### Build Step 10 — IssueProductFormPage + IssueProductController

- [x] `create_issue_products_table` migration — columns: id, code (unique), warehouse_id FK, issue_type (enum: sale/internal_use), date_issued (date), issued_by FK; **no status column** — single-stage transaction, always complete; run
- [x] `create_issue_product_items_table` migration — columns: id, issue_product_id FK (cascadeOnDelete), product_id FK, stock_in_use_id FK, quantity_issued (decimal 10,3), harvest_date (nullable), note (text nullable); run
- [x] `IssueProduct` model — fillable; cast date_issued; belongsTo warehouse + issuedBy (User); hasMany items
- [x] `IssueProductItem` model — fillable; cast harvest_date; belongsTo issueProduct, product, stockInUse
- [x] `IssueProductController` — uses `GeneratesTransactionCode` trait; `index` (all records with warehouse/user names); `store` (same-manager PIN + `ISS-[WH]-000-[SEQ]` per-warehouse code inside DB::transaction + item loop with `lockForUpdate()` batch check — returns 422 with message if quantity_issued exceeds batch quantity + `decrement` on StockInUse); `show` (record + items + nested product details)
- [x] `routes/api.php` — `GET/POST /issue-products`, `GET /issue-products/{issueProduct}`
- [x] `AddProductsModal.jsx` — updated `handleSelect` to include `productId: p.id` in the callback payload (backward-compatible; existing RO/TRF consumers ignore the new field)
- [x] `IssueProductFormPage.jsx` (`src/pages/issueProduct/`) — opens as overlay via `UIContext` (no URL change, no route); blur overlay z-40 + card z-50; auto-fills Issued By (AuthContext), Date Requested (today), Warehouse (WarehouseContext.activeWarehouse — no dropdown); Issue Type dropdown (Sale/Internal Use); two-step product flow (AddProductsModal → StockInUseModal per row); table columns: Product SKU | Product Name | Stock-in-Use Code | Unit: | Quantity Issued: | Harvest Date: | Note: (trailing colons per prototype); Note field is `<textarea rows={2}>`; on success: "Created ISS-..." confirmation label + COMPLETE and Add Product buttons disabled; calls `onSuccess()` (refreshProducts) on success; RETURN closes overlay via `onClose` prop
- [x] `UIContext.jsx` — added `issueProductFormOpen` boolean + `setIssueProductFormOpen` setter
- [x] `App.jsx` — `GlobalOverlays` renders `<IssueProductFormPage>` when `issueProductFormOpen` is true; passes `onClose` and `onSuccess={refreshProducts}`; no `/issue-products/new` route added
- [x] `Navbar.jsx` — `+ Issue Product` button wired to `setIssueProductFormOpen(true)` via UIContext (removed from `STATIC_ACTION_BUTTONS`, added dedicated handler); does not use `navigate()`
- [x] `STRUCTURE.md` — removed `/issue-products/new` route entry; updated overlay callout to include `IssueProductFormPage`; updated `IssueProductFormPage` spec opening line to "opens as UIContext overlay"

### UX Enhancement — "Available" Column + Per-Row Quantity Validation (2026-05-15)

- [x] `TransferRequestFormPage.jsx` — renamed "Unit" table column header to "Available"; Available cell shows `{batch_quantity} {unit}` (e.g., "100 kg") when a batch is selected, blank otherwise; removed `batch_quantity` sub-line that was previously shown under the Product Name cell; added `getRowError(item)` helper that fires when typed qty exceeds the batch's available quantity (returns `"Batch {code} only has {qty} {unit}."`) or when a qty is entered but no batch is selected yet (returns `"Select a Stock-In-Use Code first."`); qty input (Qty Requested in create mode, Qty Received in accomplish mode) gets a red border + inline helper text below it when `getRowError` is non-null; CREATE / ACCOMPLISH button disabled while `hasRowErrors` is true (any row has an error)
- [x] `IssueProductFormPage.jsx` — same "Available" column rename, cell rendering, and `getRowError` / `hasRowErrors` validation pattern applied to Qty Issued; COMPLETE button disabled while any row has an error
- [x] Backend — `TransferRequestController@show` was already returning `batch_quantity: (float) $i->stockInUse->quantity` per item (via the eager-loaded `stockInUse` relationship); accomplish-mode Available cell renders from this field on load, no extra fetch or backend change needed

---

## Not Started

- [ ] Step 11 — Temporary Warehouse pages + `TemporaryWarehouseController`
- [ ] Step 12 — Reconciliation pages + `ReconciliationController`
- [ ] Step 13 — `UserManagementPage` + `UserController`
- [ ] Step 14 — All Reports pages + `ReportController`
- [ ] Step 15 — `InventorySummaryPage` + PDF export
