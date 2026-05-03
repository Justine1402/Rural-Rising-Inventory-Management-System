import { createContext, useContext, useState } from 'react';

const UIContext = createContext();

export function UIProvider({ children }) {
  const [receiveOrderFormOpen, setReceiveOrderFormOpen] = useState(false);
  const [createProductFormOpen, setCreateProductFormOpen] = useState(false);

  return (
    <UIContext.Provider value={{
      receiveOrderFormOpen, setReceiveOrderFormOpen,
      createProductFormOpen, setCreateProductFormOpen,
    }}>
      {children}
    </UIContext.Provider>
  );
}

export const useUI = () => useContext(UIContext);
