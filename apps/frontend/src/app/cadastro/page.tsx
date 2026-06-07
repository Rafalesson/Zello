// Endereço: apps/frontend/src/app/cadastro/page.tsx

import { PublicLayout } from "@/components/PublicLayout";
import { Stethoscope, User, ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function RegistrationTypePage() {
  return (
    <PublicLayout>
      <div className="w-full max-w-lg">
        {/* Card container */}
        <div className="rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-lg ring-1 ring-slate-900/5 dark:ring-slate-700">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Já tenho uma conta
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Crie sua conta
            </h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Escolha o tipo de perfil que melhor representa você.
            </p>
          </div>

          {/* Options */}
          <div className="space-y-4">
            {/* Médico */}
            <Link
              href="/cadastro/medico"
              className="group flex items-center gap-5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 p-5 transition-all duration-200 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-md hover:bg-teal-50 dark:hover:bg-teal-900/20"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-900/30 transition-colors duration-200 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/50">
                <Stethoscope className="h-7 w-7 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Sou Médico(a)
                </h2>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Emita atestados, receitas e gerencie sua agenda digital.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 dark:text-slate-500 transition-all duration-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-1" />
            </Link>

            {/* Paciente */}
            <Link
              href="/cadastro/paciente"
              className="group flex items-center gap-5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 p-5 transition-all duration-200 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-md hover:bg-teal-50 dark:hover:bg-teal-900/20"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-900/30 transition-colors duration-200 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/50">
                <User className="h-7 w-7 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Sou Paciente
                </h2>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Acesse documentos e conecte-se com seus médicos de forma segura.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 dark:text-slate-500 transition-all duration-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}