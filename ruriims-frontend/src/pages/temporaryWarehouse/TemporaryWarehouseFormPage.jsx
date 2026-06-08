import { useState } from 'react';
import api from '../../api/axios';
import PinVerificationModal from '../../components/shared/PinVerificationModal';
import { useAuth } from '../../context/AuthContext';
import { useWarehouse } from '../../context/WarehouseContext';

const fieldClass =
  'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#409645] bg-white transition';

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
          <span className="text-white font-semibold text-lg">Create Temporary Warehouse</span>
        </div>

        {/* Body */}
        <div className="p-6">

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Warehouse Details
          </p>

          {/* 2-column form */}
          <div className="grid grid-cols-2 gap-x-16 gap-y-7">

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Warehouse Name</label>
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder="e.g. Box All You Can - SM Aura"
                className={fieldClass}
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Event Date</label>
              <input
                type="date"
                value={form.event_date}
                onChange={set('event_date')}
                className="date-input"
              />
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-0.5">Created By</p>
              <p className="font-semibold text-gray-800">{user?.name ?? '—'}</p>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Location</label>
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
          <div className="flex items-center justify-end gap-3 mt-8">
            {successCode && (
              <span className="px-4 py-2 text-sm font-medium text-gray-500 bg-gray-200 rounded-lg">
                Created {successCode}
              </span>
            )}
            <button
              onClick={handleCreate}
              disabled={loading || !!successCode || !canCreate}
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
