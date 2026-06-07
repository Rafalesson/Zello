import { PrescriptionProvider } from '@/contexts/PrescriptionContext';

export default function ReceitasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PrescriptionProvider>{children}</PrescriptionProvider>;
}
