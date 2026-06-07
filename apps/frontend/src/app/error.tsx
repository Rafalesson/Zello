// Endereço: apps/frontend/src/app/error.tsx

'use client'; 

import { useEffect } from 'react';
import { Header } from '@/components/Header';
import { AlertOctagon, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-50 dark:bg-slate-900 transition-colors">
      <Header />

      <main className="flex flex-grow flex-col items-center justify-center px-4 py-20 text-center">
        <AlertOctagon className="mb-4 h-16 w-16 text-red-500" />
        <h1 className="mb-4 text-4xl font-bold text-slate-900 dark:text-white">Algo deu errado</h1>
        <p className="max-w-md text-slate-500 dark:text-slate-300 mb-8">
          Lamentamos, mas um erro inesperado ocorreu. Nossa equipe já foi notificada. Por favor, tente novamente.
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center rounded-lg bg-teal-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-teal-700"
        >
          <RefreshCw className="mr-2 h-5 w-5" />
          Tentar Novamente
        </button>
      </main>
    </div>
  );
}