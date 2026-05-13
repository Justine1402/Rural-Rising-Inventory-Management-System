import { createContext, useContext, useState } from 'react';

const UIContext = createContext();

export function UIProvider({ children }) {
  const [receiveOrderFormOpen, setReceiveOrderFormOpen] = useState(false);
  const [createProductFormOpen, setCreateProductFormOpen] = useState(false);
  const [productRefreshKey, setProductRefreshKey] = useState(0);

  const refreshProducts = () => setProductRefreshKey((k) => k + 1);

  return (
    <UIContext.Provider value={{
      receiveOrderFormOpen, setReceiveOrderFormOpen,
      createProductFormOpen, setCreateProductFormOpen,
      productRefreshKey, refreshProducts,
    }}>
      {children}
    </UIContext.Provider>
  );
}

export const useUI = () => useContext(UIContext);
