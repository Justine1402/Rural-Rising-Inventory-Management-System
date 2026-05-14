import { createContext, useContext, useState } from 'react';

const UIContext = createContext();

export function UIProvider({ children }) {
  const [receiveOrderFormOpen, setReceiveOrderFormOpen] = useState(false);
  const [createProductFormOpen, setCreateProductFormOpen] = useState(false);
  const [transferRequestFormOpen, setTransferRequestFormOpen] = useState(false);
  const [issueProductFormOpen, setIssueProductFormOpen] = useState(false);
  const [productRefreshKey, setProductRefreshKey] = useState(0);
  const [receiveOrderRefreshKey, setReceiveOrderRefreshKey] = useState(0);
  const [transferRequestRefreshKey, setTransferRequestRefreshKey] = useState(0);

  const refreshProducts = () => setProductRefreshKey((k) => k + 1);
  const refreshReceiveOrders = () => setReceiveOrderRefreshKey((k) => k + 1);
  const refreshTransferRequests = () => setTransferRequestRefreshKey((k) => k + 1);

  return (
    <UIContext.Provider value={{
      receiveOrderFormOpen, setReceiveOrderFormOpen,
      createProductFormOpen, setCreateProductFormOpen,
      transferRequestFormOpen, setTransferRequestFormOpen,
      issueProductFormOpen, setIssueProductFormOpen,
      productRefreshKey, refreshProducts,
      receiveOrderRefreshKey, refreshReceiveOrders,
      transferRequestRefreshKey, refreshTransferRequests,
    }}>
      {children}
    </UIContext.Provider>
  );
}

export const useUI = () => useContext(UIContext);
