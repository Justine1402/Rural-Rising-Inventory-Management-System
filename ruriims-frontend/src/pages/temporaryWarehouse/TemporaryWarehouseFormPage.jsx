import { useState } from 'react';
import api from '../../api/axios';
import PinVerificationModal from '../../components/shared/PinVerificationModal';
import { useAuth } from '../../context/AuthContext';
import { useWarehouse } from '../../context/WarehouseContext';

const fieldClass =
  'w-full bg-gray-100 border border-transparent rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1A381E] focus:bg-white transition';
const readonlyClass =
  'w-full bg-gray-100 border border-transparent rounded-lg px-4 py-3 text-sm text-gray-500 cursor-not-allowed';

export default function TemporaryWarehouseFormPage({ onClose }) {
  const { user } = useAuth();
  const { refreshWarehouses } = useWarehouse();

  const [form, setForm] = useState({ name: '', event_date: '', location: '' });
  const [pinOpen, setPinOpen] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successCode, setSuccessCode] = useState(null);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const locationCode = form.location.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
  const canCreate = form.name.trim() && form.event_date && form.location.trim() && locationCode.length > 0;

  const handleCreate = () => {
    setError(null);
    if (!canCreate) {
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
      const res = await api.post('/temporary-warehouses', {
        name: form.name,
        event_date: form.event_date,
        location: form.location,
        location_code: locationCode,
        pin,
      });
      const twh = res.data.temporary_warehouse;
      setSuccessCode(twh.transaction_code);
      refreshWarehouses(twh.warehouse_id);
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
      <div className="fixed top-[115px] left-1/2 -translate-x-1/2 w-[900px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 p-8 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => onClose?.()}
            className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg"
            style={{ backgroundColor: '#409645' }}
          >
            RETURN
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create Temporary Warehouse</h1>
        </div>

        {/* 2-column form */}
        <div className="grid grid-cols-2 gap-x-16 gap-y-7">

          <div>
            <label className="block text-sm text-gray-500 mb-2">Warehouse Name</label>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              placeholder="e.g. Box All You Can - SM Aura"
              className={fieldClass}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-2">Event Date</label>
            <input
              type="date"
              value={form.event_date}
              onChange={set('event_date')}
              className={fieldClass}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-2">Created By</label>
            <div className={readonlyClass}>{user?.name ?? ''}</div>
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-2">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={set('location')}
              placeholder="e.g. Bonifacio Global City"
              className={fieldClass}
            />
          </div>

        </div>

        {error && <p className="text-red-600 text-sm mt-6">{error}</p>}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 mt-auto pt-6">
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

      <PinVerificationModal
        isOpen={pinOpen}
        onVerify={handleVerify}
        onClose={() => setPinOpen(false)}
      />
    </>
  );
}
