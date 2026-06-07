// apps/frontend/src/app/dashboard/atestados/layout.tsx

import { AttestationProvider } from '@/contexts/AttestationContext';

export default function AtestadosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AttestationProvider>
      {children}
    </AttestationProvider>
  );
}