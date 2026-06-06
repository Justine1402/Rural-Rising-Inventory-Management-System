import { useState } from 'react';
import api from '../../api/axios';
import PinVerificationModal from '../../components/shared/PinVerificationModal';

const CATEGORIES = ['Fruits', 'Vegetables', 'Poultry', 'Herbs & Spices', 'Processed Goods'];
const UNITS = ['kg', 'g', 'pcs'];

const fieldClass =
  'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#409645] bg-white transition';

export default function CreateProductPage({ onClose, onSuccess }) {

  const [form, setForm] = useState({ name: '', category: '', unit: '', shelf_life: '' });
  const [useCustomUnit, setUseCustomUnit] = useState(false);
  const [customUnitInput, setCustomUnitInput] = useState('');
  const [pinOpen, setPinOpen] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successCode, setSuccessCode] = useState(null);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleUnitChange = (e) => {
    if (e.target.value === '__other__') {
      setUseCustomUnit(true);
      setCustomUnitInput('');
      setForm((prev) => ({ ...prev, unit: '' }));
    } else {
      setForm((prev) => ({ ...prev, unit: e.target.value }));
    }
  };

  const handleCustomUnitChange = (e) => {
    setCustomUnitInput(e.target.value);
    setForm((prev) => ({ ...prev, unit: e.target.value }));
  };

  const switchBackToDropdown = () => {
    setUseCustomUnit(false);
    setCustomUnitInput('');
    setForm((prev) => ({ ...prev, unit: '' }));
  };

  const handleCreate = () => {
    setError(null);
    if (!form.name || !form.category || !form.unit || !form.shelf_life) {
      setError('Please fill in all required fields.');
      return;
    }
    setPinOpen(true);
  };

  const handleVerify = async (pin) => {
    setPinOpen(false);
    setError(null);
    try {
      setLoading(true);
      const res = await api.post('/products', { ...form, pin });
      setSuccessCode(res.data.product.sku_code);
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
      <div className="fixed top-[115px] left-1/2 -translate-x-1/2 w-[900px] bg-white rounded-2xl shadow-2xl z-50 overflow-y-auto">

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
          <span className="text-white font-semibold text-lg">Create Product</span>
        </div>

        {/* Body */}
        <div className="p-6">

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Product Details
          </p>

          {/* 2-column form */}
          <div className="grid grid-cols-2 gap-x-16 gap-y-7">

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                className={fieldClass}
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Unit</label>
              {useCustomUnit ? (
                <div>
                  <input
                    type="text"
                    value={customUnitInput}
                    onChange={handleCustomUnitChange}
                    placeholder="Enter custom unit"
                    className={fieldClass}
                  />
                  <button
                    onClick={switchBackToDropdown}
                    className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    ← Use dropdown instead
                  </button>
                </div>
              ) : (
                <select value={form.unit} onChange={handleUnitChange} className={fieldClass}>
                  <option value="" />
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  <option value="__other__">Other (specify)</option>
                </select>
              )}
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Category</label>
              <select value={form.category} onChange={set('category')} className={fieldClass}>
                <option value="" />
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Shelf Life</label>
              <input
                type="number"
                min="1"
                value={form.shelf_life}
                onChange={set('shelf_life')}
                placeholder="Days"
                className={fieldClass}
              />
            </div>

          </div>

          {error && <p className="text-red-600 text-sm mt-6">{error}</p>}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 mt-8">
            {successCode && (
              <span className="px-4 py-2 text-sm font-medium text-gray-500 bg-gray-200 rounded-lg">
                Created {successCode}
              </span>
            )}
            <button
              onClick={handleCreate}
              disabled={loading || !!successCode}
              className="px-8 py-2.5 text-sm font-bold text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#409645' }}
            >
              {loading ? 'Saving…' : 'CREATE'}
            </button>
          </div>

        </div>
      </div>

      <PinVerificationModal
        isOpen={pinOpen}
        onVerify={handleVerify}
        onClose={() => setPinOpen(false)}
      />
    </>
  );
}
