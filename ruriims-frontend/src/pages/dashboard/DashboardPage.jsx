import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import WarehouseTabs from '../../components/layout/WarehouseTabs';
import StatusBadge from '../../components/ui/StatusBadge';
import api from '../../api/axios';
import { useUI } from '../../context/UIContext';
import { useWarehouse } from '../../context/WarehouseContext';
import { formatDate } from '../../utils/formatDate';

export default function DashboardPage() {
  const location = useLocation();
  const { productRefreshKey, setProductDetailOverlayProductId } = useUI();
  const { activeWarehouse, warehouses } = useWarehouse();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortMode, setSortMode] = useState('LIFO');

  const permanentWarehouses = warehouses.filter((w) => !w.isTemporary);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysUntilExpiry = (harvestDateStr, shelfLife) => {
    if (!harvestDateStr || shelfLife == null) return null;
    const harvest = new Date(harvestDateStr + 'T00:00:00');
    const expiry = new Date(harvest);
    expiry.setDate(expiry.getDate() + shelfLife);
    return Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
  };

  const getOldestActiveHarvestDate = (product) => {
    const perWh = product.harvest_date_per_warehouse ?? {};
    const stock = product.warehouse_stock ?? {};
    const dates = Object.entries(perWh)
      .filter(([whId, date]) => date && parseFloat(stock[whId] ?? 0) > 0)
      .map(([, date]) => date);
    if (dates.length === 0) return null;
    return dates.slice().sort()[0];
  };

  const getNewestActiveHarvestDate = (product) => {
    const perWh = product.harvest_date_per_warehouse ?? {};
    const stock = product.warehouse_stock ?? {};
    const dates = Object.entries(perWh)
      .filter(([whId, date]) => date && parseFloat(stock[whId] ?? 0) > 0)
      .map(([, date]) => date);
    if (dates.length === 0) return null;
    return dates.slice().sort().at(-1);
  };

  const getWarehouseCodeForDate = (product, targetDate) => {
    if (!targetDate) return null;
    const perWh = product.harvest_date_per_warehouse ?? {};
    const stock = product.warehouse_stock ?? {};
    const matchingWhId = Object.entries(perWh).find(
      ([whId, date]) => date === targetDate && parseFloat(stock[whId] ?? 0) > 0
    )?.[0];
    if (!matchingWhId) return null;
    const wh = warehouses.find((w) => String(w.id) === String(matchingWhId));
    return wh?.code ?? null;
  };

  const displayedProducts = products
    .filter((p) => !selectedCategory || p.category === selectedCategory)
    .sort((a, b) => {
      const getSortDate = (product) => {
        if (activeWarehouse) {
          return product.harvest_date_per_warehouse?.[activeWarehouse.id] ?? null;
        }
        if (sortMode === 'LIFO') return getNewestActiveHarvestDate(product);
        return getOldestActiveHarvestDate(product);
      };

      if (sortMode === 'FIFO') {
        const dA = getSortDate(a);
        const dB = getSortDate(b);
        if (!dA && !dB) return 0;
        if (!dA) return 1;
        if (!dB) return -1;
        return new Date(dA) - new Date(dB);
      }
      if (sortMode === 'LIFO') {
        const dA = getSortDate(a);
        const dB = getSortDate(b);
        if (!dA && !dB) return 0;
        if (!dA) return 1;
        if (!dB) return -1;
        return new Date(dB) - new Date(dA);
      }
      if (sortMode === 'FEFO') {
        const expA = getDaysUntilExpiry(getSortDate(a), a.shelf_life);
        const expB = getDaysUntilExpiry(getSortDate(b), b.shelf_life);
        if (expA === null && expB === null) return 0;
        if (expA === null) return 1;
        if (expB === null) return -1;
        return expA - expB;
      }
      return 0;
    });

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
  const isAllWarehouses = activeWarehouse === null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        sortMode={sortMode}
        onSortModeChange={setSortMode}
      />

      <main className="flex-1 p-5">
        <div className="bg-white rounded-xl shadow overflow-hidden">

          {isTwh ? (
            /* ── Branch A: Temporary Warehouse simplified table ── */
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white" style={{ backgroundColor: '#1A381E' }}>
                  <th className="text-left font-semibold px-5 py-3">Name</th>
                  <th className="text-left font-semibold px-5 py-3">Quantity</th>
                  <th className="text-left font-semibold px-5 py-3">
                    {sortMode === 'FEFO' ? 'Days Until Expiry' : 'Harvest Date'}
                  </th>
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
                {!loading && !error && displayedProducts.map((product) => {
                  const qty = product.warehouse_stock?.[activeWarehouse.id] ?? 0;
                  const twhStatus = qty > 0 ? 'In Stock' : 'Out of Stock';
                  const twhHarvestDate = product.harvest_date_per_warehouse?.[activeWarehouse.id] ?? null;

                  let harvestCell;
                  if (sortMode === 'FEFO') {
                    const days = getDaysUntilExpiry(twhHarvestDate, product.shelf_life);
                    if (days === null || qty === 0) {
                      harvestCell = <td className="px-5 py-3 text-gray-600">—</td>;
                    } else if (days >= 0) {
                      harvestCell = <td className="px-5 py-3 text-gray-600">{days} days</td>;
                    } else {
                      harvestCell = <td className="px-5 py-3 font-medium" style={{ color: '#DC2626' }}>Expired for {Math.abs(days)} days</td>;
                    }
                  } else {
                    harvestCell = <td className="px-5 py-3 text-gray-600">{qty > 0 ? (twhHarvestDate ?? '—') : '—'}</td>;
                  }

                  return (
                    <tr key={product.sku_code} className="border-b border-gray-100 odd:bg-white even:bg-gray-50 hover:bg-gray-100 cursor-pointer" onClick={() => setProductDetailOverlayProductId(product.id)}>
                      <td className="px-5 py-3 text-gray-800">{product.name}</td>
                      <td className="px-5 py-3 text-gray-600">
                        {qty.toLocaleString('en-PH', { maximumFractionDigits: 3 })} {product.unit}
                      </td>
                      {harvestCell}
                      <td className="px-5 py-3">
                        <StatusBadge status={twhStatus} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : isAllWarehouses ? (
            /* ── Branch B: All Warehouses — multi-column table ── */
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white" style={{ backgroundColor: '#1A381E' }}>
                  <th className="text-left font-semibold px-5 py-3">Name</th>
                  {permanentWarehouses.map((w) => (
                    <th key={w.id} className="text-left font-semibold px-5 py-3">{w.name}</th>
                  ))}
                  <th className="text-left font-semibold px-5 py-3">Total</th>
                  <th className="text-left font-semibold px-5 py-3">
                    {sortMode === 'FEFO' ? 'Days Until Expiry' : 'Harvest Date'}
                  </th>
                  <th className="text-left font-semibold px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={permanentWarehouses.length + 4} className="px-5 py-6 text-center text-gray-400">
                      Loading products…
                    </td>
                  </tr>
                )}
                {error && (
                  <tr>
                    <td colSpan={permanentWarehouses.length + 4} className="px-5 py-6 text-center text-red-500">
                      {error}
                    </td>
                  </tr>
                )}
                {!loading && !error && products.length === 0 && (
                  <tr>
                    <td colSpan={permanentWarehouses.length + 4} className="px-5 py-6 text-center text-gray-400">
                      No products yet. Use &quot;+ Create Product&quot; to add one.
                    </td>
                  </tr>
                )}
                {!loading && !error && displayedProducts.map((product) => {
                  let harvestCell;
                  if (sortMode === 'FIFO') {
                    const fifoDate = getOldestActiveHarvestDate(product);
                    const fifoWhCode = getWarehouseCodeForDate(product, fifoDate);
                    harvestCell = (
                      <td className="px-5 py-3 text-gray-600">
                        <div className="flex flex-col">
                          <span>{fifoDate ? formatDate(fifoDate) : '—'}</span>
                          {fifoWhCode && (
                            <span className="text-xs font-medium mt-0.5" style={{ color: '#409645' }}>
                              {fifoWhCode}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  } else if (sortMode === 'LIFO') {
                    const lifoDate = getNewestActiveHarvestDate(product);
                    const lifoWhCode = getWarehouseCodeForDate(product, lifoDate);
                    harvestCell = (
                      <td className="px-5 py-3 text-gray-600">
                        <div className="flex flex-col">
                          <span>{lifoDate ? formatDate(lifoDate) : '—'}</span>
                          {lifoWhCode && (
                            <span className="text-xs font-medium mt-0.5" style={{ color: '#409645' }}>
                              {lifoWhCode}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  } else {
                    const fefoDate = getOldestActiveHarvestDate(product);
                    const fefoWhCode = getWarehouseCodeForDate(product, fefoDate);
                    const days = getDaysUntilExpiry(fefoDate, product.shelf_life);
                    harvestCell = (
                      <td className="px-5 py-3 text-gray-600">
                        <div className="flex flex-col">
                          {days === null
                            ? <span>—</span>
                            : days >= 0
                              ? <span>{days} days</span>
                              : <span className="font-medium" style={{ color: '#DC2626' }}>Expired for {Math.abs(days)} days</span>
                          }
                          {fefoWhCode && (
                            <span className="text-xs font-medium mt-0.5" style={{ color: '#409645' }}>
                              {fefoWhCode}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  }

                  return (
                    <tr key={product.sku_code} className="border-b border-gray-100 odd:bg-white even:bg-gray-50 hover:bg-gray-100 cursor-pointer" onClick={() => setProductDetailOverlayProductId(product.id)}>
                      <td className="px-5 py-3 text-gray-800">{product.name}</td>
                      {permanentWarehouses.map((w) => (
                        <td key={w.id} className="px-5 py-3 text-gray-600">
                          {(product.warehouse_stock?.[w.id] ?? 0).toLocaleString('en-PH', { maximumFractionDigits: 3 })} {product.unit}
                        </td>
                      ))}
                      <td className="px-5 py-3 font-medium text-gray-800">
                        {permanentWarehouses
                          .reduce((sum, w) => sum + (product.warehouse_stock?.[w.id] ?? 0), 0)
                          .toLocaleString('en-PH', { maximumFractionDigits: 3 })} {product.unit}
                      </td>
                      {harvestCell}
                      <td className="px-5 py-3">
                        <StatusBadge status={product.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            /* ── Branch C: Specific permanent warehouse — single-warehouse table ── */
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white" style={{ backgroundColor: '#1A381E' }}>
                  <th className="text-left font-semibold px-5 py-3">Name</th>
                  <th className="text-left font-semibold px-5 py-3">Quantity</th>
                  <th className="text-left font-semibold px-5 py-3">
                    {sortMode === 'FEFO' ? 'Days Until Expiry' : 'Harvest Date'}
                  </th>
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
                      No products in stock at this warehouse.
                    </td>
                  </tr>
                )}
                {!loading && !error && displayedProducts.map((product) => {
                  const qty = product.warehouse_stock?.[activeWarehouse.id] ?? 0;
                  const warehouseStatus = qty > 0 ? 'In Stock' : 'Out of Stock';
                  const whHarvestDate = product.harvest_date_per_warehouse?.[activeWarehouse.id] ?? null;

                  let harvestCell;
                  if (sortMode === 'FEFO') {
                    const days = getDaysUntilExpiry(whHarvestDate, product.shelf_life);
                    if (days === null || qty === 0) {
                      harvestCell = <td className="px-5 py-3 text-gray-600">—</td>;
                    } else if (days >= 0) {
                      harvestCell = <td className="px-5 py-3 text-gray-600">{days} days</td>;
                    } else {
                      harvestCell = <td className="px-5 py-3 font-medium" style={{ color: '#DC2626' }}>Expired for {Math.abs(days)} days</td>;
                    }
                  } else {
                    harvestCell = <td className="px-5 py-3 text-gray-600">{whHarvestDate ?? '—'}</td>;
                  }

                  return (
                    <tr key={product.sku_code} className="border-b border-gray-100 odd:bg-white even:bg-gray-50 hover:bg-gray-100 cursor-pointer" onClick={() => setProductDetailOverlayProductId(product.id)}>
                      <td className="px-5 py-3 text-gray-800">{product.name}</td>
                      <td className="px-5 py-3 text-gray-600">
                        {qty.toLocaleString('en-PH', { maximumFractionDigits: 3 })} {product.unit}
                      </td>
                      {harvestCell}
                      <td className="px-5 py-3">
                        <StatusBadge status={warehouseStatus} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          <WarehouseTabs />
        </div>
      </main>
    </div>
  );
}
