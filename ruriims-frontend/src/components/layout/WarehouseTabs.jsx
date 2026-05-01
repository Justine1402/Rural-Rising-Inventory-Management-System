import { useAuth } from '../../context/AuthContext';
import { useWarehouse } from '../../context/WarehouseContext';

export default function WarehouseTabs() {
  const { user } = useAuth();
  const { warehouses, activeWarehouse, setActiveWarehouse } = useWarehouse();
  const isAdmin = user?.role === 'admin';

  const activeClass = 'bg-[#409645] text-white text-sm font-medium px-5 py-2 rounded transition-colors';
  const inactiveClass = 'bg-white text-[#1A381E] border border-[#1A381E] text-sm font-medium px-5 py-2 rounded transition-colors hover:bg-green-50';

  return (
    <div className="flex justify-center gap-3 px-6 py-4">
      {isAdmin && (
        <button
          onClick={() => setActiveWarehouse(null)}
          className={activeWarehouse === null ? activeClass : inactiveClass}
        >
          All Warehouses
        </button>
      )}
      {warehouses.map((warehouse) => (
        <button
          key={warehouse.id}
          onClick={() => setActiveWarehouse(warehouse)}
          className={activeWarehouse?.id === warehouse.id ? activeClass : inactiveClass}
        >
          {warehouse.name}
        </button>
      ))}
    </div>
  );
}
