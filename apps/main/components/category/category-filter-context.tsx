"use client";

import { createContext, useContext, useState } from "react";

interface FilterContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const FilterContext = createContext<FilterContextValue>({
  isOpen: false,
  setIsOpen: () => {},
});

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return <FilterContext.Provider value={{ isOpen, setIsOpen }}>{children}</FilterContext.Provider>;
}

export const useFilter = () => useContext(FilterContext);
