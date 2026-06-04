import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/layout/Navbar';
import WarehouseTabs from '../../components/layout/WarehouseTabs';
import StatusBadge from '../../components/ui/StatusBadge';
import { useUI } from '../../context/UIContext';
import { useWarehouse } from '../../context/WarehouseContext';

const ChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export default function ReconciliationListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { reconciliationRefreshKey, setReconciliationFormOpen } = useUI();
  const { activeWarehouse } = useWarehouse();
  const [reconciliations, setReconciliations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    setSelectedId(null);
    const params = new URLSearchParams();
    if (activeWarehouse) params.set('warehouse_id', activeWarehouse.id);
    if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
    const url = `/reconciliations${params.toString() ? '?' + params.toString() : ''}`;
    api.get(url)
      .then((res) => setReconciliations(res.data.reconciliations))
      .catch(() => setError('Failed to load reconciliations. Please refresh.'))
      .finally(() => setLoading(false));
  }, [location.key, reconciliationRefreshKey, activeWarehouse, statusFilter]);

  useEffect(() => {
    setSelectedId(null);
  }, [activeWarehouse]);

  const handleRowClick = (rec) => {
    if (rec.status === 'pending_review') {
      setSelectedId((prev) => (prev === rec.id ? null : rec.id));
    } else {
      navigate(`/reconciliation/${rec.id}/review`);
    }
  };

  const pluralizeProducts = (count) =>
    `${count} ${count === 1 ? 'Product' : 'Products'}`;

  const hasSelection = selectedId !== null;

  const statusLabels = { all: 'All Status', pending_review: 'Pending Review', reviewed: 'Reviewed' };
  const filteredReconciliations = statusFilter === 'all'
    ? reconciliations
    : reconciliations.filter((r) => r.status === statusFilter);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-1 p-5">
        <div className="bg-white rounded-xl shadow overflow-hidden">

          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <div>
              {hasSelection && (
                <span className="text-sm text-gray-700">
                  Selected: <span className="font-bold">{reconciliations.find((r) => r.id === selectedId)?.transaction_code}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setStatusDropdownOpen((o) => !o)}
                  className="flex items-center gap-1 border border-gray-300 text-gray-600 text-xs px-3 py-1.5 rounded"
                >
                  {statusLabels[statusFilter]} <ChevronDown />
                </button>
                {statusDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setStatusDropdownOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-md z-20 min-w-[150px]">
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <button
                          key={value}
                          onClick={() => { setStatusFilter(value); setStatusDropdownOpen(false); setSelectedId(null); }}
                          className={`block w-full text-left px-4 py-2 text-xs hover:bg-gray-50 ${statusFilter === value ? 'font-semibold text-gray-900' : 'text-gray-600'}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={hasSelection
                  ? () => navigate(`/reconciliation/${selectedId}/review`)
                  : () => {
                      if (activeWarehouse?.isTemporary) {
                        alert('Reconciliation is not available for temporary warehouses.');
                        return;
                      }
                      setReconciliationFormOpen(true);
                    }}
                className="btn-brand text-white text-xs font-bold px-4 py-1.5 rounded transition-colors"
              >
                {hasSelection ? '+ Review & Confirm' : '+ New Reconciliation'}
              </button>
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white" style={{ backgroundColor: '#1A381E' }}>
                <th className="text-left font-semibold px-5 py-3">Reconciliation Code</th>
                <th className="text-left font-semibold px-5 py-3">Warehouse</th>
                <th className="text-left font-semibold px-5 py-3">Date Reconciled</th>
                <th className="text-left font-semibold px-5 py-3">Products with Discrepancy</th>
                <th className="text-left font-semibold px-5 py-3">Reconciled By</th>
                <th className="text-left font-semibold px-5 py-3">Reviewed By</th>
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
              {!loading && !error && filteredReconciliations.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-6 text-center text-gray-400">No reconciliations yet.</td></tr>
              )}
              {!loading && !error && filteredReconciliations.map((rec) => {
                const selected = selectedId === rec.id;
                return (
                  <tr
                    key={rec.id}
                    onClick={() => handleRowClick(rec)}
                    className="border-b border-gray-100 odd:bg-white even:bg-gray-50 transition-colors"
                    style={{
                      backgroundColor: selected ? '#f0fdf4' : undefined,
                      borderLeft: selected ? '4px solid #409645' : '4px solid transparent',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { if (!selected) e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = selected ? '#f0fdf4' : ''; }}
                  >
                    <td className="px-5 py-3 font-mono text-xs text-gray-700">{rec.transaction_code}</td>
                    <td className="px-5 py-3 text-gray-600">{rec.warehouse}</td>
                    <td className="px-5 py-3 text-gray-600">{rec.date_reconciled}</td>
                    <td className="px-5 py-3 text-gray-600">{pluralizeProducts(rec.products_with_discrepancy)}</td>
                    <td className="px-5 py-3 text-gray-600">{rec.reconciled_by || '—'}</td>
                    <td className="px-5 py-3 text-gray-600">{rec.reviewed_by !== '—' ? rec.reviewed_by : ''}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={rec.status === 'pending_review' ? 'Pending Review' : 'Reviewed'} />
                    </td>
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
