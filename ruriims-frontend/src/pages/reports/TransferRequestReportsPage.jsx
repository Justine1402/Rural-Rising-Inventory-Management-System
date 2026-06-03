import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { exportTablePdf } from '../../utils/exportPdf';
import { formatDate } from '../../utils/formatDate';
import Navbar from '../../components/layout/Navbar';
import ReportsFilterBar from '../../components/shared/ReportsFilterBar';
import StatusBadge from '../../components/ui/StatusBadge';
import { useWarehouse } from '../../context/WarehouseContext';
import TransferRequestAuditPage from '../transferRequest/TransferRequestAuditPage';

export default function TransferRequestReportsPage() {
  const location = useLocation();
  const { warehouses } = useWarehouse();

  const [transfers, setTransfers]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [warehouseId, setWarehouseId] = useState('');
  const [dateFrom, setDateFrom]       = useState('');
  const [dateTo, setDateTo]           = useState('');
  const [search, setSearch]           = useState('');
  const [selectedId, setSelectedId]   = useState(null);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    const params = {};
    if (warehouseId) params.warehouse_id = warehouseId;
    if (dateFrom)    params.date_from    = dateFrom;
    if (dateTo)      params.date_to      = dateTo;
    if (search)      params.search       = search;

    api.get('/reports/transfer-requests', { params })
      .then((res) => { if (!isCancelled) setTransfers(res.data.transfers); })
      .catch(() => { if (!isCancelled) setError('Failed to load. Please refresh.'); })
      .finally(() => { if (!isCancelled) setLoading(false); });

    return () => { isCancelled = true; };
  }, [warehouseId, dateFrom, dateTo, search, location.key]);

  const handleExportPdf = () => {
    exportTablePdf({
      title: 'Transfer Request Reports',
      filename: 'transfer-request-reports.pdf',
      orientation: 'landscape',
      columns: [
        'Transaction Code', 'Source Warehouse', 'Destination Warehouse',
        'Total Products', 'Date Requested', 'Date Accomplished',
        'Requested By', 'Verified By', 'Status',
      ],
      rows: transfers.map(r => [
        r.transaction_code,
        r.source_warehouse,
        r.destination_warehouse,
        r.total_products,
        formatDate(r.date_requested),
        formatDate(r.date_accomplished),
        r.requested_by,
        r.verified_by,
        r.status,
      ]),
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="p-6">
        <div className="bg-white rounded shadow">
          <ReportsFilterBar
            warehouses={warehouses}
            currentType="transfer-requests"
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
          />

          {error && <p className="px-4 py-3 text-red-500 text-sm">{error}</p>}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white" style={{ backgroundColor: '#1A381E' }}>
                  <th className="text-left font-semibold px-4 py-3">Transaction Code</th>
                  <th className="text-left font-semibold px-4 py-3">Source Warehouse</th>
                  <th className="text-left font-semibold px-4 py-3">Destination Warehouse</th>
                  <th className="text-left font-semibold px-4 py-3">Total Products</th>
                  <th className="text-left font-semibold px-4 py-3">Date Requested</th>
                  <th className="text-left font-semibold px-4 py-3">Date Accomplished</th>
                  <th className="text-left font-semibold px-4 py-3">Requested By</th>
                  <th className="text-left font-semibold px-4 py-3">Verified By</th>
                  <th className="text-left font-semibold px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center text-gray-400">Loading...</td>
                  </tr>
                )}
                {!loading && !error && transfers.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center text-gray-400">No transfer requests found.</td>
                  </tr>
                )}
                {!loading && !error && transfers.map((row, idx) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedId(row.id)}
                    className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 cursor-pointer`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{row.transaction_code}</td>
                    <td className="px-4 py-3 text-gray-800">{row.source_warehouse}</td>
                    <td className="px-4 py-3 text-gray-600">{row.destination_warehouse}</td>
                    <td className="px-4 py-3 text-gray-600">{row.total_products}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(row.date_requested)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(row.date_accomplished)}</td>
                    <td className="px-4 py-3 text-gray-600">{row.requested_by}</td>
                    <td className="px-4 py-3 text-gray-600">{row.verified_by}</td>
                    <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedId && (
        <TransferRequestAuditPage
          overrideId={selectedId}
          onReturn={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
