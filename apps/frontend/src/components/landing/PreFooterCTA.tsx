import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function PreFooterCTA() {
  return (
    <section className="bg-teal-600 dark:bg-teal-900 border-t border-teal-500/20">
      <div className="px-6 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Sua saúde não pode esperar.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-teal-100">
            Junte-se a milhares de pacientes que já transformaram a forma de cuidar da saúde. Cadastre-se na Zello hoje mesmo, é 100% gratuito.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              href="/cadastro"
              className="group rounded-lg bg-white px-8 py-3.5 text-base font-bold text-teal-700 shadow-md hover:bg-slate-50 transition-all hover:scale-105 hover:shadow-xl inline-flex items-center gap-2"
            >
              Criar Conta
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/medicos" className="text-base font-bold leading-6 text-white hover:text-teal-200 transition-colors">
              Ver médicos disponíveis <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
