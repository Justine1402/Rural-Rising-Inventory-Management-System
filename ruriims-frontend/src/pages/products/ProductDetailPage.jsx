import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/layout/Navbar';
import WarehouseTabs from '../../components/layout/WarehouseTabs';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/products/${id}`)
      .then((res) => setProduct(res.data.product ?? res.data))
      .catch((err) => {
        if (err.response?.status === 404) {
          setError('not_found');
        } else {
          setError('Failed to load product. Please refresh.');
        }
      })
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
              className="btn-brand text-white text-xs font-medium px-3 py-1.5 rounded transition-colors"
            >
              ← RETURN
            </button>
            {product && (
              <span className="text-white font-bold text-base tracking-wide">
                {product.sku_code}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {loading && (
              <p className="text-center text-gray-400 py-8">Loading...</p>
            )}
            {!loading && error === 'not_found' && (
              <div className="text-center py-8">
                <p className="text-red-500 mb-4">Product not found.</p>
                <button
                  onClick={() => navigate(-1)}
                  className="btn-brand text-white text-xs font-medium px-3 py-1.5 rounded transition-colors"
                >
                  ← RETURN
                </button>
              </div>
            )}
            {!loading && error && error !== 'not_found' && (
              <p className="text-center text-red-500 py-8">{error}</p>
            )}
            {!loading && !error && product && (
              <div className="grid grid-cols-2 gap-x-8 gap-y-6 max-w-xl">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Name</p>
                  <p className="text-sm text-gray-800 font-medium">{product.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Unit</p>
                  <p className="text-sm text-gray-800 font-medium">{product.unit}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Category</p>
                  <p className="text-sm text-gray-800 font-medium">{product.category}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Shelf Life</p>
                  <p className="text-sm text-gray-800 font-medium">{product.shelf_life} days</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
