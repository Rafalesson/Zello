'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { AlertTriangle, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthProvider';

export default function NotFound() {
  const { isAuthenticated, user } = useAuth();

  const getHomeHref = () => {
    if (!isAuthenticated || !user) return '/';
    if (user.role === 'PATIENT') return '/paciente/dashboard';
    if (user.role === 'DOCTOR') return '/medico/dashboard';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    return '/';
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-50 dark:bg-slate-900 transition-colors">
      <Header />

      <main className="flex flex-grow flex-col items-center justify-center px-4 py-20 text-center">
        <AlertTriangle className="mb-4 h-16 w-16 text-yellow-500" />
        <h1 className="mb-2 text-4xl font-bold text-slate-900 dark:text-white">Erro 404</h1>
        <h2 className="mb-4 text-2xl font-semibold text-slate-700 dark:text-slate-300">Página Não Encontrada</h2>
        <p className="max-w-md text-slate-500 dark:text-slate-300 mb-8">
          Oops! A página que você busca não existe, foi movida ou está indisponível.
        </p>
        <Link href={getHomeHref()} className="inline-flex items-center rounded-lg bg-teal-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-teal-700">
          <Home className="mr-2 h-5 w-5" />
          Voltar ao Início
        </Link>
      </main>
    </div>
  );
}