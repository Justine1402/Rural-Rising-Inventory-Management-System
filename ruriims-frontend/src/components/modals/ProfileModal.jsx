import { useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useWarehouse } from '../../context/WarehouseContext';

const EyeIcon = ({ open }) =>
  open ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ChevronIcon = ({ open }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

function PasswordInput({ placeholder, value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full bg-gray-100 border border-transparent rounded-lg px-4 pr-10 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1A381E] focus:bg-white transition"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
      >
        <EyeIcon open={show} />
      </button>
    </div>
  );
}

const INITIAL_PASSWORDS = { current: '', newPass: '', confirm: '' };
const INITIAL_PINS = { current: '', newPin: '' };

export default function ProfileModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const { warehouses } = useWarehouse();

  const [passwords, setPasswords] = useState(INITIAL_PASSWORDS);
  const [pins, setPins] = useState(INITIAL_PINS);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState(null);
  const [pinSuccess, setPinSuccess] = useState(false);

  if (!isOpen) return null;

  const warehouseName =
    warehouses.find((w) => w.id === user?.warehouse_id)?.name || '—';
  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : '—';
  const avatarInitial = user?.name?.[0]?.toUpperCase() ?? '?';

  const handleClose = () => {
    setPasswords(INITIAL_PASSWORDS);
    setPins(INITIAL_PINS);
    setPasswordOpen(false);
    setPasswordLoading(false);
    setPasswordError(null);
    setPasswordSuccess(false);
    setPinLoading(false);
    setPinError(null);
    setPinSuccess(false);
    onClose();
  };

  const handlePinChange = (field) => (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPins((prev) => ({ ...prev, [field]: val }));
  };

  const handlePasswordSubmit = async () => {
    if (passwords.newPass !== passwords.confirm) {
      setPasswordError('New passwords do not match.');
      return;
    }
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(false);
    try {
      await api.patch('/user/password', {
        current_password: passwords.current,
        new_password: passwords.newPass,
        new_password_confirmation: passwords.confirm,
      });
      setPasswordSuccess(true);
      setPasswords(INITIAL_PASSWORDS);
    } catch (err) {
      setPasswordError(err.response?.data?.message ?? 'Something went wrong.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePinSubmit = async () => {
    if (!/^\d{6}$/.test(pins.current) || !/^\d{6}$/.test(pins.newPin)) {
      setPinError('Both PINs must be exactly 6 digits.');
      return;
    }
    setPinLoading(true);
    setPinError(null);
    setPinSuccess(false);
    try {
      await api.patch('/user/pin', {
        current_pin: pins.current,
        new_pin: pins.newPin,
      });
      setPinSuccess(true);
      setPins(INITIAL_PINS);
    } catch (err) {
      setPinError(err.response?.data?.message ?? 'Something went wrong.');
    } finally {
      setPinLoading(false);
    }
  };

  const passwordSubmitDisabled =
    passwordLoading || !passwords.current || !passwords.newPass || !passwords.confirm;
  const pinSubmitDisabled =
    pinLoading || pins.current.length !== 6 || pins.newPin.length !== 6;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: '#1A381E' }}>
          <h2 className="text-white font-bold text-base uppercase tracking-widest">Profile</h2>
          <button
            onClick={handleClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <XIcon />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="px-6 py-5 space-y-6 overflow-y-auto max-h-[72vh]">

          {/* User info */}
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-2xl"
              style={{ backgroundColor: '#409645' }}
            >
              {avatarInitial}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg leading-tight">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {roleLabel}
                </span>
                <span className="text-xs text-gray-400">{warehouseName}</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{user?.position_title || '—'}</p>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Change Password — collapsible */}
          <div>
            <button
              type="button"
              onClick={() => setPasswordOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors hover:bg-gray-50"
              style={{ color: '#1A381E', borderColor: '#1A381E', backgroundColor: 'white' }}
            >
              <span>Change Password</span>
              <ChevronIcon open={passwordOpen} />
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                passwordOpen ? 'max-h-96 mt-3' : 'max-h-0'
              }`}
            >
              <div className="space-y-3">
                <PasswordInput
                  placeholder="Current password"
                  value={passwords.current}
                  onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                />
                <PasswordInput
                  placeholder="New password"
                  value={passwords.newPass}
                  onChange={(e) => setPasswords((p) => ({ ...p, newPass: e.target.value }))}
                />
                <PasswordInput
                  placeholder="Confirm new password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                />
                {passwordError && (
                  <p className="text-xs text-red-600">{passwordError}</p>
                )}
                {passwordSuccess && (
                  <p className="text-xs text-green-600">Password updated successfully.</p>
                )}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handlePasswordSubmit}
                    disabled={passwordSubmitDisabled}
                    className="px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors btn-brand disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {passwordLoading ? 'Updating…' : 'UPDATE PASSWORD'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Change PIN */}
          <div>
            <h3
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: '#1A381E' }}
            >
              Change PIN
            </h3>
            <p className="text-xs text-gray-400 mb-3">PIN is a 6-digit number used to authorize transactions.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Current PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••••"
                  value={pins.current}
                  onChange={handlePinChange('current')}
                  className="w-full bg-gray-100 border border-transparent rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1A381E] focus:bg-white transition tracking-[0.4em] text-center"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">New PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••••"
                  value={pins.newPin}
                  onChange={handlePinChange('newPin')}
                  className="w-full bg-gray-100 border border-transparent rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1A381E] focus:bg-white transition tracking-[0.4em] text-center"
                />
              </div>
            </div>
            {pinError && (
              <p className="text-xs text-red-600 mt-2">{pinError}</p>
            )}
            {pinSuccess && (
              <p className="text-xs text-green-600 mt-2">PIN updated successfully.</p>
            )}
            <div className="flex justify-end mt-3">
              <button
                type="button"
                onClick={handlePinSubmit}
                disabled={pinSubmitDisabled}
                className="px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors btn-brand disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pinLoading ? 'Updating…' : 'UPDATE PIN'}
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-5 py-2 text-sm font-medium text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
