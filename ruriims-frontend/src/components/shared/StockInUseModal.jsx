import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function StockInUseModal({ isOpen, skuCode, warehouseId, onSelect, onClose }) {
  const [batches, setBatches] = useState([]);
  const [warehouseTotal, setWarehouseTotal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !skuCode || !warehouseId) return;
    setSelected(null);
    setError(null);
    setLoading(true);
    api.get('/stock-in-use', { params: { sku_code: skuCode, warehouse_id: warehouseId } })
      .then((res) => {
        setWarehouseTotal(res.data.warehouse_total);
        setBatches(res.data.batches);
      })
      .catch(() => setError('Failed to load batches.'))
      .finally(() => setLoading(false));
  }, [isOpen, skuCode, warehouseId]);

  if (!isOpen) return null;

  const handleSelect = () => {
    if (selected) onSelect({ batch: selected, warehouseTotal, allBatches: batches });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: '#1A381E' }}>
          <h2 className="text-lg font-bold text-white">Stock-In-Use: {skuCode}</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl font-light transition-colors">✕</button>
        </div>

        {/* Table */}
        <div className="overflow-y-auto max-h-80">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left font-semibold px-5 py-3 text-gray-600">Code</th>
                <th className="text-left font-semibold px-5 py-3 text-gray-600">Harvest Date</th>
                <th className="text-left font-semibold px-5 py-3 text-gray-600">Quantity</th>
                <th className="text-left font-semibold px-5 py-3 text-gray-600">Category</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-gray-400">Loading batches…</td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-red-500">{error}</td>
                </tr>
              )}
              {!loading && !error && batches.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-gray-400">
                    No available stock for this product in the selected warehouse.
                  </td>
                </tr>
              )}
              {!loading && !error && batches.map((batch) => (
                <tr
                  key={batch.code}
                  onClick={() => setSelected(batch)}
                  className="border-b border-gray-100 cursor-pointer transition-colors"
                  style={selected?.code === batch.code ? { backgroundColor: '#d1fae5' } : {}}
                  onMouseEnter={(e) => { if (selected?.code !== batch.code) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = selected?.code === batch.code ? '#d1fae5' : ''; }}
                >
                  <td className="px-5 py-3 text-gray-700 font-mono text-xs">{batch.code}</td>
                  <td className="px-5 py-3 text-gray-600">{batch.harvest_date}</td>
                  <td className="px-5 py-3 text-gray-600">{batch.quantity}</td>
                  <td className="px-5 py-3 text-gray-600">{batch.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <span className="text-sm text-gray-500">
            {selected ? `Selected: ${selected.code}` : 'Click a row to select a batch'}
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              CANCEL
            </button>
            <button
              onClick={handleSelect}
              disabled={!selected}
              className="px-5 py-2 text-sm font-bold text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ backgroundColor: '#409645' }}
            >
              SELECT
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
