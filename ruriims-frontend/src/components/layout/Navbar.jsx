import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWarehouse } from '../../context/WarehouseContext';
import { useUI } from '../../context/UIContext';
import ProfileModal from '../modals/ProfileModal';

const ChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);


const GearIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const STATIC_ACTION_BUTTONS = [
  { label: '+ Issue Product',              to: null },
  { label: '+ Transfer Request',           to: null },
  { label: '+ Create Temporary Warehouse', to: null },
];

const BUTTON_ORDER = ['+ Create Product', '+ Receive Order', '+ Issue Product', '+ Transfer Request', '+ Create Temporary Warehouse'];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { activeWarehouse } = useWarehouse();
  const { setReceiveOrderFormOpen, setCreateProductFormOpen } = useUI();
  const navigate = useNavigate();
  const location = useLocation();

  const inventoryLabel = location.pathname.startsWith('/receive-orders') ? 'Receive Orders' : 'Inventory';
  const [menuOpen, setMenuOpen] = useState(false);
  const [gearOpen, setGearOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef(null);
  const gearRef = useRef(null);
  const inventoryRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (gearRef.current && !gearRef.current.contains(e.target)) setGearOpen(false);
      if (inventoryRef.current && !inventoryRef.current.contains(e.target)) setInventoryOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <>
    <nav className="bg-[#1A381E] w-full">

      {/* Row 1 — Brand + Warehouse + Icons */}
      <div className="flex items-center justify-between px-6 py-3">
        <span className="font-bold text-base tracking-widest uppercase" style={{ color: '#FAA31A' }}>
          RURAL RISING
        </span>
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold text-sm">{activeWarehouse?.name ?? 'All Warehouses'}</span>
          {user?.role === 'admin' && (
            <div className="relative" ref={gearRef}>
              <button
                onClick={() => setGearOpen((v) => !v)}
                className="text-white hover:text-green-300 transition-colors"
              >
                <GearIcon />
              </button>
              {gearOpen && (
                <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg z-50 overflow-hidden">
                  <button
                    onClick={() => { setGearOpen(false); navigate('/admin/users'); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Manage Accounts
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Avatar + dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-8 h-8 rounded-full bg-gray-400 flex-shrink-0 hover:ring-2 hover:ring-white transition-all"
            />

            {menuOpen && (
              <div className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {user?.name ?? 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email ?? ''}</p>
                </div>
                <button
                  onClick={() => { setMenuOpen(false); setProfileOpen(true); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  View Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2 — Action buttons + Controls */}
      <div className="flex items-center justify-between px-6 pb-3 gap-4">

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {BUTTON_ORDER.map((label) => {
            if (label === '+ Create Product') {
              return (
                <button key={label} onClick={() => setCreateProductFormOpen(true)}
                  className="bg-[#409645] hover:bg-[#367a38] text-white text-xs font-medium px-3 py-1.5 rounded transition-colors">
                  {label}
                </button>
              );
            }
            if (label === '+ Receive Order') {
              return (
                <button key={label} onClick={() => setReceiveOrderFormOpen(true)}
                  className="bg-[#409645] hover:bg-[#367a38] text-white text-xs font-medium px-3 py-1.5 rounded transition-colors">
                  {label}
                </button>
              );
            }
            const btn = STATIC_ACTION_BUTTONS.find((b) => b.label === label);
            return (
              <button key={label} onClick={() => btn?.to && navigate(btn.to)}
                className="bg-[#409645] hover:bg-[#367a38] text-white text-xs font-medium px-3 py-1.5 rounded transition-colors">
                {label}
              </button>
            );
          })}
        </div>

        {/* Center-right controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="flex items-center gap-1 bg-[#409645] hover:bg-[#367a38] text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors">
            All Products <ChevronDown />
          </button>
          <div className="relative" ref={inventoryRef}>
            <button
              onClick={() => setInventoryOpen((v) => !v)}
              className="flex items-center gap-1 bg-[#409645] hover:bg-[#367a38] text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
            >
              {inventoryLabel} <ChevronDown />
            </button>
            {inventoryOpen && (
              <div className="absolute left-0 top-8 w-48 bg-white rounded-lg shadow-lg z-50 overflow-hidden">
                <button
                  onClick={() => { setInventoryOpen(false); navigate('/'); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Inventory
                </button>
                <button
                  onClick={() => { setInventoryOpen(false); navigate('/receive-orders'); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Receive Orders
                </button>
              </div>
            )}
          </div>
          <button className="flex items-center gap-1 bg-[#409645] hover:bg-[#367a38] text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors">
            LIFO <ChevronDown />
          </button>
          <button className="text-white text-xs font-medium px-3 py-1.5 rounded border border-white hover:bg-[#409645] transition-colors">
            Reports History
          </button>
        </div>

      </div>
    </nav>

    <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
