import { useState } from 'react';

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
  const [passwords, setPasswords] = useState(INITIAL_PASSWORDS);
  const [pins, setPins] = useState(INITIAL_PINS);
  const [passwordOpen, setPasswordOpen] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setPasswords(INITIAL_PASSWORDS);
    setPins(INITIAL_PINS);
    setPasswordOpen(false);
    onClose();
  };

  const handlePinChange = (field) => (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPins((prev) => ({ ...prev, [field]: val }));
  };

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
              A
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg leading-tight">Admin User</p>
              <p className="text-sm text-gray-500">admin@ruriims.com</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  Admin
                </span>
                <span className="text-xs text-gray-400">Quezon City Warehouse</span>
              </div>
              {/* position_title — replace "—" with user.position_title once AuthContext returns it */}
              <p className="text-xs text-gray-400 mt-0.5">—</p>
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
                passwordOpen ? 'max-h-64 mt-3' : 'max-h-0'
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
            <p className="text-xs text-gray-400 mb-3">PIN is a 4-digit number used to authorize transactions.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Current PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
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
                  maxLength={4}
                  placeholder="••••"
                  value={pins.newPin}
                  onChange={handlePinChange('newPin')}
                  className="w-full bg-gray-100 border border-transparent rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1A381E] focus:bg-white transition tracking-[0.4em] text-center"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-5 py-2 text-sm font-medium text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            className="px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors bg-[#409645] hover:bg-[#367a38]"
          >
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}
