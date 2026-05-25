import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import api from '../../api/axios';

const fieldClass =
  'w-full bg-gray-100 border border-transparent rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1A381E] focus:bg-white transition';
const disabledFieldClass =
  'w-full bg-gray-100 border border-transparent rounded-lg px-4 py-3 text-sm text-gray-400 cursor-not-allowed';
const labelClass = 'block text-sm text-gray-500 mb-1';
const errorClass = 'text-red-600 text-xs mt-1';

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

  function setField(field) {
    return (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));
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

  const fc = isReadOnly ? disabledFieldClass : fieldClass;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={handleClose} />

      <div className="fixed top-[115px] left-1/2 -translate-x-1/2 w-[700px] max-h-[calc(100vh-150px)] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 p-8 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isCreateMode ? 'New User' : 'Edit User'}
          </h2>
          <button
            onClick={handleClose}
            className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg btn-brand"
          >
            RETURN
          </button>
        </div>

        {/* Deactivated notice */}
        {isReadOnly && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            This user is deactivated.
          </div>
        )}

        {/* Global error */}
        {errors._global && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {errors._global}
          </div>
        )}

        {/* Loading in edit mode */}
        {isEditMode && !editingUser && !errors._global && (
          <div className="text-gray-500 text-sm py-8 text-center">Loading...</div>
        )}

        {/* Form */}
        {(isCreateMode || editingUser) && (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name */}
            <div>
              <label className={labelClass}>Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.name}
                onChange={setField('name')}
                disabled={isReadOnly}
                className={fc}
              />
              {errors.name && <p className={errorClass}>{errors.name[0]}</p>}
            </div>

            {/* Email */}
            <div>
              <label className={labelClass}>Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                value={formData.email}
                onChange={setField('email')}
                disabled={isReadOnly}
                className={fc}
              />
              {errors.email && <p className={errorClass}>{errors.email[0]}</p>}
            </div>

            {/* Password — create mode only */}
            {isCreateMode && (
              <div>
                <label className={labelClass}>Password <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={setField('password')}
                  className={fieldClass}
                  autoComplete="new-password"
                />
                {errors.password && <p className={errorClass}>{errors.password[0]}</p>}
              </div>
            )}

            {/* Role — hidden when editing self */}
            {!isSelf && (
              <div>
                <label className={labelClass}>Role <span className="text-red-500">*</span></label>
                <select
                  value={formData.role}
                  onChange={setField('role')}
                  disabled={isReadOnly}
                  className={fc}
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                </select>
                {errors.role && <p className={errorClass}>{errors.role[0]}</p>}
              </div>
            )}

            {/* Warehouse */}
            <div>
              <label className={labelClass}>
                Warehouse{formData.role === 'manager' && <span className="text-red-500"> *</span>}
              </label>
              <select
                value={formData.warehouse_id}
                onChange={setField('warehouse_id')}
                disabled={isReadOnly}
                className={fc}
              >
                <option value="">— None —</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
              {errors.warehouse_id && <p className={errorClass}>{errors.warehouse_id[0]}</p>}
            </div>

            {/* Position Title */}
            <div>
              <label className={labelClass}>Position Title</label>
              <input
                type="text"
                value={formData.position_title}
                onChange={setField('position_title')}
                disabled={isReadOnly}
                className={fc}
              />
              {errors.position_title && <p className={errorClass}>{errors.position_title[0]}</p>}
            </div>

            {/* PIN — create mode only */}
            {isCreateMode && (
              <div>
                <label className={labelClass}>PIN <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={formData.pin}
                  onChange={setField('pin')}
                  className={fieldClass}
                  placeholder="6 digits"
                />
                {errors.pin && <p className={errorClass}>{errors.pin[0]}</p>}
              </div>
            )}

            {/* Submit row — not shown in read-only mode */}
            {!isReadOnly && (
              <div className="flex items-center gap-3 pt-2">
                {successLabel && (
                  <span className="text-sm text-green-700 font-medium">{successLabel}</span>
                )}
                <button
                  type="submit"
                  disabled={submitting || !!successLabel}
                  className="btn-brand text-white px-6 py-2.5 rounded-lg font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed ml-auto"
                >
                  {submitting ? 'Saving…' : isCreateMode ? 'CREATE' : 'UPDATE'}
                </button>
              </div>
            )}
          </form>
        )}

        {/* Restore button — read-only mode only */}
        {isReadOnly && (
          <button
            type="button"
            onClick={handleRestore}
            disabled={submitting}
            className="btn-brand text-white px-4 py-2 rounded mt-4 font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Restoring…' : 'Restore User'}
          </button>
        )}

        {/* Reset Password / Reset PIN / Delete — edit mode, not read-only */}
        {isEditMode && editingUser && !isReadOnly && (
          <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">

            {/* Reset Password */}
            <div>
              {!resetPasswordOpen ? (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => { setResetPasswordOpen(true); setResetPasswordError(''); }}
                    className="text-sm text-[#409645] font-medium hover:underline"
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
                  <input
                    type="password"
                    value={resetPasswordValue}
                    onChange={e => setResetPasswordValue(e.target.value)}
                    className={fieldClass}
                    autoComplete="new-password"
                    minLength={8}
                  />
                  {resetPasswordError && <p className={errorClass}>{resetPasswordError}</p>}
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      className="btn-brand text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => { setResetPasswordOpen(false); setResetPasswordValue(''); setResetPasswordError(''); }}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
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
                    className="text-sm text-[#409645] font-medium hover:underline"
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
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={resetPinValue}
                    onChange={e => setResetPinValue(e.target.value)}
                    className={fieldClass}
                    placeholder="6 digits"
                  />
                  {resetPinError && <p className={errorClass}>{resetPinError}</p>}
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={handleResetPin}
                      className="btn-brand text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => { setResetPinOpen(false); setResetPinValue(''); setResetPinError(''); }}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
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
                    className="px-4 py-2 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50"
                  >
                    Delete User
                  </button>
                ) : (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="font-semibold text-red-900 mb-2">Delete user?</h3>
                    <p className="text-sm text-red-800 mb-3">
                      {editingUser.name} will be deactivated. Their past transaction records will remain intact, but they will no longer be able to log in.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={submitting}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm disabled:opacity-60"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmOpen(false)}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>
    </>
  );
}
