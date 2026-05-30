"use client";

import { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import type { ResidencyStatus } from "@/types/database";

interface ResidencyContextType {
  status: ResidencyStatus;
  setStatus: (status: ResidencyStatus) => void;
  legalType: "individual" | "business";
  setLegalType: (type: "individual" | "business") => void;
}

const ResidencyContext = createContext<ResidencyContextType | undefined>(undefined);

export function ResidencyProvider({ 
  children, 
  initialStatus 
}: { 
  children: React.ReactNode;
  initialStatus: ResidencyStatus;
}) {
  const [status, setInternalStatus] = useState<ResidencyStatus>(initialStatus);
  const [legalType, setInternalLegalType] = useState<"individual" | "business">("individual");
  const router = useRouter();

  const setStatus = (newStatus: ResidencyStatus) => {
    setInternalStatus(newStatus);
    document.cookie = `expat_status=${newStatus}; path=/; max-age=2592000; SameSite=Lax`;
    router.refresh(); 
  };

  const setLegalType = (newType: "individual" | "business") => {
    setInternalLegalType(newType);
    document.cookie = `expat_legal_type=${newType}; path=/; max-age=2592000; SameSite=Lax`;
    router.refresh();
  };

  return (
    <ResidencyContext.Provider value={{ status, setStatus, legalType, setLegalType }}>
      {children}
    </ResidencyContext.Provider>
  );
}

export const useResidency = () => {
  const context = useContext(ResidencyContext);
  if (!context) throw new Error("useResidency must be used within ResidencyProvider");
  return context;
};