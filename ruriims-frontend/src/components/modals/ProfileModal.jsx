import { useRef, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useWarehouse } from '../../context/WarehouseContext';
import AvatarCropModal from './AvatarCropModal';

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

const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

function PasswordInput({ placeholder, value, onChange, inputMode, maxLength, extraClass = '' }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        inputMode={inputMode}
        maxLength={maxLength}
        className={`w-full bg-gray-100 border border-transparent rounded-lg px-4 pr-10 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1A381E] focus:bg-white transition ${extraClass}`}
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
  const { user, updateUser } = useAuth();
  const { warehouses } = useWarehouse();
  const fileInputRef = useRef(null);

  const [passwords, setPasswords] = useState(INITIAL_PASSWORDS);
  const [pins, setPins] = useState(INITIAL_PINS);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState(null);
  const [pinSuccess, setPinSuccess] = useState(false);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(null);
  const [cropSrc, setCropSrc] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [nameEditing, setNameEditing] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState(null);

  if (!isOpen) return null;

  const warehouseName = warehouses.find((w) => w.id === user?.warehouse_id)?.name || '—';
  const roleLabel = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '—';
  const avatarInitial = user?.name?.[0]?.toUpperCase() ?? '?';

  const handleClose = () => {
    setPasswords(INITIAL_PASSWORDS);
    setPins(INITIAL_PINS);
    setPasswordOpen(false);
    setPinOpen(false);
    setPasswordLoading(false);
    setPasswordError(null);
    setPasswordSuccess(false);
    setPinLoading(false);
    setPinError(null);
    setPinSuccess(false);
    setNameEditing(false);
    setNameValue('');
    setNameSaving(false);
    setNameError(null);
    setAvatarUploading(false);
    setAvatarError(null);
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setPendingFile(null);
    onClose();
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setCropSrc(objectUrl);
    setPendingFile(file);
    e.target.value = '';
  };

  const handleAvatarUpload = async (blob) => {
    setAvatarUploading(true);
    setAvatarError(null);
    try {
      const fd = new FormData();
      fd.append('avatar', blob, 'avatar.jpg');
      const res = await api.patch('/user/profile', fd, {
        headers: { 'Content-Type': null },
      });
      updateUser({ name: res.data.user.name, avatar_url: res.data.user.avatar_url });
    } catch (err) {
      setAvatarError(err.response?.data?.message ?? 'Failed to upload avatar.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleNameConfirm = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === user?.name) {
      setNameEditing(false);
      setNameError(null);
      return;
    }
    setNameSaving(true);
    setNameError(null);
    try {
      const res = await api.patch('/user/profile', { name: trimmed });
      updateUser({ name: res.data.user.name });
      setNameEditing(false);
    } catch (err) {
      setNameError(err.response?.data?.message ?? 'Failed to update name.');
    } finally {
      setNameSaving(false);
    }
  };

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') handleNameConfirm();
    if (e.key === 'Escape') { setNameEditing(false); setNameError(null); }
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
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: '#1A381E' }}>
          <h2 className="text-white font-bold text-base uppercase tracking-widest">Profile</h2>
          <button onClick={handleClose} className="text-white/70 hover:text-white transition-colors">
            <XIcon />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto max-h-[72vh]">

          {/* Avatar + name + info */}
          <div className="space-y-1">
            <div className="flex items-center gap-4">

              {/* Avatar circle with camera overlay */}
              <div className="relative flex-shrink-0">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user?.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl"
                    style={{ backgroundColor: '#1A381E' }}
                  >
                    {avatarInitial}
                  </div>
                )}
                <button
                  type="button"
                  disabled={avatarUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center text-white shadow disabled:opacity-60"
                  style={{ backgroundColor: '#409645' }}
                >
                  {avatarUploading ? (
                    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : (
                    <CameraIcon />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarFileChange}
                />
              </div>

              {/* Name + email + badges */}
              <div className="flex-1 min-w-0">
                {nameEditing ? (
                  <div className="flex items-center gap-1 mb-0.5">
                    <input
                      type="text"
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      onKeyDown={handleNameKeyDown}
                      autoFocus
                      className="font-bold text-gray-900 text-lg leading-tight border-b border-gray-300 focus:outline-none focus:border-[#1A381E] bg-transparent w-full"
                    />
                    <button
                      type="button"
                      onClick={handleNameConfirm}
                      disabled={nameSaving}
                      className="text-green-600 hover:text-green-800 font-bold text-lg px-1 flex-shrink-0 disabled:opacity-50"
                    >✓</button>
                    <button
                      type="button"
                      onClick={() => { setNameEditing(false); setNameError(null); }}
                      className="text-gray-400 hover:text-gray-600 font-bold text-lg px-1 flex-shrink-0"
                    >×</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="font-bold text-gray-900 text-lg leading-tight truncate">{user?.name}</p>
                    <button
                      type="button"
                      onClick={() => { setNameEditing(true); setNameValue(user?.name ?? ''); setNameError(null); }}
                      className="text-gray-400 hover:text-gray-600 flex-shrink-0 transition-colors"
                    >
                      <PencilIcon />
                    </button>
                  </div>
                )}
                {nameError && <p className="text-xs text-red-600 mb-0.5">{nameError}</p>}
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
            {avatarError && <p className="text-xs text-red-600">{avatarError}</p>}
          </div>

          <hr className="border-gray-100" />

          {/* Change Password accordion */}
          <div>
            <button
              type="button"
              onClick={() => { setPasswordOpen((v) => !v); setPinOpen(false); }}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-white rounded-lg"
              style={{ backgroundColor: '#1A381E' }}
            >
              <span>Change Password</span>
              <ChevronIcon open={passwordOpen} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${passwordOpen ? 'max-h-96 mt-3' : 'max-h-0'}`}>
              <div className="space-y-3">
                <PasswordInput
                  placeholder="Current password"
                  value={passwords.current}
                  onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-3">
                  <PasswordInput
                    placeholder="New password"
                    value={passwords.newPass}
                    onChange={(e) => setPasswords((p) => ({ ...p, newPass: e.target.value }))}
                  />
                  <PasswordInput
                    placeholder="Confirm password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                  />
                </div>
                {passwordError && <p className="text-xs text-red-600">{passwordError}</p>}
                {passwordSuccess && <p className="text-xs text-green-600">Password updated successfully.</p>}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handlePasswordSubmit}
                    disabled={passwordSubmitDisabled}
                    className="btn-brand text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {passwordLoading ? 'Updating…' : 'Update password'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Change PIN accordion */}
          <div>
            <button
              type="button"
              onClick={() => { setPinOpen((v) => !v); setPasswordOpen(false); }}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-white rounded-lg"
              style={{ backgroundColor: '#1A381E' }}
            >
              <span>Change PIN</span>
              <ChevronIcon open={pinOpen} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${pinOpen ? 'max-h-64 mt-3' : 'max-h-0'}`}>
              <div className="space-y-3">
                <p className="text-xs text-gray-400">PIN is a 6-digit number used to authorize transactions.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Current PIN</label>
                    <PasswordInput
                      placeholder="••••••"
                      value={pins.current}
                      onChange={handlePinChange('current')}
                      inputMode="numeric"
                      maxLength={6}
                      extraClass="tracking-[0.4em] text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">New PIN</label>
                    <PasswordInput
                      placeholder="••••••"
                      value={pins.newPin}
                      onChange={handlePinChange('newPin')}
                      inputMode="numeric"
                      maxLength={6}
                      extraClass="tracking-[0.4em] text-center"
                    />
                  </div>
                </div>
                {pinError && <p className="text-xs text-red-600">{pinError}</p>}
                {pinSuccess && <p className="text-xs text-green-600">PIN updated successfully.</p>}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handlePinSubmit}
                    disabled={pinSubmitDisabled}
                    className="btn-brand text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {pinLoading ? 'Updating…' : 'Update PIN'}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-100">
          <button onClick={handleClose} className="btn-brand-outline px-4 py-2 rounded text-sm font-medium">
            Close
          </button>
        </div>

      </div>
    </div>

    {cropSrc && (
      <AvatarCropModal
        imageSrc={cropSrc}
        onConfirm={(blob) => {
          URL.revokeObjectURL(cropSrc);
          setCropSrc(null);
          setPendingFile(null);
          handleAvatarUpload(blob);
        }}
        onCancel={() => {
          URL.revokeObjectURL(cropSrc);
          setCropSrc(null);
          setPendingFile(null);
        }}
        onError={() => {
          URL.revokeObjectURL(cropSrc);
          setCropSrc(null);
          setPendingFile(null);
          setAvatarError('This image format is not supported. Please use JPEG, PNG, or WebP.');
        }}
      />
    )}
  </>
  );
}
