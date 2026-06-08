import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function AddProductsModal({ isOpen, onSelect, onClose, warehouseId }) {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      return;
    }
    setSelected([]);
    setError(null);
    setLoading(true);
    const params = {};
    if (warehouseId) params.has_stock_in_warehouse = warehouseId;
    api.get('/products', { params })
      .then((res) => setProducts(res.data.products))
      .catch(() => setError('Failed to load products.'))
      .finally(() => setLoading(false));
  }, [isOpen, warehouseId]);

  const filteredProducts = searchTerm
    ? products.filter((p) => {
        const term = searchTerm.toLowerCase();
        return p.name.toLowerCase().includes(term) || p.sku_code.toLowerCase().includes(term);
      })
    : products;

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
        productId: p.id,
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

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <div className="relative flex items-center w-full">
            <span className="absolute left-2 text-gray-400 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or SKU…"
              className="w-full border border-gray-300 rounded-lg pl-8 pr-7 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#409645]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
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
              {!loading && !error && products.length > 0 && filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-gray-400">No products match your search.</td>
                </tr>
              )}
              {!loading && !error && filteredProducts.map((product) => (
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
