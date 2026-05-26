import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/layout/Navbar';
import WarehouseTabs from '../../components/layout/WarehouseTabs';
import ReportsFilterBar from '../../components/shared/ReportsFilterBar';
import StatusBadge from '../../components/ui/StatusBadge';
import { useWarehouse } from '../../context/WarehouseContext';

const fmtDate = (d) => {
  if (!d || d === '—') return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

export default function IssueProductReportsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { warehouses } = useWarehouse();

  const [issues, setIssues]           = useState([]);
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

    api.get('/reports/issue-products', { params })
      .then((res) => { if (!isCancelled) setIssues(res.data.issues); })
      .catch(() => { if (!isCancelled) setError('Failed to load. Please refresh.'); })
      .finally(() => { if (!isCancelled) setLoading(false); });

    return () => { isCancelled = true; };
  }, [warehouseId, dateFrom, dateTo, search, location.key]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <WarehouseTabs />

      <div className="p-6">
        <div className="bg-white rounded shadow">
          <ReportsFilterBar
            warehouses={warehouses}
            currentType="issue-products"
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
            onExportPdf={() => console.log('PDF export — Stage 5')}
          />

          {error && <p className="px-4 py-3 text-red-500 text-sm">{error}</p>}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white" style={{ backgroundColor: '#1A381E' }}>
                  <th className="text-left font-semibold px-4 py-3">Transaction Code</th>
                  <th className="text-left font-semibold px-4 py-3">Issue Type</th>
                  <th className="text-left font-semibold px-4 py-3">Total Products</th>
                  <th className="text-left font-semibold px-4 py-3">Date Issued</th>
                  <th className="text-left font-semibold px-4 py-3">Issued By</th>
                  <th className="text-left font-semibold px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-400">Loading...</td>
                  </tr>
                )}
                {!loading && !error && issues.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-400">No issue product records found.</td>
                  </tr>
                )}
                {!loading && !error && issues.map((row, idx) => (
                  <tr
                    key={row.id}
                    onClick={() => navigate(`/issue-products/${row.id}/audit`)}
                    className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 cursor-pointer`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{row.transaction_code}</td>
                    <td className="px-4 py-3 text-gray-800">{row.issue_type}</td>
                    <td className="px-4 py-3 text-gray-600">{row.total_quantity_summary}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(row.date_issued)}</td>
                    <td className="px-4 py-3 text-gray-600">{row.issued_by}</td>
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
