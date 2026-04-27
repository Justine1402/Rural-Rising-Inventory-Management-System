import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const WarehouseContext = createContext(null);

export function WarehouseProvider({ children }) {
  const [warehouses, setWarehouses] = useState([]);
  const [activeWarehouse, setActiveWarehouse] = useState(null);

  useEffect(() => {
    api.get('/warehouses')
      .then((res) => {
        const list = res.data.warehouses ?? [];
        setWarehouses(list);
        if (list.length > 0) setActiveWarehouse(list[0]);
      })
      .catch(() => {
        // WarehouseController not built yet — stays empty until Step 4
      });
  }, []);

  return (
    <WarehouseContext.Provider value={{ activeWarehouse, warehouses, setActiveWarehouse }}>
      {children}
    </WarehouseContext.Provider>
  );
}

export function useWarehouse() {
  return useContext(WarehouseContext);
}
