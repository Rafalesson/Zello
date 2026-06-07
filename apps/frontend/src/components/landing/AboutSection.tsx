'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export function AboutSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  useScrollReveal(sectionRef);

  return (
    <section ref={sectionRef} id="about" className="bg-white dark:bg-slate-900 transition-colors duration-200">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-6 py-20 sm:py-28 lg:flex-row lg:items-start lg:px-8">
        <div className="w-full max-w-xl space-y-6">
          <span className="inline-block rounded-full bg-teal-50 dark:bg-teal-900/30 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.15em] text-teal-700 dark:text-teal-300">
            Sobre o Zello
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Um time comprometido em humanizar o cuidado digital
          </h2>
          <p className="text-base leading-7 text-slate-600 dark:text-slate-300">
            Acreditamos que a tecnologia deve aproximar médicos e pacientes, não distanciá-los. O Zello nasceu da missão de tornar o acesso à saúde mais simples, seguro e acolhedor para todos.
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            <div data-reveal className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-6 shadow-sm ring-1 ring-slate-900/5 dark:ring-slate-700">
              <p className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-teal-400 bg-clip-text text-transparent">100%</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Comprometidos com a excelência técnica e a segurança dos seus dados.</p>
            </div>
            <div data-reveal className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-6 shadow-sm ring-1 ring-slate-900/5 dark:ring-slate-700">
              <p className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-teal-400 bg-clip-text text-transparent">LGPD</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Em total conformidade com a Lei Geral de Proteção de Dados.</p>
            </div>
          </div>
        </div>

        <div className="relative w-full max-w-xl" data-reveal>
          <div className="overflow-hidden rounded-3xl shadow-2xl ring-1 ring-slate-900/10 dark:ring-white/10">
            <Image
              src="https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80"
              alt="Equipe médica reunida"
              width={900}
              height={600}
              className="h-full w-full object-cover"
            />
          </div>
          {/* Decorative gradient blur behind image */}
          <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-teal-100 to-teal-50 opacity-60 blur-2xl dark:from-teal-900/20 dark:to-slate-900/0" />
        </div>
      </div>
    </section>
  );
}
