import { useEffect, useState } from 'react';
import api from '../../api/axios';
import PinVerificationModal from '../../components/shared/PinVerificationModal';
import { useAuth } from '../../context/AuthContext';
import { useWarehouse } from '../../context/WarehouseContext';
import { formatDiscrepancy, EPSILON } from '../../utils/reconciliationFormat';

const readonlyClass =
  'w-full bg-gray-100 border border-transparent rounded-lg px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed';

export default function ReconciliationFormPage({ onClose, onSuccess }) {
  const { user } = useAuth();
  const { activeWarehouse } = useWarehouse();

  const [products, setProducts] = useState([]);
  const [rowState, setRowState] = useState({});
  const [loading, setLoading] = useState(true);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successCode, setSuccessCode] = useState(null);
  const [error, setError] = useState(null);

  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const todayISO = new Date().toISOString().split('T')[0];
  const isTWH = activeWarehouse?.isTemporary === true;

  useEffect(() => {
    if (isTWH) return;
    setLoading(true);
    api.get('/reconciliations/expected-stock', { params: { warehouse_id: activeWarehouse?.id } })
      .then((res) => {
        const prods = res.data.products ?? [];
        setProducts(prods);
        const initial = {};
        prods.forEach((p) => { initial[p.id] = { actualCount: '', remarks: '' }; });
        setRowState(initial);
      })
      .catch(() => setError('Failed to load products.'))
      .finally(() => setLoading(false));
  }, []);

  const updateRow = (productId, field, value) =>
    setRowState((prev) => ({ ...prev, [productId]: { ...prev[productId], [field]: value } }));

  const computeDiscrepancy = (product) => {
    const state = rowState[product.id];
    if (!state || state.actualCount === '') return null;
    const actualNum = parseFloat(state.actualCount);
    if (isNaN(actualNum)) return null;
    return actualNum - product.total_quantity;
  };

  const isSubmitDisabled = submitting || !!successCode || products.length === 0 || products.some((p) => {
    const state = rowState[p.id] ?? { actualCount: '', remarks: '' };
    if (state.actualCount === '') return true;
    const disc = computeDiscrepancy(p);
    return disc !== null && Math.abs(disc) > EPSILON && !state.remarks.trim();
  });

  const handleSubmit = () => {
    setError(null);
    setPinModalOpen(true);
  };

  const handleVerify = async (pin) => {
    setPinModalOpen(false);
    setSubmitting(true);
    try {
      const res = await api.post('/reconciliations', {
        warehouse_id: activeWarehouse.id,
        date_reconciled: todayISO,
        pin,
        items: products.map((p) => ({
          product_id: p.id,
          actual_count: parseFloat(rowState[p.id].actualCount),
          remarks: rowState[p.id].remarks.trim() || null,
        })),
      });
      setSuccessCode(res.data.reconciliation.transaction_code);
      onSuccess?.();
      setTimeout(() => onClose?.(), 1500);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />
      <div className="fixed top-[105px] left-1/2 -translate-x-1/2 w-[1040px] max-h-[85vh] bg-white rounded-lg shadow-xl overflow-y-auto z-50 p-8">

        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg"
            style={{ backgroundColor: '#409645' }}
          >
            RETURN
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Reconciliation</h1>
        </div>

        {isTWH ? (
          <p className="text-red-600 text-sm text-center py-8">
            Reconciliation is not available for temporary warehouses.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-x-8 gap-y-4 mb-6">
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">Reconciled By</label>
                <div className={readonlyClass}>{user?.name ?? ''}</div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">Date</label>
                <div className={readonlyClass}>{today}</div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">Warehouse</label>
                <div className={readonlyClass}>{activeWarehouse?.name ?? ''}</div>
              </div>
            </div>

            <div className="rounded-lg overflow-hidden border border-gray-200 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white" style={{ backgroundColor: '#1A381E' }}>
                    <th className="text-left font-semibold px-4 py-2.5">Product SKU</th>
                    <th className="text-left font-semibold px-4 py-2.5">Product Name</th>
                    <th className="text-left font-semibold px-4 py-2.5">Expected Stock</th>
                    <th className="text-left font-semibold px-4 py-2.5">Actual Count</th>
                    <th className="text-left font-semibold px-4 py-2.5">Discrepancy</th>
                    <th className="text-left font-semibold px-4 py-2.5">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={6} className="px-4 py-5 text-center text-gray-400">Loading products…</td>
                    </tr>
                  )}
                  {!loading && products.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-5 text-center text-gray-400">
                        No in-stock products to reconcile at this warehouse.
                      </td>
                    </tr>
                  )}
                  {!loading && products.map((product) => {
                    const state = rowState[product.id] ?? { actualCount: '', remarks: '' };
                    const disc = computeDiscrepancy(product);

                    let discCell = null;
                    if (disc !== null) {
                      const formatted = formatDiscrepancy(disc, product.unit);
                      discCell = <span style={{ color: formatted.color }}>{formatted.label}</span>;
                    }

                    return (
                      <tr key={product.id} className="border-t border-gray-100">
                        <td className="px-4 py-2 font-mono text-xs text-gray-700">{product.sku_code}</td>
                        <td className="px-4 py-2 text-gray-800">{product.name}</td>
                        <td className="px-4 py-2 text-gray-600">{product.total_quantity} {product.unit}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              step="0.001"
                              value={state.actualCount}
                              onChange={(e) => updateRow(product.id, 'actualCount', e.target.value)}
                              className="w-24 bg-gray-100 border border-transparent rounded px-2 py-1 text-sm focus:outline-none focus:border-[#1A381E] focus:bg-white"
                            />
                            <span className="text-xs text-gray-500">{product.unit}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2">{discCell}</td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={state.remarks}
                            onChange={(e) => updateRow(product.id, 'remarks', e.target.value)}
                            placeholder="e.g., Weighing Error"
                            className="w-full bg-gray-100 border border-transparent rounded px-2 py-1 text-sm focus:outline-none focus:border-[#1A381E] focus:bg-white"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

            <div className="flex items-center justify-end gap-3">
              {successCode && (
                <span className="px-4 py-2 text-sm font-medium text-gray-500 bg-gray-200 rounded-lg">
                  Created {successCode}
                </span>
              )}
              <button
                onClick={handleSubmit}
                disabled={isSubmitDisabled}
                className="px-8 py-2.5 text-sm font-bold text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#409645' }}
              >
                {submitting ? 'Saving…' : 'SUBMIT'}
              </button>
            </div>
          </>
        )}
      </div>

      <PinVerificationModal isOpen={pinModalOpen} onVerify={handleVerify} onClose={() => setPinModalOpen(false)} />
    </>
  );
}
