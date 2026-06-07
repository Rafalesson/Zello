'use client';

import { useRef, type ComponentType } from 'react';
import { ShieldCheck, Rocket, Users } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

type Feature = {
  name: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

const features: Feature[] = [
  {
    name: 'Segurança & Privacidade',
    description:
      'Seus dados são protegidos com criptografia de ponta a ponta, autenticação segura e conformidade total com a LGPD.',
    icon: ShieldCheck,
  },
  {
    name: 'Documentos Digitais',
    description:
      'Emita atestados e prescrições médicas em poucos cliques, com assinatura digital e QR Code para validação instantânea.',
    icon: Rocket,
  },
  {
    name: 'Conexão Direta',
    description:
      'Comunicação descomplicada entre você e seu paciente, com histórico compartilhado e acompanhamento contínuo.',
    icon: Users,
  },
];

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  useScrollReveal(sectionRef);

  return (
    <section ref={sectionRef} id="features" className="bg-white dark:bg-slate-900 transition-colors duration-200">
      <div className="mx-auto w-full max-w-7xl px-6 py-20 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-teal-50 dark:bg-teal-900/30 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.15em] text-teal-700 dark:text-teal-300">
            Por que o Zello?
          </span>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Tecnologia de ponta a favor do seu bem-estar
          </h2>
          <p className="mt-5 text-base leading-7 text-slate-500 dark:text-slate-300">
            Muito além de uma videochamada. O Zello oferece agendamento inteligente, prontuário integrado e emissão de documentos médicos digitais.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.name}
              data-reveal
              className="group relative flex flex-col rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-sm ring-1 ring-slate-900/5 dark:ring-slate-700 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:ring-teal-500/20"
            >
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 transition-all duration-300 group-hover:bg-teal-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-teal-600/25">
                <feature.icon className="h-7 w-7" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{feature.name}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
