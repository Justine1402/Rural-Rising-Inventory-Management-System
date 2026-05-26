import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
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

export default function ReportsHistoryPage() {
  const location = useLocation();
  const { warehouses } = useWarehouse();

  const [reports, setReports]         = useState([]);
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

    api.get('/reports', { params })
      .then((res) => {
        if (!isCancelled) setReports(res.data.reports);
      })
      .catch(() => {
        if (!isCancelled) setError('Failed to load reports. Please refresh.');
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

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
            currentType="all"
            onTypeChange={() => {}}
            warehouseId={warehouseId}
            onWarehouseChange={setWarehouseId}
            dateFrom={dateFrom}
            onDateFromChange={setDateFrom}
            dateTo={dateTo}
            onDateToChange={setDateTo}
            search={search}
            onSearchChange={setSearch}
            showPdfButton={false}
          />

          {error && <p className="px-4 py-3 text-red-500 text-sm">{error}</p>}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white" style={{ backgroundColor: '#1A381E' }}>
                  <th className="text-left font-semibold px-4 py-3">Transaction Code</th>
                  <th className="text-left font-semibold px-4 py-3">Transaction Type</th>
                  <th className="text-left font-semibold px-4 py-3">Warehouse</th>
                  <th className="text-left font-semibold px-4 py-3">Date Accomplished</th>
                  <th className="text-left font-semibold px-4 py-3">Accomplished By</th>
                  <th className="text-left font-semibold px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-400">Loading...</td>
                  </tr>
                )}
                {!loading && !error && reports.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-400">No reports found.</td>
                  </tr>
                )}
                {!loading && !error && reports.map((r, idx) => (
                  <tr
                    key={`${r.transaction_type}-${r.transaction_code}-${idx}`}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{r.transaction_code}</td>
                    <td className="px-4 py-3 text-gray-800">{r.transaction_type}</td>
                    <td className="px-4 py-3 text-gray-600">{r.warehouse}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(r.date_accomplished)}</td>
                    <td className="px-4 py-3 text-gray-600">{r.accomplished_by}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
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
