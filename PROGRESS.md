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

### Cascade Feature — Cross-Cutting (2026-05-15)

- [x] `app/Traits/PlansBatchCascade.php` — backend cascade planner: nearest-harvest-date sort with FIFO (oldest-first) tiebreak; FIFO fallback when the anchor batch is depleted (selected batch not in non-zero set); `lockForUpdate()` on all fetched batches; throws `RuntimeException` on insufficient total stock
- [x] `app/Models/IssueProductBatchDeduction.php` + migration `create_issue_product_batch_deductions_table` — records actual batch-level deductions per `issue_product_items` row; FK cascadeOnDelete on item
- [x] `app/Models/TransferRequestBatchDeduction.php` + migration `create_transfer_request_batch_deductions_table` — same for TRF items
- [x] Migrations `rename_stock_in_use_id_on_issue_product_items` + `rename_stock_in_use_id_on_transfer_request_items` — renamed `stock_in_use_id` → `requested_stock_in_use_id` on both items tables to clarify the column is the requester's chosen batch, not the actual deduction reference
- [x] `IssueProductController@store` — cascade-aware; computes plan via trait inside `DB::transaction`; asserts `planSum === quantity_issued` invariant; creates `IssueProductBatchDeduction` rows; decrements `StockInUse` per plan; returns 422 with user-facing message on insufficient stock
- [x] `TransferRequestController@store` — cascade-aware; computes plan via trait; stores `TransferRequestBatchDeduction` rows as the requester's plan; does **not** decrement stock at create time
- [x] `TransferRequestController@accomplish` — recomputes cascade from current stock at accomplish time using `quantity_received`; deletes stale create-time `batch_deductions`; inserts fresh deduction rows; decrements source batches; creates one destination `StockInUse` batch per source batch deducted (harvest date copied from source); wrapped in `try/catch` returning 422 on `RuntimeException`
- [x] `StockInUseController@index` — response shape updated to `{ warehouse_total, batches }` (`warehouse_total` = sum of all quantities for that product+warehouse; `batches` = non-zero only, FEFO ordered)
- [x] `src/utils/planBatchCascade.js` — frontend mirror of `PlansBatchCascade` trait; identical algorithm (nearest-harvest-date + FIFO tiebreak, FIFO fallback when anchor batch absent); used for cascade count and preview rendering; returns `null` instead of throwing
- [x] `src/components/shared/CascadePreviewModal.jsx` — modal (`z-[80]`) showing per-batch draw breakdown (code, harvest date, quantity deducted, total); click-outside-to-close; `formatDate` uses local time constructor to avoid UTC offset issues
- [x] `src/components/shared/StockInUseModal.jsx` — updated to capture `warehouse_total` from new response shape; passes `{ batch, warehouseTotal, allBatches }` via `onSelect` so forms can compute cascade validation without extra fetches
- [x] Per-row cascade validation in `IssueProductFormPage` and `TransferRequestFormPage` (create + accomplish modes): three-tier validation (within-batch → no feedback; cascade range → gray hint with count + preview link; exceeds warehouse total → red error, submit disabled)
- [x] `TransferRequestFormPage` accomplish mode — parallel-fetches `GET /stock-in-use` per unique product code on load to populate `allBatches`/`warehouseTotal` for cascade validation (show API does not return these)

### UX Enhancement — "Available" Column + Per-Row Quantity Validation (2026-05-15)

- [x] `TransferRequestFormPage.jsx` — renamed "Unit" table column header to "Available"; Available cell shows `{batch_quantity} {unit}` (e.g., "100 kg") when a batch is selected, blank otherwise; removed `batch_quantity` sub-line that was previously shown under the Product Name cell; added `getRowError(item)` helper that fires when typed qty exceeds the batch's available quantity (returns `"Batch {code} only has {qty} {unit}."`) or when a qty is entered but no batch is selected yet (returns `"Select a Stock-In-Use Code first."`); qty input (Qty Requested in create mode, Qty Received in accomplish mode) gets a red border + inline helper text below it when `getRowError` is non-null; CREATE / ACCOMPLISH button disabled while `hasRowErrors` is true (any row has an error)
- [x] `IssueProductFormPage.jsx` — same "Available" column rename, cell rendering, and `getRowError` / `hasRowErrors` validation pattern applied to Qty Issued; COMPLETE button disabled while any row has an error
- [x] Backend — `TransferRequestController@show` was already returning `batch_quantity: (float) $i->stockInUse->quantity` per item (via the eager-loaded `stockInUse` relationship); accomplish-mode Available cell renders from this field on load, no extra fetch or backend change needed

### Codebase Cleanup — 2026-05-16
- Ran read-only audit pass (`CODEBASE_AUDIT.md`) covering dead code, orphaned imports, stale TODOs, duplicated logic, debug statements, commented-out code, and concurrency concerns. 15 findings across 8 categories.
- **Removed:** commented-out `MustVerifyEmail` import in `User.php`. Replaced inline FQCN `\App\Models\Warehouse` with a `use` statement in `ReceiveOrderController.php`. Removed unused `ReceiveOrderItem::receiveOrder()` inverse relationship after confirming zero references in codebase.
- **Fixed:** Added `lockForUpdate()` to the batch-sequence count query in `ReceiveOrderController@complete` (header-row lock remains unfixed — see Known Issues).
- **Deferred to future refactor (noted, not acted on):**
  - Extract duplicated batch-sequence-generation pattern between `ReceiveOrderController@complete` and `TransferRequestController@accomplish` into a shared trait (similar to `GeneratesTransactionCode`).
  - Extract duplicated PIN verification logic across `AuthController`, `IssueProductController`, `TransferRequestController`, `ReceiveOrderController` into a middleware or controller trait.
  - Inverse `belongsTo` relationships on `StockInUse`, `IssueProductBatchDeduction`, `TransferRequestBatchDeduction` are unused today but intentionally retained for future Reports/Detail view traversal.
- Audit findings consolidated into this entry. Full audit report (`CODEBASE_AUDIT.md`) deleted after action items were resolved or deferred.

### Documentation Reconciliation — 2026-05-16
- **TECHSTACK.md** — Added `PlansBatchCascade.php` to Traits list; added `IssueProductBatchDeduction.php` and `TransferRequestBatchDeduction.php` to Models list; added 4 cascade migrations (`rename_stock_in_use_id_on_issue_product_items`, `rename_stock_in_use_id_on_transfer_request_items`, `create_issue_product_batch_deductions_table`, `create_transfer_request_batch_deductions_table`); added `CascadePreviewModal.jsx` to shared components; added `src/utils/planBatchCascade.js` to frontend structure.
- **STRUCTURE.md** — Fixed TWH-active Navbar button list to use UIContext overlays (no `/issue-products/new` or `/transfer-requests/new` routes); added `CascadePreviewModal.jsx` to `src/components/shared/` folder tree; added `src/utils/` entry with `planBatchCascade.js`; added zero-stock empty-state note to `CloseTemporaryWarehousePage` Products to Return table.

### Concurrency Fix — TRF Accomplish Header Lock — 2026-05-16
- **Fixed:** `TransferRequestController@accomplish` now acquires a row-level lock via `DB::table('transfer_requests')->where('id', $transferRequest->id)->lockForUpdate()->first()` as the first statement inside `DB::transaction`, then calls `$transferRequest->refresh()` to update the Eloquent instance in-place, then re-checks `status !== 'incomplete'` (throws `RuntimeException` if already complete, caught by the existing `catch (\Exception $e)` block → 422). Closes the race window where two concurrent accomplish requests could both pass the pre-transaction status check.

### Step 11, Stage 1 — Temporary Warehouse Backend Foundation — 2026-05-16

- [x] `add_is_temporary_to_warehouses_table` migration — adds `boolean is_temporary default false` to existing `warehouses` table; existing QC/ALA/MAN rows receive `false` via MySQL ALTER TABLE default; run
- [x] `create_temporary_warehouses_table` migration — columns: id, warehouse_id (unique FK → warehouses, cascadeOnDelete), transaction_code (unique), name, location, event_date, created_by FK, closed_by FK (nullable), date_closed (nullable), status (enum: active/closed, default active); run
- [x] `create_temporary_warehouse_returns_table` migration — columns: id, temporary_warehouse_id FK (cascadeOnDelete), product_id FK, source_stock_in_use_id FK, destination_stock_in_use_id FK, destination_warehouse_id FK, quantity_returned (decimal 10,3), harvest_date (nullable); run
- [x] `Warehouse` model — added `is_temporary` to fillable + boolean cast; `WarehouseController@index` now serializes `is_temporary` on every row automatically
- [x] `TemporaryWarehouse` model — fillable; casts event_date/date_closed → date; belongsTo warehouse(), creator(), closer(); hasMany returns()
- [x] `TemporaryWarehouseReturn` model — fillable; cast harvest_date; belongsTo temporaryWarehouse(), product(), sourceStockInUse(), destinationStockInUse(), destinationWarehouse()
- [x] `TemporaryWarehouseController` — `index` (optional ?status filter, orderByDesc created_at); `store` (same-manager PIN + inline TWH code gen via LIKE count + lockForUpdate inside DB::transaction + creates warehouses row then TWH row — **⚠ TWH event code format is `TWH-{LOC}-{NNN}` instead of correct `TWH-{LOC}-000-{NNN}`; see Known Issues**); `show` (products_transferred_in from completed TRF items, products_issued from IssueProductItems, products_returned from returns() relationship); `close` (same-manager PIN — any manager including creator; lockForUpdate+refresh+status re-check inside transaction; validates dest warehouse is not TWH; validates batch ownership; per-batch decrement + dest StockInUse creation using `SKU-` prefix — correct since close() destinations are always permanent warehouses + TemporaryWarehouseReturn insert; zero-stock close supported via nullable returns array)
- [x] `routes/api.php` — 4 TWH routes added under auth:sanctum: GET/POST /temporary-warehouses, GET /temporary-warehouses/{id}, POST /temporary-warehouses/{id}/close
- **Schema decision:** TWH rows stored in existing `warehouses` table (`is_temporary=true`); `temporary_warehouses` is an extension table with unique FK. Avoids all FK collision issues for TRF destination, ISS warehouse, StockInUse warehouse_id.
- **PIN rule:** close() uses same-manager (any authorized manager, including creator). No different-manager check. Contrast with TRF accomplish (different warehouse) and RO complete (different manager, same branch).

### TWH Backend Bugfixes — Pre-Stage 2 — 2026-05-17

- **Fixed: TWH event header code missing "000" segment** — `TemporaryWarehouseController@store` was generating `TWH-{LOC}-{SEQ}` (e.g., `TWH-BGC-001`) instead of the correct `TWH-{LOC}-000-{SEQ}` (e.g., `TWH-BGC-000-001`). Changed the LIKE pattern to `TWH-{$locationCode}-000-%` and the code assembly to `"TWH-{$locationCode}-000-{$seq}"`. All future event codes now match the 4-segment format shown in prototype screenshots.
- **Fixed: TRF→TWH destination batch code using wrong prefix** — `TransferRequestController@accomplish` was writing all destination `StockInUse` batches with `SKU-` prefix unconditionally. Added `$prefix = $destination->is_temporary ? 'TWH' : 'SKU'` branch before code assembly. TWH destinations now produce `TWH-{LOC}-{SKU_SEQ}-{BATCH_SEQ}` codes; permanent warehouse destinations keep the `SKU-` prefix unchanged. `TemporaryWarehouseController@close` was not affected (its destination is always a permanent warehouse, validated at runtime).
- **Doc fix: STRUCTURE.md styling rules** — Replaced stale `bg-green-700`/`bg-green-800` Tailwind class references in the Brand color, Buttons, and Table header examples with Tailwind arbitrary value equivalents (`bg-[#409645]`, `bg-[#1A381E]`, `hover:bg-[#39803E]`). Added a DESIGN.md citation as the source of truth for brand hex values. The actual code was already using inline hex correctly; only the STRUCTURE.md docs were stale.

### Step 11, Stage 2 — Temporary Warehouse Frontend Wiring — 2026-05-17

- [x] `TemporaryWarehouseController@index` — added `warehouse_id` to the index response map so `WarehouseContext` can resolve the underlying `warehouses.id` for TWH entries
- [x] `WarehouseContext.jsx` — parallel-fetches `/warehouses` + `/temporary-warehouses?status=active` on login; merges into a single list via `buildWarehouseList` (filters `/warehouses` to `is_temporary=false` only to prevent duplicates); TWH entries carry `{ id: warehouse_id, isTemporary: true, transactionCode, temporaryWarehouseId }`; exposes `refreshWarehouses()` (preserves active warehouse if still present, resets to first otherwise) for use in Stage 3 after TWH creation
- [x] `WarehouseTabs.jsx` — tab label renders `Temporary Warehouse ({code})` for TWH entries; permanent warehouse labels unchanged; active-tab highlight uses both `id` and `isTemporary` for safe matching; TWH key prefixed `twh-` to prevent future collisions
- [x] `Navbar.jsx` — action button row branches on `activeWarehouse?.isTemporary`: TWH-active shows 3 buttons (Issue Product → `setIssueProductFormOpen`, Transfer Request → `setTransferRequestFormOpen`, Close Temporary Warehouse → `/temporary-warehouses/{temporaryWarehouseId}/close`); permanent-active shows existing full set unchanged; `+ Close Temporary Warehouse` route is wired but navigates to a 404 pending Stage 4
- [x] `DashboardPage.jsx` — imports `useWarehouse`; derives `permanentWarehouses` (context list filtered to `!isTemporary`) for standard table column headers, preventing spurious TWH columns; TWH-active branch renders simplified 4-column table (Name | Quantity | Harvest Date | Status) using `warehouse_stock[activeWarehouse.id]`; per-product TWH status computed from TWH-specific quantity (not global product status)
- **`permanentWarehouses` pattern note:** `GET /api/products` returns a `warehouses` list from `Warehouse::all()` which now includes `is_temporary=true` rows — using it directly for column headers would produce spurious TWH columns. Correct pattern is `WarehouseContext.warehouses.filter(w => !w.isTemporary)`, which is already correctly filtered at the source. Future page consumers building permanent-warehouse-column tables should follow this same pattern instead of reading `warehouses` from the products API response.

### Step 11, Stage 3 — TWH Create Form + TRF Prefill + Harvest Date Fix — 2026-05-17

- [x] `UIContext.jsx` — added `temporaryWarehouseFormOpen` boolean + `setTemporaryWarehouseFormOpen` setter; follows same pattern as `issueProductFormOpen`
- [x] `WarehouseContext.jsx` — `refreshWarehouses` now accepts an optional `selectWarehouseId` param; when provided, auto-selects the matching TWH entry after re-fetch (used by `TemporaryWarehouseFormPage` after creation to switch the dashboard to the new TWH immediately); default behavior (preserve active) unchanged when param is omitted
- [x] `TemporaryWarehouseFormPage.jsx` (`src/pages/temporaryWarehouse/`) — new overlay (not a route); fields: Warehouse Name, Event Date, Created By (read-only from AuthContext), Location; derives `location_code` client-side (`first 3 alphanumeric chars of Location, uppercased`) and sends both `location` + `location_code` to `POST /api/temporary-warehouses`; PIN-verified (same manager); on success: shows "Created TWH-…" label, calls `refreshWarehouses(warehouse_id)` to append new tab and auto-select it; RETURN closes overlay
- [x] `App.jsx` — `GlobalOverlays` renders `<TemporaryWarehouseFormPage>` when `temporaryWarehouseFormOpen` is true; passes `onClose` only (no `onSuccess` needed — `refreshWarehouses` called internally)
- [x] `Navbar.jsx` — `+ Create Temporary Warehouse` button wired to `setTemporaryWarehouseFormOpen(true)`; removed from `STATIC_ACTION_BUTTONS`; dedicated `if` branch added to `BUTTON_ORDER.map()`
- [x] `TransferRequestFormPage.jsx` — `activeWarehouse` added to `useWarehouse()` destructure; `destinationWarehouseId` initial state pre-fills to `activeWarehouse.id` when `!isAccomplish && activeWarehouse?.isTemporary`; source starts blank; dropdown options, mutual-disable logic, and validation unchanged
- [x] `ProductController@index` — added `$latestHarvestPerWarehouse` map (`GROUP BY product_id, warehouse_id`); each product in response now carries `harvest_date_per_warehouse: { [warehouse_id]: latest_harvest }` alongside the existing global `harvest_date` scalar; standard table unchanged
- [x] `DashboardPage.jsx` — TWH branch now reads `product.harvest_date_per_warehouse?.[activeWarehouse.id]` for the Harvest Date cell instead of the global scalar; zero-stock guard from Stage 2 retained; standard (non-TWH) table branch untouched
- **Harvest Date bug resolved:** Stage 2 zero-stock guard + Stage 3 per-warehouse map together ensure the TWH dashboard shows the correct per-warehouse harvest date. Standard multi-warehouse table intentionally still uses the global scalar (redesign deferred).
- **STRUCTURE.md update:** `+ Create Temporary Warehouse` entry on line 332 changed from `/temporary-warehouses/new (not yet built)` to `opens TemporaryWarehouseFormPage overlay via UIContext (no URL change)`.

### Step 11, Stage 4 — TWH Close Flow + Detail Page — 2026-05-18

- [x] `App.jsx` — two new protected routes added: `/temporary-warehouses/:id/close` → `CloseTemporaryWarehousePage` (specific route first) and `/temporary-warehouses/:id` → `TemporaryWarehouseDetailPage`; both components imported at top of file
- [x] `CloseTemporaryWarehousePage.jsx` (`src/pages/temporaryWarehouse/`) — new routed full page (not overlay); on mount: fetches TWH details via `GET /api/temporary-warehouses/{id}`, then parallel-fetches `GET /api/stock-in-use?sku_code=&warehouse_id=` for each unique product SKU in `products_transferred_in` to derive remaining live batches (show() does not include remaining stock directly); read-only header fields (Warehouse Name, Event Date, Created By, Location) + blank pre-close fields (Closed By, Date Closed — auto-filled on success from AuthContext user.name + todayISO); "Products to Return" table: one row per StockInUse batch with quantity > 0 (Product SKU | Product Name | Stock-In-Use Code | Unit | Qty to Return | Return To dropdown); Return To dropdown contains permanent warehouses only from WarehouseContext; CLOSE WAREHOUSE button disabled until every row has a destination selected (empty rows = button always enabled); PIN-verified via `PinVerificationModal`; POST to `/api/temporary-warehouses/{id}/close` with `{ date_closed, pin, returns: [{ stock_in_use_id, destination_warehouse_id, quantity_returned }] }`; on success: shows success message, calls `refreshWarehouses()`, navigates to `/` after 1.5s; "already closed" defensive guard redirects with message
- [x] `TemporaryWarehouseDetailPage.jsx` (`src/pages/temporaryWarehouse/`) — new routed read-only page; on mount: fetches `GET /api/temporary-warehouses/{id}`; displays metadata block (Warehouse Name, Event Date, Created By, Location, Closed By, Date Closed) as plain labeled text; three sub-tables: Products Transferred In (Transfer Code | Qty Received | Harvest Date — source_warehouse not in backend response), Products Issued (Issue Code | Qty Issued | Harvest Date — issue_type not in backend response), Products Returned (Source Batch | Qty Returned | Returned To) — empty state "No records." for each if array is empty; no action buttons other than RETURN (navigate(-1))
- **STRUCTURE.md fix:** Corrected line 935 "Two sub-tables" typo to "Three sub-tables" — the backend show() returns all three, and the detail page builds all three

### Step 11, Stage 4 Refactor — Overlay Conversion + Backend show() Patch — 2026-05-18

- [x] `TemporaryWarehouseController@show` — enriched `products_transferred_in` items with `stock_in_use_code` (the TWH batch code created by TRF accomplish, looked up via warehouse_id + product_id) and `source_warehouse` (TRF's `sourceWarehouse->name`, via eager-loaded `transferRequest.sourceWarehouse`); enriched `products_issued` items with `stock_in_use_code` (via `stockInUse` eager load on `requested_stock_in_use_id` FK) and `issue_type` (from parent `issueProduct->issue_type`); `products_returned` unchanged
- [x] `UIContext.jsx` — added `closeTemporaryWarehouseOverlayTwhId` / `setCloseTemporaryWarehouseOverlayTwhId` and `temporaryWarehouseDetailOverlayTwhId` / `setTemporaryWarehouseDetailOverlayTwhId` (Option α — single ID-carrying state per overlay, `null` = closed, number = open); both pairs exposed in context value
- [x] `CloseTemporaryWarehousePage.jsx` — converted from routed full page to UIContext overlay; removed `Navbar`, `useParams`, `useNavigate`; reads TWH id from `closeTemporaryWarehouseOverlayTwhId`; early `return null` (after hooks) when id is null; `useEffect` resets all state on null + fetches on new id; RETURN and success both close via setter (`setCloseTemporaryWarehouseOverlayTwhId(null)`); success waits 1.5s then closes overlay (no explicit navigation — `refreshWarehouses()` handles tab disappearance and active-warehouse fallback); overlay shell: `fixed inset-0 bg-black/20 backdrop-blur-sm z-40` backdrop + `fixed top-[105px] left-1/2 -translate-x-1/2 w-[1040px] max-h-[85vh]` card
- [x] `TemporaryWarehouseDetailPage.jsx` — converted from routed full page to UIContext overlay; same shell pattern; three sub-tables expanded with new backend columns: Products Transferred In now 7 columns (Transfer Code + Stock-In-Use Code + Harvest Date + Source Warehouse added), Products Issued now 7 columns (Issue Code + Stock-In-Use Code + Harvest Date + Issue Type added), Products Returned unchanged at 5 columns
- [x] `Navbar.jsx` — `+ Close Temporary Warehouse` button rewired from `navigate('/temporary-warehouses/.../close')` to `setCloseTemporaryWarehouseOverlayTwhId(activeWarehouse.temporaryWarehouseId)`; removed comment referencing Stage 4 route; `setCloseTemporaryWarehouseOverlayTwhId` added to UIContext destructure
- [x] `App.jsx` — removed `/temporary-warehouses/:id/close` and `/temporary-warehouses/:id` routes; mounted `<CloseTemporaryWarehousePage />` and `<TemporaryWarehouseDetailPage />` unconditionally inside `GlobalOverlays` (each self-guards on UIContext null state)
- **Rationale:** Consistency with established overlay pattern (Create Product, Receive Order, Transfer Request, Issue Product, Create TWH are all overlays). Detail overlay entry point becomes click-from-list in Stage 5.

### Step 11, Stage 5 — TempWarehouseReportsPage — 2026-05-18

- [x] `TemporaryWarehouseController@index` — added `created_at` field (formatted as `M d, Y`) to the index response map so the reports page can display the creation date
- [x] `StatusBadge.jsx` — added `"Active"` to the green-badge condition so TWH active status renders green; "Closed" retains red; both existing statuses (In Stock, Accomplished, Complete) unchanged
- [x] `TempWarehouseReportsPage.jsx` (`src/pages/reports/`) — new standalone full page (Navbar only, no WarehouseTabs); fetches `GET /api/temporary-warehouses` on `location.key`; 9-column table: Transaction Code | Warehouse Name | Location | Event Date | Date Created | Created By | Closed By | Date Closed | Status; all rows clickable → `setTemporaryWarehouseDetailOverlayTwhId(twh.id)` opens the detail overlay; no action bar, no filter bar (deferred to Step 14); status "active"/"closed" mapped to "Active"/"Closed" for StatusBadge
- [x] `App.jsx` — imported `TempWarehouseReportsPage`; added protected route `/reports/temporary-warehouses`
- [x] `Navbar.jsx` — "Reports History" button wired to `navigate('/reports/temporary-warehouses')` (temporary wiring; Step 14 will replace with a proper dropdown)

---

### Pre-Step 12 Cleanup — STRUCTURE.md Drift + StatusBadge Expansion + DESIGN.md Styling Reconciliation — 2026-05-18

- [x] **STRUCTURE.md routing table:** Removed 3 stale TWH routes (`/temporary-warehouses/:id`, `/temporary-warehouses/new`, `/temporary-warehouses/:id/close`) — all converted to UIContext overlays during Stage 4 refactor; `/reports/temporary-warehouses` entry retained. Deleted obsolete React Router precedence note for `:id` vs `:id/close`. Updated Navbar TWH-active section: `+ Close Temporary Warehouse` now correctly documents UIContext overlay wiring (`setCloseTemporaryWarehouseOverlayTwhId`; no URL change). Added inline comment flagging that Reports History Navbar button temporarily routes to `/reports/temporary-warehouses` until Step 14.
- [x] **`StatusBadge.jsx` expanded to 3 color tiers using Tailwind named pastel classes throughout:** Green tier adds `"Reviewed"` (was missing); amber tier added for `"Pending Review"` (`bg-amber-100 text-amber-800`, consistent with green/red pastel pattern); red tier adds `"Closed"` explicitly (previously implicit via fallback). STRUCTURE.md `### StatusBadge.jsx` table synced — all 10 status values documented with named classes used; "(planned)" labels removed. Styling Rules section updated to document the status badge exception to the brand-color rule (badges use Tailwind pastels, not brand hex, to preserve the prototype's soft visual language).
- [x] **DESIGN.md confirmed as source of truth for brand color application.** Added dual-approach note to DESIGN.md: inline `style={{ backgroundColor }}` for non-interactive elements; `.btn-brand` / `.btn-brand-outline` CSS classes for interactive elements with hover states.
- [x] **`src/index.css`** — added `.btn-brand` (`#409645` bg, `#367a38` hover) and `.btn-brand-outline` (`#409645` hover-only) CSS rules.
- [x] **Codebase migration — 15 files updated:** Converted all `bg-[#1A381E]` table headers and navbar to inline `style={{ backgroundColor: '#1A381E' }}` (12 occurrences: `Navbar.jsx`, `CascadePreviewModal.jsx`, `DashboardPage.jsx` ×2, `ReceiveOrderListPage.jsx`, `ReceiveOrderFormPage.jsx`, `TransferRequestListPage.jsx`, `TransferRequestFormPage.jsx`, `IssueProductFormPage.jsx`, `TempWarehouseReportsPage.jsx`, `TemporaryWarehouseDetailPage.jsx`, `CloseTemporaryWarehousePage.jsx`). Converted all `bg-[#409645] hover:bg-[#367a38]` button classes to `btn-brand` (13 occurrences across `Navbar.jsx`, `ProfileModal.jsx`, `LoginPage.jsx`). Converted `WarehouseTabs.jsx` active tab constant to `btn-brand`. Converted `Navbar.jsx:235` ghost button to `btn-brand-outline`. Replaced `bg-[#F3F4F6]` in `LoginPage.jsx` with standard `bg-gray-100`. STRUCTURE.md Styling Rules rewritten to document dual approach.

---

### Concurrency Fix — RO Complete Header Lock — 2026-05-18

- [x] **Fixed:** `ReceiveOrderController@complete` now acquires a row-level lock via `DB::table('receive_orders')->where('id', $receiveOrder->id)->lockForUpdate()->first()` as the first statement inside `DB::transaction`, then `$receiveOrder->refresh()` to re-hydrate, then re-checks `status !== 'incomplete'` (throws `RuntimeException`, caught by new `try/catch` wrapper → 422). Added the `try/catch` wrapper to match `TransferRequestController@accomplish` exactly — the original method had no catch block, so a thrown exception would have surfaced as a 500. Closes the race window where two concurrent complete requests could both pass the pre-transaction status check and double-add inventory.

---

### Step 12, Stage 1 — Reconciliation Backend Foundation — 2026-05-19

- [x] 3 migrations: create_reconciliations_table, create_reconciliation_items_table,
      create_reconciliation_batch_adjustments_table. All run.
- [x] 3 models: Reconciliation, ReconciliationItem, ReconciliationBatchAdjustment
      with full relations.
- [x] ReconciliationController with index, expectedStock, store, show, confirm
      methods.
- [x] FIFO deduction routine for negative discrepancies (oldest harvest_date first,
      id ASC tiebreak, lockForUpdate, zero-quantity batches retained).
- [x] Surplus batch creation routine with RCB-{WH}-{SKU_SEQ}-{BATCH_SEQ} code
      generation; SKU_SEQ from product sku_code suffix, BATCH_SEQ scoped per
      (warehouse, product, RCB- prefix); harvest_date copied from oldest existing
      batch at same warehouse for that product, defaults to today if no existing
      batches; harvest_date_source enum recorded for audit transparency.
- [x] PIN model: same-manager on store() (auth user's own PIN); different-manager-
      same-branch on confirm() (mirrors RO complete).
- [x] confirm() uses lockForUpdate + refresh + status re-check inside DB::transaction
      from the start (matches the pattern proven on TRF accomplish and RO complete),
      with try/catch wrapper converting RuntimeException to 422.
- [x] Event code RC-{WH}-000-{SEQ} generated via existing GeneratesTransactionCode
      trait (no new trait needed).
- [x] Validation: store() requires Remarks on items with non-zero discrepancy via
      single inline validator closure that computes discrepancy server-side; rejects
      422 if any non-zero row has empty remarks. Warehouse fetched ONCE at top of
      store() and reused by both the is_temporary rejection check and the closure.
- [x] 5 routes added under auth:sanctum: GET /reconciliations, GET /reconciliations/
      expected-stock, POST /reconciliations, GET /reconciliations/{id}, POST
      /reconciliations/{id}/confirm. expected-stock placed before {id} for routing
      precedence.
- **Schema decision:** Single reconciliation_batch_adjustments table with direction
  enum (deduction/addition) and nullable harvest_date_source enum
  (copied_from_oldest/defaulted_today, populated only for additions).
- **Code prefix decision:** Event code RC-, surplus batch code RCB- — disambiguated
  so reports never have to count segments to identify what kind of code they're
  looking at.
- **Scope decision:** Reconciliation reads all in-stock products at the active
  warehouse via the new expectedStock endpoint (one row per product, summed across
  batches); manager doesn't pick products. Zero-discrepancy rows are still saved
  for audit trail.
- **Snapshot semantics (documented for future reference):** expected_stock is
  captured at store() time and not updated at confirm(). Between submit and confirm,
  stock can move via other transactions; FIFO deduction at confirm() operates on
  current stock, not the snapshot. Recorded discrepancy may diverge from actual
  deduction sum in such cases — this is intentional, not a bug.

---

## Known Issues / Flagged for Future Fix

- **Reconciliation reports not reachable from UI** — Step 12 reconciliation records
  are created and confirmed, but the existing Reports History Navbar button is
  temporarily hard-routed to /reports/temporary-warehouses. Step 14 will add the
  Reports History dropdown and a /reports/reconciliations page. Until then,
  reconciliation history is only visible through the /reconciliation list page.

---

## Not Started

- [ ] Step 12 (Stages 2–4) — Reconciliation frontend pages (list, create form, review page)
- [ ] Step 13 — `UserManagementPage` + `UserController`
- [ ] Step 14 — All Reports pages + `ReportController`
- [ ] Step 15 — `InventorySummaryPage` + PDF export
