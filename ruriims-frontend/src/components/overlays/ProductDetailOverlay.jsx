import { useEffect, useState } from 'react';
import { useUI } from '../../context/UIContext';
import { useWarehouse } from '../../context/WarehouseContext';
import api from '../../api/axios';

const isExpired = (harvestDate, shelfLifeDays) => {
  if (!harvestDate || !shelfLifeDays) return false;
  const expiry = new Date(harvestDate);
  expiry.setDate(expiry.getDate() + Number(shelfLifeDays));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  return today >= expiry;
};

export default function ProductDetailOverlay() {
  const { productDetailOverlayProductId, setProductDetailOverlayProductId } = useUI();
  const { activeWarehouse } = useWarehouse();

  const id = productDetailOverlayProductId;

  const [product, setProduct] = useState(null);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id === null) {
      setProduct(null);
      setBatches([]);
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const warehouseParam = activeWarehouse ? `?warehouse_id=${activeWarehouse.id}` : '';
    api.get(`/products/${id}/batches${warehouseParam}`)
      .then((res) => {
        if (cancelled) return;
        setProduct(res.data.product);
        setBatches(res.data.batches);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Failed to load product details.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id, activeWarehouse]);

  if (id === null) return null;

  const handleClose = () => setProductDetailOverlayProductId(null);

  const fields = product
    ? [
        ['Product Name', product.name],
        ['Category', product.category],
        ['Unit', product.unit],
        ['Shelf Life', product.shelf_life != null ? `${product.shelf_life} days` : '—'],
      ]
    : [];

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={handleClose}
      />
      <div
        className="fixed top-[105px] left-1/2 -translate-x-1/2 w-[700px] max-h-[calc(100vh-130px)] overflow-y-auto bg-white rounded-lg shadow-xl z-50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
          style={{ backgroundColor: '#1A381E' }}
        >
          <button
            onClick={handleClose}
            className="flex items-center gap-2 text-sm font-semibold text-white hover:opacity-80"
          >
            ← RETURN
          </button>
          <span className="text-sm font-semibold text-white">
            {product?.sku_code ?? ''}
          </span>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {loading && (
            <p className="text-gray-400 text-sm text-center py-10">Loading…</p>
          )}

          {!loading && error && (
            <p className="text-red-500 text-sm text-center py-10">{error}</p>
          )}

          {!loading && !error && product && (
            <>
              {/* Section 1 — Product Master Data */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Product Information
              </p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8">
                {fields.map(([label, value]) => (
                  <div key={label}>
                    <p className="text-sm text-gray-500 mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-gray-800">{value}</p>
                  </div>
                ))}
              </div>

              {/* Section 2 — Active Batches */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Active Batches
              </p>
              {batches.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  No active stock batches.
                </p>
              ) : (
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-white" style={{ backgroundColor: '#1A381E' }}>
                        <th className="text-left font-semibold px-4 py-2.5">Stock-In-Use Code</th>
                        <th className="text-left font-semibold px-4 py-2.5">Warehouse</th>
                        <th className="text-left font-semibold px-4 py-2.5">Quantity</th>
                        <th className="text-left font-semibold px-4 py-2.5">Harvest Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batches.map((b, i) => (
                        <tr key={i} className="border-t border-gray-100 odd:bg-white even:bg-gray-50">
                          <td
                            className="px-4 py-2.5 font-mono text-xs"
                            style={isExpired(b.harvest_date, product.shelf_life) ? { color: '#DC2626' } : undefined}
                          >
                            {b.code}
                          </td>
                          <td className="px-4 py-2.5 text-gray-700">{b.warehouse}</td>
                          <td className="px-4 py-2.5 text-gray-700">
                            {parseFloat(b.quantity)} {product.unit}
                          </td>
                          <td className="px-4 py-2.5 text-gray-700">{b.harvest_date ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
