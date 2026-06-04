import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { exportDetailPdf } from '../../utils/exportPdf';

export default function TransferRequestAuditPage({ overrideId = null, onReturn = null }) {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const effectiveId = overrideId ?? paramId;
  const [data, setData] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/transfer-requests/${effectiveId}`)
      .then((res) => {
        if (cancelled) return;
        setData(res.data.transfer);
        setPageLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err.response?.data?.message ?? 'Failed to load transfer request.');
        setPageLoading(false);
      });
    return () => { cancelled = true; };
  }, [effectiveId]);

  const handleClose = () => onReturn ? onReturn() : navigate('/transfer-requests');

  const handleExportPdf = () => {
    if (!data) return;
    exportDetailPdf({ type: 'trf', records: [data] });
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={handleClose} />

      {/* Card */}
      <div
        className="fixed top-[105px] left-1/2 -translate-x-1/2 w-[1140px] max-h-[calc(100vh-130px)] overflow-y-auto bg-white rounded-lg shadow-xl z-50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dark green header — sticky */}
        <div
          className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
          style={{ backgroundColor: '#1A381E' }}
        >
          <button
            onClick={handleClose}
            className="flex items-center gap-2 text-sm font-semibold text-white hover:opacity-80"
          >
            ← RETURN
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-white">
              {data?.code ?? ''}
            </span>
            <button
              onClick={handleExportPdf}
              disabled={!data}
              className="text-xs font-semibold text-white border border-white rounded px-3 py-1.5 hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Export as PDF
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {pageLoading && (
            <p className="text-gray-400 text-sm text-center py-10">Loading transfer request…</p>
          )}

          {!pageLoading && loadError && (
            <p className="text-red-500 text-sm text-center py-10">{loadError}</p>
          )}

          {!pageLoading && !loadError && data && (
            <>
              {/* Section 1 — Transfer metadata */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Transfer Details
              </p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8">
                <div>
                  <p className="text-sm text-gray-500 mb-0.5">Requested By</p>
                  <p className="text-sm font-medium text-gray-800">{data.requested_by || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-0.5">Date Requested</p>
                  <p className="text-sm font-medium text-gray-800">{data.date_requested || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-0.5">Source Warehouse</p>
                  <p className="text-sm font-medium text-gray-800">{data.source_warehouse || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-0.5">Destination Warehouse</p>
                  <p className="text-sm font-medium text-gray-800">{data.destination_warehouse || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-0.5">Verified By</p>
                  <p className="text-sm font-medium text-gray-800">{data.verified_by || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-0.5">Date Received</p>
                  <p className="text-sm font-medium text-gray-800">{data.date_received || '—'}</p>
                </div>
              </div>

              {/* Section 2 — Product table */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Product Details
              </p>
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-white" style={{ backgroundColor: '#1A381E' }}>
                      <th className="text-left font-semibold px-4 py-2.5">Product SKU</th>
                      <th className="text-left font-semibold px-4 py-2.5">Product Name</th>
                      <th className="text-left font-semibold px-4 py-2.5">Stock-In-Use Code</th>
                      <th className="text-left font-semibold px-4 py-2.5">Qty Requested</th>
                      <th className="text-left font-semibold px-4 py-2.5">Qty Received</th>
                      <th className="text-left font-semibold px-4 py-2.5">Harvest Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.items ?? []).length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-5 text-center text-gray-400">
                          No items.
                        </td>
                      </tr>
                    )}
                    {(data.items ?? []).map((item, idx) => (
                      <tr key={item.product_code ?? idx} className="border-t border-gray-100 odd:bg-white even:bg-gray-50">
                        <td className="px-4 py-2 font-mono text-xs text-gray-700">{item.product_code}</td>
                        <td className="px-4 py-2 text-gray-800">{item.product_name}</td>
                        <td className="px-4 py-2 font-mono text-xs text-gray-700">
                          {item.stock_in_use_code || '—'}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {parseFloat(item.quantity_requested)} {item.unit ?? ''}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {parseFloat(item.quantity_received)} {item.unit ?? ''}
                        </td>
                        <td className="px-4 py-2 text-gray-600">{item.harvest_date || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
