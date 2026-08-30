"use client";

import { createContext, useContext, useState } from "react";

type EditContextValue = {
  editing: boolean;
  setEditing: (v: boolean) => void;
  toggleEditing: () => void;
};

const EditContext = createContext<EditContextValue>({
  editing: false,
  setEditing: () => {},
  toggleEditing: () => {},
});

export function AdminEditProvider({ children }: { children: React.ReactNode }) {
  const [editing, setEditing] = useState(false);

  return (
    <EditContext.Provider
      value={{
        editing,
        setEditing,
        toggleEditing: () => setEditing((v) => !v),
      }}
    >
      {children}
    </EditContext.Provider>
  );
}

export function useAdminEdit() {
  return useContext(EditContext);
}
