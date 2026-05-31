import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { exportTablePdf } from '../../utils/exportPdf';
import { formatDate } from '../../utils/formatDate';
import Navbar from '../../components/layout/Navbar';
import WarehouseTabs from '../../components/layout/WarehouseTabs';
import ReportsFilterBar from '../../components/shared/ReportsFilterBar';
import StatusBadge from '../../components/ui/StatusBadge';
import { useWarehouse } from '../../context/WarehouseContext';

export default function ReceiveOrderReportsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { warehouses } = useWarehouse();

  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [warehouseId, setWarehouseId] = useState('');
  const [dateFrom, setDateFrom]       = useState('');
  const [dateTo, setDateTo]           = useState('');
  const [search, setSearch]           = useState('');

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    const params = {};
    if (warehouseId) params.warehouse_id = warehouseId;
    if (dateFrom)    params.date_from    = dateFrom;
    if (dateTo)      params.date_to      = dateTo;
    if (search)      params.search       = search;

    api.get('/reports/receive-orders', { params })
      .then((res) => { if (!isCancelled) setOrders(res.data.orders); })
      .catch(() => { if (!isCancelled) setError('Failed to load. Please refresh.'); })
      .finally(() => { if (!isCancelled) setLoading(false); });

    return () => { isCancelled = true; };
  }, [warehouseId, dateFrom, dateTo, search, location.key]);

  const handleExportPdf = () => {
    exportTablePdf({
      title: 'Receive Order Reports',
      filename: 'receive-order-reports.pdf',
      orientation: 'landscape',
      columns: [
        'Transaction Code', 'Supplier Name', 'Warehouse', 'Total Products',
        'Total Cost', 'Date Ordered', 'Date Accomplished', 'Created By',
        'Verified By', 'Status',
      ],
      rows: orders.map(r => [
        r.transaction_code,
        r.supplier_name,
        r.warehouse,
        r.total_products,
        '₱' + Number(r.total_cost).toLocaleString('en-PH', { minimumFractionDigits: 2 }),
        r.date_ordered       ? new Date(r.date_ordered       + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—',
        r.date_accomplished  ? new Date(r.date_accomplished  + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—',
        r.created_by,
        r.verified_by,
        r.status,
      ]),
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <WarehouseTabs />

      <div className="p-6">
        <div className="bg-white rounded shadow">
          <ReportsFilterBar
            warehouses={warehouses}
            currentType="receive-orders"
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
                  <th className="text-left font-semibold px-4 py-3">Supplier Name</th>
                  <th className="text-left font-semibold px-4 py-3">Warehouse</th>
                  <th className="text-left font-semibold px-4 py-3">Total Products</th>
                  <th className="text-left font-semibold px-4 py-3">Total Cost</th>
                  <th className="text-left font-semibold px-4 py-3">Date Ordered</th>
                  <th className="text-left font-semibold px-4 py-3">Date Accomplished</th>
                  <th className="text-left font-semibold px-4 py-3">Created By</th>
                  <th className="text-left font-semibold px-4 py-3">Verified By</th>
                  <th className="text-left font-semibold px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={10} className="px-4 py-6 text-center text-gray-400">Loading...</td>
                  </tr>
                )}
                {!loading && !error && orders.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-6 text-center text-gray-400">No receive orders found.</td>
                  </tr>
                )}
                {!loading && !error && orders.map((row, idx) => (
                  <tr
                    key={row.id}
                    onClick={() => navigate(`/receive-orders/${row.id}/audit`)}
                    className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 cursor-pointer`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{row.transaction_code}</td>
                    <td className="px-4 py-3 text-gray-800">{row.supplier_name}</td>
                    <td className="px-4 py-3 text-gray-600">{row.warehouse}</td>
                    <td className="px-4 py-3 text-gray-600">{row.total_products}</td>
                    <td className="px-4 py-3 text-gray-600">
                      ₱{Number(row.total_cost).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(row.date_ordered)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(row.date_accomplished)}</td>
                    <td className="px-4 py-3 text-gray-600">{row.created_by}</td>
                    <td className="px-4 py-3 text-gray-600">{row.verified_by}</td>
                    <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
