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
    refreshProducts, refreshReceiveOrders, refreshTransferRequests,
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
    </>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/receive-orders" element={<ProtectedRoute><ReceiveOrderListPage /></ProtectedRoute>} />
      <Route path="/receive-orders/:id" element={
        <ProtectedRoute>
          <><ReceiveOrderListPage /><ReceiveOrderFormPage /></>
        </ProtectedRoute>
      } />
      <Route path="/transfer-requests" element={<ProtectedRoute><TransferRequestListPage /></ProtectedRoute>} />
      <Route path="/transfer-requests/:id" element={
        <ProtectedRoute>
          <><TransferRequestListPage /><TransferRequestFormPage /></>
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={<ProtectedRoute adminOnly><DashboardPage /></ProtectedRoute>} />
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
