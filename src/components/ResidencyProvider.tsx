"use client";

import { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import type { ResidencyStatus, LegalType } from "@/types/bank";

interface ResidencyContextType {
  status: ResidencyStatus;
  setStatus: (status: ResidencyStatus) => void;
  legalType: LegalType;
  setLegalType: (type: LegalType) => void;
}

const ResidencyContext = createContext<ResidencyContextType | undefined>(undefined);

export function ResidencyProvider({ 
  children, 
  initialStatus,
  initialLegalType
}: { 
  children: React.ReactNode;
  initialStatus: ResidencyStatus;
  initialLegalType: LegalType;
}) {
  const router = useRouter();

  // 1. Инициализируем локальный стейт
  const [status, setInternalStatus] = useState<ResidencyStatus>(initialStatus);
  const [legalType, setInternalLegalType] = useState<LegalType>(initialLegalType);

  // 2. Храним предыдущие значения пропсов для отслеживания изменений сервера
  const [prevStatusProp, setPrevStatusProp] = useState<ResidencyStatus>(initialStatus);
  const [prevLegalTypeProp, setPrevLegalTypeProp] = useState<LegalType>(initialLegalType);

  // 3. Синхронизируем стейт во время рендера (Паттерн React 18+ вместо useEffect).
  // Это предотвращает ошибку "cascading renders" и делает UI мгновенным.
  if (initialStatus !== prevStatusProp) {
    setPrevStatusProp(initialStatus);
    setInternalStatus(initialStatus);
  }

  if (initialLegalType !== prevLegalTypeProp) {
    setPrevLegalTypeProp(initialLegalType);
    setInternalLegalType(initialLegalType);
  }

  // 4. Функции обновления (Оптимистичный UI + запись куки + запрос на сервер)
  const setStatus = (newStatus: ResidencyStatus) => {
    setInternalStatus(newStatus);
    document.cookie = `expat_status=${newStatus}; path=/; max-age=2592000; SameSite=Lax`;
    router.refresh(); 
  };

  const setLegalType = (newType: LegalType) => {
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

export function useResidency() {
  const context = useContext(ResidencyContext);
  if (!context) {
    throw new Error("useResidency must be used within a ResidencyProvider");
  }
  return context;
}