import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const WarehouseContext = createContext(null);

function buildWarehouseList(permWarehouses, twhList) {
  const permanent = permWarehouses
    .filter((w) => !w.is_temporary)
    .map((w) => ({
      id: w.id,
      name: w.name,
      code: w.code,
      isTemporary: false,
    }));
  const temporary = twhList.map((t) => ({
    id: t.warehouse_id,
    name: t.name,
    code: t.transaction_code.split('-')[1],
    isTemporary: true,
    transactionCode: t.transaction_code,
    temporaryWarehouseId: t.id,
  }));
  return [...permanent, ...temporary];
}

export function WarehouseProvider({ children }) {
  const { user } = useAuth();
  const [warehouses, setWarehouses] = useState([]);
  const [activeWarehouse, setActiveWarehouse] = useState(null);

  useEffect(() => {
    if (!user) {
      setWarehouses([]);
      setActiveWarehouse(null);
      return;
    }
    Promise.all([
      api.get('/warehouses'),
      api.get('/temporary-warehouses?status=active'),
    ]).then(([permRes, twhRes]) => {
      const list = buildWarehouseList(
        permRes.data.warehouses ?? [],
        twhRes.data.temporary_warehouses ?? [],
      );
      if (user.role === 'manager') {
        const permanent = list.find((w) => !w.isTemporary && w.id === user.warehouse_id)
          ?? list.find((w) => !w.isTemporary)
          ?? null;
        const twhs = list.filter((w) => w.isTemporary);
        const managerList = permanent ? [permanent, ...twhs] : twhs;
        setWarehouses(managerList);
        setActiveWarehouse(managerList[0] ?? null);
      } else {
        setWarehouses(list);
        setActiveWarehouse(null);
      }
    }).catch(() => {});
  }, [user]);

  // Refreshes the warehouse list. If selectWarehouseId is provided (a warehouses.id for a TWH),
  // auto-selects that TWH as active (used after TWH creation). Otherwise preserves the current
  // activeWarehouse if still present, resetting to first only if it disappeared.
  const refreshWarehouses = useCallback((selectWarehouseId = null) => {
    Promise.all([
      api.get('/warehouses'),
      api.get('/temporary-warehouses?status=active'),
    ]).then(([permRes, twhRes]) => {
      const list = buildWarehouseList(
        permRes.data.warehouses ?? [],
        twhRes.data.temporary_warehouses ?? [],
      );
      if (user?.role === 'manager') {
        const permanent = list.find((w) => !w.isTemporary && w.id === user.warehouse_id)
          ?? list.find((w) => !w.isTemporary)
          ?? null;
        const twhs = list.filter((w) => w.isTemporary);
        const managerList = permanent ? [permanent, ...twhs] : twhs;
        setWarehouses(managerList);
        if (selectWarehouseId !== null) {
          const target = managerList.find((w) => w.id === selectWarehouseId && w.isTemporary);
          setActiveWarehouse(target ?? (managerList[0] ?? null));
        } else {
          setActiveWarehouse((prev) => {
            const match = managerList.find(
              (w) => w.id === prev?.id && w.isTemporary === prev?.isTemporary,
            );
            return match ?? (managerList[0] ?? null);
          });
        }
      } else {
        setWarehouses(list);
        if (selectWarehouseId !== null) {
          const target = list.find((w) => w.id === selectWarehouseId && w.isTemporary);
          setActiveWarehouse(target ?? (list.length > 0 ? list[0] : null));
        } else {
          setActiveWarehouse((prev) => {
            if (prev === null) return null; // admin explicitly chose All Warehouses
            const match = list.find(
              (w) => w.id === prev.id && w.isTemporary === prev.isTemporary,
            );
            return match ?? null;
          });
        }
      }
    }).catch(() => {});
  }, [user]);

  return (
    <WarehouseContext.Provider value={{ activeWarehouse, warehouses, setActiveWarehouse, refreshWarehouses }}>
      {children}
    </WarehouseContext.Provider>
  );
}

export function useWarehouse() {
  return useContext(WarehouseContext);
}
