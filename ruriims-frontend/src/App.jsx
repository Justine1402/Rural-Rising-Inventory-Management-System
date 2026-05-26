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
      <Route path="/reconciliation/:id/review" element={<ProtectedRoute><ReconciliationReviewPage /></ProtectedRoute>} />
      <Route path="/reports/products" element={<ProtectedRoute><div className="p-8 text-gray-500">Product Reports — coming in Stage 3</div></ProtectedRoute>} />
      <Route path="/reports/receive-orders" element={<ProtectedRoute><div className="p-8 text-gray-500">Receive Order Reports — coming in Stage 3</div></ProtectedRoute>} />
      <Route path="/reports/transfer-requests" element={<ProtectedRoute><div className="p-8 text-gray-500">Transfer Request Reports — coming in Stage 3</div></ProtectedRoute>} />
      <Route path="/reports/issue-products" element={<ProtectedRoute><div className="p-8 text-gray-500">Issue Product Reports — coming in Stage 4</div></ProtectedRoute>} />
      <Route path="/reports/temporary-warehouses" element={<ProtectedRoute><TempWarehouseReportsPage /></ProtectedRoute>} />
      <Route path="/reports/reconciliation" element={<ProtectedRoute><div className="p-8 text-gray-500">Reconciliation Reports — coming in Stage 4</div></ProtectedRoute>} />
      <Route path="/reports/inventory-summary" element={<ProtectedRoute><div className="p-8 text-gray-500">Inventory Summary — coming in Step 15</div></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ReportsHistoryPage /></ProtectedRoute>} />
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
