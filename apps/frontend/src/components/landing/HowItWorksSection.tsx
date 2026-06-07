'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

type Step = {
  title: string;
  description: string;
};

const steps: Step[] = [
  {
    title: 'Cadastre-se em minutos',
    description:
      'Crie sua conta como médico ou paciente, confirme os dados principais e personalize o seu perfil profissional.',
  },
  {
    title: 'Realize a consulta',
    description:
      'Conecte-se por vídeo com estabilidade e prontuário integrado, mantendo todo o histórico em um só lugar.',
  },
  {
    title: 'Receba seus documentos',
    description:
      'Atestados e receitas médicas emitidos digitalmente, com validação por QR Code e entrega instantânea no seu e-mail.',
  },
];

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  useScrollReveal(sectionRef);

  return (
    <section ref={sectionRef} id="how-it-works" className="bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <div className="mx-auto w-full max-w-7xl px-6 py-20 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-teal-50 dark:bg-teal-900/30 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.15em] text-teal-700 dark:text-teal-300">
            Como funciona
          </span>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl md:whitespace-nowrap">
            Sua jornada de saúde em três passos simples
          </h2>
          <p className="mt-5 text-base leading-7 text-slate-500 dark:text-slate-300">
            Do primeiro acesso à emissão de documentos, tudo foi pensado para ser rápido, seguro e totalmente intuitivo.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              data-reveal
              className="group relative flex flex-col gap-4 rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-sm ring-1 ring-slate-900/5 dark:ring-slate-700 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:ring-teal-500/20"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-lg font-bold text-white shadow-md shadow-teal-600/25 transition-transform duration-300 group-hover:scale-110">
                {index + 1}
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{step.title}</h3>
              <p className="text-sm leading-6 text-slate-500 dark:text-slate-300">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex justify-center">
          <Link
            href="/cadastro"
            className="inline-flex items-center justify-center rounded-xl border-2 border-teal-600 bg-transparent px-10 py-4 text-base font-semibold text-teal-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-transparent hover:bg-gradient-to-r hover:from-teal-600 hover:to-teal-500 hover:text-white hover:shadow-lg hover:shadow-teal-600/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:border-teal-400 dark:text-teal-400 dark:hover:border-transparent"
          >
            Começar Agora
          </Link>
        </div>
      </div>
    </section>
  );
}
