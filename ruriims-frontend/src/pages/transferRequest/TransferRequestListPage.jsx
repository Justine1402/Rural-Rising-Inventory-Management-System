import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/layout/Navbar';
import WarehouseTabs from '../../components/layout/WarehouseTabs';
import StatusBadge from '../../components/ui/StatusBadge';
import { useUI } from '../../context/UIContext';

export default function TransferRequestListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { transferRequestRefreshKey } = useUI();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  useEffect(() => {
    setLoading(true);
    setSelectedRow(null);
    api.get('/transfer-requests')
      .then((res) => setTransfers(res.data.transfers))
      .catch(() => setError('Failed to load transfer requests. Please refresh.'))
      .finally(() => setLoading(false));
  }, [location.key, transferRequestRefreshKey]);

  const handleRowClick = (transfer) => {
    if (transfer.status !== 'incomplete') return;
    setSelectedRow((prev) => (prev?.id === transfer.id ? null : transfer));
  };

  const statusLabel = (s) => s === 'complete' ? 'Complete' : 'Incomplete';

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
                onClick={() => navigate(`/transfer-requests/${selectedRow.id}`)}
                className="px-5 py-1.5 text-xs font-bold text-white rounded transition-colors"
                style={{ backgroundColor: '#409645' }}
              >
                ACCOMPLISH TRANSFER
              </button>
            </div>
          )}

          {/* Table */}
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1A381E] text-white">
                <th className="text-left font-semibold px-5 py-3">Transfer Request Code</th>
                <th className="text-left font-semibold px-5 py-3">Source Warehouse</th>
                <th className="text-left font-semibold px-5 py-3">Destination Warehouse</th>
                <th className="text-left font-semibold px-5 py-3">Date Requested</th>
                <th className="text-left font-semibold px-5 py-3">Date Accomplished</th>
                <th className="text-left font-semibold px-5 py-3">Requested By</th>
                <th className="text-left font-semibold px-5 py-3">Verified By</th>
                <th className="text-left font-semibold px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="px-5 py-6 text-center text-gray-400">Loading…</td></tr>
              )}
              {error && (
                <tr><td colSpan={8} className="px-5 py-6 text-center text-red-500">{error}</td></tr>
              )}
              {!loading && !error && transfers.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-6 text-center text-gray-400">No transfer requests yet.</td></tr>
              )}
              {!loading && !error && transfers.map((transfer) => {
                const isSelected = selectedRow?.id === transfer.id;
                return (
                  <tr
                    key={transfer.id}
                    onClick={() => handleRowClick(transfer)}
                    className="border-b border-gray-100 transition-colors"
                    style={{
                      backgroundColor: isSelected ? '#f0fdf4' : undefined,
                      borderLeft: isSelected ? '4px solid #409645' : '4px solid transparent',
                      cursor: transfer.status === 'incomplete' ? 'pointer' : 'default',
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isSelected ? '#f0fdf4' : ''; }}
                  >
                    <td className="px-5 py-3 font-mono text-xs text-gray-700">{transfer.code}</td>
                    <td className="px-5 py-3 text-gray-600">{transfer.source_warehouse}</td>
                    <td className="px-5 py-3 text-gray-600">{transfer.destination_warehouse}</td>
                    <td className="px-5 py-3 text-gray-600">{transfer.date_requested}</td>
                    <td className="px-5 py-3 text-gray-600">{transfer.date_accomplished}</td>
                    <td className="px-5 py-3 text-gray-600">{transfer.requested_by}</td>
                    <td className="px-5 py-3 text-gray-600">{transfer.verified_by}</td>
                    <td className="px-5 py-3"><StatusBadge status={statusLabel(transfer.status)} /></td>
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
