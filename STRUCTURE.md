# Rural Rising IMS — Frontend Structure

## Purpose of This File

This file defines the folder structure, component breakdown, and architectural rules
for the `ruriims-frontend` React app. It exists so that every feature is built
consistently — the same patterns, the same file locations, and the same component
boundaries — whether you are building it manually or with Claude Code.

When starting a new feature, always reference this file so you know exactly where
new files belong, which shared components to reuse, and how pages and their
sub-components should be organized.

---

## Folder Structure

```
ruriims-frontend/
└── src/
    ├── api/
    │   └── axios.js                  ← Axios client + getCsrfCookie()
    │
    ├── assets/
    │   └── logo.png                  ← Rural Rising logo (used in navbar + PDF reports)
    │
    ├── components/                   ← Reusable, shared UI components
    │   ├── layout/
    │   │   ├── Navbar.jsx            ← Top navigation bar (action buttons + dropdowns)
    │   │   └── WarehouseTabs.jsx     ← Bottom warehouse switcher tabs
    │   │
    │   ├── shared/
    │   │   ├── PinVerificationModal.jsx   ← 6-digit PIN entry modal (used across all transactions)
    │   │   ├── AddProductsModal.jsx       ← Product selection table modal (used in Receive, Transfer, Issue)
    │   │   ├── DataTable.jsx              ← Reusable table (columns + rows as props)
    │   │   ├── StatusBadge.jsx            ← "In Stock" / "Out of Stock" / "Incomplete" / "Accomplished" badges
    │   │   ├── ConfirmModal.jsx           ← Generic yes/no confirmation dialog
    │   │   └── ProfileModal.jsx           ← Profile details overlay (triggered by avatar icon)
    │
    ├── pages/                        ← One folder per feature/section
    │   ├── auth/
    │   │   └── LoginPage.jsx         ← Sign in form (email + password + social login buttons)
    │   │
    │   ├── dashboard/
    │   │   └── DashboardPage.jsx     ← Main inventory table view with filters and sorting
    │   │
    │   ├── products/
    │   │   └── CreateProductPage.jsx ← Create product form (Name, Category, Unit, Shelf Life)
    │   │
    │   ├── receiveOrder/
    │   │   ├── ReceiveOrderListPage.jsx   ← Table of all receiving orders with status
    │   │   └── ReceiveOrderFormPage.jsx   ← Create/view a receiving order + PIN verification
    │   │
    │   ├── transferRequest/
    │   │   ├── TransferRequestListPage.jsx   ← Table of all transfer requests with status
    │   │   └── TransferRequestFormPage.jsx   ← Create/accomplish a transfer + PIN verification
    │   │
    │   ├── issueProduct/
    │   │   ├── IssueProductListPage.jsx   ← Table of all issued product records
    │   │   └── IssueProductFormPage.jsx   ← Issue product form + Stock-In-Use selection
    │   │
    │   ├── temporaryWarehouse/
    │   │   ├── TemporaryWarehouseListPage.jsx   ← List of temporary warehouses (active + closed)
    │   │   └── TemporaryWarehouseFormPage.jsx   ← Create temporary warehouse form
    │   │
    │   ├── reconciliation/
    │   │   ├── ReconciliationListPage.jsx   ← List of reconciliation records
    │   │   └── ReconciliationFormPage.jsx   ← Reconciliation workflow (expected vs actual)
    │   │
    │   └── reports/
    │       ├── ReportsHistoryPage.jsx   ← List of past generated reports + filter/generate panel
    │       └── ReportDetailPage.jsx     ← Print-ready report view + Export to PDF button
    │
    ├── App.jsx       ← Root component: sets up routing
    └── main.jsx      ← React DOM entry point
```

---

## Routing

All routes are defined in `App.jsx`. Use React Router v6 with the following structure:

```
/                          → DashboardPage  (protected)
/login                     → LoginPage      (public)
/products/create           → CreateProductPage
/receive-orders            → ReceiveOrderListPage
/receive-orders/new        → ReceiveOrderFormPage (create mode)
/receive-orders/:id        → ReceiveOrderFormPage (view/complete mode)
/transfer-requests         → TransferRequestListPage
/transfer-requests/new     → TransferRequestFormPage (create mode)
/transfer-requests/:id     → TransferRequestFormPage (accomplish mode)
/issue-products            → IssueProductListPage
/issue-products/new        → IssueProductFormPage
/temporary-warehouses      → TemporaryWarehouseListPage
/temporary-warehouses/new  → TemporaryWarehouseFormPage
/reconciliation            → ReconciliationListPage
/reconciliation/:id        → ReconciliationFormPage
/reports                   → ReportsHistoryPage
/reports/:id               → ReportDetailPage
```

All routes except `/login` should be wrapped in a protected route guard that checks
for an authenticated Sanctum session. If unauthenticated, redirect to `/login`.

---

## Shared Components — Usage Rules

### `PinVerificationModal.jsx`

Used on every transaction that requires a second manager to verify. This is the most
reused component in the system. It must never be rebuilt inside a page — always import
from `components/shared/`.

Props it should accept:
```
isOpen         boolean   — controls visibility
transactionId  string    — e.g. "RO-QC-000-003" (shown in the modal header)
onVerify       function  — called when PIN is verified successfully
onClose        function  — called when the modal is dismissed
```

Used by: `ReceiveOrderFormPage`, `TransferRequestFormPage`, `IssueProductFormPage`,
`ReconciliationFormPage`

---

### `AddProductsModal.jsx`

The product selection table that appears when the user clicks "Add Product" inside a
form. Shows all master products (Product Code, Product Name, Unit, Category) as a
selectable list. Multiple rows can be selected before clicking SELECT.

Props it should accept:
```
isOpen      boolean
onSelect    function  — receives array of selected product objects
onClose     function
```

Used by: `ReceiveOrderFormPage`, `TransferRequestFormPage`, `IssueProductFormPage`

---

### `DataTable.jsx`

A reusable table component so you don't rebuild the same `<table>` structure on every
list page.

Props it should accept:
```
columns    array   — [{ key, label, render? }]
rows       array   — data objects
onRowClick function (optional) — called with the row object when a row is clicked
```

Used by: `ReceiveOrderListPage`, `TransferRequestListPage`, `IssueProductListPage`,
`ReconciliationListPage`, `ReportsHistoryPage`

---

### `StatusBadge.jsx`

Renders a colored pill badge based on a status string.

Status → Color mapping:
- `"In Stock"` → green
- `"Out of Stock"` → red
- `"Accomplished"` / `"Complete"` → green
- `"Incomplete"` / `"Pending"` → red/orange

Props:
```
status  string
```

Used by: `DashboardPage`, all list pages

---

### `Navbar.jsx`

The top navigation bar rendered on every protected page. Contains:
- Rural Rising logo / name (left)
- Action buttons: Create Product, Receive Order, Issue Product, Transfer Request,
  Create Temporary Warehouse
- Filter dropdowns: All Products, Inventory (→ Receive Orders, Transfer Requests,
  Inventory Reconciliation), LIFO
- Reports History button
- Settings icon + Profile avatar (right) — clicking avatar opens `ProfileModal`

The active warehouse context (e.g. "Main Warehouse") is displayed on the top right.
The Navbar does not manage state — it receives the current warehouse name as a prop
and calls callback functions for button/dropdown actions.

---

### `WarehouseTabs.jsx`

The row of warehouse tabs at the bottom of the dashboard view.
Renders one tab per registered warehouse. The active tab is highlighted.

Props:
```
warehouses      array of { id, name }
activeWarehouse string  — id of the currently selected warehouse
onChange        function — called with the warehouse id when a tab is clicked
```

---

## Page Patterns

Every list page (e.g. `ReceiveOrderListPage`) follows this pattern:
1. Fetch data from the API on mount using `useEffect`
2. Store data in `useState`
3. Render `DataTable` with the appropriate columns
4. Clicking a row navigates to the form/detail page using `useNavigate`

Every form page (e.g. `ReceiveOrderFormPage`) follows this pattern:
1. If a route `/:id` param exists, fetch existing record on mount (view/complete mode)
2. If no param, render empty form (create mode)
3. Form state lives in `useState` within the page component
4. "Add Product" button opens `AddProductsModal`
5. "Complete" / "Accomplish" button opens `PinVerificationModal`
6. On successful PIN verification, submit the final API call
7. On success, navigate back to the list page

---

## Styling Rules

- All styling uses **Tailwind CSS utility classes only**. No custom CSS files.
- The primary brand color is green. Use `bg-green-700` for filled buttons and table
  headers, `text-green-700` for links and accents.
- All buttons follow the same two variants:
  - Primary (filled): `bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800`
  - Secondary (outlined): `border border-green-700 text-green-700 px-4 py-2 rounded`
- Status badges use `rounded-full px-3 py-1 text-sm font-medium` with color classes
  applied conditionally in `StatusBadge.jsx`.
- All modals use a fixed dark overlay (`fixed inset-0 bg-black/50 z-50`) with the modal
  panel centered using flexbox.
- Form fields use `w-full border border-gray-300 rounded px-3 py-2 text-sm` as the
  base class. Disabled/read-only fields add `bg-gray-100 text-gray-500`.

---

## API Calls

All API calls go through the axios instance in `src/api/axios.js`. Never use `fetch`
directly or create a second axios instance.

Before any POST/PUT/DELETE call, `getCsrfCookie()` must have been called. This is
already handled in the login flow, and the session cookie persists for subsequent
requests. For new transaction submissions, call `getCsrfCookie()` once at the start
of the session — do not call it before every single request.

Suggested API call pattern inside a page:
```js
import api from '../../api/axios';

const handleSubmit = async () => {
  try {
    const response = await api.post('/receive-orders', formData);
    navigate('/receive-orders');
  } catch (error) {
    console.error(error);
  }
};
```

---

## Backend Controller Conventions (Laravel)

Each feature maps to its own controller in `ruriims-backend/app/Http/Controllers/`:

```
AuthController.php               ← login, logout, user
ProductController.php            ← index, store
ReceiveOrderController.php       ← index, store, show, complete
TransferRequestController.php    ← index, store, show, accomplish
IssueProductController.php       ← index, store, show
TemporaryWarehouseController.php ← index, store, close
ReconciliationController.php     ← index, store, show
ReportController.php             ← index, generate, show, export (PDF)
PinController.php                ← verify (validates PIN, returns short-lived token)
```

Models belong in `app/Models/`. One model per database table.
Migrations belong in `database/migrations/`. One migration per table.

---

## Build Order

Build features in this sequence. Each step depends on the previous:

1. `LoginPage` + `AuthController` + Sanctum session
2. `Navbar` + `WarehouseTabs` + `DashboardPage` (static table first, then API)
3. `StatusBadge` + `DataTable` (shared components used from step 4 onward)
4. `CreateProductPage` + `ProductController`
5. `PinVerificationModal` + `AddProductsModal` (shared modals used from step 6 onward)
6. `ReceiveOrderListPage` + `ReceiveOrderFormPage` + `ReceiveOrderController`
7. `TransferRequestListPage` + `TransferRequestFormPage` + `TransferRequestController`
8. `IssueProductListPage` + `IssueProductFormPage` + `IssueProductController`
9. `TemporaryWarehouseListPage` + `TemporaryWarehouseFormPage` + `TemporaryWarehouseController`
10. `ReconciliationListPage` + `ReconciliationFormPage` + `ReconciliationController`
11. `ReportsHistoryPage` + `ReportDetailPage` + `ReportController` (PDF via DomPDF)
