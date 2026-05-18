import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import AddProductsModal from '../../components/shared/AddProductsModal';
import CascadePreviewModal from '../../components/shared/CascadePreviewModal';
import PinVerificationModal from '../../components/shared/PinVerificationModal';
import StockInUseModal from '../../components/shared/StockInUseModal';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { useWarehouse } from '../../context/WarehouseContext';
import { planBatchCascade } from '../../utils/planBatchCascade';

const fieldClass =
  'w-full bg-gray-100 border border-transparent rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1A381E] focus:bg-white transition';
const readonlyClass =
  'w-full bg-gray-100 border border-transparent rounded-lg px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed';

export default function TransferRequestFormPage({ onClose, onSuccess }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { warehouses, activeWarehouse } = useWarehouse();
  const { refreshProducts, refreshTransferRequests } = useUI();
  const isAccomplish = !!id;

  const [sourceWarehouseId, setSourceWarehouseId] = useState('');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState(
    !isAccomplish && activeWarehouse?.isTemporary ? activeWarehouse.id : '',
  );
  const [dateReceived, setDateReceived] = useState('');
  const [items, setItems] = useState([]);
  const [transferData, setTransferData] = useState(null);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [stockInUseModal, setStockInUseModal] = useState({ open: false, rowIndex: null, skuCode: null });
  const [cascadePreview, setCascadePreview] = useState(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isAccomplish);
  const [error, setError] = useState(null);
  const [successCode, setSuccessCode] = useState(null);

  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  useEffect(() => {
    if (!isAccomplish) return;
    (async () => {
      try {
        const res = await api.get(`/transfer-requests/${id}`);
        const t = res.data.transfer;
        setTransferData(t);
        setSourceWarehouseId(t.source_warehouse_id);
        setDestinationWarehouseId(t.destination_warehouse_id);
        setDateReceived(t.date_received ?? '');

        // Fetch allBatches and warehouseTotal for cascade validation in accomplish mode
        const uniqueCodes = [...new Set(t.items.map((i) => i.product_code))];
        const batchDataByCode = {};
        await Promise.all(
          uniqueCodes.map(async (code) => {
            try {
              const br = await api.get('/stock-in-use', {
                params: { sku_code: code, warehouse_id: t.source_warehouse_id },
              });
              batchDataByCode[code] = br.data;
            } catch {
              batchDataByCode[code] = { warehouse_total: null, batches: [] };
            }
          })
        );

        setItems(
          t.items.map((i) => ({
            ...i,
            quantity_received: parseFloat(i.quantity_received) || 0,
            batch_quantity: i.batch_quantity ?? null,
            warehouseTotal: batchDataByCode[i.product_code]?.warehouse_total ?? null,
            allBatches: batchDataByCode[i.product_code]?.batches ?? [],
            batch_deductions: i.batch_deductions ?? [],
          }))
        );
      } catch {
        setError('Failed to load transfer request.');
      } finally {
        setFetchLoading(false);
      }
    })();
  }, [id, isAccomplish]);

  const permanentWarehouses = warehouses.filter((w) => !w.isTemporary);

  const handleAddProducts = (selected) => {
    setAddModalOpen(false);
    setItems((prev) => {
      const existing = new Set(prev.map((i) => i.product_code));
      return [
        ...prev,
        ...selected
          .filter((s) => !existing.has(s.productCode))
          .map((s) => ({
            product_code: s.productCode,
            product_name: s.productName,
            unit: s.unit,
            category: s.category,
            stock_in_use_id: null,
            stock_in_use_code: null,
            quantity_requested: '',
            harvest_date: null,
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
    if (!sourceWarehouseId) {
      setError('Select a Source Warehouse before choosing a batch.');
      return;
    }
    setError(null);
    setStockInUseModal({ open: true, rowIndex, skuCode: items[rowIndex].product_code });
  };

  const setItemField = (index, field, value) =>
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));

  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const getRowError = (item) => {
    const qty = parseFloat(isAccomplish ? item.quantity_received : item.quantity_requested);
    if (!qty || qty <= 0) return null;
    if (!isAccomplish && !item.stock_in_use_id) return 'Select a Stock-In-Use Code first.';
    if (item.warehouseTotal != null && qty > item.warehouseTotal) {
      return `Only ${item.warehouseTotal} ${item.unit} available across all batches in this warehouse.`;
    }
    return null;
  };

  const getCascadeHint = (item) => {
    const qty = parseFloat(isAccomplish ? item.quantity_received : item.quantity_requested);
    if (!qty || qty <= 0 || !item.stock_in_use_id) return null;
    if (item.warehouseTotal != null && qty > item.warehouseTotal) return null;
    if (item.batch_quantity == null || qty <= item.batch_quantity) return null;
    const plan = planBatchCascade(item.allBatches ?? [], item.stock_in_use_id, qty);
    return plan !== null ? plan.length : null;
  };

  const hasRowErrors = items.some((item) => getRowError(item) !== null);

  const handleSubmit = () => {
    setError(null);
    if (!isAccomplish) {
      if (!sourceWarehouseId) { setError('Please select a Source Warehouse.'); return; }
      if (!destinationWarehouseId) { setError('Please select a Destination Warehouse.'); return; }
      if (items.length === 0) { setError('Add at least one product.'); return; }
      if (items.some((i) => !i.stock_in_use_id)) { setError('Select a Stock-In-Use batch for every product.'); return; }
      if (items.some((i) => !i.quantity_requested || parseFloat(i.quantity_requested) <= 0)) {
        setError('Enter a valid Quantity Requested for every product.');
        return;
      }
    } else {
      if (!dateReceived) { setError('Date Received is required.'); return; }
    }
    setPinOpen(true);
  };

  const handleVerify = async (pin) => {
    setPinOpen(false);
    setError(null);
    setLoading(true);
    try {
      if (!isAccomplish) {
        const res = await api.post('/transfer-requests', {
          source_warehouse_id: sourceWarehouseId,
          destination_warehouse_id: destinationWarehouseId,
          pin,
          items: items.map((i) => ({
            product_code: i.product_code,
            stock_in_use_id: i.stock_in_use_id,
            quantity_requested: parseFloat(i.quantity_requested),
          })),
        });
        setSuccessCode(res.data.transfer.code);
        onSuccess?.();
      } else {
        const res = await api.post(`/transfer-requests/${id}/accomplish`, {
          date_received: dateReceived,
          pin,
          items: items.map((i) => ({ id: i.id, quantity_received: parseFloat(i.quantity_received) || 0 })),
        });
        refreshProducts();
        refreshTransferRequests();
        setSuccessCode(res.data.message);
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
      <div className="fixed top-[105px] left-1/2 -translate-x-1/2 w-[960px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-auto">

        {fetchLoading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">Loading transfer request…</div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 flex-shrink-0">
              <button
                onClick={() => isAccomplish ? navigate('/transfer-requests') : onClose?.()}
                className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg"
                style={{ backgroundColor: '#409645' }}
              >
                RETURN
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {isAccomplish ? (transferData?.code ?? 'Accomplish Transfer') : 'Create Transfer Request'}
              </h1>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-auto px-8 pb-6">

              {/* Top form fields */}
              <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-6">
                <div>
                  <label className="block text-sm text-gray-500 mb-1.5">Requested By</label>
                  <div className={readonlyClass}>{isAccomplish ? transferData?.requested_by : (user?.name ?? '')}</div>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1.5">Date Requested</label>
                  <div className={readonlyClass}>{isAccomplish ? transferData?.date_requested : today}</div>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1.5">Source Warehouse</label>
                  {isAccomplish ? (
                    <div className={readonlyClass}>{transferData?.source_warehouse}</div>
                  ) : (
                    <div className="relative">
                      <select
                        value={sourceWarehouseId}
                        onChange={(e) => { setSourceWarehouseId(e.target.value); if (e.target.value === destinationWarehouseId) setDestinationWarehouseId(''); }}
                        className={`${fieldClass} appearance-none pr-8`}
                        style={{ color: sourceWarehouseId ? '#1f2937' : '#9ca3af' }}
                      >
                        <option value="">Select source warehouse</option>
                        {permanentWarehouses.map((w) => (
                          <option key={w.id} value={w.id} disabled={String(w.id) === String(destinationWarehouseId)}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1.5">Destination Warehouse</label>
                  {isAccomplish ? (
                    <div className={readonlyClass}>{transferData?.destination_warehouse}</div>
                  ) : (
                    <div className="relative">
                      <select
                        value={destinationWarehouseId}
                        onChange={(e) => { setDestinationWarehouseId(e.target.value); if (e.target.value === sourceWarehouseId) setSourceWarehouseId(''); }}
                        className={`${fieldClass} appearance-none pr-8`}
                        style={{ color: destinationWarehouseId ? '#1f2937' : '#9ca3af' }}
                      >
                        <option value="">Select destination warehouse</option>
                        {warehouses.map((w) => (
                          <option key={w.id} value={w.id} disabled={String(w.id) === String(sourceWarehouseId)}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
                    </div>
                  )}
                </div>
                {isAccomplish && (
                  <div>
                    <label className="block text-sm text-gray-500 mb-1.5">Date Received</label>
                    <input
                      type="date"
                      value={dateReceived}
                      onChange={(e) => setDateReceived(e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-700">Product Details</h2>
                  {!isAccomplish && (
                    <button
                      onClick={() => setAddModalOpen(true)}
                      className="text-xs font-bold text-white px-4 py-1.5 rounded transition-colors"
                      style={{ backgroundColor: '#409645' }}
                    >
                      + Add Product
                    </button>
                  )}
                </div>
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-white" style={{ backgroundColor: '#1A381E' }}>
                        <th className="text-left font-semibold px-4 py-2.5">Product SKU</th>
                        <th className="text-left font-semibold px-4 py-2.5">Product Name</th>
                        <th className="text-left font-semibold px-4 py-2.5">Stock-In-Use Code</th>
                        <th className="text-left font-semibold px-4 py-2.5">Available</th>
                        <th className="text-left font-semibold px-4 py-2.5">Qty Requested</th>
                        {isAccomplish && <th className="text-left font-semibold px-4 py-2.5">Qty Received</th>}
                        <th className="text-left font-semibold px-4 py-2.5">Harvest Date</th>
                        {!isAccomplish && <th className="px-4 py-2.5" />}
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 && (
                        <tr>
                          <td colSpan={isAccomplish ? 7 : 7} className="px-4 py-5 text-center text-gray-400">
                            No products added yet.
                          </td>
                        </tr>
                      )}
                      {items.map((item, idx) => {
                        const rowError = getRowError(item);
                        const cascadeCount = rowError === null ? getCascadeHint(item) : null;
                        const typedQty = isAccomplish
                          ? parseFloat(item.quantity_received)
                          : parseFloat(item.quantity_requested);

                        return (
                          <tr key={item.product_code ?? idx} className="border-t border-gray-100">
                            <td className="px-4 py-2 font-mono text-xs text-gray-700">{item.product_code}</td>
                            <td className="px-4 py-2">
                              <span className="text-gray-800 text-sm">{item.product_name}</span>
                            </td>
                            <td className="px-4 py-2">
                              {isAccomplish ? (
                                <span className="font-mono text-xs text-gray-700">{item.stock_in_use_code}</span>
                              ) : (
                                <button
                                  onClick={() => openStockInUseModal(idx)}
                                  title={!sourceWarehouseId ? 'Select a source warehouse first' : 'Click to select a batch'}
                                  className={`font-mono text-xs px-2 py-1 rounded border transition-colors ${
                                    item.stock_in_use_code
                                      ? 'text-gray-700 bg-gray-50 border-gray-200'
                                      : sourceWarehouseId
                                        ? 'text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100'
                                        : 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed'
                                  }`}
                                >
                                  {item.stock_in_use_code ?? 'Select batch…'}
                                </button>
                              )}
                            </td>
                            <td className="px-4 py-2 text-gray-700 text-sm">
                              {item.batch_quantity != null ? `${item.batch_quantity} ${item.unit}` : ''}
                            </td>
                            {/* Qty Requested */}
                            <td className="px-4 py-2">
                              {isAccomplish ? (
                                <span className="text-gray-600">{parseFloat(item.quantity_requested)} {item.unit}</span>
                              ) : (
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="number"
                                      min="0"
                                      step="1"
                                      value={item.quantity_requested}
                                      onChange={(e) => setItemField(idx, 'quantity_requested', e.target.value)}
                                      className={`w-24 bg-gray-100 border rounded px-2 py-1 text-sm focus:outline-none focus:bg-white ${
                                        rowError ? 'border-red-500' : 'border-transparent focus:border-[#1A381E]'
                                      }`}
                                    />
                                    <span className="text-xs text-gray-500">{item.unit}</span>
                                  </div>
                                  {rowError && <p className="text-xs text-red-600">{rowError}</p>}
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
                              )}
                            </td>
                            {/* Qty Received (accomplish mode only) */}
                            {isAccomplish && (
                              <td className="px-4 py-2">
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="number"
                                      min="0"
                                      step="1"
                                      value={item.quantity_received}
                                      onChange={(e) => setItemField(idx, 'quantity_received', e.target.value)}
                                      className={`w-24 bg-gray-100 border rounded px-2 py-1 text-sm focus:outline-none focus:bg-white ${
                                        rowError ? 'border-red-500' : 'border-transparent focus:border-[#1A381E]'
                                      }`}
                                    />
                                    <span className="text-xs text-gray-500">{item.unit}</span>
                                  </div>
                                  {rowError && <p className="text-xs text-red-600">{rowError}</p>}
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
                            )}
                            <td className="px-4 py-2 text-gray-600 text-xs">
                              {item.harvest_date ?? '—'}
                            </td>
                            {!isAccomplish && (
                              <td className="px-4 py-2">
                                <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 text-xs font-medium">
                                  Remove
                                </button>
                              </td>
                            )}
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
                    {isAccomplish ? successCode : `Created ${successCode}`}
                  </span>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={loading || !!successCode || hasRowErrors}
                  className="px-8 py-2.5 text-sm font-bold text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#409645' }}
                >
                  {loading ? 'Saving…' : isAccomplish ? 'ACCOMPLISH' : 'CREATE'}
                </button>
              </div>

            </div>
          </>
        )}
      </div>

      <AddProductsModal isOpen={addModalOpen} onSelect={handleAddProducts} onClose={() => setAddModalOpen(false)} />
      <StockInUseModal
        isOpen={stockInUseModal.open}
        skuCode={stockInUseModal.skuCode}
        warehouseId={sourceWarehouseId}
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
