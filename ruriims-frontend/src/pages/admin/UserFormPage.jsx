import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import api from '../../api/axios';
import CustomSelect from '../../components/ui/CustomSelect';

const BRAND_GREEN = '#409645';
const ERROR_RED = '#DC2626';

const fieldBase =
  'w-full border rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-white transition';
const neutralFieldClass = `${fieldBase} border-gray-300 focus:border-[#409645]`;
// Kept for the Reset Password / Reset PIN sub-forms (no inline validation there).
const fieldClass =
  'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#409645] bg-white transition';
const labelClass = 'text-xs text-gray-500 mb-1 block';
const mainLabelClass = 'text-sm text-gray-700 mb-1.5 block';
const errorClass = 'text-red-600 text-xs mt-1';
const sectionLabelClass = 'text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY_FORM = {
  name: '', email: '', password: '', role: 'manager',
  warehouse_id: '', position_title: '', pin: '',
};

export default function UserFormPage() {
  const { user: authUser } = useAuth();
  const {
    userFormOpen, setUserFormOpen,
    userDetailOverlayUserId, setUserDetailOverlayUserId,
    refreshUsers,
  } = useUI();

  const isCreateMode = userFormOpen === true;
  const isEditMode = userDetailOverlayUserId !== null;
  const isOpen = isCreateMode || isEditMode;

  const [editingUser, setEditingUser] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [successLabel, setSuccessLabel] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [resetPinOpen, setResetPinOpen] = useState(false);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetPinValue, setResetPinValue] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [resetPinError, setResetPinError] = useState('');
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState('');
  const [resetPinSuccess, setResetPinSuccess] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (!isEditMode) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/users/${userDetailOverlayUserId}`);
        if (!cancelled) {
          const u = res.data.user;
          setEditingUser(u);
          setFormData({
            name: u.name,
            email: u.email,
            password: '',
            role: u.role,
            warehouse_id: u.warehouse_id || '',
            position_title: u.position_title || '',
            pin: '',
          });
        }
      } catch (err) {
        if (!cancelled) setErrors({ _global: 'Failed to load user.' });
      }
    })();
    return () => { cancelled = true; };
  }, [isEditMode, userDetailOverlayUserId]);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const res = await api.get('/warehouses');
        setWarehouses(res.data.warehouses.filter(w => !w.is_temporary));
      } catch (err) { /* silent fail — dropdown stays empty */ }
    })();
  }, [isOpen]);

  if (!isOpen) return null;

  const isReadOnly = isEditMode && editingUser && !!editingUser.deleted_at;
  const isSelf = isEditMode && editingUser && editingUser.id === authUser?.id;

  function handleClose() {
    setUserFormOpen(false);
    setUserDetailOverlayUserId(null);
    setEditingUser(null);
    setFormData(EMPTY_FORM);
    setSubmitting(false);
    setErrors({});
    setSuccessLabel('');
    setShowPassword(false);
    setTouched({});
    setResetPasswordOpen(false);
    setResetPinOpen(false);
    setResetPasswordValue('');
    setResetPinValue('');
    setResetPasswordError('');
    setResetPinError('');
    setResetPasswordSuccess('');
    setResetPinSuccess('');
    setDeleteConfirmOpen(false);
  }

  const markTouched = (field) => setTouched(prev => (prev[field] ? prev : { ...prev, [field]: true }));

  function setField(field) {
    return (e) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
      markTouched(field);
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      if (isCreateMode) {
        const res = await api.post('/users', formData);
        setSuccessLabel(`Created ${res.data.user.name}`);
      } else {
        const { password, pin, ...editData } = formData;
        const res = await api.put(`/users/${editingUser.id}`, editData);
        setSuccessLabel(`Updated ${res.data.user.name}`);
      }
      refreshUsers();
      setTimeout(() => handleClose(), 1500);
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        setErrors({ _global: err.response?.data?.message || 'Submit failed.' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword() {
    setResetPasswordError('');
    if (!resetPasswordValue || resetPasswordValue.length < 8) {
      setResetPasswordError('Password must be at least 8 characters.');
      return;
    }
    try {
      await api.post(`/users/${editingUser.id}/reset-password`, { password: resetPasswordValue });
      setResetPasswordSuccess('Password reset');
      setResetPasswordOpen(false);
      setResetPasswordValue('');
      setTimeout(() => setResetPasswordSuccess(''), 2000);
    } catch (err) {
      setResetPasswordError(err.response?.data?.message || 'Failed to reset password.');
    }
  }

  async function handleResetPin() {
    setResetPinError('');
    if (!/^\d{6}$/.test(resetPinValue)) {
      setResetPinError('PIN must be exactly 6 digits.');
      return;
    }
    try {
      await api.post(`/users/${editingUser.id}/reset-pin`, { pin: resetPinValue });
      setResetPinSuccess('PIN reset');
      setResetPinOpen(false);
      setResetPinValue('');
      setTimeout(() => setResetPinSuccess(''), 2000);
    } catch (err) {
      setResetPinError(err.response?.data?.message || 'Failed to reset PIN.');
    }
  }

  async function handleDelete() {
    setSubmitting(true);
    try {
      await api.delete(`/users/${editingUser.id}`);
      refreshUsers();
      handleClose();
    } catch (err) {
      setErrors({ _global: err.response?.data?.message || 'Delete failed.' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRestore() {
    setSubmitting(true);
    try {
      await api.post(`/users/${editingUser.id}/restore`);
      refreshUsers();
      handleClose();
    } catch (err) {
      setErrors({ _global: err.response?.data?.message || 'Restore failed.' });
    } finally {
      setSubmitting(false);
    }
  }

  // ---- Client-side validation (front-end only; backend remains authoritative) ----
  const nameValid = formData.name.trim().length > 0;
  const emailValid = EMAIL_REGEX.test(formData.email);
  const passwordValid = formData.password.length >= 8;
  const warehouseRequired = formData.role === 'manager';
  const warehouseValid = !warehouseRequired || !!formData.warehouse_id;
  const pinValid = /^\d{6}$/.test(formData.pin);

  const validity = {
    name: nameValid, email: emailValid, password: passwordValid,
    warehouse_id: warehouseValid, pin: pinValid,
  };
  const hasValue = {
    name: formData.name.trim().length > 0,
    email: formData.email.length > 0,
    password: formData.password.length > 0,
    warehouse_id: !!formData.warehouse_id,
    pin: formData.pin.length > 0,
  };
  const stateFor = (field) => {
    if (hasValue[field] && validity[field]) return 'valid';
    if (touched[field] && !validity[field]) return 'invalid';
    return 'neutral';
  };
  const borderColorFor = (field) => {
    const s = stateFor(field);
    return s === 'valid' ? BRAND_GREEN : s === 'invalid' ? ERROR_RED : undefined;
  };
  const inputClass = (field, extra = '') =>
    `${fieldBase} ${stateFor(field) === 'neutral' ? 'border-gray-300 focus:border-[#409645]' : ''} ${extra}`
      .replace(/\s+/g, ' ').trim();
  const inputStyle = (field) => {
    const c = borderColorFor(field);
    return c ? { borderColor: c } : undefined;
  };

  // Password strength (advisory only): uppercase, number, length >= 8, special char
  const pw = formData.password;
  const pwScore = [/[A-Z]/.test(pw), /[0-9]/.test(pw), pw.length >= 8, /[^A-Za-z0-9]/.test(pw)]
    .filter(Boolean).length;
  const pwLabel = pwScore <= 1 ? 'Weak' : pwScore === 2 ? 'Fair' : pwScore === 3 ? 'Good' : 'Strong';
  const pwColor = pwScore <= 1 ? ERROR_RED : pwScore === 2 ? '#F59E0B' : pwScore === 3 ? '#489F46' : BRAND_GREEN;
  const pwSegments = pwScore <= 1 ? 1 : pwScore;

  const isFormValid = isCreateMode
    ? (nameValid && emailValid && passwordValid && warehouseValid && pinValid)
    : (nameValid && emailValid && warehouseValid);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={handleClose} />

      {/* Card */}
      <div className="fixed top-[115px] left-1/2 -translate-x-1/2 w-[900px] max-h-[85vh] bg-white rounded-2xl shadow-2xl z-50 overflow-y-auto">

        {/* Dark green sticky header */}
        <div
          className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
          style={{ backgroundColor: '#1A381E' }}
        >
          <button
            onClick={handleClose}
            className="text-white text-sm font-medium hover:opacity-80 transition-opacity"
          >
            ← RETURN
          </button>
          <span className="text-white font-semibold text-lg">
            {isCreateMode ? 'New User' : 'Edit User'}
          </span>
        </div>

        {/* Body */}
        <div className="p-6">

          {/* Deactivated notice */}
          {isReadOnly && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              This user is deactivated.
            </div>
          )}

          {/* Global error */}
          {errors._global && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errors._global}
            </div>
          )}

          {/* Loading state */}
          {isEditMode && !editingUser && !errors._global && (
            <div className="text-gray-500 text-sm py-8 text-center">Loading…</div>
          )}

          {/* Form */}
          {(isCreateMode || editingUser) && (
            <>
              <form onSubmit={handleSubmit}>

                {/* ===== ACCOUNT DETAILS ===== */}
                <p className={sectionLabelClass}>Account Details</p>

                <div className="grid grid-cols-2 gap-x-16 gap-y-7">

                  {/* Full Name */}
                  <div>
                    {isReadOnly ? (
                      <>
                        <p className="text-xs text-gray-500 mb-0.5">Full Name</p>
                        <p className="font-semibold text-gray-800">{formData.name || '—'}</p>
                      </>
                    ) : (
                      <>
                        <label className={mainLabelClass}>Full Name <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={setField('name')}
                          onBlur={() => markTouched('name')}
                          placeholder="e.g. Maria Santos"
                          className={inputClass('name')}
                          style={inputStyle('name')}
                        />
                        {stateFor('name') === 'invalid'
                          ? <p className={errorClass}>Full name is required</p>
                          : errors.name && <p className={errorClass}>{errors.name[0]}</p>}
                      </>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    {isReadOnly ? (
                      <>
                        <p className="text-xs text-gray-500 mb-0.5">Email</p>
                        <p className="font-semibold text-gray-800">{formData.email || '—'}</p>
                      </>
                    ) : (
                      <>
                        <label className={mainLabelClass}>Email <span className="text-red-500">*</span></label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={setField('email')}
                          onBlur={() => markTouched('email')}
                          placeholder="name@company.com"
                          className={inputClass('email')}
                          style={inputStyle('email')}
                        />
                        {stateFor('email') === 'invalid'
                          ? <p className={errorClass}>Enter a valid email address</p>
                          : errors.email && <p className={errorClass}>{errors.email[0]}</p>}
                      </>
                    )}
                  </div>

                  {/* Password — create mode only */}
                  {isCreateMode && (
                    <div>
                      <label className={mainLabelClass}>Password <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={setField('password')}
                          onBlur={() => markTouched('password')}
                          placeholder="At least 8 characters"
                          autoComplete="new-password"
                          className={inputClass('password', 'pr-16')}
                          style={inputStyle('password')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(v => !v)}
                          className="absolute inset-y-0 right-3 flex items-center text-xs font-bold tracking-wide"
                          style={{ color: BRAND_GREEN }}
                        >
                          {showPassword ? 'HIDE' : 'SHOW'}
                        </button>
                      </div>

                      {/* Strength meter — advisory */}
                      {formData.password && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 flex gap-1">
                            {[0, 1, 2, 3].map(i => (
                              <div
                                key={i}
                                className="h-1.5 flex-1 rounded-full"
                                style={{ backgroundColor: i < pwSegments ? pwColor : '#e5e7eb' }}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-bold" style={{ color: pwColor }}>{pwLabel}</span>
                        </div>
                      )}

                      {touched.password && !formData.password
                        ? <p className={errorClass}>Password is required</p>
                        : errors.password && <p className={errorClass}>{errors.password[0]}</p>}
                    </div>
                  )}

                  {/* Role — hidden when editing self */}
                  {!isSelf && (
                    <div>
                      {isReadOnly ? (
                        <>
                          <p className="text-xs text-gray-500 mb-0.5">Role</p>
                          <p className="font-semibold text-gray-800 capitalize">{formData.role || '—'}</p>
                        </>
                      ) : (
                        <>
                          <label className={mainLabelClass}>Role <span className="text-red-500">*</span></label>
                          <CustomSelect
                            value={formData.role}
                            onChange={setField('role')}
                            options={[
                              { value: 'admin', label: 'Admin' },
                              { value: 'manager', label: 'Manager' },
                            ]}
                          />
                          {errors.role && <p className={errorClass}>{errors.role[0]}</p>}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 my-7" />

                {/* ===== ROLE & ASSIGNMENT ===== */}
                <p className={sectionLabelClass}>Role &amp; Assignment</p>

                <div className="grid grid-cols-2 gap-x-16 gap-y-7">

                  {/* Warehouse */}
                  <div>
                    {isReadOnly ? (
                      <>
                        <p className="text-xs text-gray-500 mb-0.5">Warehouse</p>
                        <p className="font-semibold text-gray-800">
                          {warehouses.find((w) => String(w.id) === String(formData.warehouse_id))?.name ?? '—'}
                        </p>
                      </>
                    ) : (
                      <>
                        <label className={mainLabelClass}>
                          Warehouse{warehouseRequired && <span className="text-red-500"> *</span>}
                        </label>
                        <CustomSelect
                          value={formData.warehouse_id}
                          onChange={setField('warehouse_id')}
                          borderColor={borderColorFor('warehouse_id')}
                          options={[
                            { value: '', label: '— None —' },
                            ...warehouses.map((w) => ({ value: w.id, label: w.name })),
                          ]}
                        />
                        {stateFor('warehouse_id') === 'invalid'
                          ? <p className={errorClass}>Warehouse is required for managers</p>
                          : errors.warehouse_id && <p className={errorClass}>{errors.warehouse_id[0]}</p>}
                      </>
                    )}
                  </div>

                  {/* Position Title */}
                  <div>
                    {isReadOnly ? (
                      <>
                        <p className="text-xs text-gray-500 mb-0.5">Position Title</p>
                        <p className="font-semibold text-gray-800">{formData.position_title || '—'}</p>
                      </>
                    ) : (
                      <>
                        <label className={mainLabelClass}>Position Title</label>
                        <input
                          type="text"
                          value={formData.position_title}
                          onChange={setField('position_title')}
                          placeholder="e.g. Inventory Supervisor"
                          className={neutralFieldClass}
                        />
                        {errors.position_title && <p className={errorClass}>{errors.position_title[0]}</p>}
                      </>
                    )}
                  </div>

                  {/* PIN — create mode only */}
                  {isCreateMode && (
                    <div>
                      <label className={mainLabelClass}>PIN <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={formData.pin}
                        onChange={setField('pin')}
                        onBlur={() => markTouched('pin')}
                        placeholder="6 digits"
                        className={inputClass('pin', 'tracking-widest')}
                        style={inputStyle('pin')}
                      />
                      {stateFor('pin') === 'invalid'
                        ? <p className={errorClass}>PIN must be 6 digits</p>
                        : errors.pin && <p className={errorClass}>{errors.pin[0]}</p>}
                    </div>
                  )}
                </div>

                {/* Submit — not shown in read-only mode */}
                {!isReadOnly && (
                  <div className="flex items-center justify-end gap-3 mt-8">
                    {successLabel && (
                      <span className="text-sm text-green-700 font-medium">{successLabel}</span>
                    )}
                    <button
                      type="submit"
                      disabled={submitting || !!successLabel || !isFormValid}
                      className="px-8 py-2.5 text-sm font-bold text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ backgroundColor: BRAND_GREEN }}
                    >
                      {submitting ? 'Saving…' : isCreateMode ? 'CREATE' : 'UPDATE'}
                    </button>
                  </div>
                )}
              </form>

              {/* Restore — read-only mode only */}
              {isReadOnly && (
                <div className="flex justify-end mt-4">
                  <button
                    type="button"
                    onClick={handleRestore}
                    disabled={submitting}
                    className="px-8 py-2.5 text-sm font-bold text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ backgroundColor: BRAND_GREEN }}
                  >
                    {submitting ? 'Restoring…' : 'Restore User'}
                  </button>
                </div>
              )}

              {/* Account Actions — edit mode, not read-only */}
              {isEditMode && editingUser && !isReadOnly && (
                <div className="mt-6 pt-6 border-t border-gray-100">

                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                    Account Actions
                  </p>

                  <div className="space-y-4">

                    {/* Reset Password */}
                    <div>
                      {!resetPasswordOpen ? (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => { setResetPasswordOpen(true); setResetPasswordError(''); }}
                            className="text-sm font-medium px-4 py-2 border border-[#409645] text-[#409645] rounded-lg hover:bg-green-50 transition-colors"
                          >
                            Reset Password
                          </button>
                          {resetPasswordSuccess && (
                            <span className="text-sm text-green-700">{resetPasswordSuccess}</span>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <label className={labelClass}>New Password</label>
                          <input type="password" value={resetPasswordValue} onChange={e => setResetPasswordValue(e.target.value)} className={fieldClass} autoComplete="new-password" minLength={8} />
                          {resetPasswordError && <p className={errorClass}>{resetPasswordError}</p>}
                          <div className="flex gap-2 mt-3">
                            <button type="button" onClick={handleResetPassword} className="px-6 py-2 text-sm font-bold text-white rounded-lg" style={{ backgroundColor: '#409645' }}>Confirm</button>
                            <button type="button" onClick={() => { setResetPasswordOpen(false); setResetPasswordValue(''); setResetPasswordError(''); }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Reset PIN */}
                    <div>
                      {!resetPinOpen ? (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => { setResetPinOpen(true); setResetPinError(''); }}
                            className="text-sm font-medium px-4 py-2 border border-[#409645] text-[#409645] rounded-lg hover:bg-green-50 transition-colors"
                          >
                            Reset PIN
                          </button>
                          {resetPinSuccess && (
                            <span className="text-sm text-green-700">{resetPinSuccess}</span>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <label className={labelClass}>New PIN (6 digits)</label>
                          <input type="text" inputMode="numeric" maxLength={6} value={resetPinValue} onChange={e => setResetPinValue(e.target.value)} className={fieldClass} placeholder="6 digits" />
                          {resetPinError && <p className={errorClass}>{resetPinError}</p>}
                          <div className="flex gap-2 mt-3">
                            <button type="button" onClick={handleResetPin} className="px-6 py-2 text-sm font-bold text-white rounded-lg" style={{ backgroundColor: '#409645' }}>Confirm</button>
                            <button type="button" onClick={() => { setResetPinOpen(false); setResetPinValue(''); setResetPinError(''); }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Delete — hidden when editing self */}
                    {!isSelf && (
                      <div>
                        {!deleteConfirmOpen ? (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmOpen(true)}
                            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors"
                          >
                            Delete User
                          </button>
                        ) : (
                          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm font-semibold text-red-900 mb-2">Delete {editingUser.name}?</p>
                            <p className="text-sm text-red-800 mb-3">
                              This account will be deactivated. Their past transaction records will remain intact, but they will no longer be able to log in.
                            </p>
                            <div className="flex gap-2">
                              <button type="button" onClick={handleDelete} disabled={submitting} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-bold disabled:opacity-60">
                                {submitting ? 'Deleting…' : 'Delete'}
                              </button>
                              <button type="button" onClick={() => setDeleteConfirmOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </>
  );
}
