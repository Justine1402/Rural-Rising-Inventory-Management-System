import { useState } from 'react';
import api from '../../api/axios';
import AddProductsModal from '../../components/shared/AddProductsModal';
import CascadePreviewModal from '../../components/shared/CascadePreviewModal';
import PinVerificationModal from '../../components/shared/PinVerificationModal';
import StockInUseModal from '../../components/shared/StockInUseModal';
import { useAuth } from '../../context/AuthContext';
import { useWarehouse } from '../../context/WarehouseContext';
import CustomSelect from '../../components/ui/CustomSelect';
import { planBatchCascade } from '../../utils/planBatchCascade';

const fieldClass =
  'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#409645] bg-white transition';

const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const todayISO = new Date().toISOString().split('T')[0];

export default function IssueProductFormPage({ onClose, onSuccess }) {
  const { user } = useAuth();
  const { activeWarehouse } = useWarehouse();

  const [issueType, setIssueType] = useState('');
  const [items, setItems] = useState([]);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [stockInUseModal, setStockInUseModal] = useState({ open: false, rowIndex: null, skuCode: null });
  const [cascadePreview, setCascadePreview] = useState(null);
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
            batch_quantity: null,
            warehouseTotal: null,
            allBatches: [],
          })),
      ];
    });
  };

  const handleBatchSelect = ({ batch, warehouseTotal, allBatches }) => {
    const { rowIndex } = stockInUseModal;
    setItems((prev) =>
      prev.map((item, i) =>
        i === rowIndex
          ? {
              ...item,
              stock_in_use_id: batch.id,
              stock_in_use_code: batch.code,
              harvest_date: batch.harvest_date,
              batch_quantity: batch.quantity,
              warehouseTotal,
              allBatches,
            }
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
    if (item.warehouseTotal != null && qty > item.warehouseTotal) {
      return `Only ${item.warehouseTotal} ${item.unit} available across all batches in this warehouse.`;
    }
    return null;
  };

  const getCascadeHint = (item) => {
    const qty = parseFloat(item.quantity_issued);
    if (!qty || qty <= 0 || !item.stock_in_use_id) return null;
    if (item.warehouseTotal != null && qty > item.warehouseTotal) return null;
    if (item.batch_quantity == null || qty <= item.batch_quantity) return null;
    const plan = planBatchCascade(item.allBatches ?? [], item.stock_in_use_id, qty);
    return plan !== null ? plan.length : null;
  };

  const hasRowErrors = items.some((item) => getRowError(item) !== null);
  const hasEmptyQty = items.some((i) => !i.quantity_issued);

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
      <div className="fixed top-[105px] left-1/2 -translate-x-1/2 w-[960px] max-h-[85vh] bg-white rounded-2xl shadow-2xl z-50 overflow-y-auto">

        {/* Dark green sticky header */}
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
          <span className="text-white font-semibold text-lg">Issue Products</span>
        </div>

        {/* Body */}
        <div className="px-8 py-6">

          {/* Section label */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Issue Details
          </p>

          {/* Top form fields */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Issued By</p>
              <p className="font-semibold text-gray-800">{user?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Date Requested</p>
              <p className="font-semibold text-gray-800">{today}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Warehouse</p>
              <p className="font-semibold text-gray-800">{activeWarehouse?.name ?? '—'}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Issue Type</label>
              <CustomSelect
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                disabled={!!successCode}
                options={[
                  { value: '', label: 'Select issue type' },
                  { value: 'sale', label: 'Sale' },
                  { value: 'internal_use', label: 'Internal Use' },
                ]}
              />
            </div>
          </div>

          {/* Product Details */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Product Details
              </p>
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
                  <tr className="text-white" style={{ backgroundColor: '#1A381E' }}>
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
                  {items.map((item, idx) => {
                    const rowError = getRowError(item);
                    const cascadeCount = rowError === null ? getCascadeHint(item) : null;
                    const typedQty = parseFloat(item.quantity_issued);
                    return (
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
                                  rowError ? 'border-red-500' : 'border-transparent focus:border-[#1A381E]'
                                }`}
                              />
                              <span className="text-xs text-gray-500">{item.unit}</span>
                            </div>
                            {rowError && (
                              <p className="text-xs text-red-600">{rowError}</p>
                            )}
                            {!rowError && cascadeCount !== null && (
                              <p className="text-xs text-gray-500">
                                Will draw from {cascadeCount} batch(es) —{' '}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const plan = planBatchCascade(item.allBatches ?? [], item.stock_in_use_id, typedQty);
                                    if (plan) setCascadePreview({ skuCode: item.product_code, productName: item.product_name, qty: typedQty, unit: item.unit, plan });
                                  }}
                                  className="text-blue-600 hover:underline focus:outline-none"
                                >
                                  preview
                                </button>
                              </p>
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
                    );
                  })}
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
              disabled={loading || !!successCode || hasRowErrors || hasEmptyQty}
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
      <CascadePreviewModal
        isOpen={!!cascadePreview}
        skuCode={cascadePreview?.skuCode}
        productName={cascadePreview?.productName}
        qty={cascadePreview?.qty}
        unit={cascadePreview?.unit}
        plan={cascadePreview?.plan}
        onClose={() => setCascadePreview(null)}
      />
    </>
  );
}
