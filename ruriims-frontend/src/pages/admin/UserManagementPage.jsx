import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import Navbar from '../../components/layout/Navbar';
import StatusBadge from '../../components/ui/StatusBadge';
import api from '../../api/axios';

export default function UserManagementPage() {
  const { user } = useAuth();
  const { setUserFormOpen, setUserDetailOverlayUserId, userRefreshKey } = useUI();
  const navigate = useNavigate();
  const location = useLocation();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    let cancelled = false;
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/users');
        if (!cancelled) {
          setUsers(res.data.users);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load users.');
          setLoading(false);
        }
      }
    };
    fetchUsers();
    return () => { cancelled = true; };
  }, [location.key, userRefreshKey]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return u.name.toLowerCase().includes(term) ||
             u.email.toLowerCase().includes(term);
    });
  }, [users, searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">

          {/* Action bar */}
          <div className="flex items-center justify-between mb-6">
            <button
              className="btn-brand text-white px-4 py-2 rounded-lg font-medium"
              onClick={() => setUserFormOpen(true)}
            >
              + New User
            </button>

            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg w-64 text-sm focus:outline-none focus:ring-2 focus:ring-[#409645]"
              />

              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <select
                value={warehouseFilter}
                onChange={e => setWarehouseFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Warehouses</option>
              </select>
            </div>
          </div>

          {/* States */}
          {loading && (
            <div className="text-gray-500 text-sm py-8 text-center">Loading users...</div>
          )}
          {!loading && error && (
            <div className="text-red-600 text-sm py-4">{error}</div>
          )}
          {!loading && !error && filteredUsers.length === 0 && (
            <div className="text-gray-500 text-sm py-8 text-center">
              {users.length === 0 ? 'No users yet.' : 'No users match your search.'}
            </div>
          )}

          {/* Table */}
          {!loading && !error && filteredUsers.length > 0 && (
            <div className="rounded-lg overflow-hidden border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white text-left" style={{ backgroundColor: '#1A381E' }}>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Warehouse</th>
                    <th className="px-4 py-3 font-semibold">Position</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Date Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => {
                    const isInactive = !!u.deleted_at;
                    return (
                      <tr
                        key={u.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer${isInactive ? ' opacity-60' : ''}`}
                        onClick={() => setUserDetailOverlayUserId(u.id)}
                      >
                        <td className="px-4 py-3 text-gray-800">{u.name}</td>
                        <td className="px-4 py-3 text-gray-700">{u.email}</td>
                        <td className="px-4 py-3 text-gray-700">
                          {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{u.warehouse || '—'}</td>
                        <td className="px-4 py-3 text-gray-700">{u.position_title || '—'}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={isInactive ? 'Inactive' : 'Active'} />
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
