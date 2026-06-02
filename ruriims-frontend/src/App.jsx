import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WarehouseProvider } from './context/WarehouseContext';
import { UIProvider, useUI } from './context/UIContext';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import CreateProductPage from './pages/products/CreateProductPage';
import ReceiveOrderListPage from './pages/receiveOrder/ReceiveOrderListPage';
import ReceiveOrderFormPage from './pages/receiveOrder/ReceiveOrderFormPage';
import TransferRequestListPage from './pages/transferRequest/TransferRequestListPage';
import TransferRequestFormPage from './pages/transferRequest/TransferRequestFormPage';
import IssueProductFormPage from './pages/issueProduct/IssueProductFormPage';
import TemporaryWarehouseFormPage from './pages/temporaryWarehouse/TemporaryWarehouseFormPage';
import CloseTemporaryWarehousePage from './pages/temporaryWarehouse/CloseTemporaryWarehousePage';
import TemporaryWarehouseDetailPage from './pages/temporaryWarehouse/TemporaryWarehouseDetailPage';
import TempWarehouseReportsPage from './pages/reports/TempWarehouseReportsPage';
import ReportsHistoryPage from './pages/reports/ReportsHistoryPage';
import ReconciliationListPage from './pages/reconciliation/ReconciliationListPage';
import ReconciliationReviewPage from './pages/reconciliation/ReconciliationReviewPage';
import ReconciliationFormPage from './pages/reconciliation/ReconciliationFormPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import UserFormPage from './pages/admin/UserFormPage';
import ReceiveOrderAuditPage from './pages/receiveOrder/ReceiveOrderAuditPage';
import TransferRequestAuditPage from './pages/transferRequest/TransferRequestAuditPage';
import ProductDetailPage from './pages/products/ProductDetailPage';
import ProductReportsPage from './pages/reports/ProductReportsPage';
import ReceiveOrderReportsPage from './pages/reports/ReceiveOrderReportsPage';
import TransferRequestReportsPage from './pages/reports/TransferRequestReportsPage';
import IssueProductAuditPage from './pages/issueProduct/IssueProductAuditPage';
import IssueProductReportsPage from './pages/reports/IssueProductReportsPage';
import ReconciliationReportsPage from './pages/reports/ReconciliationReportsPage';
import InventorySummaryPage from './pages/reports/InventorySummaryPage';
import ProductDetailOverlay from './components/overlays/ProductDetailOverlay';

function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

function GlobalOverlays() {
  const {
    receiveOrderFormOpen, setReceiveOrderFormOpen,
    createProductFormOpen, setCreateProductFormOpen,
    transferRequestFormOpen, setTransferRequestFormOpen,
    issueProductFormOpen, setIssueProductFormOpen,
    temporaryWarehouseFormOpen, setTemporaryWarehouseFormOpen,
    reconciliationFormOpen, setReconciliationFormOpen,
    refreshProducts, refreshReceiveOrders, refreshTransferRequests, refreshReconciliations,
  } = useUI();
  return (
    <>
      {createProductFormOpen && (
        <CreateProductPage onClose={() => setCreateProductFormOpen(false)} onSuccess={refreshProducts} />
      )}
      {receiveOrderFormOpen && (
        <ReceiveOrderFormPage onClose={() => setReceiveOrderFormOpen(false)} onSuccess={refreshReceiveOrders} />
      )}
      {transferRequestFormOpen && (
        <TransferRequestFormPage onClose={() => setTransferRequestFormOpen(false)} onSuccess={() => { refreshProducts(); refreshTransferRequests(); }} />
      )}
      {issueProductFormOpen && (
        <IssueProductFormPage onClose={() => setIssueProductFormOpen(false)} onSuccess={refreshProducts} />
      )}
      {temporaryWarehouseFormOpen && (
        <TemporaryWarehouseFormPage onClose={() => setTemporaryWarehouseFormOpen(false)} />
      )}
      {reconciliationFormOpen && (
        <ReconciliationFormPage
          onClose={() => setReconciliationFormOpen(false)}
          onSuccess={refreshReconciliations}
        />
      )}
      <CloseTemporaryWarehousePage />
      <TemporaryWarehouseDetailPage />
      <UserFormPage />
      <ProductDetailOverlay />
    </>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/receive-orders" element={<ProtectedRoute><ReceiveOrderListPage /></ProtectedRoute>} />
      <Route path="/receive-orders/:id/audit" element={
        <ProtectedRoute>
          <><ReceiveOrderListPage /><ReceiveOrderAuditPage /></>
        </ProtectedRoute>
      } />
      <Route path="/receive-orders/:id" element={
        <ProtectedRoute>
          <><ReceiveOrderListPage /><ReceiveOrderFormPage /></>
        </ProtectedRoute>
      } />
      <Route path="/transfer-requests" element={<ProtectedRoute><TransferRequestListPage /></ProtectedRoute>} />
      <Route path="/transfer-requests/:id/audit" element={
        <ProtectedRoute>
          <><TransferRequestListPage /><TransferRequestAuditPage /></>
        </ProtectedRoute>
      } />
      <Route path="/transfer-requests/:id" element={
        <ProtectedRoute>
          <><TransferRequestListPage /><TransferRequestFormPage /></>
        </ProtectedRoute>
      } />
      <Route path="/reconciliation" element={<ProtectedRoute><ReconciliationListPage /></ProtectedRoute>} />
      <Route path="/reconciliation/:id/review" element={
        <ProtectedRoute>
          <><ReconciliationListPage /><ReconciliationReviewPage /></>
        </ProtectedRoute>
      } />
      <Route path="/issue-products/:id/audit" element={<ProtectedRoute><IssueProductAuditPage /></ProtectedRoute>} />
      <Route path="/reports/products" element={<ProtectedRoute><ProductReportsPage /></ProtectedRoute>} />
      <Route path="/reports/receive-orders" element={<ProtectedRoute><ReceiveOrderReportsPage /></ProtectedRoute>} />
      <Route path="/reports/transfer-requests" element={<ProtectedRoute><TransferRequestReportsPage /></ProtectedRoute>} />
      <Route path="/reports/issue-products" element={<ProtectedRoute><IssueProductReportsPage /></ProtectedRoute>} />
      <Route path="/reports/temporary-warehouses" element={<ProtectedRoute><TempWarehouseReportsPage /></ProtectedRoute>} />
      <Route path="/reports/reconciliation" element={<ProtectedRoute><ReconciliationReportsPage /></ProtectedRoute>} />
      <Route path="/reports/inventory-summary" element={<ProtectedRoute><InventorySummaryPage /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ReportsHistoryPage /></ProtectedRoute>} />
      <Route path="/products/:id" element={<ProtectedRoute><ProductDetailPage /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute adminOnly><UserManagementPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WarehouseProvider>
          <UIProvider>
            <AppRoutes />
            <GlobalOverlays />
          </UIProvider>
        </WarehouseProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
