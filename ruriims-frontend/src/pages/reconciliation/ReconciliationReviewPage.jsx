import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/layout/Navbar';
import PinVerificationModal from '../../components/shared/PinVerificationModal';
import { useUI } from '../../context/UIContext';
import {
  EPSILON,
  formatAdjustmentArrow,
  formatDiscrepancy,
} from '../../utils/reconciliationFormat';

const readonlyClass =
  'w-full bg-gray-100 border border-transparent rounded-lg px-4 py-2.5 text-sm text-gray-500';

const formatDate = (d) =>
  d
    ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

export default function ReconciliationReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshReconciliations, refreshProducts } = useUI();

  const [data, setData] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [error, setError] = useState(null);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [successCode, setSuccessCode] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.get(`/reconciliations/${id}`)
      .then((res) => {
        if (cancelled) return;
        setData(res.data.reconciliation);
        setPageLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err.response?.data?.message ?? 'Failed to load reconciliation.');
        setPageLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  const handleConfirmClick = () => {
    setPinModalOpen(true);
  };

  const handleVerify = async (pin) => {
    setPinModalOpen(false);
    setError(null);
    setLoading(true);
    try {
      await api.post(`/reconciliations/${id}/confirm`, { pin });
      setSuccessCode(data.transaction_code);
      refreshReconciliations?.();
      refreshProducts?.();
      setTimeout(() => navigate('/reconciliation'), 1500);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-400 text-sm">Loading…</p>
        </main>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Navbar />
        <main className="flex-1 p-5">
          <p className="text-red-600 text-sm mb-4">{loadError}</p>
          <button
            onClick={() => navigate('/reconciliation')}
            className="btn-brand px-6 py-2.5 text-sm font-semibold text-white rounded-lg"
          >
            RETURN
          </button>
        </main>
      </div>
    );
  }

  const adjustedItems = (data.items ?? []).filter(
    (item) => Math.abs(parseFloat(item.discrepancy)) >= EPSILON
  );
  const isPendingReview = data.status === 'pending_review';

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-1 p-5">
        <div className="bg-white rounded-xl shadow p-8 max-w-[1040px] mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Reconciliation Review</h1>
            <span className="font-mono text-lg font-semibold text-gray-700">
              {data.transaction_code}
            </span>
          </div>

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-6">
            <div>
              <label className="block text-sm text-gray-500 mb-1.5">Reconciled By</label>
              <div className={readonlyClass}>{data.reconciled_by}</div>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1.5">Date Reconciled</label>
              <div className={readonlyClass}>{formatDate(data.date_reconciled)}</div>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1.5">Reviewed By</label>
              <div className={readonlyClass}>{data.reviewed_by ?? '—'}</div>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1.5">Date Reviewed</label>
              <div className={readonlyClass}>{formatDate(data.date_reviewed)}</div>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1.5">Warehouse</label>
              <div className={readonlyClass}>{data.warehouse}</div>
            </div>
          </div>

          {/* Counted Items table */}
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Counted Items</h2>
          <div className="rounded-lg overflow-hidden border border-gray-200 mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#F3F4F6' }}>
                  <th className="text-left font-semibold px-4 py-2.5 text-gray-700">Product SKU</th>
                  <th className="text-left font-semibold px-4 py-2.5 text-gray-700">Product Name</th>
                  <th className="text-left font-semibold px-4 py-2.5 text-gray-700">Expected Stock</th>
                  <th className="text-left font-semibold px-4 py-2.5 text-gray-700">Actual Count</th>
                  <th className="text-left font-semibold px-4 py-2.5 text-gray-700">Discrepancy</th>
                  <th className="text-left font-semibold px-4 py-2.5 text-gray-700">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {(data.items ?? []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-5 text-center text-gray-400">
                      No items recorded for this reconciliation.
                    </td>
                  </tr>
                )}
                {(data.items ?? []).map((item) => {
                  const disc = formatDiscrepancy(item.discrepancy, item.unit);
                  return (
                    <tr key={item.id} className="border-t border-gray-100">
                      <td className="px-4 py-2 font-mono text-xs text-gray-700">{item.product_code}</td>
                      <td className="px-4 py-2 text-gray-800">{item.product_name}</td>
                      <td className="px-4 py-2 text-gray-600">
                        {parseFloat(item.expected_stock)} {item.unit}
                      </td>
                      <td className="px-4 py-2 text-gray-600">
                        {parseFloat(item.actual_count)} {item.unit}
                      </td>
                      <td className="px-4 py-2">
                        {disc && <span style={{ color: disc.color }}>{disc.label}</span>}
                      </td>
                      <td className="px-4 py-2 text-gray-600">{item.remarks || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Inventory Adjustment sub-table */}
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Inventory Adjustment Upon Confirmation
          </h2>
          <div className="rounded-lg overflow-hidden border border-gray-200 mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#F3F4F6' }}>
                  <th className="text-left font-semibold px-4 py-2.5 text-gray-700">Product Name</th>
                  <th className="text-left font-semibold px-4 py-2.5 text-gray-700">Adjustment</th>
                  <th className="text-left font-semibold px-4 py-2.5 text-gray-700">Variance</th>
                </tr>
              </thead>
              <tbody>
                {adjustedItems.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-5 text-center" style={{ color: '#6B7280' }}>
                      No adjustments — all counts matched.
                    </td>
                  </tr>
                )}
                {adjustedItems.map((item) => {
                  const variance = formatDiscrepancy(item.discrepancy, item.unit);
                  return (
                    <tr key={item.id} className="border-t border-gray-100">
                      <td className="px-4 py-2 text-gray-800">{item.product_name}</td>
                      <td className="px-4 py-2 text-gray-600">
                        {formatAdjustmentArrow(item.expected_stock, item.actual_count, item.unit)}
                      </td>
                      <td className="px-4 py-2">
                        {variance && (
                          <span style={{ color: variance.color }}>({variance.label})</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Action row */}
          {isPendingReview ? (
            <div>
              {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
              <div className="flex items-center justify-end gap-3">
                {successCode ? (
                  <span
                    className="px-4 py-2 text-sm font-bold rounded-lg"
                    style={{ color: '#409645' }}
                  >
                    Accomplished {successCode}
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() => navigate('/reconciliation')}
                      className="btn-brand-outline px-6 py-2.5 text-sm font-semibold rounded-lg border transition-colors"
                      style={{ color: '#409645', borderColor: '#409645' }}
                    >
                      RETURN
                    </button>
                    <button
                      onClick={handleConfirmClick}
                      disabled={loading}
                      className="btn-brand px-8 py-2.5 text-sm font-bold text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Confirming…' : 'CONFIRM'}
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-end">
              <button
                onClick={() => navigate('/reconciliation')}
                className="btn-brand-outline px-6 py-2.5 text-sm font-semibold rounded-lg border transition-colors"
                style={{ color: '#409645', borderColor: '#409645' }}
              >
                RETURN
              </button>
            </div>
          )}

        </div>
      </main>

      <PinVerificationModal
        isOpen={pinModalOpen}
        onVerify={handleVerify}
        onClose={() => setPinModalOpen(false)}
      />
    </div>
  );
}
