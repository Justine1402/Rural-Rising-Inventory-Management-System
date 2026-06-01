import { useEffect, useState } from 'react';
import api from '../../api/axios';
import PinVerificationModal from '../../components/shared/PinVerificationModal';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { useWarehouse } from '../../context/WarehouseContext';
import { formatDate } from '../../utils/formatDate';

const readonlyClass =
  'w-full bg-gray-100 border border-transparent rounded-lg px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed';
const todayISO = new Date().toISOString().split('T')[0];

export default function CloseTemporaryWarehousePage() {
  const { user } = useAuth();
  const { warehouses, refreshWarehouses } = useWarehouse();
  const { closeTemporaryWarehouseOverlayTwhId, setCloseTemporaryWarehouseOverlayTwhId } = useUI();

  const id = closeTemporaryWarehouseOverlayTwhId;

  const [twh, setTwh] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [error, setError] = useState(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const permanentWarehouses = warehouses.filter((w) => !w.isTemporary);

  useEffect(() => {
    if (id === null) {
      setTwh(null);
      setRows([]);
      setFetchError(null);
      setError(null);
      setSuccessMessage(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setFetchError(null);
    setError(null);
    setSuccessMessage(null);
    api.get(`/temporary-warehouses/${id}`)
      .then(async (res) => {
        const t = res.data.temporary_warehouse;
        setTwh(t);

        if (t.status === 'closed') {
          setLoading(false);
          return;
        }

        const skus = [...new Set(t.products_transferred_in.map((p) => p.product_code))];

        if (skus.length === 0) {
          setRows([]);
          setLoading(false);
          return;
        }

        const batchResults = await Promise.all(
          skus.map((sku) =>
            api
              .get('/stock-in-use', { params: { sku_code: sku, warehouse_id: t.warehouse_id } })
              .then((r) => ({ sku, batches: r.data.batches }))
              .catch(() => ({ sku, batches: [] }))
          )
        );

        const productMap = {};
        t.products_transferred_in.forEach((p) => {
          productMap[p.product_code] = { productName: p.product_name, unit: p.unit };
        });

        const allRows = [];
        for (const { sku, batches } of batchResults) {
          const info = productMap[sku] ?? { productName: sku, unit: '' };
          for (const batch of batches) {
            allRows.push({
              batchId: batch.id,
              batchCode: batch.code,
              productCode: sku,
              productName: info.productName,
              unit: info.unit,
              quantity: batch.quantity,
              destinationWarehouseId: '',
            });
          }
        }
        setRows(allRows);
      })
      .catch(() => setFetchError('Failed to load temporary warehouse details.'))
      .finally(() => setLoading(false));
  }, [id]);

  const setRowDestination = (idx, warehouseId) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, destinationWarehouseId: warehouseId } : r)));
  };

  const allRowsHaveDestination =
    rows.length === 0 || rows.every((r) => r.destinationWarehouseId !== '');

  const handleClose = () => setCloseTemporaryWarehouseOverlayTwhId(null);

  const handleSubmit = () => {
    setError(null);
    if (!allRowsHaveDestination) {
      setError('Please select a Return To warehouse for every product row.');
      return;
    }
    setPinOpen(true);
  };

  const handleVerify = async (pin) => {
    setPinOpen(false);
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post(`/temporary-warehouses/${id}/close`, {
        date_closed: todayISO,
        pin,
        returns: rows.map((r) => ({
          stock_in_use_id: r.batchId,
          destination_warehouse_id: parseInt(r.destinationWarehouseId, 10),
          quantity_returned: r.quantity,
        })),
      });
      setSuccessMessage(res.data.message);
      refreshWarehouses();
      setTimeout(() => setCloseTemporaryWarehouseOverlayTwhId(null), 1500);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (id === null) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />

      {/* Card */}
      <div className="fixed top-[105px] left-1/2 -translate-x-1/2 w-[1040px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 flex-shrink-0 border-b border-gray-100">
          <button
            onClick={handleClose}
            className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg"
            style={{ backgroundColor: '#409645' }}
          >
            RETURN
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Close Temporary Warehouse</h1>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-8 py-6">

          {loading && (
            <p className="text-gray-500 text-sm text-center py-8">Loading…</p>
          )}

          {!loading && fetchError && (
            <p className="text-red-500 text-sm text-center py-8">{fetchError}</p>
          )}

          {!loading && !fetchError && twh?.status === 'closed' && (
            <p className="text-gray-600 text-sm text-center py-8">This temporary warehouse is already closed.</p>
          )}

          {!loading && !fetchError && twh && twh.status !== 'closed' && (
            <>
              {/* Pre-filled read-only fields */}
              <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-6">
                <div>
                  <label className="block text-sm text-gray-500 mb-1.5">Warehouse Name</label>
                  <div className={readonlyClass}>{twh.name}</div>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1.5">Event Date</label>
                  <div className={readonlyClass}>{formatDate(twh.event_date)}</div>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1.5">Created By</label>
                  <div className={readonlyClass}>{twh.created_by}</div>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1.5">Location</label>
                  <div className={readonlyClass}>{twh.location}</div>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1.5">Closed By</label>
                  <div className={readonlyClass}>{successMessage ? (user?.name ?? ' ') : ' '}</div>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1.5">Date Closed</label>
                  <div className={readonlyClass}>{successMessage ? formatDate(todayISO) : ' '}</div>
                </div>
              </div>

              {/* Products to Return table */}
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Products to Return</h2>
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-white" style={{ backgroundColor: '#1A381E' }}>
                        <th className="text-left font-semibold px-4 py-2.5">Product SKU</th>
                        <th className="text-left font-semibold px-4 py-2.5">Product Name</th>
                        <th className="text-left font-semibold px-4 py-2.5">Stock-In-Use Code</th>
                        <th className="text-left font-semibold px-4 py-2.5">Unit</th>
                        <th className="text-left font-semibold px-4 py-2.5">Qty to Return</th>
                        <th className="text-left font-semibold px-4 py-2.5">Return To</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-5 text-center text-gray-400">
                            No remaining stock to return.
                          </td>
                        </tr>
                      ) : (
                        rows.map((row, idx) => (
                          <tr key={row.batchId} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-2 font-mono text-xs text-gray-700">{row.productCode}</td>
                            <td className="px-4 py-2 text-gray-800">{row.productName}</td>
                            <td className="px-4 py-2 font-mono text-xs text-gray-700">{row.batchCode}</td>
                            <td className="px-4 py-2 text-gray-600">{row.unit}</td>
                            <td className="px-4 py-2 text-gray-800">{row.quantity}</td>
                            <td className="px-4 py-2">
                              <div className="relative">
                                <select
                                  value={row.destinationWarehouseId}
                                  onChange={(e) => setRowDestination(idx, e.target.value)}
                                  disabled={!!successMessage}
                                  className="w-full bg-gray-100 border border-transparent rounded-lg px-3 py-1.5 text-sm appearance-none focus:outline-none focus:border-[#1A381E] focus:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                                  style={{ color: row.destinationWarehouseId ? '#1f2937' : '#9ca3af' }}
                                >
                                  <option value="">Select warehouse…</option>
                                  {permanentWarehouses.map((w) => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                  ))}
                                </select>
                                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
              {successMessage && (
                <p className="text-green-600 text-sm font-medium mb-4">{successMessage} — closing…</p>
              )}

              {/* Footer */}
              <div className="flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={!allRowsHaveDestination || submitting || !!successMessage}
                  className="px-8 py-2.5 text-sm font-bold text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#409645' }}
                >
                  {submitting ? 'Closing…' : 'CLOSE WAREHOUSE'}
                </button>
              </div>
            </>
          )}

        </div>
      </div>

      <PinVerificationModal isOpen={pinOpen} onVerify={handleVerify} onClose={() => setPinOpen(false)} />
    </>
  );
}
