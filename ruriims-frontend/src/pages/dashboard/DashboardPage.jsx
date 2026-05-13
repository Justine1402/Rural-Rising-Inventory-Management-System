import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import WarehouseTabs from '../../components/layout/WarehouseTabs';
import StatusBadge from '../../components/ui/StatusBadge';
import api from '../../api/axios';
import { useUI } from '../../context/UIContext';

export default function DashboardPage() {
  const location = useLocation();
  const { productRefreshKey } = useUI();
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get('/products')
      .then((res) => {
        setProducts(res.data.products);
        setWarehouses(res.data.warehouses ?? []);
      })
      .catch(() => setError('Failed to load products. Please refresh.'))
      .finally(() => setLoading(false));
  }, [location.key, productRefreshKey]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-1 p-5">
        <div className="bg-white rounded-xl shadow overflow-hidden">

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1A381E] text-white">
                <th className="text-left font-semibold px-5 py-3">Name</th>
                {warehouses.map((w) => (
                  <th key={w.id} className="text-left font-semibold px-5 py-3">{w.name}</th>
                ))}
                <th className="text-left font-semibold px-5 py-3">Harvest Date</th>
                <th className="text-left font-semibold px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={warehouses.length + 3} className="px-5 py-6 text-center text-gray-400">
                    Loading products…
                  </td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={warehouses.length + 3} className="px-5 py-6 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && products.length === 0 && (
                <tr>
                  <td colSpan={warehouses.length + 3} className="px-5 py-6 text-center text-gray-400">
                    No products yet. Use "+ Create Product" to add one.
                  </td>
                </tr>
              )}
              {!loading && !error && products.map((product) => (
                <tr key={product.sku_code} className="border-b border-gray-100 odd:bg-white even:bg-gray-50 hover:bg-gray-100 cursor-pointer">
                  <td className="px-5 py-3 text-gray-800">{product.name}</td>
                  {warehouses.map((w) => (
                    <td key={w.id} className="px-5 py-3 text-gray-600">
                      {(product.warehouse_stock?.[w.id] ?? 0).toLocaleString('en-PH', { maximumFractionDigits: 3 })} {product.unit}
                    </td>
                  ))}
                  <td className="px-5 py-3 text-gray-600">{product.harvest_date ?? '—'}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={product.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <WarehouseTabs />
        </div>
      </main>
    </div>
  );
}
