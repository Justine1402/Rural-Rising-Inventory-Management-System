import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import AddProductsModal from '../../components/shared/AddProductsModal';
import PinVerificationModal from '../../components/shared/PinVerificationModal';
import { useAuth } from '../../context/AuthContext';
import { useWarehouse } from '../../context/WarehouseContext';

const fieldClass =
  'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#409645] bg-white transition';

export default function ReceiveOrderFormPage({ onClose, onSuccess }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeWarehouse, warehouses } = useWarehouse();
  const isAccomplish = !!id;

  const [selectedWarehouseId, setSelectedWarehouseId] = useState(activeWarehouse?.id ?? '');
  const [form, setForm] = useState({ supplier_name: '', delivery_fee: '', date_ordered: '', date_arrived: '' });
  const [items, setItems] = useState([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isAccomplish);
  const [error, setError] = useState(null);
  const [successCode, setSuccessCode] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isAccomplish) return;
    api.get(`/receive-orders/${id}`)
      .then((res) => {
        const o = res.data.order;
        setOrderData(o);
        setForm({ supplier_name: o.supplier_name, delivery_fee: o.delivery_fee, date_ordered: o.date_ordered, date_arrived: o.date_arrived ?? '' });
        setItems(o.items.map((i) => ({ ...i, quantity_arrived: parseFloat(i.quantity_arrived) || 0 })));
      })
      .catch(() => setError('Failed to load order.'))
      .finally(() => setFetchLoading(false));
  }, [id, isAccomplish]);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const orderCost = items.reduce((sum, i) => sum + (parseFloat(i.product_cost) || 0), 0);
  const total = orderCost + (parseFloat(form.delivery_fee) || 0);

  const handleAddProducts = (selected) => {
    setAddModalOpen(false);
    setItems((prev) => {
      const existing = new Set(prev.map((i) => i.product_code));
      return [
        ...prev,
        ...selected
          .filter((s) => !existing.has(s.productCode))
          .map((s) => ({ product_code: s.productCode, product_name: s.productName, unit: s.unit, category: s.category, quantity_ordered: '', quantity_arrived: '', harvest_date: '', product_cost: '' })),
      ];
    });
  };

  const setItemField = (index, field, value) =>
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));

  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = () => {
    if (!isAccomplish) {
      const missingHarvestDate = items.some(item => !item.harvest_date || item.harvest_date.trim() === '');
      if (missingHarvestDate) {
        setError('Harvest date is required for all items before proceeding.');
        return;
      }
    }
    setError(null);
    if (!isAccomplish) {
      if (!selectedWarehouseId) { setError('Please select a warehouse.'); return; }
      if (!form.supplier_name || !form.delivery_fee || !form.date_ordered) { setError('Please fill in all required fields.'); return; }
      if (items.length === 0) { setError('Add at least one product.'); return; }
      if (items.some((i) => !i.quantity_ordered || !i.product_cost)) { setError('Fill in Quantity Ordered and Product Cost for all items.'); return; }
    } else {
      if (!form.date_arrived) { setError('Date Arrived is required.'); return; }
      if (items.some((i) => parseFloat(i.quantity_arrived) < 0)) {
        setError('Quantity Arrived cannot be negative.');
        return;
      }
    }
    setPinOpen(true);
  };

  const handleVerify = async (pin) => {
    setPinOpen(false);
    setError(null);
    setLoading(true);
    try {
      if (!isAccomplish) {
        const res = await api.post('/receive-orders', {
          warehouse_id: selectedWarehouseId,
          supplier_name: form.supplier_name,
          delivery_fee: parseFloat(form.delivery_fee),
          date_ordered: form.date_ordered,
          pin,
          items: items.map((i) => ({ product_code: i.product_code, quantity_ordered: parseFloat(i.quantity_ordered), harvest_date: i.harvest_date || null, product_cost: parseFloat(i.product_cost) })),
        });
        setSuccessCode(res.data.order.code);
        setSubmitted(true);
        onSuccess?.();
      } else {
        const res = await api.post(`/receive-orders/${id}/complete`, {
          date_arrived: form.date_arrived,
          pin,
          items: items.map((i) => ({ id: i.id, quantity_arrived: parseFloat(i.quantity_arrived) || 0 })),
        });
        setSuccessCode(res.data.message);
        setSubmitted(true);
      }
    } catch (err) {
      setError(err.response?.data?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Blur overlay */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />

      {/* Card */}
      <div className={`fixed top-[105px] left-1/2 -translate-x-1/2 w-[960px] max-h-[85vh] bg-white shadow-2xl z-50 ${
        isAccomplish
          ? 'rounded-lg overflow-y-auto'
          : 'rounded-2xl overflow-y-auto'
      }`}>

        {fetchLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">Loading order…</div>
        ) : (
          <>
            {/* Header */}
            {isAccomplish ? (
              <div
                className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
                style={{ backgroundColor: '#1A381E' }}
              >
                <button
                  onClick={() => navigate('/receive-orders')}
                  className="flex items-center gap-2 text-sm font-semibold text-white hover:opacity-80"
                >
                  ← RETURN
                </button>
                <span className="text-sm font-semibold text-white font-mono">
                  {orderData?.code ?? ''}
                </span>
              </div>
            ) : (
              <div
                className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
                style={{ backgroundColor: '#1A381E' }}
              >
                <button
                  onClick={() => onClose?.()}
                  className="text-white text-sm font-medium hover:opacity-80 transition-opacity"
                >
                  ← RETURN
                </button>
                <span className="text-white font-semibold text-lg">Receive Order</span>
              </div>
            )}

            {/* Body */}
            <div className="px-8 py-6">

              {/* Section label */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Order Details
              </p>

              {/* Form fields */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6">
                <div>
                  {isAccomplish ? (
                    <>
                      <p className="text-sm text-gray-500 mb-0.5">Supplier Name</p>
                      <p className="text-sm font-medium text-gray-800">{form.supplier_name || '—'}</p>
                    </>
                  ) : (
                    <>
                      <label className="text-xs text-gray-500 mb-1 block">Supplier Name</label>
                      <input type="text" value={form.supplier_name} onChange={set('supplier_name')} disabled={submitted} className={fieldClass} />
                    </>
                  )}
                </div>
                <div>
                  {isAccomplish ? (
                    <>
                      <p className="text-sm text-gray-500 mb-0.5">Date Ordered</p>
                      <p className="text-sm font-medium text-gray-800">{form.date_ordered || '—'}</p>
                    </>
                  ) : (
                    <>
                      <label className="text-xs text-gray-500 mb-1 block">Date Ordered</label>
                      <input type="date" value={form.date_ordered} onChange={set('date_ordered')} disabled={submitted} className="date-input" />
                    </>
                  )}
                </div>
                <div>
                  {isAccomplish ? (
                    <>
                      <p className="text-sm text-gray-500 mb-0.5">Order Cost (PHP)</p>
                      <p className="text-sm font-medium text-gray-800">₱ {orderCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-gray-500 mb-0.5">Order Cost (PHP)</p>
                      <p className="font-semibold text-gray-800">₱ {orderCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                    </>
                  )}
                </div>
                <div>
                  {isAccomplish ? (
                    <>
                      <p className="text-xs text-gray-500 mb-1">Date Arrived</p>
                      <input type="date" value={form.date_arrived} onChange={set('date_arrived')} disabled={submitted} className="date-input" />
                    </>
                  ) : (
                    <>
                      <label className="text-xs text-gray-500 mb-1 block">Date Arrived</label>
                      <div className="opacity-50 cursor-not-allowed">
                        <input type="date" disabled className="date-input" />
                      </div>
                    </>
                  )}
                </div>
                <div>
                  {isAccomplish ? (
                    <>
                      <p className="text-sm text-gray-500 mb-0.5">Delivery Fee (PHP)</p>
                      <p className="text-sm font-medium text-gray-800">₱ {parseFloat(form.delivery_fee).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                    </>
                  ) : (
                    <>
                      <label className="text-xs text-gray-500 mb-1 block">Delivery Fee (PHP)</label>
                      <input type="number" min="0" value={form.delivery_fee} onChange={set('delivery_fee')} disabled={submitted} className={fieldClass} placeholder="0.00" />
                    </>
                  )}
                </div>
                <div>
                  {isAccomplish ? (
                    <>
                      <p className="text-sm text-gray-500 mb-0.5">Total (PHP)</p>
                      <p className="text-sm font-medium text-gray-800">₱ {total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-gray-500 mb-0.5">Total (PHP)</p>
                      <p className="font-semibold text-gray-800">₱ {total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                    </>
                  )}
                </div>
                {isAccomplish && (
                  <div>
                    <p className="text-sm text-gray-500 mb-0.5">Warehouse</p>
                    <p className="text-sm font-medium text-gray-800">{orderData?.warehouse ?? '—'}</p>
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    Product Details
                  </p>
                  {!isAccomplish && (
                    <div className="flex items-center gap-2">
                      {user?.role === 'manager' ? (
                        <div className="bg-gray-100 text-gray-700 border border-gray-300 rounded px-3 py-1.5 text-sm">
                          {activeWarehouse?.name ?? ''}
                        </div>
                      ) : (
                        <select
                          value={selectedWarehouseId}
                          onChange={(e) => setSelectedWarehouseId(e.target.value)}
                          disabled={submitted}
                          className="bg-gray-100 border border-transparent rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-[#1A381E] focus:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="">Select Warehouse</option>
                          {warehouses.map((w) => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                      )}
                      <button
                        onClick={() => setAddModalOpen(true)}
                        disabled={submitted}
                        className="text-xs font-bold text-white px-4 py-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: '#409645' }}
                      >
                        + Add Product
                      </button>
                    </div>
                  )}
                </div>
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-white" style={{ backgroundColor: '#1A381E' }}>
                        <th className="text-left font-semibold px-4 py-2.5">Product Code</th>
                        <th className="text-left font-semibold px-4 py-2.5">Product Name</th>
                        <th className="text-left font-semibold px-4 py-2.5">Qty Ordered</th>
                        <th className="text-left font-semibold px-4 py-2.5">Qty Arrived</th>
                        <th className="text-left font-semibold px-4 py-2.5">Harvest Date</th>
                        <th className="text-left font-semibold px-4 py-2.5">Product Cost (PHP)</th>
                        {!isAccomplish && <th className="px-4 py-2.5" />}
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 && (
                        <tr><td colSpan={isAccomplish ? 6 : 7} className="px-4 py-5 text-center text-gray-400">No products added yet.</td></tr>
                      )}
                      {items.map((item, idx) => (
                        <tr key={item.product_code ?? idx} className="border-t border-gray-100">
                          <td className="px-4 py-2 font-mono text-xs text-gray-700">{item.product_code}</td>
                          <td className="px-4 py-2 text-gray-800">{item.product_name}</td>
                          <td className="px-4 py-2">
                            {isAccomplish ? <span className="text-gray-600">{parseFloat(item.quantity_ordered)} {item.unit}</span>
                              : <div className="flex items-center gap-1.5">
                                  <input type="number" min="0" step="1" value={item.quantity_ordered} onChange={(e) => setItemField(idx, 'quantity_ordered', e.target.value)}
                                    disabled={submitted}
                                    className="w-24 bg-gray-100 border border-transparent rounded px-2 py-1 text-sm focus:outline-none focus:border-[#1A381E] focus:bg-white disabled:opacity-50" />
                                  <span className="text-xs text-gray-500">{item.unit}</span>
                                </div>}
                          </td>
                          <td className="px-4 py-2">
                            {isAccomplish
                              ? <div className="flex items-center gap-1.5">
                                  <input type="number" min="0" step="1" value={item.quantity_arrived} onChange={(e) => setItemField(idx, 'quantity_arrived', e.target.value)}
                                    disabled={submitted}
                                    className="w-24 bg-gray-100 border border-transparent rounded px-2 py-1 text-sm focus:outline-none focus:border-[#1A381E] focus:bg-white disabled:opacity-50" />
                                  <span className="text-xs text-gray-500">{item.unit}</span>
                                </div>
                              : <span className="text-gray-400">—</span>}
                          </td>
                          <td className="px-4 py-2">
                            {isAccomplish ? <span className="text-gray-600">{item.harvest_date ?? '—'}</span>
                              : <input type="date" value={item.harvest_date || ''} onChange={(e) => setItemField(idx, 'harvest_date', e.target.value)}
                                  disabled={submitted}
                                  className="bg-gray-100 border border-transparent rounded px-2 py-1 text-sm focus:outline-none focus:border-[#1A381E] focus:bg-white disabled:opacity-50" />}
                          </td>
                          <td className="px-4 py-2">
                            {isAccomplish ? <span className="text-gray-600">₱ {parseFloat(item.product_cost).toFixed(2)}</span>
                              : <input type="number" min="0" step="0.01" value={item.product_cost} onChange={(e) => setItemField(idx, 'product_cost', e.target.value)}
                                  disabled={submitted}
                                  className="w-28 bg-gray-100 border border-transparent rounded px-2 py-1 text-sm focus:outline-none focus:border-[#1A381E] focus:bg-white disabled:opacity-50" placeholder="0.00" />}
                          </td>
                          {!isAccomplish && (
                            <td className="px-4 py-2">
                              {!submitted && (
                                <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 text-xs font-medium">Remove</button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

              {/* Footer */}
              <div className="flex items-center justify-end gap-3">
                {successCode && (
                  isAccomplish ? (
                    <span className="px-4 py-2 text-sm font-bold rounded-lg" style={{ color: '#409645' }}>
                      {successCode}
                    </span>
                  ) : (
                    <span className="px-4 py-2 text-sm font-medium text-gray-500 bg-gray-200 rounded-lg">
                      Created {successCode}
                    </span>
                  )
                )}
                <button
                  onClick={handleSubmit}
                  disabled={loading || !!successCode}
                  className={`px-8 py-2.5 text-sm font-bold text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed ${isAccomplish ? 'btn-brand' : ''}`}
                  style={isAccomplish ? undefined : { backgroundColor: '#409645' }}
                >
                  {loading ? 'Saving…' : isAccomplish ? 'COMPLETE' : 'CREATE'}
                </button>
              </div>

            </div>
          </>
        )}
      </div>

      <AddProductsModal isOpen={addModalOpen} onSelect={handleAddProducts} onClose={() => setAddModalOpen(false)} />
      <PinVerificationModal isOpen={pinOpen} onVerify={handleVerify} onClose={() => setPinOpen(false)} />
    </>
  );
}
