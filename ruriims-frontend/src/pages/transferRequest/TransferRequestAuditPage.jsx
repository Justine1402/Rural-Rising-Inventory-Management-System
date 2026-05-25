import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';

const roClass =
  'w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-100 text-gray-500 cursor-not-allowed';

export default function TransferRequestAuditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/transfer-requests/${id}`)
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
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <>
      {/* Blur overlay */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />

      {/* Card */}
      <div className="fixed top-[105px] left-1/2 -translate-x-1/2 w-[1140px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-auto">

        {pageLoading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 py-16">
            Loading transfer request…
          </div>
        ) : loadError ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16">
            <p className="text-red-600 text-sm">{loadError}</p>
            <button
              onClick={() => navigate('/transfer-requests')}
              className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg"
              style={{ backgroundColor: '#409645' }}
            >
              RETURN
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 flex-shrink-0">
              <button
                onClick={() => navigate('/transfer-requests')}
                className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg"
                style={{ backgroundColor: '#409645' }}
              >
                RETURN
              </button>
              <h1 className="text-2xl font-bold text-gray-900">{data.code}</h1>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-auto px-8 pb-6">

              {/* Fields grid */}
              <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-6">
                <div>
                  <label className="block text-sm text-gray-500 mb-1.5">Requested By</label>
                  <div className={roClass}>{data.requested_by || '—'}</div>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1.5">Date Requested</label>
                  <div className={roClass}>{data.date_requested || '—'}</div>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1.5">Source Warehouse</label>
                  <div className={roClass}>{data.source_warehouse || '—'}</div>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1.5">Destination Warehouse</label>
                  <div className={roClass}>{data.destination_warehouse || '—'}</div>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1.5">Verified By</label>
                  <div className={roClass}>{data.verified_by || '—'}</div>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1.5">Date Received</label>
                  <div className={roClass}>{data.date_received || '—'}</div>
                </div>
              </div>

              {/* Product table */}
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Product Details</h2>
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
                        <tr key={item.product_code ?? idx} className="border-t border-gray-100">
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
              </div>

            </div>
          </>
        )}
      </div>
    </>
  );
}
