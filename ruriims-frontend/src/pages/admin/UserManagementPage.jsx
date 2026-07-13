import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import Navbar from '../../components/layout/Navbar';
import StatusBadge from '../../components/ui/StatusBadge';
import CustomSelect from '../../components/ui/CustomSelect';
import Pagination, { FillerRows } from '../../components/ui/Pagination';
import { usePagination } from '../../utils/usePagination';
import { formatDate } from '../../utils/formatDate';
import api from '../../api/axios';

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export default function UserManagementPage() {
  const { user } = useAuth();
  const { setUserFormOpen, setUserDetailOverlayUserId, userRefreshKey } = useUI();
  const navigate = useNavigate();
  const location = useLocation();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');

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

  const warehouseOptions = useMemo(() => {
    return users
      .map(u => u.warehouse)
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch =
        !searchTerm ||
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = !roleFilter || u.role === roleFilter;
      const matchesStatus =
        !statusFilter ||
        (statusFilter === 'active' && !u.deleted_at) ||
        (statusFilter === 'inactive' && !!u.deleted_at);
      const matchesWarehouse = !warehouseFilter || u.warehouse === warehouseFilter;
      return matchesSearch && matchesRole && matchesStatus && matchesWarehouse;
    });
  }, [users, searchTerm, roleFilter, statusFilter, warehouseFilter]);

  const { page, setPage, totalPages, pageItems, fillerCount } = usePagination(filteredUsers, {
    resetKey: `${searchTerm}-${roleFilter}-${statusFilter}-${warehouseFilter}`,
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="p-6">
        <div className="bg-white rounded shadow overflow-hidden">

          {/* Filter / action bar */}
          <div className="flex items-center gap-3 flex-wrap p-4 border-b border-gray-200">
            <button
              className="btn-brand text-white px-4 py-2 rounded font-medium"
              onClick={() => setUserFormOpen(true)}
            >
              + New User
            </button>

            {/* Search — pushed right */}
            <div className="ml-auto relative flex items-center">
              <span className="absolute left-2 text-gray-400 pointer-events-none">
                <SearchIcon />
              </span>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#409645] w-64 pl-7"
              />
            </div>

            <div className="w-40">
              <CustomSelect
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Roles' },
                  { value: 'admin', label: 'Admin' },
                  { value: 'manager', label: 'Manager' },
                ]}
              />
            </div>

            <div className="w-40">
              <CustomSelect
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
              />
            </div>

            <div className="w-48">
              <CustomSelect
                value={warehouseFilter}
                onChange={e => setWarehouseFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Warehouses' },
                  ...warehouseOptions.map(name => ({ value: name, label: name })),
                ]}
              />
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white text-left" style={{ backgroundColor: '#1A381E' }}>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Warehouse</th>
                <th className="px-4 py-3 font-semibold">Position</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Date Created</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Loading users…</td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-red-500">{error}</td></tr>
              )}
              {!loading && !error && filteredUsers.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  {users.length === 0 ? 'No users yet.' : 'No users match your search.'}
                </td></tr>
              )}
              {!loading && !error && pageItems.map(u => {
                const isInactive = !!u.deleted_at;
                return (
                  <tr
                    key={u.id}
                    onClick={() => setUserDetailOverlayUserId(u.id)}
                    className={`border-b border-gray-100 odd:bg-white even:bg-gray-50 transition-colors cursor-pointer${isInactive ? ' opacity-60' : ''}`}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          {u.avatar_url ? (
                            <img
                              src={u.avatar_url}
                              alt={u.name}
                              className="w-9 h-9 rounded-full object-cover"
                            />
                          ) : (
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                              style={{ backgroundColor: '#1A381E' }}
                            >
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span
                            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${u.deleted_at ? 'bg-red-400' : 'bg-green-400'}`}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                          <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{u.warehouse || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{u.position_title || '—'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={isInactive ? 'Inactive' : 'Active'} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(u.created_at?.slice(0, 10))}
                    </td>
                  </tr>
                );
              })}
              <FillerRows count={fillerCount} colSpan={6} lines={2} />
            </tbody>
          </table>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

        </div>
      </div>
    </div>
  );
}
