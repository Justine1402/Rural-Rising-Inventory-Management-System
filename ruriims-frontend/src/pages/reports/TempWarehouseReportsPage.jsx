import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/layout/Navbar';
import StatusBadge from '../../components/ui/StatusBadge';
import { useUI } from '../../context/UIContext';

export default function TempWarehouseReportsPage() {
  const location = useLocation();
  const { setTemporaryWarehouseDetailOverlayTwhId } = useUI();
  const [twhs, setTwhs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get('/temporary-warehouses')
      .then((res) => setTwhs(res.data.temporary_warehouses))
      .catch(() => setError('Failed to load temporary warehouses. Please refresh.'))
      .finally(() => setLoading(false));
  }, [location.key]);

  const statusLabel = (s) => s === 'active' ? 'Active' : 'Closed';

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-1 p-5">
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white" style={{ backgroundColor: '#1A381E' }}>
                <th className="text-left font-semibold px-5 py-3">Transaction Code</th>
                <th className="text-left font-semibold px-5 py-3">Warehouse Name</th>
                <th className="text-left font-semibold px-5 py-3">Location</th>
                <th className="text-left font-semibold px-5 py-3">Event Date</th>
                <th className="text-left font-semibold px-5 py-3">Date Created</th>
                <th className="text-left font-semibold px-5 py-3">Created By</th>
                <th className="text-left font-semibold px-5 py-3">Closed By</th>
                <th className="text-left font-semibold px-5 py-3">Date Closed</th>
                <th className="text-left font-semibold px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={9} className="px-5 py-6 text-center text-gray-400">Loading…</td></tr>
              )}
              {error && (
                <tr><td colSpan={9} className="px-5 py-6 text-center text-red-500">{error}</td></tr>
              )}
              {!loading && !error && twhs.length === 0 && (
                <tr><td colSpan={9} className="px-5 py-6 text-center text-gray-400">No temporary warehouses yet.</td></tr>
              )}
              {!loading && !error && twhs.map((twh) => (
                <tr
                  key={twh.id}
                  onClick={() => setTemporaryWarehouseDetailOverlayTwhId(twh.id)}
                  className="border-b border-gray-100 odd:bg-white even:bg-gray-50 cursor-pointer transition-colors"
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
                >
                  <td className="px-5 py-3 font-mono text-xs text-gray-700">{twh.transaction_code}</td>
                  <td className="px-5 py-3 text-gray-800">{twh.name}</td>
                  <td className="px-5 py-3 text-gray-600">{twh.location}</td>
                  <td className="px-5 py-3 text-gray-600">{twh.event_date}</td>
                  <td className="px-5 py-3 text-gray-600">{twh.created_at}</td>
                  <td className="px-5 py-3 text-gray-600">{twh.created_by}</td>
                  <td className="px-5 py-3 text-gray-600">{twh.closed_by}</td>
                  <td className="px-5 py-3 text-gray-600">{twh.date_closed}</td>
                  <td className="px-5 py-3"><StatusBadge status={statusLabel(twh.status)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
