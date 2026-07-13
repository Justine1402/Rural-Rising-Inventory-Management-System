import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { exportTablePdf, exportDetailPdf } from '../../utils/exportPdf';
import { formatDate } from '../../utils/formatDate';
import Navbar from '../../components/layout/Navbar';
import ReportsFilterBar from '../../components/shared/ReportsFilterBar';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination, { FillerRows } from '../../components/ui/Pagination';
import { usePagination, REPORTS_PAGE_SIZE } from '../../utils/usePagination';
import { useWarehouse } from '../../context/WarehouseContext';
import ReconciliationReviewPage from '../reconciliation/ReconciliationReviewPage';

export default function ReconciliationReportsPage() {
  const location = useLocation();
  const { warehouses } = useWarehouse();

  const [reconciliations, setReconciliations] = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState(null);
  const [warehouseId, setWarehouseId]         = useState('');
  const [dateFrom, setDateFrom]               = useState('');
  const [dateTo, setDateTo]                   = useState('');
  const [search, setSearch]                   = useState('');
  const [selectedId, setSelectedId]           = useState(null);
  const [selectedIds, setSelectedIds]         = useState(new Set());

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    const params = {};
    if (warehouseId) params.warehouse_id = warehouseId;
    if (dateFrom)    params.date_from    = dateFrom;
    if (dateTo)      params.date_to      = dateTo;
    if (search)      params.search       = search;

    api.get('/reports/reconciliation', { params })
      .then((res) => {
        if (!isCancelled) {
          setReconciliations(res.data.reconciliations);
          setSelectedIds(new Set());
        }
      })
      .catch(() => { if (!isCancelled) setError('Failed to load. Please refresh.'); })
      .finally(() => { if (!isCancelled) setLoading(false); });

    return () => { isCancelled = true; };
  }, [warehouseId, dateFrom, dateTo, search, location.key]);

  const { page, setPage, totalPages, pageItems, fillerCount } = usePagination(reconciliations, {
    pageSize: REPORTS_PAGE_SIZE,
    resetKey: `${warehouseId}-${dateFrom}-${dateTo}-${search}`,
  });

  const pageIds = pageItems.map(r => r.id);
  const allChecked = pageIds.length > 0 && pageIds.every(id => selectedIds.has(id));

  // Header "select all" scopes to the current page; ticks on other pages are preserved.
  const toggleAll = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allChecked) pageIds.forEach(id => next.delete(id));
      else pageIds.forEach(id => next.add(id));
      return next;
    });
  };

  const toggleOne = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exportLabel = selectedIds.size > 0
    ? `Export Selected (${selectedIds.size})`
    : 'Export as PDF';

  const handleExportPdf = async () => {
    if (selectedIds.size === 0) {
      exportTablePdf({
        title: 'Inventory Reconciliation Reports',
        filename: 'reconciliation-reports.pdf',
        orientation: 'landscape',
        columnWidths: [3, 3, 2, 2, 3, 3, 2],
        columns: [
          'Reconciliation Code', 'Warehouse', 'Date Reconciled',
          'Products with Discrepancy', 'Reconciled By', 'Reviewed By', 'Status',
        ],
        rows: reconciliations.map(r => [
          r.transaction_code,
          r.warehouse,
          formatDate(r.date_reconciled),
          r.products_with_discrepancy === 1
            ? '1 Product'
            : `${r.products_with_discrepancy} Products`,
          r.reconciled_by,
          r.reviewed_by ?? '—',
          r.status,
        ]),
      });
      return;
    }
    const selectedRows = reconciliations.filter(r => selectedIds.has(r.id));
    const details = await Promise.all(
      selectedRows.map(r => api.get(`/reconciliations/${r.id}`).then(res => res.data.reconciliation))
    );
    exportDetailPdf({ type: 'rc', records: details });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="p-6">
        <div className="bg-white rounded shadow">
          <ReportsFilterBar
            warehouses={warehouses}
            currentType="reconciliation"
            onTypeChange={() => {}}
            warehouseId={warehouseId}
            onWarehouseChange={setWarehouseId}
            dateFrom={dateFrom}
            onDateFromChange={setDateFrom}
            dateTo={dateTo}
            onDateToChange={setDateTo}
            search={search}
            onSearchChange={setSearch}
            showPdfButton={true}
            onExportPdf={handleExportPdf}
            exportLabel={exportLabel}
          />

          {error && <p className="px-4 py-3 text-red-500 text-sm">{error}</p>}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white" style={{ backgroundColor: '#1A381E' }}>
                  <th className="px-3 py-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleAll}
                      className="cursor-pointer"
                    />
                  </th>
                  <th className="text-left font-semibold px-4 py-3">Reconciliation Code</th>
                  <th className="text-left font-semibold px-4 py-3">Warehouse</th>
                  <th className="text-left font-semibold px-4 py-3">Date Reconciled</th>
                  <th className="text-left font-semibold px-4 py-3">Products with Discrepancy</th>
                  <th className="text-left font-semibold px-4 py-3">Reconciled By</th>
                  <th className="text-left font-semibold px-4 py-3">Reviewed By</th>
                  <th className="text-left font-semibold px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-gray-400">Loading...</td>
                  </tr>
                )}
                {!loading && !error && reconciliations.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-gray-400">No reconciliation records found.</td>
                  </tr>
                )}
                {!loading && !error && pageItems.map((row, idx) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedId(row.id)}
                    className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 cursor-pointer`}
                  >
                    <td className="px-3 py-3 w-10" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleOne(row.id)}
                        className="cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{row.transaction_code}</td>
                    <td className="px-4 py-3 text-gray-800">{row.warehouse}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(row.date_reconciled)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {row.products_with_discrepancy} Product{row.products_with_discrepancy === 1 ? '' : 's'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{row.reconciled_by}</td>
                    <td className="px-4 py-3 text-gray-600">{row.reviewed_by}</td>
                    <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                  </tr>
                ))}
                <FillerRows count={fillerCount} colSpan={8} lines={1} />
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      {selectedId && (
        <ReconciliationReviewPage
          overrideId={selectedId}
          onReturn={() => setSelectedId(null)}
          readOnly={true}
        />
      )}
    </div>
  );
}
