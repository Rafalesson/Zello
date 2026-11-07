// Endereço: apps/frontend/src/contexts/AttestationContext.tsx

'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

// MODIFICAÇÃO: Adicionada a palavra-chave 'export' para que o tipo 'Patient' possa ser importado por outros arquivos.
export type Patient = { 
  id: string; 
  name: string; 
  cpf: string; 
  userId: string;
  patientProfile?: { // Adicionando patientProfile para consistência com outros usos
    dateOfBirth: string;
    sex: 'MALE' | 'FEMALE' | 'OTHER';
  };
};
export type Cid = { id: string; code: string; description: string; };

export type AttestationData = {
  patient: Patient | null;
  cid: Cid | null;
  purpose: string;
  durationInDays: number | '';
  templateId: string;
  hasLegalRepresentative: boolean;
  legalRepresentative: string;
  legalRepresentativeCpf: string;
  signatureStyle: string;
};

export function resolveSignatureImage(signatureStyle: string, templateId: string): string {
  switch (signatureStyle) {
    case 'icp_cfm':
      return '/assinatura_icp_cfm.png';
    case 'rubrica_crm':
      return '/assinatura_rubrica_crm.png';
    case 'gov_iti':
      return '/assinatura_gov_iti.png';
    case 'classic_icp':
      return '/assinatura_img.jpeg';
    default:
      switch (templateId) {
        case 'modern':
          return '/assinatura_rubrica_crm.png';
        case 'institutional':
          return '/assinatura_gov_iti.png';
        case 'classic':
          return '/assinatura_img.jpeg';
        case 'executive':
        case 'default':
        default:
          return '/assinatura_icp_cfm.png';
      }
  }
}

// Tipo para o valor do nosso contexto
type AttestationContextType = {
  data: AttestationData;
  setData: (data: AttestationData) => void;
  clearData: () => void;
};

// Valor inicial do nosso estado
const initialState: AttestationData = {
  patient: null,
  cid: null,
  purpose: '',
  durationInDays: 1,
  templateId: 'default',
  hasLegalRepresentative: false,
  legalRepresentative: '',
  legalRepresentativeCpf: '',
  signatureStyle: 'auto',
};

// Criamos o contexto com um valor padrão
const AttestationContext = createContext<AttestationContextType | undefined>(undefined);

// Este é o nosso Provedor, o componente que vai "segurar" o estado
export function AttestationProvider({ children }: { children: ReactNode }) {
  const [attestationData, setAttestationData] = useState<AttestationData>(initialState);

  const setData = (newData: AttestationData) => {
    setAttestationData(newData);
  };

  const clearData = () => {
    setAttestationData(initialState);
  }

  return (
    <AttestationContext.Provider value={{ data: attestationData, setData, clearData }}>
      {children}
    </AttestationContext.Provider>
  );
}

// Este é um hook customizado para facilitar o uso do contexto nos componentes
export function useAttestation() {
  const context = useContext(AttestationContext);
  if (context === undefined) {
    throw new Error('useAttestation must be used within an AttestationProvider');
  }
  return context;
}