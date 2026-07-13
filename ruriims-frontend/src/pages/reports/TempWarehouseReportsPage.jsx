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
import { useUI } from '../../context/UIContext';
import { useWarehouse } from '../../context/WarehouseContext';

export default function TempWarehouseReportsPage() {
  const location = useLocation();
  const { setTemporaryWarehouseDetailOverlayTwhId } = useUI();
  const { warehouses } = useWarehouse();

  const [twhs, setTwhs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [warehouseId, setWarehouseId] = useState('');
  const [dateFrom, setDateFrom]       = useState('');
  const [dateTo, setDateTo]           = useState('');
  const [search, setSearch]           = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get('/temporary-warehouses')
      .then((res) => {
        setTwhs(res.data.temporary_warehouses);
        setSelectedIds(new Set());
      })
      .catch(() => setError('Failed to load temporary warehouses. Please refresh.'))
      .finally(() => setLoading(false));
  }, [location.key]);

  const filtered = twhs
    .filter((r) => !dateFrom || r.event_date >= dateFrom)
    .filter((r) => !dateTo   || r.event_date <= dateTo)
    .filter((r) => !search
      || r.transaction_code?.toLowerCase().includes(search.toLowerCase())
      || r.name?.toLowerCase().includes(search.toLowerCase()));

  const { page, setPage, totalPages, pageItems, fillerCount } = usePagination(filtered, {
    pageSize: REPORTS_PAGE_SIZE,
    resetKey: `${dateFrom}-${dateTo}-${search}`,
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
        title: 'Temporary Warehouse Reports',
        filename: 'temporary-warehouse-reports.pdf',
        orientation: 'landscape',
        columnWidths: [3, 3, 2, 2, 2, 3, 3, 2, 2],
        columns: [
          'Transaction Code', 'Warehouse Name', 'Location', 'Event Date',
          'Date Created', 'Created By', 'Closed By', 'Date Closed', 'Status',
        ],
        rows: filtered.map(t => [
          t.transaction_code,
          t.name,
          t.location,
          formatDate(t.event_date),
          formatDate(t.created_at),
          t.created_by,
          t.closed_by ?? '—',
          formatDate(t.date_closed),
          t.status,
        ]),
      });
      return;
    }
    const selectedRows = filtered.filter(r => selectedIds.has(r.id));
    const details = await Promise.all(
      selectedRows.map(r => api.get(`/temporary-warehouses/${r.id}`).then(res => res.data.temporary_warehouse))
    );
    exportDetailPdf({ type: 'twh', records: details });
  };

  const statusLabel = (s) => s === 'active' ? 'Active' : 'Closed';

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-1 p-5">
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <ReportsFilterBar
            warehouses={warehouses}
            currentType="temporary-warehouses"
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
                <th className="text-left font-semibold px-5 py-3">Transaction Code</th>
                <th className="text-left font-semibold px-5 py-3">Warehouse Name</th>
                <th className="text-left font-semibold px-5 py-3">Location</th>
                <th className="text-left font-semibold px-5 py-3">Event Date</th>
                <th className="text-left font-semibold px-5 py-3">Date Created</th>
                <th className="text-left font-semibold px-5 py-3">Created By</th>
                <th className="text-left font-semibold px-5 py-3">Closed By</th>
                <th className="text-left font-semibold px-5 py-3">Date Closed</th>
                <th className="text-left font-semibold px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={10} className="px-5 py-6 text-center text-gray-400">Loading…</td></tr>
              )}
              {error && (
                <tr><td colSpan={10} className="px-5 py-6 text-center text-red-500">{error}</td></tr>
              )}
              {!loading && !error && filtered.length === 0 && (
                <tr><td colSpan={10} className="px-5 py-6 text-center text-gray-400">No temporary warehouses yet.</td></tr>
              )}
              {!loading && !error && pageItems.map((twh) => (
                <tr
                  key={twh.id}
                  onClick={() => setTemporaryWarehouseDetailOverlayTwhId(twh.id)}
                  className="border-b border-gray-100 odd:bg-white even:bg-gray-50 cursor-pointer transition-colors"
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
                >
                  <td className="px-3 py-3 w-10" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(twh.id)}
                      onChange={() => toggleOne(twh.id)}
                      className="cursor-pointer"
                    />
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-gray-700">{twh.transaction_code}</td>
                  <td className="px-5 py-3 text-gray-800">{twh.name}</td>
                  <td className="px-5 py-3 text-gray-600">{twh.location}</td>
                  <td className="px-5 py-3 text-gray-600">{twh.event_date}</td>
                  <td className="px-5 py-3 text-gray-600">{twh.created_at}</td>
                  <td className="px-5 py-3 text-gray-600">{twh.created_by || '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{twh.closed_by}</td>
                  <td className="px-5 py-3 text-gray-600">{twh.date_closed}</td>
                  <td className="px-5 py-3"><StatusBadge status={statusLabel(twh.status)} /></td>
                </tr>
              ))}
              <FillerRows count={fillerCount} colSpan={10} lines={1} />
            </tbody>
          </table>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </main>
    </div>
  );
}
