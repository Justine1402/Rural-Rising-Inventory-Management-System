import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/layout/Navbar';
import ReportsFilterBar from '../../components/shared/ReportsFilterBar';
import StatusBadge from '../../components/ui/StatusBadge';
import { useWarehouse } from '../../context/WarehouseContext';
import { formatDate } from '../../utils/formatDate';

function ProductDetailInline({ productId }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);
    setProduct(null);
    api.get(`/products/${productId}`)
      .then((res) => { if (!isCancelled) setProduct(res.data.product); })
      .catch(() => { if (!isCancelled) setError('Failed to load product details.'); })
      .finally(() => { if (!isCancelled) setLoading(false); });
    return () => { isCancelled = true; };
  }, [productId]);

  if (loading) return <p className="px-6 py-8 text-center text-gray-400 text-sm">Loading…</p>;
  if (error)   return <p className="px-6 py-8 text-center text-red-500 text-sm">{error}</p>;
  if (!product) return null;

  const fields = [
    { label: 'Product Name', value: product.name },
    { label: 'Unit',         value: product.unit },
    { label: 'Category',     value: product.category },
    { label: 'Shelf Life',   value: `${product.shelf_life} days` },
  ];

  return (
    <div className="px-6 py-6 grid grid-cols-2 gap-x-12 gap-y-5">
      {fields.map(({ label, value }) => (
        <div key={label}>
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className="text-sm font-semibold text-gray-800">{value}</p>
        </div>
      ))}
    </div>
  );
}

export default function ProductReportsPage() {
  const location = useLocation();
  const { warehouses } = useWarehouse();

  const [products, setProducts]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [warehouseId, setWarehouseId]       = useState('');
  const [dateFrom, setDateFrom]             = useState('');
  const [dateTo, setDateTo]                 = useState('');
  const [search, setSearch]                 = useState('');
  const [selectedProductId, setSelectedProductId] = useState(null);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    const params = {};
    if (warehouseId) params.warehouse_id = warehouseId;
    if (dateFrom)    params.date_from    = dateFrom;
    if (dateTo)      params.date_to      = dateTo;
    if (search)      params.search       = search;

    api.get('/reports/products', { params })
      .then((res) => { if (!isCancelled) setProducts(res.data.products); })
      .catch(() => { if (!isCancelled) setError('Failed to load. Please refresh.'); })
      .finally(() => { if (!isCancelled) setLoading(false); });

    return () => { isCancelled = true; };
  }, [warehouseId, dateFrom, dateTo, search, location.key]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="p-6">
        <div className="bg-white rounded shadow">
          <ReportsFilterBar
            warehouses={warehouses}
            currentType="products"
            onTypeChange={() => {}}
            warehouseId={warehouseId}
            onWarehouseChange={setWarehouseId}
            dateFrom={dateFrom}
            onDateFromChange={setDateFrom}
            dateTo={dateTo}
            onDateToChange={setDateTo}
            search={search}
            onSearchChange={setSearch}
            showPdfButton={false}
          />

          {error && <p className="px-4 py-3 text-red-500 text-sm">{error}</p>}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white" style={{ backgroundColor: '#1A381E' }}>
                  <th className="text-left font-semibold px-4 py-3">Product Code</th>
                  <th className="text-left font-semibold px-4 py-3">Product Name</th>
                  <th className="text-left font-semibold px-4 py-3">Shelf Life</th>
                  <th className="text-left font-semibold px-4 py-3">Date Created</th>
                  <th className="text-left font-semibold px-4 py-3">Created By</th>
                  <th className="text-left font-semibold px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-400">Loading...</td>
                  </tr>
                )}
                {!loading && !error && products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-400">No products found.</td>
                  </tr>
                )}
                {!loading && !error && products.map((row, idx) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedProductId(row.id)}
                    className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 cursor-pointer`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{row.product_code}</td>
                    <td className="px-4 py-3 text-gray-800">{row.product_name}</td>
                    <td className="px-4 py-3 text-gray-600">{row.shelf_life} days</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(row.date_created)}</td>
                    <td className="px-4 py-3 text-gray-600">{row.created_by}</td>
                    <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedProductId && (
        <>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setSelectedProductId(null)}
          />
          <div className="fixed top-[105px] left-1/2 -translate-x-1/2 w-[700px] max-h-[calc(100vh-130px)] overflow-y-auto bg-white rounded-lg shadow-xl z-50">
            <div
              className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
              style={{ backgroundColor: '#1A381E' }}
            >
              <button
                onClick={() => setSelectedProductId(null)}
                className="text-white text-sm font-medium hover:underline"
              >
                ← RETURN
              </button>
              <span className="text-white font-semibold text-sm">
                {products.find(p => p.id === selectedProductId)?.product_code}
              </span>
            </div>
            <ProductDetailInline productId={selectedProductId} />
          </div>
        </>
      )}
    </div>
  );
}
