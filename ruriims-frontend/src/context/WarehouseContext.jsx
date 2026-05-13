import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const WarehouseContext = createContext(null);

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
    api.get('/warehouses')
      .then((res) => {
        const list = res.data.warehouses ?? [];
        setWarehouses(list);
        if (list.length > 0) setActiveWarehouse(list[0]);
      })
      .catch(() => {});
  }, [user]);

  return (
    <WarehouseContext.Provider value={{ activeWarehouse, warehouses, setActiveWarehouse }}>
      {children}
    </WarehouseContext.Provider>
  );
}

export function useWarehouse() {
  return useContext(WarehouseContext);
}
