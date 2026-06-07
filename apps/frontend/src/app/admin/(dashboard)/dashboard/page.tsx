'use client';

import { Activity } from 'lucide-react';

export default function VisaoGeralPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Activity className="h-8 w-8 text-teal-600 dark:text-teal-400" />
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Visão Geral</h1>
      </div>
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center">
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Bem-vindo ao Dashboard Administrativo</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Nesta tela, em breve teremos gráficos e indicadores de desempenho (KPIs) mostrando 
          o total de consultas mensais, crescimento de usuários e outras métricas relevantes do Zello.
        </p>
      </div>
    </div>
  );
}
