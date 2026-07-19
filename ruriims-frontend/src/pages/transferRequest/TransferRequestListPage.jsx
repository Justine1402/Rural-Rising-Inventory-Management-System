import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/layout/Navbar';
import WarehouseTabs from '../../components/layout/WarehouseTabs';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination, { FillerRows } from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import { useUI } from '../../context/UIContext';
import { useWarehouse } from '../../context/WarehouseContext';
import { usePagination, LIST_PAGE_SIZE } from '../../utils/usePagination';

export default function TransferRequestListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { transferRequestRefreshKey } = useUI();
  const { activeWarehouse } = useWarehouse();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  useEffect(() => {
    setLoading(true);
    setSelectedRow(null);
    const params = new URLSearchParams();
    if (activeWarehouse) params.set('warehouse_id', activeWarehouse.id);
    const url = `/transfer-requests${params.toString() ? '?' + params.toString() : ''}`;
    api.get(url)
      .then((res) => setTransfers(res.data.transfers))
      .catch(() => setError('Failed to load transfer requests. Please refresh.'))
      .finally(() => setLoading(false));
  }, [location.key, transferRequestRefreshKey, activeWarehouse]);

  useEffect(() => {
    setSelectedRow(null);
  }, [activeWarehouse]);

  const handleRowClick = (transfer) => {
    if (transfer.status === 'complete') {
      navigate(`/transfer-requests/${transfer.id}/audit`);
      return;
    }
    setSelectedRow((prev) => (prev?.id === transfer.id ? null : transfer));
  };

  const statusLabel = (s) => s === 'complete' ? 'Complete' : 'Incomplete';

  const { page, setPage, totalPages, pageItems, fillerCount } = usePagination(transfers, {
    pageSize: LIST_PAGE_SIZE,
    resetKey: `${activeWarehouse?.id ?? 'all'}`,
  });

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
              <tr className="text-white" style={{ backgroundColor: '#1A381E' }}>
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
                <EmptyState colSpan={8} message="No transfer requests yet." />
              )}
              {!loading && !error && pageItems.map((transfer) => {
                const isSelected = selectedRow?.id === transfer.id;
                return (
                  <tr
                    key={transfer.id}
                    onClick={() => handleRowClick(transfer)}
                    className="border-b border-gray-100 odd:bg-white even:bg-gray-50 transition-colors"
                    style={{
                      backgroundColor: isSelected ? '#f0fdf4' : undefined,
                      borderLeft: isSelected ? '4px solid #409645' : '4px solid transparent',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isSelected ? '#f0fdf4' : ''; }}
                  >
                    <td className="px-5 py-3 font-mono text-xs text-gray-700">{transfer.code}</td>
                    <td className="px-5 py-3 text-gray-600">{transfer.source_warehouse}</td>
                    <td className="px-5 py-3 text-gray-600">{transfer.destination_warehouse}</td>
                    <td className="px-5 py-3 text-gray-600">{transfer.date_requested}</td>
                    <td className="px-5 py-3 text-gray-600">{transfer.date_accomplished}</td>
                    <td className="px-5 py-3 text-gray-600">{transfer.requested_by || '—'}</td>
                    <td className="px-5 py-3 text-gray-600">{transfer.verified_by}</td>
                    <td className="px-5 py-3"><StatusBadge status={statusLabel(transfer.status)} /></td>
                  </tr>
                );
              })}
              <FillerRows count={fillerCount} colSpan={8} lines={1} />
            </tbody>
          </table>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

          <WarehouseTabs />
        </div>
      </main>
    </div>
  );
}
