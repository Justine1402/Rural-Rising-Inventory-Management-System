import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/layout/Navbar';
import WarehouseTabs from '../../components/layout/WarehouseTabs';

const fmtIssueType = (t) => t === 'internal_use' ? 'Internal Use' : 'Sale';

export default function IssueProductAuditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/issue-products/${id}`)
      .then((res) => setIssue(res.data.issue))
      .catch(() => setError('Failed to load issue product record. Please refresh.'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <WarehouseTabs />

      <div className="p-6">
        <div className="bg-white rounded shadow overflow-hidden">
          {/* Header bar */}
          <div
            className="flex items-center gap-4 px-6 py-4"
            style={{ backgroundColor: '#1A381E' }}
          >
            <button
              onClick={() => navigate(-1)}
              className="btn-brand-outline text-white text-xs font-medium px-3 py-1.5 rounded border border-white transition-colors"
            >
              ← RETURN
            </button>
            {issue && (
              <span className="text-white font-bold text-base tracking-wide">
                {issue.code}
              </span>
            )}
          </div>

          {/* Content */}
          {loading && (
            <p className="text-center text-gray-400 py-8">Loading...</p>
          )}
          {!loading && error && (
            <p className="text-center text-red-500 py-8">{error}</p>
          )}
          {!loading && !error && issue && (
            <>
              {/* Header fields */}
              <div className="p-6 grid grid-cols-2 gap-x-8 gap-y-6 max-w-2xl">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Issued By</p>
                  <p className="text-sm text-gray-800 font-medium">{issue.issued_by}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Date Issued</p>
                  <p className="text-sm text-gray-800 font-medium">{issue.date_issued}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Warehouse</p>
                  <p className="text-sm text-gray-800 font-medium">{issue.warehouse}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Issue Type</p>
                  <p className="text-sm text-gray-800 font-medium">{fmtIssueType(issue.issue_type)}</p>
                </div>
              </div>

              {/* Product table */}
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-white" style={{ backgroundColor: '#1A381E' }}>
                      <th className="text-left font-semibold px-4 py-3">Product SKU</th>
                      <th className="text-left font-semibold px-4 py-3">Product Name</th>
                      <th className="text-left font-semibold px-4 py-3">Stock-In-Use Code</th>
                      <th className="text-left font-semibold px-4 py-3">Quantity Issued</th>
                      <th className="text-left font-semibold px-4 py-3">Harvest Date</th>
                      <th className="text-left font-semibold px-4 py-3">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issue.items.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-gray-400">No items recorded.</td>
                      </tr>
                    )}
                    {issue.items.map((item, idx) => (
                      <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">{item.product_code}</td>
                        <td className="px-4 py-3 text-gray-800">{item.product_name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">{item.stock_in_use_code}</td>
                        <td className="px-4 py-3 text-gray-600">{item.quantity_issued} {item.unit}</td>
                        <td className="px-4 py-3 text-gray-600">{item.harvest_date || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{item.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
