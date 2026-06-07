// Endereço: apps/frontend/src/app/dashboard/loading.tsx (versão final)

import { Spinner } from '@/components/Spinner';

export default function DashboardLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Spinner />
    </div>
  );
}