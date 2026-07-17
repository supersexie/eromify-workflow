"use client";
import { SessionProvider } from "next-auth/react";
import { PlanProvider } from "./PlanProvider";

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <PlanProvider>{children}</PlanProvider>
    </SessionProvider>
  );
}
