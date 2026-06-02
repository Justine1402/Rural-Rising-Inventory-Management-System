import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import PinVerificationModal from '../../components/shared/PinVerificationModal';
import { useUI } from '../../context/UIContext';
import {
  EPSILON,
  formatAdjustmentArrow,
  formatDiscrepancy,
} from '../../utils/reconciliationFormat';
import { formatDate } from '../../utils/formatDate';

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

  const handleClose = () => navigate('/reconciliation');

  const adjustedItems = (data?.items ?? []).filter(
    (item) => Math.abs(parseFloat(item.discrepancy)) >= EPSILON
  );
  const isPendingReview = data?.status === 'pending_review';

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={handleClose} />

      {/* Card */}
      <div
        className="fixed top-[105px] left-1/2 -translate-x-1/2 w-[1040px] max-h-[calc(100vh-130px)] overflow-y-auto bg-white rounded-lg shadow-xl z-50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dark green header — sticky */}
        <div
          className="flex items-center justify-between px-8 py-4 sticky top-0 z-10"
          style={{ backgroundColor: '#1A381E' }}
        >
          <button
            onClick={handleClose}
            className="flex items-center gap-2 text-sm font-semibold text-white hover:opacity-80"
          >
            ← RETURN
          </button>
          <span className="text-sm font-semibold text-white font-mono">
            {data?.transaction_code ?? ''}
          </span>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          {pageLoading && (
            <p className="text-gray-400 text-sm text-center py-10">Loading…</p>
          )}

          {!pageLoading && loadError && (
            <p className="text-red-600 text-sm text-center py-10">{loadError}</p>
          )}

          {!pageLoading && !loadError && data && (
            <>
              {/* Section 1 — Metadata */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Reconciliation Details
              </p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8">
                <div>
                  <p className="text-sm text-gray-500 mb-0.5">Reconciled By</p>
                  <p className="text-sm font-medium text-gray-800">{data.reconciled_by}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-0.5">Date Reconciled</p>
                  <p className="text-sm font-medium text-gray-800">{formatDate(data.date_reconciled)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-0.5">Reviewed By</p>
                  <p className="text-sm font-medium text-gray-800">{data.reviewed_by ?? '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-0.5">Date Reviewed</p>
                  <p className="text-sm font-medium text-gray-800">{formatDate(data.date_reviewed)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-0.5">Warehouse</p>
                  <p className="text-sm font-medium text-gray-800">{data.warehouse}</p>
                </div>
              </div>

              {/* Section 2 — Counted Items table */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Counted Items
              </p>
              <div className="rounded-lg overflow-hidden border border-gray-200 mb-8">
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
                        <tr key={item.id} className="border-t border-gray-100 odd:bg-white even:bg-gray-50">
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

              {/* Section 3 — Inventory Adjustment table */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Inventory Adjustment Upon Confirmation
              </p>
              <div className="rounded-lg overflow-hidden border border-gray-200 mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-white" style={{ backgroundColor: '#1A381E' }}>
                      <th className="text-left font-semibold px-4 py-2.5">Product Name</th>
                      <th className="text-left font-semibold px-4 py-2.5">Adjustment</th>
                      <th className="text-left font-semibold px-4 py-2.5">Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adjustedItems.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-5 text-center text-gray-400">
                          No adjustments — all counts matched.
                        </td>
                      </tr>
                    )}
                    {adjustedItems.map((item) => {
                      const variance = formatDiscrepancy(item.discrepancy, item.unit);
                      return (
                        <tr key={item.id} className="border-t border-gray-100 odd:bg-white even:bg-gray-50">
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

              {/* Action row — only shown for pending review */}
              {isPendingReview && (
                <div>
                  {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
                  <div className="flex items-center justify-end">
                    {successCode ? (
                      <span className="px-4 py-2 text-sm font-bold rounded-lg" style={{ color: '#409645' }}>
                        Accomplished {successCode}
                      </span>
                    ) : (
                      <button
                        onClick={() => setPinModalOpen(true)}
                        disabled={loading}
                        className="btn-brand px-8 py-2.5 text-sm font-bold text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Confirming…' : 'CONFIRM'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <PinVerificationModal
        isOpen={pinModalOpen}
        onVerify={handleVerify}
        onClose={() => setPinModalOpen(false)}
      />
    </>
  );
}
