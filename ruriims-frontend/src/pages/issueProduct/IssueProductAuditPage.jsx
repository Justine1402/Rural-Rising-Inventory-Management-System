import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { exportDetailPdf } from '../../utils/exportPdf';
import Navbar from '../../components/layout/Navbar';

const fmtIssueType = (t) => t === 'internal_use' ? 'Internal Use' : 'Sale';

export default function IssueProductAuditPage({ overrideId = null, onReturn = null }) {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const effectiveId = overrideId ?? paramId;

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIssue(null);
    setLoading(true);
    setError(null);
    api.get(`/issue-products/${effectiveId}`)
      .then((res) => setIssue(res.data.issue))
      .catch(() => setError('Failed to load issue product record. Please refresh.'))
      .finally(() => setLoading(false));
  }, [effectiveId]);

  const handleReturn = () => onReturn ? onReturn() : navigate(-1);

  const handleExportPdf = () => {
    if (!issue) return;
    exportDetailPdf({ type: 'iss', records: [issue] });
  };

  const bodyContent = issue && (
    <div className="px-8 py-6">

      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
        Issue Details
      </p>

      <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Issued By</p>
          <p className="text-sm font-medium text-gray-800">{issue.issued_by}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Date Issued</p>
          <p className="text-sm font-medium text-gray-800">{issue.date_issued}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Warehouse</p>
          <p className="text-sm font-medium text-gray-800">{issue.warehouse}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Issue Type</p>
          <p className="text-sm font-medium text-gray-800">{fmtIssueType(issue.issue_type)}</p>
        </div>
      </div>

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
              <th className="text-left font-semibold px-4 py-2.5">Quantity Issued</th>
              <th className="text-left font-semibold px-4 py-2.5">Harvest Date</th>
              <th className="text-left font-semibold px-4 py-2.5">Note</th>
            </tr>
          </thead>
          <tbody>
            {issue.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">No items recorded.</td>
              </tr>
            )}
            {issue.items.map((item, idx) => (
              <tr key={item.id} className={`border-t border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{item.product_code}</td>
                <td className="px-4 py-2.5 text-gray-800">{item.product_name}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{item.stock_in_use_code}</td>
                <td className="px-4 py-2.5 text-gray-600">{item.quantity_issued} {item.unit}</td>
                <td className="px-4 py-2.5 text-gray-600">{item.harvest_date || '—'}</td>
                <td className="px-4 py-2.5 text-gray-600">{item.note || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );

  // Overlay mode — when opened from a report page
  if (overrideId != null) {
    return (
      <>
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={handleReturn} />
        <div
          className="fixed top-[105px] left-1/2 -translate-x-1/2 w-[1140px] max-h-[calc(100vh-130px)] overflow-y-auto bg-white rounded-lg shadow-xl z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
            style={{ backgroundColor: '#1A381E' }}
          >
            <button
              onClick={handleReturn}
              className="flex items-center gap-2 text-sm font-semibold text-white hover:opacity-80"
            >
              ← RETURN
            </button>
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-white">{issue?.code ?? ''}</span>
              <button
                onClick={handleExportPdf}
                disabled={!issue}
                className="text-xs font-semibold text-white border border-white rounded px-3 py-1.5 hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Export as PDF
              </button>
            </div>
          </div>
          {loading && <p className="text-center text-gray-400 py-8">Loading...</p>}
          {!loading && error && <p className="text-center text-red-500 py-8">{error}</p>}
          {!loading && !error && bodyContent}
        </div>
      </>
    );
  }

  // Full page mode — when accessed via /issue-products/:id/audit route
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="p-6">
        <div className="bg-white rounded shadow overflow-hidden">
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ backgroundColor: '#1A381E' }}
          >
            <button
              onClick={handleReturn}
              className="btn-brand-outline text-white text-xs font-medium px-3 py-1.5 rounded border border-white transition-colors"
            >
              ← RETURN
            </button>
            <div className="flex items-center gap-4">
              {issue && (
                <span className="text-white font-bold text-base tracking-wide">{issue.code}</span>
              )}
              <button
                onClick={handleExportPdf}
                disabled={!issue}
                className="text-xs font-semibold text-white border border-white rounded px-3 py-1.5 hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Export as PDF
              </button>
            </div>
          </div>
          {loading && <p className="text-center text-gray-400 py-8">Loading...</p>}
          {!loading && error && <p className="text-center text-red-500 py-8">{error}</p>}
          {!loading && !error && bodyContent}
        </div>
      </div>
    </div>
  );
}
