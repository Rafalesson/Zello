'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Frontend ErrorBoundary caught an error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-900/50 m-4">
      <h2 className="text-2xl font-black text-red-700 dark:text-red-400 mb-4">Algo deu errado!</h2>
      <p className="text-red-600 dark:text-red-300 mb-6 max-w-md">
        Ocorreu um erro inesperado ao tentar carregar esta parte da aplicação.
        Nossa equipe já foi notificada.
      </p>
      <button
        className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors"
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
      >
        Tentar Novamente
      </button>
    </div>
  );
}