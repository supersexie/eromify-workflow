"use client";
import { createContext, useContext, useEffect, useState } from "react";

const PlanContext = createContext({ tier: null, loading: true });

export function PlanProvider({ children }) {
  const [state, setState] = useState({ tier: null, loading: true });

  useEffect(() => {
    fetch("/api/auth/whop/membership")
      .then((r) => r.json())
      .then((d) => setState({ tier: d.active ? d.tier : null, loading: false }))
      .catch(() => setState({ tier: null, loading: false }));
  }, []);

  return <PlanContext.Provider value={state}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  return useContext(PlanContext);
}
