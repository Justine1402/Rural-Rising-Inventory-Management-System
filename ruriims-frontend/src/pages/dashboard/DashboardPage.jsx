import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import WarehouseTabs from '../../components/layout/WarehouseTabs';
import StatusBadge from '../../components/ui/StatusBadge';
import api from '../../api/axios';
import { useUI } from '../../context/UIContext';
import { useWarehouse } from '../../context/WarehouseContext';

export default function DashboardPage() {
  const location = useLocation();
  const { productRefreshKey } = useUI();
  const { activeWarehouse, warehouses } = useWarehouse();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const permanentWarehouses = warehouses.filter((w) => !w.isTemporary);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get('/products')
      .then((res) => {
        setProducts(res.data.products);
      })
      .catch(() => setError('Failed to load products. Please refresh.'))
      .finally(() => setLoading(false));
  }, [location.key, productRefreshKey]);

  const isTwh = activeWarehouse?.isTemporary === true;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-1 p-5">
        <div className="bg-white rounded-xl shadow overflow-hidden">

          {isTwh ? (
            /* ── Temporary Warehouse simplified table ── */
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1A381E] text-white">
                  <th className="text-left font-semibold px-5 py-3">Name</th>
                  <th className="text-left font-semibold px-5 py-3">Quantity</th>
                  <th className="text-left font-semibold px-5 py-3">Harvest Date</th>
                  <th className="text-left font-semibold px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={4} className="px-5 py-6 text-center text-gray-400">
                      Loading products…
                    </td>
                  </tr>
                )}
                {error && (
                  <tr>
                    <td colSpan={4} className="px-5 py-6 text-center text-red-500">
                      {error}
                    </td>
                  </tr>
                )}
                {!loading && !error && products.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-6 text-center text-gray-400">
                      No products yet. Use &quot;+ Create Product&quot; to add one.
                    </td>
                  </tr>
                )}
                {!loading && !error && products.map((product) => {
                  const qty = product.warehouse_stock?.[activeWarehouse.id] ?? 0;
                  const twhStatus = qty > 0 ? 'In Stock' : 'Out of Stock';
                  const perWarehouseHarvest = product.harvest_date_per_warehouse?.[activeWarehouse.id];
                  const harvestDisplay = qty > 0 ? (perWarehouseHarvest ?? '—') : '—';
                  return (
                    <tr key={product.sku_code} className="border-b border-gray-100 odd:bg-white even:bg-gray-50 hover:bg-gray-100 cursor-pointer">
                      <td className="px-5 py-3 text-gray-800">{product.name}</td>
                      <td className="px-5 py-3 text-gray-600">
                        {qty.toLocaleString('en-PH', { maximumFractionDigits: 3 })} {product.unit}
                      </td>
                      <td className="px-5 py-3 text-gray-600">{harvestDisplay}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={twhStatus} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            /* ── Standard multi-warehouse table ── */
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1A381E] text-white">
                  <th className="text-left font-semibold px-5 py-3">Name</th>
                  {permanentWarehouses.map((w) => (
                    <th key={w.id} className="text-left font-semibold px-5 py-3">{w.name}</th>
                  ))}
                  <th className="text-left font-semibold px-5 py-3">Harvest Date</th>
                  <th className="text-left font-semibold px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={permanentWarehouses.length + 3} className="px-5 py-6 text-center text-gray-400">
                      Loading products…
                    </td>
                  </tr>
                )}
                {error && (
                  <tr>
                    <td colSpan={permanentWarehouses.length + 3} className="px-5 py-6 text-center text-red-500">
                      {error}
                    </td>
                  </tr>
                )}
                {!loading && !error && products.length === 0 && (
                  <tr>
                    <td colSpan={permanentWarehouses.length + 3} className="px-5 py-6 text-center text-gray-400">
                      No products yet. Use &quot;+ Create Product&quot; to add one.
                    </td>
                  </tr>
                )}
                {!loading && !error && products.map((product) => (
                  <tr key={product.sku_code} className="border-b border-gray-100 odd:bg-white even:bg-gray-50 hover:bg-gray-100 cursor-pointer">
                    <td className="px-5 py-3 text-gray-800">{product.name}</td>
                    {permanentWarehouses.map((w) => (
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
          )}

          <WarehouseTabs />
        </div>
      </main>
    </div>
  );
}
