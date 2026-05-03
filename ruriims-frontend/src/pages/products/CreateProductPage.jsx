import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import PinVerificationModal from '../../components/shared/PinVerificationModal';

const CATEGORIES = ['Fruits', 'Vegetables', 'Poultry', 'Herbs & Spices', 'Processed Goods'];
const UNITS = ['kg', 'g', 'pcs'];

const fieldClass =
  'w-full bg-gray-100 border border-transparent rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1A381E] focus:bg-white transition';

export default function CreateProductPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', category: '', unit: '', shelf_life: '' });
  const [pinOpen, setPinOpen] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successCode, setSuccessCode] = useState(null);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

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
    } catch (err) {
      setError(err.response?.data?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Dim overlay — clicking it goes back */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={() => navigate('/')} />

      {/* Panel — floats over the dashboard; content-height so tabs stay visible below */}
      <div className="fixed left-44 right-36 top-[110px] bg-white rounded-2xl shadow-2xl z-50 p-8">

        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 text-sm font-semibold text-white rounded-lg"
            style={{ backgroundColor: '#409645' }}
          >
            RETURN
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create Product</h1>
        </div>

        {/* 2-column form */}
        <div className="grid grid-cols-2 gap-x-16 gap-y-5 max-w-3xl">

          <div>
            <label className="block text-sm text-gray-500 mb-1.5">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              className={fieldClass}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1.5">Unit</label>
            <select value={form.unit} onChange={set('unit')} className={fieldClass}>
              <option value="" />
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1.5">Category</label>
            <select value={form.category} onChange={set('category')} className={fieldClass}>
              <option value="" />
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1.5">Shelf Life</label>
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

        {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 mt-6 max-w-3xl">
          {successCode && (
            <span className="px-4 py-2 text-sm font-medium text-gray-500 bg-gray-200 rounded-lg">
              Created {successCode}
            </span>
          )}
          <button
            onClick={handleCreate}
            disabled={loading || !!successCode}
            className="px-6 py-2 text-sm font-bold text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#409645' }}
          >
            {loading ? 'Saving…' : 'CREATE'}
          </button>
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
