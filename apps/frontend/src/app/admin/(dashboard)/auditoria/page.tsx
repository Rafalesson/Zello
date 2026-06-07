'use client';

import { List } from 'lucide-react';

export default function AuditoriaPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <List className="h-8 w-8 text-teal-600 dark:text-teal-400" />
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Logs de Auditoria</h1>
      </div>
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center">
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Rastreabilidade do Sistema</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Nesta seção, será implementada uma tabela com todos os eventos críticos do sistema 
          (aprovação de médicos, logins, emissão de documentos) para auditoria de segurança.
        </p>
      </div>
    </div>
  );
}
