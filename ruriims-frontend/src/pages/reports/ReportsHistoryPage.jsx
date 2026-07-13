import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/layout/Navbar';
import ReportsFilterBar from '../../components/shared/ReportsFilterBar';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination, { FillerRows } from '../../components/ui/Pagination';
import { useWarehouse } from '../../context/WarehouseContext';
import { useUI } from '../../context/UIContext';
import { formatDate } from '../../utils/formatDate';
import { usePagination, REPORTS_PAGE_SIZE } from '../../utils/usePagination';
import ReceiveOrderAuditPage from '../receiveOrder/ReceiveOrderAuditPage';
import TransferRequestAuditPage from '../transferRequest/TransferRequestAuditPage';
import IssueProductAuditPage from '../issueProduct/IssueProductAuditPage';
import ReconciliationReviewPage from '../reconciliation/ReconciliationReviewPage';

function ProductDetailInline({ productId }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);
    setProduct(null);
    api.get(`/products/${productId}`)
      .then((res) => { if (!isCancelled) setProduct(res.data.product); })
      .catch(() => { if (!isCancelled) setError('Failed to load product details.'); })
      .finally(() => { if (!isCancelled) setLoading(false); });
    return () => { isCancelled = true; };
  }, [productId]);

  if (loading) return <p className="px-6 py-8 text-center text-gray-400 text-sm">Loading…</p>;
  if (error)   return <p className="px-6 py-8 text-center text-red-500 text-sm">{error}</p>;
  if (!product) return null;

  const fields = [
    { label: 'Product Name', value: product.name },
    { label: 'Unit',         value: product.unit },
    { label: 'Category',     value: product.category },
    { label: 'Shelf Life',   value: `${product.shelf_life} days` },
  ];

  return (
    <div className="px-6 py-6 grid grid-cols-2 gap-x-12 gap-y-5">
      {fields.map(({ label, value }) => (
        <div key={label}>
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className="text-sm font-semibold text-gray-800">{value}</p>
        </div>
      ))}
    </div>
  );
}

export default function ReportsHistoryPage() {
  const location = useLocation();
  const { warehouses } = useWarehouse();
  const { setTemporaryWarehouseDetailOverlayTwhId } = useUI();

  const [reports, setReports]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [warehouseId, setWarehouseId] = useState('');
  const [dateFrom, setDateFrom]       = useState('');
  const [dateTo, setDateTo]           = useState('');
  const [search, setSearch]           = useState('');
  const [selectedId, setSelectedId]         = useState(null);
  const [selectedType, setSelectedType]     = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);

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

  const { page, setPage, totalPages, pageItems, fillerCount } = usePagination(reports, {
    pageSize: REPORTS_PAGE_SIZE,
    resetKey: `${warehouseId}-${dateFrom}-${dateTo}-${search}`,
  });

  const handleRowClick = (r) => {
    if (r.transaction_type === 'Temporary Warehouse') {
      setTemporaryWarehouseDetailOverlayTwhId(r.id);
    } else if (r.transaction_type === 'Create Product') {
      setSelectedProductId(r.id);
    } else {
      setSelectedId(r.id);
      setSelectedType(r.transaction_type);
    }
  };

  const closeOverlay        = () => { setSelectedId(null); setSelectedType(null); };
  const closeProductOverlay = () => setSelectedProductId(null);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

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
                {!loading && !error && pageItems.map((r, idx) => (
                  <tr
                    key={`${r.transaction_type}-${r.transaction_code}-${idx}`}
                    onClick={() => handleRowClick(r)}
                    className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 cursor-pointer`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{r.transaction_code}</td>
                    <td className="px-4 py-3 text-gray-800">{r.transaction_type}</td>
                    <td className="px-4 py-3 text-gray-600">{r.warehouse}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(r.date_accomplished)}</td>
                    <td className="px-4 py-3 text-gray-600">{r.accomplished_by}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
                <FillerRows count={fillerCount} colSpan={6} lines={1} />
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      {selectedId && selectedType === 'Receive Order' && (
        <ReceiveOrderAuditPage overrideId={selectedId} onReturn={closeOverlay} />
      )}
      {selectedId && selectedType === 'Transfer Request' && (
        <TransferRequestAuditPage overrideId={selectedId} onReturn={closeOverlay} />
      )}
      {selectedId && selectedType === 'Issue Product' && (
        <IssueProductAuditPage overrideId={selectedId} onReturn={closeOverlay} />
      )}
      {selectedId && selectedType === 'Inventory Reconciliation' && (
        <ReconciliationReviewPage overrideId={selectedId} onReturn={closeOverlay} readOnly={true} />
      )}

      {selectedProductId && (
        <>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={closeProductOverlay}
          />
          <div className="fixed top-[105px] left-1/2 -translate-x-1/2 w-[700px] max-h-[calc(100vh-130px)] overflow-y-auto bg-white rounded-lg shadow-xl z-50">
            <div
              className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
              style={{ backgroundColor: '#1A381E' }}
            >
              <button
                onClick={closeProductOverlay}
                className="text-white text-sm font-medium hover:underline"
              >
                ← RETURN
              </button>
              <span className="text-white font-semibold text-sm">
                {reports.find(r => r.id === selectedProductId)?.transaction_code}
              </span>
            </div>
            <ProductDetailInline productId={selectedProductId} />
          </div>
        </>
      )}
    </div>
  );
}
