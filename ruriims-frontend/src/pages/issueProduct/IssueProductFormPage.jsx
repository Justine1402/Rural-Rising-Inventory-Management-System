import { useState } from 'react';
import api from '../../api/axios';
import AddProductsModal from '../../components/shared/AddProductsModal';
import PinVerificationModal from '../../components/shared/PinVerificationModal';
import StockInUseModal from '../../components/shared/StockInUseModal';
import { useAuth } from '../../context/AuthContext';
import { useWarehouse } from '../../context/WarehouseContext';

const readonlyClass =
  'w-full bg-gray-100 border border-transparent rounded-lg px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed';
const fieldClass =
  'w-full bg-gray-100 border border-transparent rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1A381E] focus:bg-white transition';

const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const todayISO = new Date().toISOString().split('T')[0];

export default function IssueProductFormPage({ onClose, onSuccess }) {
  const { user } = useAuth();
  const { activeWarehouse } = useWarehouse();

  const [issueType, setIssueType] = useState('');
  const [items, setItems] = useState([]);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [stockInUseModal, setStockInUseModal] = useState({ open: false, rowIndex: null, skuCode: null });
  const [pinOpen, setPinOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successCode, setSuccessCode] = useState(null);

  const handleAddProducts = (selected) => {
    setAddModalOpen(false);
    setItems((prev) => {
      const existing = new Set(prev.map((i) => i.product_code));
      return [
        ...prev,
        ...selected
          .filter((s) => !existing.has(s.productCode))
          .map((s) => ({
            product_id: s.productId,
            product_code: s.productCode,
            product_name: s.productName,
            unit: s.unit,
            category: s.category,
            stock_in_use_id: null,
            stock_in_use_code: null,
            quantity_issued: '',
            harvest_date: null,
            note: '',
          })),
      ];
    });
  };

  const handleBatchSelect = (batch) => {
    const { rowIndex } = stockInUseModal;
    setItems((prev) =>
      prev.map((item, i) =>
        i === rowIndex
          ? { ...item, stock_in_use_id: batch.id, stock_in_use_code: batch.code, harvest_date: batch.harvest_date, batch_quantity: batch.quantity }
          : item
      )
    );
    setStockInUseModal({ open: false, rowIndex: null, skuCode: null });
  };

  const openStockInUseModal = (rowIndex) => {
    if (!activeWarehouse?.id) {
      setError('No active warehouse selected.');
      return;
    }
    setError(null);
    setStockInUseModal({ open: true, rowIndex, skuCode: items[rowIndex].product_code });
  };

  const setItemField = (index, field, value) =>
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));

  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const getRowError = (item) => {
    const qty = parseFloat(item.quantity_issued);
    if (!qty || qty <= 0) return null;
    if (!item.stock_in_use_id) return 'Select a Stock-In-Use Code first.';
    if (item.batch_quantity != null && qty > item.batch_quantity) {
      return `Batch ${item.stock_in_use_code} only has ${item.batch_quantity} ${item.unit}.`;
    }
    return null;
  };
  const hasRowErrors = items.some((item) => getRowError(item) !== null);

  const handleSubmit = () => {
    setError(null);
    if (!issueType) { setError('Please select an Issue Type.'); return; }
    if (items.length === 0) { setError('Add at least one product.'); return; }
    if (items.some((i) => !i.stock_in_use_id)) { setError('Select a Stock-In-Use batch for every product.'); return; }
    if (items.some((i) => !i.quantity_issued || parseFloat(i.quantity_issued) <= 0)) {
      setError('Enter a valid Quantity Issued for every product.');
      return;
    }
    setPinOpen(true);
  };

  const handleVerify = async (pin) => {
    setPinOpen(false);
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/issue-products', {
        warehouse_id: activeWarehouse.id,
        issue_type: issueType,
        date_issued: todayISO,
        pin,
        items: items.map((i) => ({
          product_id: i.product_id,
          stock_in_use_id: i.stock_in_use_id,
          quantity_issued: parseFloat(i.quantity_issued),
          harvest_date: i.harvest_date ?? null,
          note: i.note || null,
        })),
      });
      setSuccessCode(res.data.issue.code);
      onSuccess?.();
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
      <div className="fixed top-[105px] left-1/2 -translate-x-1/2 w-[960px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 flex-shrink-0">
          <button
            onClick={() => onClose?.()}
            className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg"
            style={{ backgroundColor: '#409645' }}
          >
            RETURN
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Issue Products</h1>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-auto px-8 pb-6">

          {/* Top form fields */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-6">
            <div>
              <label className="block text-sm text-gray-500 mb-1.5">Issued By</label>
              <div className={readonlyClass}>{user?.name ?? ''}</div>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1.5">Date Requested</label>
              <div className={readonlyClass}>{today}</div>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1.5">Warehouse</label>
              <div className={readonlyClass}>{activeWarehouse?.name ?? ''}</div>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1.5">Issue Type</label>
              <div className="relative">
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className={`${fieldClass} appearance-none pr-8`}
                  style={{ color: issueType ? '#1f2937' : '#9ca3af' }}
                  disabled={!!successCode}
                >
                  <option value="">Select issue type</option>
                  <option value="sale">Sale</option>
                  <option value="internal_use">Internal Use</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">Product Details</h2>
              <button
                onClick={() => setAddModalOpen(true)}
                disabled={!!successCode}
                className="text-xs font-bold text-white px-4 py-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#409645' }}
              >
                + Add Product
              </button>
            </div>
            <div className="rounded-lg overflow-hidden border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#1A381E] text-white">
                    <th className="text-left font-semibold px-4 py-2.5">Product SKU</th>
                    <th className="text-left font-semibold px-4 py-2.5">Product Name</th>
                    <th className="text-left font-semibold px-4 py-2.5">Stock-in-Use Code</th>
                    <th className="text-left font-semibold px-4 py-2.5">Available</th>
                    <th className="text-left font-semibold px-4 py-2.5">Quantity Issued:</th>
                    <th className="text-left font-semibold px-4 py-2.5">Harvest Date:</th>
                    <th className="text-left font-semibold px-4 py-2.5">Note:</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-5 text-center text-gray-400">
                        No products added yet.
                      </td>
                    </tr>
                  )}
                  {items.map((item, idx) => (
                    <tr key={item.product_code ?? idx} className="border-t border-gray-100">
                      <td className="px-4 py-2 font-mono text-xs text-gray-700">{item.product_code}</td>
                      <td className="px-4 py-2">
                        <span className="text-gray-800 text-sm">{item.product_name}</span>
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => openStockInUseModal(idx)}
                          disabled={!!successCode}
                          title="Click to select a batch"
                          className={`font-mono text-xs px-2 py-1 rounded border transition-colors ${
                            item.stock_in_use_code
                              ? 'text-gray-700 bg-gray-50 border-gray-200'
                              : 'text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed'
                          }`}
                        >
                          {item.stock_in_use_code ?? 'Select batch…'}
                        </button>
                      </td>
                      <td className="px-4 py-2 text-gray-700 text-sm">
                        {item.batch_quantity != null ? `${item.batch_quantity} ${item.unit}` : ''}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={item.quantity_issued}
                              onChange={(e) => setItemField(idx, 'quantity_issued', e.target.value)}
                              disabled={!!successCode}
                              className={`w-24 bg-gray-100 border rounded px-2 py-1 text-sm focus:outline-none focus:bg-white disabled:opacity-50 ${
                                getRowError(item) ? 'border-red-500' : 'border-transparent focus:border-[#1A381E]'
                              }`}
                            />
                            <span className="text-xs text-gray-500">{item.unit}</span>
                          </div>
                          {getRowError(item) && (
                            <p className="text-xs text-red-600">{getRowError(item)}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-gray-600 text-xs">
                        {item.harvest_date ?? '—'}
                      </td>
                      <td className="px-4 py-2">
                        <textarea
                          rows={2}
                          value={item.note}
                          onChange={(e) => setItemField(idx, 'note', e.target.value)}
                          disabled={!!successCode}
                          placeholder="Optional note…"
                          className="w-full bg-gray-100 border border-transparent rounded px-2 py-1 text-xs focus:outline-none focus:border-[#1A381E] focus:bg-white resize-none disabled:opacity-50"
                        />
                      </td>
                      <td className="px-4 py-2">
                        {!successCode && (
                          <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 text-xs font-medium">
                            Remove
                          </button>
                        )}
                      </td>
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
              <span className="px-4 py-2 text-sm font-medium text-gray-500 bg-gray-200 rounded-lg">
                Created {successCode}
              </span>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading || !!successCode || hasRowErrors}
              className="px-8 py-2.5 text-sm font-bold text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#409645' }}
            >
              {loading ? 'Saving…' : 'COMPLETE'}
            </button>
          </div>

        </div>
      </div>

      <AddProductsModal isOpen={addModalOpen} onSelect={handleAddProducts} onClose={() => setAddModalOpen(false)} />
      <StockInUseModal
        isOpen={stockInUseModal.open}
        skuCode={stockInUseModal.skuCode}
        warehouseId={activeWarehouse?.id}
        onSelect={handleBatchSelect}
        onClose={() => setStockInUseModal({ open: false, rowIndex: null, skuCode: null })}
      />
      <PinVerificationModal isOpen={pinOpen} onVerify={handleVerify} onClose={() => setPinOpen(false)} />
    </>
  );
}
