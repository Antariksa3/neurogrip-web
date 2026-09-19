import { createContext, useContext } from "react";
import { useNeuroGripInternal } from "@/hooks/useNeuroGrip";

const NeuroGripContext = createContext(null);

export function NeuroGripProvider({ children }) {
  const value = useNeuroGripInternal();
  return (
    <NeuroGripContext.Provider value={value}>
      {children}
    </NeuroGripContext.Provider>
  );
}

export function useNeuroGrip() {
  const ctx = useContext(NeuroGripContext);
  if (!ctx)
    throw new Error("useNeuroGrip harus dipakai di dalam NeuroGripProvider");
  return ctx;
}
