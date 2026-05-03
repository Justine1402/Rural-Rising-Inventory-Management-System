import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function AddProductsModal({ isOpen, onSelect, onClose }) {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelected([]);
    setError(null);
    setLoading(true);
    api.get('/products')
      .then((res) => setProducts(res.data.products))
      .catch(() => setError('Failed to load products.'))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const toggle = (product) => {
    setSelected((prev) =>
      prev.find((p) => p.sku_code === product.sku_code)
        ? prev.filter((p) => p.sku_code !== product.sku_code)
        : [...prev, product]
    );
  };

  const isRowSelected = (product) =>
    !!selected.find((p) => p.sku_code === product.sku_code);

  const handleSelect = () => {
    onSelect(
      selected.map((p) => ({
        productCode: p.sku_code,
        productName: p.name,
        unit: p.unit,
        category: p.category,
      }))
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: '#1A381E' }}>
          <h2 className="text-lg font-bold text-white">Select Products</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl font-light transition-colors">✕</button>
        </div>

        {/* Table */}
        <div className="overflow-y-auto max-h-80">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left font-semibold px-5 py-3 text-gray-600">Product Code</th>
                <th className="text-left font-semibold px-5 py-3 text-gray-600">Product Name</th>
                <th className="text-left font-semibold px-5 py-3 text-gray-600">Unit</th>
                <th className="text-left font-semibold px-5 py-3 text-gray-600">Category</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-gray-400">Loading products…</td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-red-500">{error}</td>
                </tr>
              )}
              {!loading && !error && products.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-gray-400">No products found.</td>
                </tr>
              )}
              {!loading && !error && products.map((product) => (
                <tr
                  key={product.sku_code}
                  onClick={() => toggle(product)}
                  className="border-b border-gray-100 cursor-pointer transition-colors"
                  style={isRowSelected(product) ? { backgroundColor: '#d1fae5' } : {}}
                  onMouseEnter={(e) => { if (!isRowSelected(product)) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isRowSelected(product) ? '#d1fae5' : ''; }}
                >
                  <td className="px-5 py-3 text-gray-700 font-mono text-xs">{product.sku_code}</td>
                  <td className="px-5 py-3 text-gray-800">{product.name}</td>
                  <td className="px-5 py-3 text-gray-600">{product.unit}</td>
                  <td className="px-5 py-3 text-gray-600">{product.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <span className="text-sm text-gray-500">
            {selected.length > 0 ? `${selected.length} selected` : 'Click rows to select'}
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
              disabled={selected.length === 0}
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
