import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/layout/Navbar';
import WarehouseTabs from '../../components/layout/WarehouseTabs';
import StatusBadge from '../../components/ui/StatusBadge';
import { useUI } from '../../context/UIContext';

export default function ReceiveOrderListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { receiveOrderRefreshKey } = useUI();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  useEffect(() => {
    setLoading(true);
    setSelectedRow(null);
    api.get('/receive-orders')
      .then((res) => setOrders(res.data.orders))
      .catch(() => setError('Failed to load receive orders. Please refresh.'))
      .finally(() => setLoading(false));
  }, [location.key, receiveOrderRefreshKey]);

  const handleRowClick = (order) => {
    if (order.status !== 'incomplete') return;
    setSelectedRow((prev) => (prev?.id === order.id ? null : order));
  };

  const statusLabel = (s) => s === 'accomplished' ? 'Accomplished' : 'Incomplete';

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-1 p-5">
        <div className="bg-white rounded-xl shadow overflow-hidden">

          {/* Contextual action bar — only when a row is selected */}
          {selectedRow && (
            <div className="flex items-center justify-between px-5 py-3 bg-green-50 border-b border-green-200">
              <span className="text-sm text-gray-700">
                Selected: <span className="font-mono font-semibold text-gray-900">{selectedRow.code}</span>
              </span>
              <button
                onClick={() => navigate(`/receive-orders/${selectedRow.id}`)}
                className="px-5 py-1.5 text-xs font-bold text-white rounded transition-colors"
                style={{ backgroundColor: '#409645' }}
              >
                ACCOMPLISH ORDER
              </button>
            </div>
          )}

          {/* Table */}
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1A381E] text-white">
                <th className="text-left font-semibold px-5 py-3">Receiving Order #</th>
                <th className="text-left font-semibold px-5 py-3">Warehouse</th>
                <th className="text-left font-semibold px-5 py-3">Date Created</th>
                <th className="text-left font-semibold px-5 py-3">Date Accomplished</th>
                <th className="text-left font-semibold px-5 py-3">Created By</th>
                <th className="text-left font-semibold px-5 py-3">Verified By</th>
                <th className="text-left font-semibold px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="px-5 py-6 text-center text-gray-400">Loading…</td></tr>
              )}
              {error && (
                <tr><td colSpan={7} className="px-5 py-6 text-center text-red-500">{error}</td></tr>
              )}
              {!loading && !error && orders.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-6 text-center text-gray-400">No receive orders yet.</td></tr>
              )}
              {!loading && !error && orders.map((order) => {
                const isSelected = selectedRow?.id === order.id;
                return (
                  <tr
                    key={order.id}
                    onClick={() => handleRowClick(order)}
                    className="border-b border-gray-100 odd:bg-white even:bg-gray-50 transition-colors"
                    style={{
                      backgroundColor: isSelected ? '#f0fdf4' : undefined,
                      borderLeft: isSelected ? '4px solid #409645' : '4px solid transparent',
                      cursor: order.status === 'incomplete' ? 'pointer' : 'default',
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isSelected ? '#f0fdf4' : ''; }}
                  >
                    <td className="px-5 py-3 font-mono text-xs text-gray-700">{order.code}</td>
                    <td className="px-5 py-3 text-gray-600">{order.warehouse}</td>
                    <td className="px-5 py-3 text-gray-600">{order.date_created}</td>
                    <td className="px-5 py-3 text-gray-600">{order.date_accomplished}</td>
                    <td className="px-5 py-3 text-gray-600">{order.created_by}</td>
                    <td className="px-5 py-3 text-gray-600">{order.verified_by}</td>
                    <td className="px-5 py-3"><StatusBadge status={statusLabel(order.status)} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <WarehouseTabs />
        </div>
      </main>
    </div>
  );
}
